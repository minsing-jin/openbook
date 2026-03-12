function collectBundle() {
  const headings = Array.from(document.querySelectorAll("h1, h2, h3")).map((node) => ({
    tag: node.tagName.toLowerCase(),
    text: node.textContent?.trim() ?? ""
  }));

  const links = Array.from(document.querySelectorAll("a[href]"))
    .slice(0, 50)
    .map((node) => ({
      href: node.href,
      text: node.textContent?.trim() ?? ""
    }));

  return {
    capturedAt: new Date().toISOString(),
    url: window.location.href,
    title: document.title,
    html: document.documentElement.outerHTML,
    headings,
    links
  };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "OPENBOOK_CAPTURE_PAGE") {
    return false;
  }

  const payload = collectBundle();
  chrome.runtime.sendMessage({ type: "OPENBOOK_CAPTURE_RESULT", payload }).then(() => {
    sendResponse({ ok: true });
  });
  return true;
});
