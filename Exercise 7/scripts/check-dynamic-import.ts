async function checkDynamicImport() {
  try {
    const mod = await import("youtube-captions-scraper");
    console.log("Module keys:", Object.keys(mod));
    console.log("getSubtitles type:", typeof mod.getSubtitles);
    // @ts-ignore
    console.log(
      "default keys:",
      mod.default ? Object.keys(mod.default) : "no default",
    );
    // @ts-ignore
    console.log(
      "default.getSubtitles type:",
      mod.default ? typeof mod.default.getSubtitles : "N/A",
    );
  } catch (error) {
    console.error("Import failed:", error);
  }
}

checkDynamicImport();
