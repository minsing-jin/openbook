const captureButton = document.querySelector("#capture");
const status = document.querySelector("#status");

async function captureCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    status.textContent = "No active tab found.";
    return;
  }

  status.textContent = "Capturing page bundle...";
  await chrome.tabs.sendMessage(tab.id, { type: "OPENBOOK_CAPTURE_PAGE" });
  const response = await chrome.runtime.sendMessage({ type: "OPENBOOK_GET_LATEST_BUNDLE" });
  status.textContent = JSON.stringify(response.payload, null, 2);
}

captureButton.addEventListener("click", () => {
  captureCurrentTab().catch((error) => {
    status.textContent = `Capture failed: ${String(error)}`;
  });
});
