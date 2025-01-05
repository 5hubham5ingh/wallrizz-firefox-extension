import * as std from "std";
import * as os from "os";

// Helper function to convert ArrayBuffer to base64 string
function arrayBufferToBase64(buffer) {
  const BASE64_CHARS =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const bytes = new Uint8Array(buffer);
  let remainder = bytes.length % 3;
  let result = "";
  let i = 0;

  // Process 3 bytes at a time
  for (i = 0; i < bytes.length - remainder; i += 3) {
    const chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    result += BASE64_CHARS[(chunk >> 18) & 63];
    result += BASE64_CHARS[(chunk >> 12) & 63];
    result += BASE64_CHARS[(chunk >> 6) & 63];
    result += BASE64_CHARS[chunk & 63];
  }

  // Handle remaining bytes if any
  if (remainder > 0) {
    const chunk = (bytes[i] << 16) | (remainder === 2 ? bytes[i + 1] << 8 : 0);
    result += BASE64_CHARS[(chunk >> 18) & 63];
    result += BASE64_CHARS[(chunk >> 12) & 63];
    if (remainder === 2) {
      result += BASE64_CHARS[(chunk >> 6) & 63];
      result += "=";
    } else {
      result += "==";
    }
  }

  return result;
}

export function imageFileInBase64(filePath) {
  let file = null;
  try {
    // First check if file exists and get its size using os.stat
    const [statInfo] = os.stat(filePath);
    if (!statInfo) {
      throw new Error(`File not found: ${filePath}`);
    }
    const fileSize = statInfo.size;

    // Open the file in binary read mode
    file = std.open(filePath, "rb");
    if (!file) {
      throw new Error(`Could not open image file: ${filePath}`);
    }

    // Read the file into ArrayBuffer
    const buffer = new ArrayBuffer(fileSize);
    const bytesRead = file.read(buffer, 0, fileSize);
    if (bytesRead !== fileSize) {
      throw new Error(
        `Failed to read entire image: read ${bytesRead} of ${fileSize} bytes`,
      );
    }

    // Convert buffer to base64
    const base64String = arrayBufferToBase64(buffer);

    // Get file extension for MIME type
    const extension = filePath.split(".").pop().toLowerCase();
    const mimeType = getMimeType(extension);

    // Return complete base64 string with data URL format
    return `data:${mimeType};base64,${base64String}`;
  } catch (error) {
    throw new Error(
      `Error processing image file ${filePath}: ${error.message}`,
    );
  } finally {
    if (file !== null) {
      file.close();
    }
  }
}

// Helper function to get MIME type from file extension
function getMimeType(extension) {
  const mimeTypes = {
    "png": "image/png",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "gif": "image/gif",
    "webp": "image/webp",
    "bmp": "image/bmp",
  };
  return mimeTypes[extension] || "application/octet-stream";
}

imageFileInBase64(
  "/home/ss/pics/walls/1920x1080/yellow_sky.jpg",
);
