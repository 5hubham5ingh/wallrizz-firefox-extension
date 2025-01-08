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
      console.log("fetching theme");
      await setTheme(message.data);
      break;
    case "wallpaper":
      if (message.status === 0.5) {
        wallpaperChunks.push(message.data);
        console.log(
          "Wallpaper chunk received",
          wallpaperChunks.reduce((acc, chunk) => acc + chunk.length, 0),
          "data received",
          message.data.length,
        );
        port.postMessage("getWallpaper");
      } else if (message.status === 0) {
        wallpaperChunks.push(message.data);
        const base64Wallpaper = wallpaperChunks.join("");
        await setWallpaper(base64Wallpaper);
        console.log("Transfer completed", "received:", base64Wallpaper.length);

        // Clear chunks
        wallpaperChunks.length = 0;
        console.log("Reset wallpaper chunks.");
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
  console.log("saving data in indexDb", data);
  await storeDataInIndexedDB(data);
  console.log("data saved. sending status = 0 ");
  browser.storage.local.set({ status: 0 });
}

const dbName = "myDatabase";
const storeName = "myStore";

// Function to store data in IndexedDB (overwrites existing data)
async function storeDataInIndexedDB(data) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1); // Version 1 of the database

    request.onerror = (event) => {
      reject("Error opening database: " + event.target.errorCode);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName); // Create the object store if it doesn't exist
      }
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(storeName, "readwrite");
      const objectStore = transaction.objectStore(storeName);

      const putRequest = objectStore.put(data, "data"); // "data" is the key. overwrites if the key already exists

      putRequest.onsuccess = () => {
        resolve();
      };

      putRequest.onerror = (event) => {
        reject("Error storing data: " + event.target.errorCode);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    };
  });
}
