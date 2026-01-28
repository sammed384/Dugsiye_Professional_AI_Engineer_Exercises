import { YoutubeTranscript } from "youtube-transcript";

export interface YouTubeVideoInfo {
  title: string;
  description: string;
  transcript: string;
  videoId: string;
}

/**
 * Extract video ID from YouTube URL
 */
export function getVideoIdFromUrl(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

/**
 * Robustly fetch transcript by scraping the YouTube page directly.
 * This mimics a browser and parses the ytInitialPlayerResponse.
 */
async function fetchTranscriptViaScraping(videoId: string): Promise<string> {
  const url = `https://www.youtube.com/watch?v=${videoId}`;

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });

  const html = await response.text();

  // Look for ytInitialPlayerResponse
  const playerResponseMatch = html.match(
    /ytInitialPlayerResponse\s*=\s*({.+?});/,
  );
  if (!playerResponseMatch) {
    throw new Error("Could not find player response in page source");
  }

  const playerResponse = JSON.parse(playerResponseMatch[1]);
  const captionTracks =
    playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

  if (!captionTracks || captionTracks.length === 0) {
    throw new Error("No caption tracks found in player response");
  }

  // Find the first English track or just the first one
  const track =
    captionTracks.find((t: any) => t.languageCode === "en") || captionTracks[0];

  // Append fmt=json3 to get a more reliable JSON response
  const transcriptUrl = track.baseUrl + "&fmt=json3";
  console.log(
    "Fetching transcript from:",
    transcriptUrl.substring(0, 100) + "...",
  );

  const transcriptResponse = await fetch(transcriptUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Referer: "https://www.youtube.com/",
      Origin: "https://www.youtube.com",
    },
  });

  const transcriptText = await transcriptResponse.text();
  console.log("Transcript response length:", transcriptText.length);

  if (!transcriptText || transcriptText.trim().length === 0) {
    throw new Error("Empty transcript response from YouTube");
  }

  let transcriptData;
  try {
    transcriptData = JSON.parse(transcriptText);
  } catch (e) {
    console.error(
      "Failed to parse transcript JSON:",
      transcriptText.substring(0, 500),
    );
    throw new Error("Invalid JSON response from YouTube transcript API");
  }

  if (!transcriptData || !transcriptData.events) {
    throw new Error("No transcript events found in JSON response");
  }

  const lines = transcriptData.events
    .filter((event: any) => event.segs)
    .map((event: any) => event.segs.map((seg: any) => seg.utf8).join(""))
    .join(" ")
    .replace(/  +/g, " ");

  if (lines.length === 0) {
    throw new Error("No transcript text extracted from JSON");
  }

  return lines;
}

/**
 * Fetch transcript and basic info from YouTube video
 * Note: youtube-transcript only provides text, so we'll use the URL/ID for title initially
 * unless we add a real YouTube API client.
 */
