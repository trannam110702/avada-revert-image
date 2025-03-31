// Listen for messages from the webpage
window.addEventListener("message", function (event) {
  if (
    [
      "AVADA_INTERCEPTED_REQUEST",
      "AVADA_INTERCEPTED_GET_PREVIEWS_REQUEST",
      "AVADA_INTERCEPTED_UPDATE_REQUEST",
    ].includes(event.data.type)
  ) {
    chrome.runtime.sendMessage({
      type: event.data.type,
      data: event.data.data,
    });
  }
});

// Listen for messages from the extension
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === "START_REVERT_IN_PAGE") {
    const { url: bulkRevertUrl } = message.data;
    // Get the stored requests from extension storage
    const {
      clonedRequest,
      previewRequest: clonedGetPreviewsRequest,
      updateRequest: clonedUpdateRequest,
    } = await chrome.storage.local.get([
      "clonedRequest",
      "previewRequest",
      "updateRequest",
    ]);

    if (!clonedGetPreviewsRequest || !clonedUpdateRequest) {
      throw new Error("Required requests not found in storage");
    }
    try {
      console.log(
        "333 START_REVERT_IN_PAGE",
        bulkRevertUrl,
        clonedGetPreviewsRequest,
        clonedUpdateRequest
      );
      const imageIds = await getImagesFromBulkRevert(bulkRevertUrl);
      console.log("333 imageIds", imageIds);
      const chunkedImages = chunk(imageIds, 50);
      for (const chunkedImage of chunkedImages) {
        await Promise.all(
          chunkedImage.map(async (id) =>
            revertImage(id, clonedGetPreviewsRequest, clonedUpdateRequest)
          )
        );
        await delay(1000);
      }
      console.log("Successfully reverted", imageIds.length, "images");

      sendResponse({ success: true });
    } catch (error) {
      console.error("Error during revert operation:", error);
      sendResponse({ success: false, error: error.message });
    }

    return true; // Required for async response
  }
});

const prepareImages = async ({ resp, lastLineNo = 0 }) => {
  const data =
    typeof resp === "string"
      ? resp?.split("\n").filter(Boolean)
      : [JSON.stringify(resp)];
  const mediaImages = [];

  data.slice(lastLineNo).some((line, index) => {
    if (!line) return;
    const lineNo = lastLineNo + index;
    const { __parentId: parentId, ...item } = JSON.parse(line);
    switch (getItemTypeById(item.id)) {
      case "MediaImage":
        mediaImages.push({ productId: parentId, ...item, lineNo });
        break;
    }
  });

  return mediaImages;
};

const getImagesFromBulkRevert = async (bulkRevertUrl) => {
  // Send request to background script to fetch the data
  const response = await chrome.runtime.sendMessage({
    type: "FETCH_BULK_REVERT",
    data: { url: bulkRevertUrl },
  });

  if (!response.success) {
    throw new Error(response.error || "Failed to fetch bulk revert data");
  }

  const images = await prepareImages({ resp: response.data, getAll: true });
  const imageIds = [...new Set(images.map((image) => image.id))];
  return imageIds;
};

function getItemTypeById(id) {
  return ["MediaImage", "ProductImage", "ProductVariant"].find((type) =>
    id.startsWith(`gid://shopify/${type}`)
  );
}

