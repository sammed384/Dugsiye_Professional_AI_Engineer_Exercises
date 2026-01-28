async function test() {
  const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
  try {
    const response = await fetch(url);
    const text = await response.text();
    console.log("Page fetched. Length:", text.length);
    if (text.includes("captionTracks")) {
      console.log("Found captionTracks!");
    } else {
      console.log("captionTracks NOT found.");
      // Check for consent page
      if (text.includes("consent")) {
        console.log("Redirected to consent page.");
      }
    }
  } catch (error) {
    console.error("Fetch failed:", error);
  }
}

test();
