import"./modulepreload-polyfill.js";document.getElementById("injectButton").addEventListener("click",async()=>{const t=document.getElementById("jsCode").value;try{const[e]=await chrome.tabs.query({active:!0,currentWindow:!0});await chrome.scripting.executeScript({target:{tabId:e.id},func:function(r){try{return Function(r)()}catch(c){console.error("Failed to execute code:",c)}},args:[t],world:"MAIN"})}catch(e){console.error("Error injecting script:",e)}});
