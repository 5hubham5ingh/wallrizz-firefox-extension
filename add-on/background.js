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
      await setTheme(message.data);
      break;
    }
    case "wallpaper":
      if (message.status === 0.5) {
        base64Wallpaper += message.data;
        port.postMessage("getWallpaper");
      } else {
        base64Wallpaper += message.data;
        await setWallpaper(base64Wallpaper);
        base64Wallpaper = "";
      }
      break;
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
  // send data to script.js via message
  console.log(data);
}
