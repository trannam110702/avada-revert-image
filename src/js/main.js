import "@js/background.js";
import "@js/popup.js";

window.chrome = {
  tabs: {
    query: async () => [{ id: "dev-tab" }],
  },
  scripting: {
    executeScript: async ({ func, args }) => {
      try {
        func(...args);
      } catch (error) {
        console.error("Error executing script:", error);
      }
    },
  },
};
