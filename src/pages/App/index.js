import React, { useState, useEffect } from "react";
import isEmpty from "../../helpers/isEmpty";
import "./App.css";
import startRevert from "@js/startRevert";

const App = () => {
  const [clonedRequest, setClonedRequest] = useState(null);
  useEffect(() => {
    const handleMessage = (message) => {
      if (message.type === "AVADA_INTERCEPTED_REQUEST") {
        setClonedRequest(message.data);
        chrome.storage.local.set({ clonedRequest: message.data });
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  const handleRevert = () => {
    startRevert();
  };

  const handleReload = () => {
    console.log("Reloading...");
    chrome.runtime.reload();
  };

  return (
    <div className="app flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Avada Revert Image Extension</h1>
      <div>Cloned request: {isEmpty(clonedRequest) ? "No" : "Yes"}</div>
      <button onClick={handleRevert}>Start revert</button>
      <button onClick={handleReload}>Reload extension</button>
    </div>
  );
};

export default App;
