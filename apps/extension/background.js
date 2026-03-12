chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "OPENBOOK_CAPTURE_RESULT") {
    chrome.storage.local.set({ latestBundle: message.payload }).then(() => {
      sendResponse({ ok: true });
    });
    return true;
  }

  if (message?.type === "OPENBOOK_GET_LATEST_BUNDLE") {
    chrome.storage.local.get("latestBundle").then((result) => {
      sendResponse({ ok: true, payload: result.latestBundle ?? null });
    });
    return true;
  }

  return false;
});
