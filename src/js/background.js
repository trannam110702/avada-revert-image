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
              url.includes("api/shopify/nam-product-store") &&
              url.includes("operation=FilesQuery") &&
              url.includes("type=query") &&
              config?.body?.includes("media_type:Image")
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

                // Send message using postMessage
                window.postMessage(
                  {
                    type: "AVADA_INTERCEPTED_REQUEST",
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
