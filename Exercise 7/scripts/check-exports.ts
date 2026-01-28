async function checkExports() {
  try {
    const mod = await import('youtube-caption-scraper');
    console.log('Module exports:', mod);
    console.log('Keys:', Object.keys(mod));
    // @ts-ignore
    if (mod.default) {
        console.log('default keys:', Object.keys(mod.default));
        // @ts-ignore
        console.log('default prototype keys:', Object.getOwnPropertyNames(mod.default.prototype));
        // @ts-ignore
        console.log('default.getSubtitles:', typeof mod.default.getSubtitles);
    }
    // @ts-ignore
    console.log('getSubtitles type:', typeof mod.getSubtitles);
  } catch (error) {
    console.error('Import failed:', error);
  }
}

checkExports();
