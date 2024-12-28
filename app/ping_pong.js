#!/usr/bin/env qjs

import * as std from 'std';

const sampleTheme = { "colors": { "accentcolor": null, "bookmark_text": null, "button_background_active": null, "button_background_hover": null, "frame": "rgb(255, 255, 255)", "frame_inactive": null, "icons": null, "icons_attention": null, "ntp_background": null, "ntp_card_background": null, "ntp_text": null, "popup": "rgb(0, 0, 0)", "popup_border": null, "popup_highlight": null, "popup_highlight_text": null, "popup_text": "rgb(138, 138, 138)", "sidebar": null, "sidebar_border": null, "sidebar_highlight": null, "sidebar_highlight_text": null, "sidebar_text": null, "tab_background_separator": null, "tab_background_text": "rgb(255, 255, 255)", "tab_line": "rgb(255, 255, 255)", "tab_loading": "rgb(255, 255, 255)", "tab_selected": null, "tab_text": null, "textcolor": null, "toolbar": "rgb(255, 255, 255)", "toolbar_bottom_separator": null, "toolbar_field": "rgb(0, 0, 0)", "toolbar_field_border": null, "toolbar_field_border_focus": null, "toolbar_field_focus": null, "toolbar_field_highlight": null, "toolbar_field_highlight_text": null, "toolbar_field_separator": null, "toolbar_field_text": "rgb(255, 255, 255)", "toolbar_field_text_focus": null, "toolbar_text": "rgb(255, 255, 255)", "toolbar_top_separator": null, "toolbar_vertical_separator": null }, "images": { "additional_backgrounds": null, "headerURL": null, "theme_frame": null }, "properties": { "additional_backgrounds_alignment": null, "additional_backgrounds_tiling": null, "color_scheme": null, "content_color_scheme": null } }

// Main loop
while (true) {
  try {
    const receivedMessage = getMessage();
    if (receivedMessage === "getTheme") {
      sendMessage(sampleTheme);
    }
  } catch (err) {
    std.exit(1); // Exit the program on error
  }
}

// Read a message from stdin using the length-prefixed header
function getMessage() {
  const rawLength = new Uint8Array(4);
  const bytesRead = std.in.read(rawLength.buffer, 0, 4); // Read the 4-byte header
  if (bytesRead !== 4) {
    std.exit(0); // Exit if no more data is available
  }
  const messageLength = new DataView(rawLength.buffer).getUint32(0, true); // Little-endian
  return JSON.parse(std.in.readAsString(messageLength));
}

// Encode a message for transmission with a length-prefixed header
function encodeMessage(messageContent) {
  const encodedContent = JSON.stringify(messageContent);
  const encodedLength = new Uint8Array(4);
  new DataView(encodedLength.buffer).setUint32(0, encodedContent.length, true);

  return { length: encodedLength.buffer, content: encodedContent };
}

// Send an encoded message to stdout
function sendMessage(message) {
  const encodedMessage = encodeMessage(message);
  std.out.write(encodedMessage.length, 0, 4); // Write the 4-byte length header
  std.out.puts(encodedMessage.content)
  std.out.flush();
}

