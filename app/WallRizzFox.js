import { exit, getenv, in as stdin, loadFile, open, out as stdout } from "std";
import { isatty, stat } from "os";
import { exec as execAsync } from "../../qjs-ext-lib/src/process.js";

// Read a message from stdin using the length-prefixed header
function getMessage() {
  const rawLength = new Uint8Array(4);
  const bytesRead = stdin.read(rawLength.buffer, 0, 4); // Read the 4-byte header
  if (bytesRead !== 4) {
    throw Error("invalid header length: " + bytesRead);
  }
  const messageLength = new DataView(rawLength.buffer).getUint32(0, true); // Little-endian
  return JSON.parse(stdin.readAsString(messageLength));
}

// Send an encoded message to stdout
function sendMessage(message) {
  const messageString = JSON.stringify(message);
  const encodedLength = new Uint8Array(4);
  new DataView(encodedLength.buffer).setUint32(0, messageString.length, true);
  stdout.write(encodedLength.buffer, 0, 4); // Write the 4-byte length header
  stdout.puts(messageString);
  stdout.flush();
}

function isCacheValid(cacheId, cacheType) {
  sendMessage({
    status: 0,
    type: cacheType,
    cacheId,
  });

  const cacheStatus = getMessage().trim();
  return cacheStatus.trim() === "true" ? true : false;
}

let lastMTime;
function sendTheme() {
  const themeFilePathCache = getenv("HOME")?.concat(
    "/.cache/WallRizzFox/themeConfigPath.txt",
  );

  const [fileStats, err] = stat(themeFilePathCache);
  if (err !== 0) {
    throw Error(
      "Failed to read " + themeFilePathCache + " stats." +
        "\nError code: " + err,
    );
  }
  if (lastMTime && fileStats.mtime <= lastMTime) return;
  lastMTime = fileStats.mtime;

  const currentThemeFilePath = loadFile(themeFilePathCache);

  if (isCacheValid(currentThemeFilePath.trim(), "themeCache")) return;
  const currentTheme = loadFile(currentThemeFilePath.trim());
  if (currentTheme) {
    const message = {
      status: 0,
      type: "theme",
      data: currentTheme,
      cacheId: currentThemeFilePath.trim(),
    };
    sendMessage(message);
  } else {
    throw Error(
      "Failed to load current theme file: " + currentThemeFilePath,
    );
  }
}

let wallpaperFileTransferOffset = 0;
let wallpaperLastMTime;
let image;
async function sendWallpaper() {
  const sendData = (cacheId) => {
    const data = image.slice(
      wallpaperFileTransferOffset,
      wallpaperFileTransferOffset + 512,
    );
    wallpaperFileTransferOffset += data.length;
    if (wallpaperFileTransferOffset >= image.length) {
      wallpaperFileTransferOffset = 0;
    }
    sendMessage({
      status: wallpaperFileTransferOffset === 0 ? 0 : 0.5,
      type: "wallpaper",
      data,
      cacheId,
    });
  };

  if (wallpaperFileTransferOffset !== 0) {
    sendData();
    return;
  } // send remaining string.

  const wallpaperFilePathCache = getenv("HOME")?.concat(
    "/.cache/WallRizzFox/wallpaperPath.txt",
  );

  const [fileStats, err] = stat(wallpaperFilePathCache);
  if (err !== 0) {
    throw Error(
      "Failed to read " + wallpaperFilePathCache + " stats." +
        "\nError code: " + err,
    );
  }
  if (wallpaperLastMTime && fileStats.mtime <= wallpaperLastMTime) return;
  const wallpaperPath = loadFile(wallpaperFilePathCache).trim();

  if (isCacheValid(wallpaperPath.trim(), "wallpaperCache")) return;

  wallpaperLastMTime = fileStats.mtime;
  const imageBase64encoded = await execAsync(["base64", wallpaperPath]);
  image = `data:image/${
    wallpaperPath.slice(wallpaperPath.lastIndexOf(".") + 1)
  };base64,${imageBase64encoded}`;
  sendData(wallpaperPath);
}

if (isatty()) {
  const nativeAppJson = {
    "name": "WallRizzFox",
    "description": "Native app manifest for firefox.",
    "path": scriptArgs[1] ?? "/usr/bin/WallRizzFox",
    "type": "stdio",
    "allowed_extensions": ["WallRizz@Fox"],
  };

  const nativeAppManifestFilePath =
    "/usr/lib/mozilla/native-messaging-hosts/WallRizzFox.json";
  const nativeAppManifest = open(nativeAppManifestFilePath, "w+");

  if (!nativeAppManifest) {
    print(
      '  Failed to open native app manifest "' + nativeAppManifestFilePath +
        '".\n  Run "sudo WallRizzFox" to generate the app manifest.',
    );
    exit(1);
  }

  nativeAppManifest.puts(JSON.stringify(nativeAppJson));
  nativeAppManifest.close();
  exit(0);
}

// Main loop
while (true) {
  try {
    const receivedMessage = getMessage();
    switch (receivedMessage) {
      case "getTheme":
        sendTheme();
        break;
      case "getWallpaper":
        await sendWallpaper();
    }
  } catch (err) {
    const message = {
      status: 1,
      data: `${err.constructor.name}: ${err.message}\n${err.stack}`,
    };
    sendMessage(message);
  }
}
