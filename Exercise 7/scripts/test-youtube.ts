import { YoutubeTranscript } from "youtube-transcript";
import { fetchYouTubeTranscript } from "../lib/youtube";

async function test() {
  const url2 = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

  console.log(`Testing with URL: ${url2}`);

  try {
    console.log("Fetching raw transcript...");
    const raw = await YoutubeTranscript.fetchTranscript("dQw4w9WgXcQ").catch(
      () => [],
    );
    console.log("Raw items count:", raw.length);
    if (raw.length > 0) {
      console.log("First item:", raw[0]);
    }

    const info = await fetchYouTubeTranscript(url2);
    console.log("Success!");
    console.log("Title:", info.title);
    console.log("Video ID:", info.videoId);
    console.log("Transcript length:", info.transcript.length);
    console.log("Preview:", info.transcript.substring(0, 100));
  } catch (error) {
    console.log(
      "TEST FAILED:",
      error instanceof Error ? error.message : String(error),
    );
  }
}

test();
