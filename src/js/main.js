import "@js/popup.js";
import App from "../pages/App";
import React from "react";
import { createRoot } from "react-dom/client";
const container = document.getElementById("root");
const root = createRoot(container);
root.render(<App />);

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "AVADA_INTERCEPTED_REQUEST") {
    // Handle the intercepted request data
    console.log("Received intercepted request in main.js:", message.data);
    // You can store it in a variable or process it as needed
    window.AvadaClonedRequest = message.data;
  }
});
