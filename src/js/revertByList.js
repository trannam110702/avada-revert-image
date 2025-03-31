/**
 * Deprecated
 *
 *
 *
 *
 *
 * @param {string[]} imageIds
 * @param {string} url
 * @param {string} endCursor
 * @param {boolean} isContinued
 */

const { clonedRequest } = await chrome.storage.local.get("clonedRequest");

if (!clonedRequest) {
  console.log("No cloned request found");
  return;
}

const { url, config } = clonedRequest;
const { method, headers, body } = config;
const newBody = body ? JSON.parse(body) : null;

if (endCursor) {
  newBody.variables.after = endCursor;
}

const response = await fetch(url, {
  method: method,
  headers: headers,
  body: JSON.stringify(newBody),
});

const { data } = await response.json();
if (!data) {
  console.log("No data found");
  return;
}

// Handle the image reversion
const { nodes } = data.files;
const imageIds = nodes.map((node) => node.id);
console.log("Image IDs:", imageIds);

// Store last cursor and check for next page
const hasNextPage = data?.files?.pageInfo?.hasNextPage;
await chrome.storage.local.set({
  lastEndCursor: data?.files?.pageInfo?.endCursor,
});
console.log("hasNextPage", hasNextPage);
if (hasNextPage) {
  // Continue with next page
  setTimeout(() => {
    startRevert({
      endCursor: data?.files?.pageInfo?.endCursor,
      isContinued: true,
    });
  }, 500);
}
