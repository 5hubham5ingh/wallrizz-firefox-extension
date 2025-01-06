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

let base64Wallpaper = "";
let cacheIdRecord;
port.onMessage.addListener(async (message) => {
  if (message.status === 1) {
    console.error(message.data);
    clearInterval(interval);
    interval = undefined;
    return;
  }
  switch (message.type) {
    case "theme": {
      console.log("fetching theme");
      setCache(message.cacheId, message.data);
      await setTheme(message.data);
      break;
    }
    case "wallpaper":
      if (message.status === 0.5) {
        base64Wallpaper += message.data;
        cacheIdRecord = message.cacheId ?? cacheIdRecord;
        port.postMessage("getWallpaper");
      } else {
        await setWallpaper(base64Wallpaper);
        setCache(cacheIdRecord, message.data);
        cacheIdRecord = null;
      }
      break;
    case "wallpaperCache":
    case "themeCache": {
      const cache = getCache(message.cacheId);
      if (cache) {
        message.type === "themeCache" ? setTheme(cache) : setWallpaper(cache);
        port.postMessage("true");
      } else port.postMessage("false");
    }
  }
});

port.onDisconnect.addListener((port) => {
  if (port.error) {
    console.log(`Disconnected due to an error: ${port.error.message}`);
  } else {
    console.log(`Disconnected`, port);
  }
});

async function setTheme(data) {
  const theme = JSON.parse(data);
  console.log("Fetched theme");
  await browser.theme.update(theme);
}

async function setWallpaper(data) {
  console.log(data);
}

const cache = {};
function setCache(cacheId, data) {
  cache[cacheId] = data;
}
function getCache(cacheId) {
  if (cache[cacheId]) {
    console.log("cache hit for cache id ; ", cacheId);
    return cache[cacheId];
  }
}
