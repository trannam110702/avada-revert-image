// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Check if the page has completed loading
  if (changeInfo.status === "complete" && tab.url) {
    // Example: Run script on specific URLs
    // You can modify these patterns to match your needs
    const urlPatterns = [
      "https://admin.shopify.com/*",
      "http://localhost:5173/*",
    ];

    // Check if the current URL matches any pattern
    if (
      urlPatterns.some((pattern) => {
        // Convert URL pattern to regex
        const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
        return regex.test(tab.url);
      })
    ) {
      // Inject your script
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: () => {
          // Your code to run on matching pages
          console.log("Script injected on:", window.location.href);
          // Example: Change background color
          document.body.style.background = "#f0f0f0";
        },
        world: "MAIN",
      });
    }
  }
});
