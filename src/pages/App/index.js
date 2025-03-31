import React, { useState, useEffect } from "react";
import isEmpty from "../../helpers/isEmpty";
import "./App.css";
import startRevert from "@js/startRevert";

const App = () => {
  const [clonedRequest, setClonedRequest] = useState(null);
  const [clonedGetPreviewsRequest, setClonedGetPreviewsRequest] =
    useState(null);
  const [clonedUpdateRequest, setClonedUpdateRequest] = useState(null);
  const [url, setUrl] = useState("");

  useEffect(() => {
    // Get initial state from background service worker
    chrome.runtime.sendMessage({ type: "GET_STATE" }, (response) => {
      console.log("111 GET_STATE", response);
      if (response?.clonedRequest) {
        setClonedRequest(response.clonedRequest);
      }
      if (response?.previewRequest) {
        setClonedGetPreviewsRequest(response.previewRequest);
      }
      if (response?.updateRequest) {
        setClonedUpdateRequest(response.updateRequest);
      }
    });

    // Listen for state updates from background service worker
    const handleMessage = (message) => {
      if (message.type === "AVADA_INTERCEPTED_REQUEST") {
        console.log("111 AVADA_INTERCEPTED_REQUEST", message.data);
        setClonedRequest(message.data);
      }
      if (message.type === "AVADA_INTERCEPTED_GET_PREVIEWS_REQUEST") {
        console.log("111 AVADA_INTERCEPTED_GET_PREVIEWS_REQUEST", message.data);
        setClonedGetPreviewsRequest(message.data);
      }
      if (message.type === "AVADA_INTERCEPTED_UPDATE_REQUEST") {
        console.log("111 AVADA_INTERCEPTED_UPDATE_REQUEST", message.data);
        setClonedUpdateRequest(message.data);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  const handleRevert = () => {
    startRevert({ url });
  };

  const handleReload = () => {
    console.log("Reloading...");
    chrome.runtime.reload();
    chrome.storage.local.clear();
  };

  return (
    <div className="app flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Avada Revert Image Extension</h1>
      {/* <div>Cloned request: {isEmpty(clonedRequest) ? "No" : "Yes"}</div> */}
      <div>
        Cloned get previews request:{" "}
        {isEmpty(clonedGetPreviewsRequest) ? "No" : "Yes"}
      </div>
      <div>
        Cloned update request: {isEmpty(clonedUpdateRequest) ? "No" : "Yes"}
      </div>
      {!isEmpty(clonedRequest) && (
        <div>Shop: {new URL(clonedRequest.url).pathname.split("/")[3]}</div>
      )}
      <label htmlFor="url">Bulk Revert URL: </label>
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter URL"
      />
      <button
        onClick={handleRevert}
        disabled={
          !url.length ||
          isEmpty(clonedGetPreviewsRequest) ||
          isEmpty(clonedUpdateRequest)
        }
      >
        Start revert
      </button>
      <button onClick={handleReload}>Reload extension</button>
    </div>
  );
};

export default App;
