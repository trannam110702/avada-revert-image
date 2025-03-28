import React, { useState, useEffect } from "react";

const App = () => {
  const [clonedRequest, setClonedRequest] = useState(null);
  useEffect(() => {
    const checkClonedRequest = () => {
      console.log("Checking for cloned request");
      window.AvadaClonedRequest && setClonedRequest(window.AvadaClonedRequest);
    };
    checkClonedRequest();
    const interval = setInterval(checkClonedRequest, 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <>
      <div>Cloned request: {!!clonedRequest}</div>
    </>
  );
};

export default App;
