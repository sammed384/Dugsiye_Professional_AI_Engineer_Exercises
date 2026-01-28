const { Innertube } = require("youtubei.js");

async function test() {
  console.log("Testing youtubei.js...");
  try {
    const youtube = await Innertube.create();
    const videoId = "dQw4w9WgXcQ";

    console.log(`Fetching info for ${videoId}...`);
    const info = await youtube.getInfo(videoId);

    console.log("Title:", info.basic_info.title);

    try {
      const transcriptData = await info.getTranscript();
      console.log("Transcript found!");
      // console.log('Transcript data:', transcriptData);

      if (transcriptData.transcript && transcriptData.transcript.content) {
        const lines =
          transcriptData.transcript.content.body.initial_segments.map(
            (seg) => seg.snippet.text,
          );
        console.log("Lines count:", lines.length);
        console.log("First line:", lines[0]);
      } else {
        console.log("Transcript structure might be different or empty.");
      }
    } catch (err) {
      console.error("Failed to get transcript:", err);
    }
  } catch (error) {
    console.error("Test failed:", error);
  }
}

test();
