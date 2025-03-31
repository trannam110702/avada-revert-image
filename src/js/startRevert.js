const startRevert = async ({
  url,
  endCursor = null,
  isContinued = false,
} = {}) => {
  chrome.runtime.sendMessage({
    type: "START_REVERT",
    data: {
      url,
      endCursor,
      isContinued,
    },
  });
};

export default startRevert;