async function getVersionId(mediaImageId, clonedGetPreviewsRequest) {
  const restId = graphQLIdToRestId(mediaImageId);
  const { url, config } = clonedGetPreviewsRequest;
  const headers = config?.headers || {};
  const resp = await fetch(url, {
    headers,
    body: `{"operationName":"FilePreview","variables":{"id":"${mediaImageId}"},"query":"query FilePreview($id: ID!) {\\n  node(id: $id) {\\n    ... on File {\\n      id\\n      alt\\n      displayName\\n      connectedResourcesCount\\n      connectedResourcesCountByType {\\n        productsCount\\n        themesCount\\n        brandSettingsCount\\n        metaobjectsCount\\n        brandImagesCount\\n        __typename\\n      }\\n      fileStatus\\n      fileVersions {\\n        id\\n        __typename\\n      }\\n      createdAt\\n      ...FilePreviewFragment\\n      __typename\\n    }\\n    ... on MediaImage {\\n      ...MediaImageFragment\\n      presentation {\\n        ... on MediaPresentation {\\n          id\\n          settings {\\n            ... on MediaImagePresentationSettings {\\n              focalPoint {\\n                x\\n                y\\n                __typename\\n              }\\n              __typename\\n            }\\n            __typename\\n          }\\n          __typename\\n        }\\n        __typename\\n      }\\n      __typename\\n    }\\n    ...VideoFragment\\n    ... on ExternalVideo {\\n      originUrl\\n      __typename\\n    }\\n    ... on Model3d {\\n      ...Model3dFragment\\n      presentation {\\n        ... on MediaPresentation {\\n          id\\n          settings {\\n            ... on Model3dPresentationSettings {\\n              backgroundColor\\n              cameraFieldOfView\\n              cameraPosition\\n              cameraTarget\\n              environmentImage {\\n                id\\n                url\\n                __typename\\n              }\\n              exposure\\n              transparentBackground\\n              __typename\\n            }\\n            __typename\\n          }\\n          __typename\\n        }\\n        __typename\\n      }\\n      __typename\\n    }\\n    ... on GenericFile {\\n      originalFileSize\\n      mimeType\\n      url\\n      __typename\\n    }\\n    __typename\\n  }\\n}\\n\\nfragment FilePreviewFragment on File {\\n  preview {\\n    status\\n    image {\\n      id\\n      width\\n      height\\n      url\\n      transformedSrc: url(transform: {maxWidth: 200, maxHeight: 200})\\n      __typename\\n    }\\n    __typename\\n  }\\n  __typename\\n}\\n\\nfragment MediaImageFragment on MediaImage {\\n  id\\n  displayName\\n  createdAt\\n  mimeType\\n  originalFileSize\\n  originalSource {\\n    url\\n    __typename\\n  }\\n  alt\\n  ...FilePreviewFragment\\n  __typename\\n}\\n\\nfragment VideoFragment on Video {\\n  id\\n  displayName\\n  createdAt\\n  alt\\n  originalFileSize\\n  duration\\n  originalSource {\\n    url\\n    width\\n    height\\n    format\\n    mimeType\\n    __typename\\n  }\\n  sources {\\n    url\\n    width\\n    height\\n    format\\n    mimeType\\n    __typename\\n  }\\n  ...FilePreviewFragment\\n  __typename\\n}\\n\\nfragment Model3dFragment on Model3d {\\n  id\\n  displayName\\n  createdAt\\n  alt\\n  fileStatus\\n  sources {\\n    format\\n    url\\n    filesize\\n    __typename\\n  }\\n  originalSource {\\n    url\\n    format\\n    mimeType\\n    filesize\\n    __typename\\n  }\\n  ...FilePreviewFragment\\n  __typename\\n}\\n"}`,
    method: "POST",
  });

  const data = await resp.json();
  return data?.data?.node?.fileVersions?.[0]?.id;
}

async function revertToOrigin(
  mediaImageId,
  imageVersionId,
  clonedUpdateRequest
) {
  const { url, config } = clonedUpdateRequest;
  const headers = config?.headers || {};
  const resp = await fetch(url, {
    headers,
    body: `{"operationName":"FileUpdateNext","variables":{"input":[{"id":"${mediaImageId}","revertToVersionId":"${imageVersionId}"}]},"query":"mutation FileUpdateNext($input: [FileUpdateInput!]!) {\\n  fileUpdate(files: $input) {\\n    userErrors {\\n      code\\n      message\\n      __typename\\n    }\\n    batchStatus {\\n      id\\n      __typename\\n    }\\n    files {\\n      id\\n      alt\\n      displayName\\n      fileStatus\\n      ...FilePreviewFragment\\n      __typename\\n    }\\n    __typename\\n  }\\n}\\n\\nfragment FilePreviewFragment on File {\\n  preview {\\n    status\\n    image {\\n      id\\n      width\\n      height\\n      url\\n      transformedSrc: url(transform: {maxWidth: 200, maxHeight: 200})\\n      __typename\\n    }\\n    __typename\\n  }\\n  __typename\\n}\\n"}`,
    method: "POST",
  });

  const data = await resp.json();
  console.log(data?.extensions?.cost?.throttleStatus?.currentlyAvailable);
  return data?.data?.node?.fileVersions?.[0]?.id;
}

const revertImage = async (
  mediaImageId,
  clonedGetPreviewsRequest,
  clonedUpdateRequest
) => {
  try {
    const imageVersionId = await getVersionId(
      mediaImageId,
      clonedGetPreviewsRequest
    );
    if (!imageVersionId) {
      console.log("Cannot get image version id of", mediaImageId);
      return;
    }
    console.log("Reverting", mediaImageId, imageVersionId);
    await revertToOrigin(mediaImageId, imageVersionId, clonedUpdateRequest);
    console.log("Revert successfully", mediaImageId);
  } catch (e) {
    console.error("revertImage", mediaImageId, e.message);
  }
};

function chunk(input, size) {
  return input.reduce((arr, item, idx) => {
    return idx % size === 0
      ? [...arr, [item]]
      : [...arr.slice(0, -1), [...arr.slice(-1)[0], item]];
  }, []);
}

function delay(ms) {
  return new Promise(function (res) {
    return setTimeout(res, ms);
  });
}

function graphQLIdToRestId(gid) {
  gid = String(gid);
  if (!gid.includes("gid://")) {
    return gid;
  }
  const parts = gid.split("/");
  return parts[parts.length - 1];
}
