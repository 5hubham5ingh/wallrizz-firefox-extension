/*
On startup, connect to the "ping_pong" app.
*/
let port = browser.runtime.connectNative("ping_pong");

/*
Listen for messages from the app and log them to the console.
*/
port.onMessage.addListener(async (theme) => {
  console.log("Applying theme...")
  await browser.theme.update(theme)
});

/*
Listen for the native messaging port closing.
*/
port.onDisconnect.addListener((port) => {
  if (port.error) {
    console.log(`Disconnected due to an error: ${port.error.message}`);
  } else {
    console.log(`Disconnected`, port);
  }
});

let interval;
browser.browserAction.onClicked.addListener(async () => {
  // return;
  if (interval) {
    console.log("Extension disabled")
    clearInterval(interval)
  } else {
    console.log("Fetching theme");
    interval = setInterval(() => port.postMessage("getTheme"), 5000)
  }
});
