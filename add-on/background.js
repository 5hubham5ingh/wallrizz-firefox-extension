const port = browser.runtime.connectNative("WallRizzFox");

let interval;
const toggleExtension = () => {
  if (interval) {
    console.log("Extension disabled");
    clearInterval(interval);
    interval = undefined;
  } else {
    interval = setInterval(() => {
      try {
        port.postMessage("getTheme");
        port.postMessage("getWallpaper");
      } catch (error) {
        console.error(error);
        clearInterval(interval);
      }
    }, 500);
  }
};

toggleExtension();

browser.browserAction.onClicked.addListener(toggleExtension);

const wallpaperChunks = [];
port.onMessage.addListener(async (message) => {
  if (message.status === 1) {
    console.error(message.data);
    clearInterval(interval);
    interval = undefined;
    return;
  }

  switch (message.type) {
    case "theme":
      await setTheme(message.data);
      break;
    case "wallpaper":
      if (message.status === 0.5) {
        wallpaperChunks.push(message.data);
        port.postMessage("getWallpaper");
      } else if (message.status === 0) {
        wallpaperChunks.push(message.data);
        const base64Wallpaper = wallpaperChunks.join("");
        await setWallpaper(base64Wallpaper);

        // Clear chunks
        wallpaperChunks.length = 0;
      }
      break;
  }
});

port.onDisconnect.addListener((port) => {
  if (port.error) {
    console.error(`Disconnected due to an error: ${port.error.message}`);
  } else {
    console.log(`Disconnected`, port);
  }
});

async function setTheme(data) {
  const theme = JSON.parse(data);
  await browser.theme.update(theme);
}

async function setWallpaper(data) {
  // send wallpaper using indexDB and signal to reload using local storage
  await storeDataInIndexedDB("wallpaper", data);
  browser.storage.local.set({ status: 0 });
}
