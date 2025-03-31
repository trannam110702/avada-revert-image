const startRevert = async ({ endCursor = null, isContinued = false }) => {
  const { clonedRequest } = await chrome.storage.local.get("clonedRequest");
  if (!clonedRequest) {
    console.log("No cloned request found");
    return;
  }
  console.log("Starting revert...", clonedRequest);
  const response = await fetch(clonedRequest.url, {
    method: clonedRequest.config.method,
    headers: clonedRequest.config.headers,
    body: clonedRequest.config.body,
  });
  const { data } = await response.json();
  if (!data) {
    console.log("No data found");
    return;
  }
  await handleRevertImages(data);
  const hasNextPage = data?.files?.pageInfo?.hasNextPage;
  await chrome.storage.local.set({
    lastEndCursor: data?.files?.pageInfo?.endCursor,
  });
  //   if (hasNextPage) {
  //     await startRevert({ endCursor: data?.files?.pageInfo?.endCursor });
  //   }
};

const handleRevertImages = async ({ files }) => {
  const { nodes } = files;
  const imageIds = nodes.map((node) => node.id);
  console.log("Image IDs:", imageIds);
};

export default startRevert;
