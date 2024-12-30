const port = browser.runtime.connectNative("WallRizzFox");

let interval;
const toggleExtension = () => {
  if (interval) {
    console.log("Extension disabled");
    clearInterval(interval);
    interval = undefined;
  } else {
    console.log("Fetching theme");
    interval = setInterval(() => port.postMessage("getTheme"), 500);
  }
};

toggleExtension();

browser.browserAction.onClicked.addListener(toggleExtension);

port.onMessage.addListener(async (message) => {
  if (message.status === 1) {
    console.error(message.data);
    clearInterval(interval);
    interval = undefined;
    return;
  }
  const theme = JSON.parse(message.data);
  console.log("Applying theme");
  await browser.theme.update(theme);
});

port.onDisconnect.addListener((port) => {
  if (port.error) {
    console.log(`Disconnected due to an error: ${port.error.message}`);
  } else {
    console.log(`Disconnected`, port);
  }
});
