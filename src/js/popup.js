chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "AVADA_INTERCEPTED_REQUEST") {
    console.log("222 Received intercepted request:", message.data);
    window.AvadaClonedRequest = message.data;
  }
});
