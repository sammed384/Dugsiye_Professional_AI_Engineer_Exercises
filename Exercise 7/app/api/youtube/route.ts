import { NextRequest, NextResponse } from "next/server";
import { fetchYouTubeTranscript } from "@/lib/youtube";
import { createChunks } from "@/lib/document-processor";
import { generateEmbeddings } from "@/lib/ai/embeddings";
import { storeVectors } from "@/lib/pinecone";
import { createDocument, updateDocument } from "@/lib/mongodb";

export async function POST(request: NextRequest) {
  try {
    const { url, manualTranscript } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: "YouTube URL is required" },
        { status: 400 },
      );
    }

    // Generate unique document ID
    const documentId = `doc-yt-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Initial document creation
    await createDocument({
      documentId,
      title: "Processing YouTube Video...",
      filename: url,
      fileType: "youtube",
      fileSize: 0, // Will update later
      uploadedAt: new Date(),
      status: "processing",
      youtubeUrl: url,
    });

    // Fetch transcript
    let videoInfo;
    try {
      videoInfo = await fetchYouTubeTranscript(url, manualTranscript);
    } catch (error) {
      await updateDocument(documentId, {
        status: "error",
        errorMessage:
          error instanceof Error ? error.message : "Failed to fetch transcript",
      });
      return NextResponse.json(
        { error: "Failed to fetch transcript. Ensure the video has captions." },
        { status: 400 },
      );
    }

    const { title, transcript } = videoInfo;

    // Update title
    await updateDocument(documentId, { title });

    // Create chunks
    const chunks = await createChunks(transcript, title);

    if (chunks.length === 0) {
      await updateDocument(documentId, {
        status: "error",
        errorMessage: "No content could be extracted from the transcript.",
      });
      return NextResponse.json(
        { error: "No content extracted from transcript." },
        { status: 400 },
      );
    }

    // Generate embeddings
    const embeddings = await generateEmbeddings(chunks);

    // Store vectors
    const vectorCount = await storeVectors(documentId, embeddings, {
      title,
      filename: url,
      fileType: "youtube",
      youtubeUrl: url,
    });

    // Update document status
    await updateDocument(documentId, {
      status: "completed",
      processedAt: new Date(),
      chunkCount: chunks.length,
      vectorCount,
      contentLength: transcript.length,
    });

    return NextResponse.json({
      success: true,
      documentId,
      title,
      message: `Successfully processed video.`,
    });
  } catch (error) {
    console.error("YouTube processing error:", error);
    return NextResponse.json(
      {
        error: "Failed to process YouTube video",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
