console.log("script.js")

let wallpaper = '';


browser.storage.local.onChanged.addListener(async (changes, area) => {
  console.log('local Storage updated');

  console.log('getting data from indexDb')
  const wallpaper = await retrieveDataFromIndexedDB();
  setWallpaper(wallpaper)
});

// Set wallpaper on first page load
document.addEventListener('DOMContentLoaded', async () => await
  retrieveDataFromIndexedDB().then(wallpaper => setWallpaper(wallpaper)).catch(error => console.error(error)));

const dbName = "myDatabase";
const storeName = "myStore";
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

  console.log('setting wallpaper', wallpaper.length, wallpaper)
  const wallpaperUrl = wallpaper.replace(/[\r\n\s]+/g, '').trim()
  document.body.style.backgroundImage = `url(${wallpaperUrl})`;
  document.body.style.backgroundSize = "cover";
  document.body.style.backgroundRepeat = "no-repeat";
  document.body.style.backgroundPosition = "center";
  document.body.style.width = "100%";
  document.body.style.height = "100vh";
  document.body.style.backgroundAttachment = "fixed";
}
