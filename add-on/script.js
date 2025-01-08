console.log("script.js")


// Set wallpaper on first page load
document.addEventListener('DOMContentLoaded', async () => await
  retrieveDataFromIndexedDB("wallpaper").then(wallpaper => setWallpaper(wallpaper)).catch(error => console.error(error)));

// listen for wallpaper update
browser.storage.local.onChanged.addListener(async () => {
  console.log('local Storage updated');

  const wallpaper = await retrieveDataFromIndexedDB("wallpaper");
  setWallpaper(wallpaper)
});

// Listen for custom js and html upload
document.getElementById('fileUpload').addEventListener('change', function(event) {
  const file = event.target.files[0];

  // Check if a file is selected and it's valid
  if (file && (file.name.endsWith('.html') || file.name.endsWith('.js'))) {
    const reader = new FileReader();

    reader.onload = async function(e) {
      const content = e.target.result; // Access file content
      injectUserContent(content, file.name.slice(file.name.lastIndexOf('.') + 1))
    };

    reader.onerror = function(error) {
      console.error('Error reading file:', error);
      // Handle file read errors (e.g., display an error message to the user)
    };

    reader.readAsText(file); // Read file as text (adjust based on file type)
  } else {
    console.warn('Invalid file selected. Please choose a .html or .js file.', file);
  }
});

// Listen for Ctrl+Enter to upload custom html and js
document.addEventListener('keydown', function(event) {
  if (event.ctrlKey && event.key === 'u') {
    if (confirm("Upload custom HTML and JS?")) {
      document.getElementById('fileUpload').click();
    }
  }
});

/* ----------------------- Helpers ------------------------ */
async function injectUserContent(content, type) {
  try {
    switch (type) {
      case 'js':
        const userScript = new Function(content);
        await userScript();
        break;

      case 'html':
        // Sanitize HTML and inject
        const tempElement = document.createElement('div');
        tempElement.innerHTML = content;
        const elementsToInject = Array.from(tempElement.childNodes); // Convert to array for safe iteration

        const body = document.body;
        elementsToInject.forEach(element => {
          body.appendChild(element);
        });
        break;

      case 'css':
        const styleElement = document.createElement('style');
        styleElement.textContent = content;
        document.head.appendChild(styleElement);
        break;

      default:
        console.error("Invalid content type:", type);
        return;
    }
    console.log(`${type.toUpperCase()} injected successfully.`);
  } catch (error) {
    console.error(`Error injecting ${type}:`, error);
  }
}

const dbName = "myDatabase";
const storeName = "myStore";
async function retrieveDataFromIndexedDB(data) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);

    request.onerror = (event) => {
      reject("Error opening database: " + event.target.errorCode);
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(storeName, "readonly");
      const objectStore = transaction.objectStore(storeName);
      const getRequest = objectStore.get(data);

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
