// Mock chrome API for development
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

// Initialize development environment
console.log("Development environment initialized");
