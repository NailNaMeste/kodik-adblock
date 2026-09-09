// Service worker: keeps the extension alive for declarativeNetRequest rules.
chrome.runtime.onInstalled.addListener(() => {
  console.log("[Kodik AdBlock] installed");
});
