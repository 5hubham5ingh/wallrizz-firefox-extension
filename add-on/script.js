console.log("script.js")

let wallpaper = '';


browser.storage.onChanged.addListener(async (changes, area) => {
  console.log('local Storage updated');

  const wallpaperUpdated = changes?.status === 0;;
  if (wallpaperUpdated) {
    console.log('getting data from indexDb')
    const wallpaper = await retrieveDataFromIndexedDB();
    setWallpaper(wallpaper)
  }
});

const dbName = "myDatabase";
const storeName = "myStore";
document.addEventListener('DOMContentLoaded', async () =>
  retrieveDataFromIndexedDB().then(wallpaper => setWallpaper(wallpaper)).catch(error => console.error(error)));

async function retrieveDataFromIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);

    request.onerror = (event) => {
      reject("Error opening database: " + event.target.errorCode);
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(storeName, "readonly");
      const objectStore = transaction.objectStore(storeName);
      const getRequest = objectStore.get("data");

      getRequest.onsuccess = (event) => {
        resolve(event.target.result); // Resolve with the retrieved data (or undefined if not found)
      };

      getRequest.onerror = (event) => {
        reject("Error retrieving data: " + event.target.errorCode);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    };
  });
}

function setWallpaper(wallpaper) {

  console.log('setting wallpaper', wallpaper)
  // Set the background image or process the wallpaper here
  const wallpaperUrl = `url(${wallpaper.trim()})`;
  document.body.style.backgroundImage = wallpaperUrl;
  document.body.style.backgroundSize = "cover";
  document.body.style.backgroundRepeat = "no-repeat";
  document.body.style.backgroundPosition = "center";
}
