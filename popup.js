document.addEventListener('DOMContentLoaded', () => {
  const startButton = document.getElementById("startButton");
  const stopButton = document.getElementById("stopButton");
  const statusBadge = document.getElementById("statusBadge");
  const appliedCountEl = document.getElementById("appliedCount");

  // Load initial state
  chrome.storage.local.get(['isRunning', 'appliedCount', 'lastRunDate'], (result) => {
    // Reset daily count if it's a new day
    const today = new Date().toLocaleDateString();
    let appliedCount = result.appliedCount || 0;
    
    if (result.lastRunDate !== today) {
      appliedCount = 0;
      chrome.storage.local.set({ appliedCount: 0, lastRunDate: today });
    }

    appliedCountEl.textContent = appliedCount;
    updateUI(!!result.isRunning);
  });

  // Listen for changes from background or content scripts (live updates)
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
      if (changes.isRunning) {
        updateUI(changes.isRunning.newValue);
      }
      if (changes.appliedCount) {
        appliedCountEl.textContent = changes.appliedCount.newValue;
      }
    }
  });

  startButton.addEventListener("click", () => {
    chrome.storage.local.set({ isRunning: true });
  });

  stopButton.addEventListener("click", () => {
    chrome.storage.local.set({ isRunning: false });
  });

  function updateUI(isRunning) {
    if (isRunning) {
      statusBadge.textContent = "Running";
      statusBadge.className = "status-badge running";
      startButton.disabled = true;
      stopButton.disabled = false;
    } else {
      statusBadge.textContent = "Stopped";
      statusBadge.className = "status-badge stopped";
      startButton.disabled = false;
      stopButton.disabled = true;
    }
  }
});