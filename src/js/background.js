// Original tab update listener code
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    const urlPatterns = [
      "https://admin.shopify.com/*",
      "http://localhost:5173/*",
    ];

    if (
      urlPatterns.some((pattern) => {
        const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
        return regex.test(tab.url);
      })
    ) {
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: () => {
          console.log("Create a fetch observer");
          const originalFetch = window.fetch;
          window.fetch = async function (...args) {
            const [url, config] = args;

            if (
              (url.includes("operation=FilesQuery") &&
                url.includes("type=query") &&
                config?.body?.includes("media_type:Image")) ||
              (url.includes("operation=FilePreview") &&
                url.includes("type=query")) ||
              (url.includes("operation=FileUpdateNext") &&
                url.includes("type=mutation"))
            ) {
              try {
                const response = await originalFetch(...args);
                const requestClone = args[1] ? { ...args[1] } : {};

                // Clean up the config object to make it clonable
                const cleanConfig = {
                  method: requestClone.method,
                  headers: requestClone.headers
                    ? { ...requestClone.headers }
                    : {},
                  body: requestClone.body,
                  mode: requestClone.mode,
                  credentials: requestClone.credentials,
                  cache: requestClone.cache,
                  redirect: requestClone.redirect,
                  referrer: requestClone.referrer,
                  referrerPolicy: requestClone.referrerPolicy,
                };

                // Determine message type based on operation
                let messageType = "AVADA_INTERCEPTED_REQUEST";
                if (url.includes("operation=FilePreview")) {
                  messageType = "AVADA_INTERCEPTED_GET_PREVIEWS_REQUEST";
                } else if (url.includes("operation=FileUpdateNext")) {
                  messageType = "AVADA_INTERCEPTED_UPDATE_REQUEST";
                }

                // Send message using postMessage
                window.postMessage(
                  {
                    type: messageType,
                    data: {
                      url: args[0],
                      config: cleanConfig,
                    },
                  },
                  "*"
                );

                return response;
              } catch (error) {
                console.error("Error intercepting request:", error);
                throw error;
              }
            }

            return originalFetch(...args);
          };
        },
        world: "MAIN",
      });
    }
  }
});

// Add CORS bypass
chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    const headers = details.responseHeaders.filter(
      (header) =>
        ![
          "access-control-allow-origin",
          "access-control-allow-methods",
          "access-control-allow-headers",
        ].includes(header.name.toLowerCase())
    );

    headers.push({
      name: "Access-Control-Allow-Origin",
      value: "*",
    });
    headers.push({
      name: "Access-Control-Allow-Methods",
      value: "GET, PUT, POST, DELETE, HEAD, OPTIONS, PATCH",
    });
    headers.push({
      name: "Access-Control-Allow-Headers",
      value: "*",
    });
    headers.push({
      name: "Access-Control-Allow-Credentials",
      value: "true",
    });

    return { responseHeaders: headers };
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders", "extraHeaders"]
);

// Listen for messages from content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "AVADA_INTERCEPTED_REQUEST") {
    // Store the request in chrome.storage
    chrome.storage.local.set({ clonedRequest: message.data });
    // Broadcast to all extension pages
    chrome.runtime.sendMessage({
      type: "AVADA_INTERCEPTED_REQUEST",
      data: message.data,
    });
  } else if (message.type === "AVADA_INTERCEPTED_GET_PREVIEWS_REQUEST") {
    // Store the preview request
    chrome.storage.local.set({ previewRequest: message.data });
    chrome.runtime.sendMessage({
      type: "AVADA_INTERCEPTED_GET_PREVIEWS_REQUEST",
      data: message.data,
    });
  } else if (message.type === "AVADA_INTERCEPTED_UPDATE_REQUEST") {
    // Store the update request
    chrome.storage.local.set({ updateRequest: message.data });
    chrome.runtime.sendMessage({
      type: "AVADA_INTERCEPTED_UPDATE_REQUEST",
      data: message.data,
    });
  } else if (message.type === "GET_STATE") {
    // Handle requests for current state
    chrome.storage.local.get(
      ["clonedRequest", "previewRequest", "updateRequest"],
      (result) => {
        sendResponse(result);
      }
    );
    return true; // Required for async response
  } else if (message.type === "FETCH_BULK_REVERT") {
    // Handle bulk revert fetch request
    fetch(message.data.url)
      .then((response) => response.text())
      .then((data) => {
        sendResponse({ success: true, data });
      })
      .catch((error) => {
        console.error("Error fetching bulk revert data:", error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Required for async response
  }
});

// Handle messages from extension and forward to content script
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === "START_REVERT") {
    try {
      // Get active tab
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      console.log("1211 START_REVERT", tab);

      // Forward the message to content script in the web page context
      chrome.tabs.sendMessage(tab.id, {
        type: "START_REVERT_IN_PAGE",
        data: message.data,
      });
    } catch (error) {
      console.error("Error forwarding revert message:", error);
    }
  }
});
