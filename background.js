chrome.runtime.onInstalled.addListener(() => {
  // Initialize storage
  chrome.storage.local.get(['appliedCount', 'lastRunDate', 'isRunning'], (result) => {
    const today = new Date().toLocaleDateString();
    
    // Set defaults if they don't exist, or if it's a new day reset count
    const updates = {};
    if (result.lastRunDate !== today) {
      updates.lastRunDate = today;
      updates.appliedCount = 0;
    }
    
    // Default to not running when extension is first installed/reloaded
    updates.isRunning = false;

    chrome.storage.local.set(updates);
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "closeTab") {
    // Only close if we have a valid tab ID
    if (sender.tab && sender.tab.id) {
      const tabId = sender.tab.id;
      // Close the tab
      chrome.tabs.remove(tabId, () => {
        if (chrome.runtime.lastError) {
          console.error(`Error closing tab ${tabId}: ${chrome.runtime.lastError.message}`);
        } else {
          console.log(`Tab ${tabId} closed successfully after applying.`);
        }
      });
    }
  } else if (message.action === "incrementApplyCount") {
    // Safely increment the applied count
    chrome.storage.local.get(['appliedCount'], (result) => {
      const currentCount = result.appliedCount || 0;
      chrome.storage.local.set({ appliedCount: currentCount + 1 });
    });
  }
});