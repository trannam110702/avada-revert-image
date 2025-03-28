document.getElementById("injectButton").addEventListener("click", async () => {
  const jsCode = document.getElementById("jsCode").value;

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: function (code) {
        // This function runs in the context of the web page
        try {
          // Execute the code in the page context
          return Function(code)();
        } catch (err) {
          console.error("Failed to execute code:", err);
        }
      },
      args: [jsCode], // Pass the code as an argument
      world: "MAIN",
    });
  } catch (error) {
    console.error("Error injecting script:", error);
  }
});
