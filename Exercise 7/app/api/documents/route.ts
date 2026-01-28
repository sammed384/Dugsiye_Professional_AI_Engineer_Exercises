import { NextRequest, NextResponse } from "next/server";
import { getAllDocuments, getDocument, deleteDocument } from "@/lib/mongodb";
import { deleteDocumentVectors } from "@/lib/pinecone";
import { Document } from "@/lib/types";

// GET /api/documents - Get all documents
export async function GET() {
  try {
    const documents = await getAllDocuments();

    return NextResponse.json({
      success: true,
      documents: documents.map((doc: unknown) => {
        const d = doc as Document;
        return {
          documentId: d.documentId || d.id,
          title: d.title,
          filename: d.filename,
          fileType: d.fileType,
          fileSize: d.fileSize,
          uploadedAt: d.uploadedAt,
          processedAt: d.processedAt,
          status: d.status,
          chunkCount: d.chunkCount,
          vectorCount: d.vectorCount,
          contentLength: d.contentLength,
        };
      }),
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 },
    );
  }
}

// DELETE /api/documents - Delete a document
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("documentId");

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 },
      );
    }

    // Check if document exists
    const document = await getDocument(documentId);
    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    // Delete from both Pinecone and MongoDB
    await deleteDocumentVectors(documentId);
    await deleteDocument(documentId);

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 },
    );
  }
}
