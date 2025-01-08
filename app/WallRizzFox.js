import { exit, getenv, in as stdin, loadFile, open, out as stdout } from "std";
import { isatty, stat } from "os";

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

  const currentTheme = loadFile(currentThemeFilePath.trim());
  if (currentTheme) {
    const message = {
      status: 0,
      type: "theme",
      data: currentTheme,
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
const chunkSize = 1000000;
const wallpaperFilePathCache = getenv("HOME")?.concat(
  "/.cache/WallRizzFox/wallpaperPath.txt",
);
function sendWallpaper() {
  const sendData = () => {
    // Calculate the end position for this chunk
    const endPosition = Math.min(
      wallpaperFileTransferOffset + chunkSize,
      image.length,
    );

    // Slice the data
    const data = image.slice(wallpaperFileTransferOffset, endPosition);

    // Update offset after slicing
    const isLastChunk = endPosition >= image.length;

    sendMessage({
      status: isLastChunk ? 0 : 0.5,
      type: "wallpaper",
      data,
    });

    if (isLastChunk) {
      wallpaperFileTransferOffset = 0;
    } else {
      wallpaperFileTransferOffset = endPosition;
    }
  };

  // Handle ongoing transfers
  if (wallpaperFileTransferOffset !== 0) {
    sendData();
    return;
  }

  const [fileStats, err] = stat(wallpaperFilePathCache);
  if (err !== 0) {
    throw Error(
      `Failed to read ${wallpaperFilePathCache} stats.\nError code: ${err}`,
    );
  }

  // Skip if file hasn't changed
  if (wallpaperLastMTime && fileStats.mtime <= wallpaperLastMTime) {
    return;
  }

  const wallpaperPath = loadFile(wallpaperFilePathCache).trim();
  wallpaperLastMTime = fileStats.mtime;

  image = loadFile(wallpaperPath);

  sendData();
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
        sendWallpaper();
    }
  } catch (err) {
    const message = {
      status: 1,
      data: `${err.constructor.name}: ${err.message}\n${err.stack}`,
    };
    sendMessage(message);
  }
}
