import scraper from "youtube-caption-scraper";

async function test() {
  const videoId = "dQw4w9WgXcQ";
  console.log(`Testing youtube-caption-scraper with ID: ${videoId}`);

  try {
    // @ts-ignore
    const subtitles = await scraper.getSubtitles({
      videoID: videoId,
      lang: "en",
    });
    console.log("getSubtitles success!");
    console.log("Subtitles count:", subtitles.length);
  } catch (error) {
    console.log("getSubtitles failed:", error);
  }

  try {
    // @ts-ignore
    const instance = new scraper.default(); // or just scraper if it's the class
    console.log("Instance created");
    // @ts-ignore
    const subtitles = await instance.scrap(videoId);
    console.log("scrap success!");
    console.log("Subtitles count:", subtitles.length);
  } catch (error) {
    console.log("scrap failed:", error);
  }
}

test();
