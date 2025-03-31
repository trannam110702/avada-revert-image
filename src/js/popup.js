if (chrome.runtime)
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "AVADA_INTERCEPTED_REQUEST") {
      window.AvadaClonedRequest = message.data;
    }
  });