export async function fetchYouTubeTranscript(
  url: string,
  manualTranscript?: string,
): Promise<YouTubeVideoInfo> {
  const videoId = getVideoIdFromUrl(url);

  if (!videoId) {
    throw new Error("Invalid YouTube URL");
  }

  // Try robust scraping method first
  try {
    console.log("Attempting robust transcript scraping...");
    const transcript = await fetchTranscriptViaScraping(videoId);
    console.log("Robust scraping successful!");
    return {
      title: `YouTube Video (${videoId})`,
      description: `Transcript from YouTube video ${url} [Scraped]`,
      transcript,
      videoId,
    };
  } catch (scrapingError) {
    console.warn("Robust scraping failed, trying libraries:", scrapingError);
  }

  // Language codes to try - many videos only have captions in specific languages
  const languagesToTry = [
    "en", // English
    "en-US", // English (US)
    "en-GB", // English (UK)
    "es", // Spanish
    "de", // German
    "fr", // French
    "pt", // Portuguese
    "it", // Italian
    "ja", // Japanese
    "ko", // Korean
    "ar", // Arabic
    "hi", // Hindi
    "zh", // Chinese
    "zh-Hans", // Chinese Simplified
    "zh-Hant", // Chinese Traditional
    "ru", // Russian
  ];

  // Try primary library (youtube-transcript) with multiple languages
  for (const lang of languagesToTry) {
    try {
      const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId, {
        lang: lang,
      });

      if (transcriptItems && transcriptItems.length > 0) {
        console.log(`youtube-transcript succeeded with language: ${lang}`);
        const fullText = transcriptItems
          .map((item) => item.text)
          .join(" ")
          .replace(/  +/g, " ");

        const title = `YouTube Video (${videoId})`;
        const langNote = lang !== "en" ? ` [Captions: ${lang}]` : "";

        return {
          title,
          description: `Transcript from YouTube video ${url}${langNote}`,
          transcript: fullText,
          videoId,
        };
      }
    } catch {
      // Continue to next language
      continue;
    }
  }

  // Primary library failed with all languages, try fallback library
  console.log(
    "youtube-transcript failed with all languages, trying youtube-caption-scraper",
  );

  try {
    // Dynamic import to avoid issues if not installed or server-side only
    const mod = await import("youtube-captions-scraper");
    // Handle both ESM and CJS interop
    const getSubtitles =
      mod.getSubtitles ||
      (mod.default && mod.default.getSubtitles) ||
      mod.default;

    if (typeof getSubtitles !== "function") {
      throw new Error(
        "Could not find getSubtitles function in youtube-captions-scraper",
      );
    }

    // Try multiple language codes - many videos only have captions in specific languages
    // or have auto-generated captions with different language codes
    const languagesToTry = [
      "en", // English
      "en-US", // English (US)
      "en-GB", // English (UK)
      "a.en", // Auto-generated English
      "es", // Spanish
      "a.es", // Auto-generated Spanish
      "de", // German
      "a.de", // Auto-generated German
      "fr", // French
      "a.fr", // Auto-generated French
      "pt", // Portuguese
      "a.pt", // Auto-generated Portuguese
      "it", // Italian
      "a.it", // Auto-generated Italian
      "ja", // Japanese
      "a.ja", // Auto-generated Japanese
      "ko", // Korean
      "a.ko", // Auto-generated Korean
      "ar", // Arabic
      "a.ar", // Auto-generated Arabic
      "hi", // Hindi
      "a.hi", // Auto-generated Hindi
      "zh", // Chinese
      "zh-Hans", // Chinese Simplified
      "zh-Hant", // Chinese Traditional
      "ru", // Russian
      "a.ru", // Auto-generated Russian
    ];

    let subtitles = null;
    let successfulLang = "";

    for (const lang of languagesToTry) {
      try {
        subtitles = await getSubtitles({
          videoID: videoId,
          lang: lang,
        });
        if (subtitles && subtitles.length > 0) {
          successfulLang = lang;
          console.log(`Successfully fetched captions with language: ${lang}`);
          break;
        }
      } catch {
        // Continue to next language
        continue;
      }
    }

    if (!subtitles || subtitles.length === 0) {
      throw new Error("No subtitles found in any supported language");
    }

    const fullText = subtitles
      .map((item: { text: string }) => item.text)
      .join(" ")
      .replace(/  +/g, " ");

    if (!fullText || fullText.trim().length === 0) {
      throw new Error("No subtitles found");
    }

    const title = `YouTube Video (${videoId})`;
    const langNote =
      successfulLang !== "en" ? ` [Captions: ${successfulLang}]` : "";

    return {
      title,
      description: `Transcript from YouTube video ${url}${langNote}`,
      transcript: fullText,
      videoId,
    };
  } catch (fallbackError) {
    console.log(
      "youtube-captions-scraper failed, trying youtubei.js:",
      fallbackError,
    );

    // Try youtubei.js as third method - uses YouTube's internal API
    try {
      const { Innertube } = await import("youtubei.js");

      // Try different client types as some work better for transcripts than others
      const clientTypes: ("TV" | "WEB_REMIX" | "ANDROID" | "YTMUSIC")[] = [
        "TV",
        "WEB_REMIX",
        "ANDROID",
      ];

      let transcriptInfo = null;
      let videoInfo = null;
      let successfulClient = "";

      for (const clientType of clientTypes) {
        try {
          console.log(`Trying youtubei.js with client: ${clientType}`);
          const youtube = await Innertube.create({ client_type: clientType });
          const info = await youtube.getInfo(videoId);

          // Get transcript info
          const tInfo = await info.getTranscript();

          if (tInfo && tInfo.transcript && tInfo.transcript.content) {
            transcriptInfo = tInfo;
            videoInfo = info;
            successfulClient = clientType;
            break;
          }
        } catch (e) {
          console.warn(`youtubei.js failed with client ${clientType}:`, e);
          continue;
        }
      }

      if (!transcriptInfo || !videoInfo) {
        throw new Error("No transcript available from any youtubei.js client");
      }

      const segments =
        transcriptInfo.transcript.content.body?.initial_segments || [];

      if (segments.length === 0) {
        throw new Error("No transcript segments found");
      }

      const fullText = segments
        .map(
          (segment: { snippet?: { text?: string } }) =>
            segment.snippet?.text || "",
        )
        .filter((text: string) => text.length > 0)
        .join(" ")
        .replace(/  +/g, " ");

      if (!fullText || fullText.trim().length === 0) {
        throw new Error("Empty transcript from youtubei.js");
      }

      console.log(
        `youtubei.js successfully fetched transcript using ${successfulClient} client`,
      );

      // Try to get the video title
      const videoTitle =
        videoInfo.basic_info?.title || `YouTube Video (${videoId})`;

      return {
        title: videoTitle,
        description: `Transcript from YouTube video ${url}`,
        transcript: fullText,
        videoId,
      };
    } catch (innertubeError) {
      console.log(
        "youtubei.js failed, trying Whisper AI transcription:",
        innertubeError,
      );

      // Try Whisper AI transcription as 4th method - downloads audio and transcribes
      try {
        const { Innertube } = await import("youtubei.js");
        const OpenAI = (await import("openai")).default;
        const fs = await import("fs");
        const path = await import("path");
        const os = await import("os");
        const { Readable } = await import("stream");
        const { finished } = await import("stream/promises");

        console.log("Downloading audio for Whisper transcription...");

        // Create temp file path
        const tempDir = os.tmpdir();
        const tempFilePath = path.join(tempDir, `youtube-audio-${videoId}.mp4`);

        let transcription = "";

        try {
          // Initialize youtubei.js with ANDROID client for better download success
          const youtube = await Innertube.create({ client_type: "ANDROID" });

          // Download audio stream using youtubei.js
          console.log("Requesting audio stream from youtubei.js...");
          const stream = await youtube.download(videoId, {
            type: "audio",
            quality: "best",
            format: "mp4",
          });

          // Pipe to file
          const writeStream = fs.createWriteStream(tempFilePath);
          await finished(Readable.from(stream).pipe(writeStream));

          console.log("Audio downloaded, sending to Whisper API...");

          // Initialize OpenAI client
          const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
          });

          // Create a File object from the audio file for Whisper API
          const audioFile = fs.createReadStream(tempFilePath);

          // Call Whisper API
          const response = await openai.audio.transcriptions.create({
            file: audioFile,
            model: "whisper-1",
            response_format: "text",
          });

          transcription =
            typeof response === "string" ? response : String(response);
        } finally {
          // Clean up temp file in finally block to ensure it's always deleted
          try {
            if (fs.existsSync(tempFilePath)) {
              fs.unlinkSync(tempFilePath);
              console.log("Temp audio file cleaned up");
            }
          } catch (cleanupError) {
            console.warn("Failed to clean up temp file:", cleanupError);
          }
        }

        if (!transcription || transcription.trim().length === 0) {
          throw new Error("Whisper returned empty transcription");
        }

        console.log("Whisper transcription successful!");

        return {
          title: `YouTube Video (${videoId})`,
          description: `Transcript from YouTube video ${url} [Whisper AI]`,
          transcript: transcription,
          videoId,
        };
      } catch (whisperError) {
        console.error("Whisper transcription failed:", whisperError);

        if (manualTranscript) {
          console.log("Using manual transcript fallback");
          return {
            title: `YouTube Video (${videoId})`,
            description: `Manual transcript for YouTube video ${url}`,
            transcript: manualTranscript,
            videoId,
          };
        }

        throw new Error(
          "Failed to fetch transcript. All methods failed including Whisper AI transcription.",
        );
      }
    }
  }
}
