// Listen for messages from the webpage
window.addEventListener("message", function (event) {
  if (event.data.type === "AVADA_INTERCEPTED_REQUEST") {
    console.log("111 Received intercepted request:", event.data.data);
    chrome.runtime.sendMessage({
      type: "AVADA_INTERCEPTED_REQUEST",
      data: event.data.data,
    });
  }
});
