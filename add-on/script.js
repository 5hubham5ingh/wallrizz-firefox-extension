// Set wallpaper on first page load
document.addEventListener(
  "DOMContentLoaded",
  async () => {
    await retrieveDataFromIndexedDB("wallpaper").then((wallpaper) =>
      setWallpaper(wallpaper)
    ).catch((error) => console.error(error));
    const files = await retrieveDataFromIndexedDB("files");
    if(files) processFiles(files);
  },
);

// ensures file type checking and loading order
const fileExtensions = [".css", ".html", ".js"];

// listen for wallpaper update
browser.storage.local.onChanged.addListener(async () => {
  const wallpaper = await retrieveDataFromIndexedDB("wallpaper");
  setWallpaper(wallpaper);
});

// Listen for Ctrl+Enter to upload custom html, css, and js.
document.addEventListener("keydown", function (event) {
  if (event.ctrlKey && event.key === "Enter") {
    showModal()
  }
});

/* ----------------------- Helpers ------------------------ */

function processFiles(filesArray) {
  for (const fileExtension of fileExtensions) {
    const files = filesArray.filter((file) =>
      file.name.endsWith(fileExtension)
    );

    for (const file of files) {
      const reader = new FileReader();
      reader.onload = async function (e) {
        const content = e.target.result;
        await injectUserContent(
          content,
          file.name.slice(file.name.lastIndexOf(".") + 1),
        );
      };
      reader.onerror = function (error) {
        console.error("Error reading file:", error);
        alert("Failed to read file. Check console for error.");
      };
      reader.readAsText(file);
    }
  }
}

async function injectUserContent(content, type) {
  try {
    switch (type) {
      case "js": {
        const userScript = new Function(content);
        await userScript();
        break;
      }

      case "html": {
        const tempElement = document.createElement("div");
        tempElement.innerHTML = content;
        const elementsToInject = Array.from(tempElement.childNodes); // Convert to array for safe iteration
        const body = document.body;
        elementsToInject.forEach((element) => {
          body.appendChild(element);
        });
        break;
      }

      case "css": {
        const styleElement = document.createElement("style");
        styleElement.textContent = content;
        document.head.appendChild(styleElement);
        break;
      }

      default:
        console.error("Invalid content type:", type);
        return;
    }
  } catch (error) {
    console.error(`Error injecting ${type}:`, error);
  }
}

function setWallpaper(wallpaper) {
  document.body.style.backgroundImage = `url(${wallpaper})`;
  document.body.style.backgroundSize = "cover";
  document.body.style.backgroundRepeat = "no-repeat";
  document.body.style.backgroundPosition = "center";
  document.body.style.width = "100%";
  document.body.style.height = "100vh";
  document.body.style.backgroundAttachment = "fixed";
}
