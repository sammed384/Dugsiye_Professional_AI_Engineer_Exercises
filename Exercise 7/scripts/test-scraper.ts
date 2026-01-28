import { getSubtitles } from "youtube-caption-scraper";

async function test() {
  const videoId = "dQw4w9WgXcQ";
  console.log(`Testing youtube-caption-scraper with ID: ${videoId}`);

  try {
    const subtitles = await getSubtitles({
      videoID: videoId,
      lang: "en",
    });
    console.log("Success!");
    console.log("Subtitles count:", subtitles.length);
    if (subtitles.length > 0) {
      console.log("First line:", subtitles[0].text);
    }
  } catch (error) {
    console.error("Test failed:", error);
  }
}

test();
