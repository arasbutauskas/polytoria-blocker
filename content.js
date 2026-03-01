(() => {
  const STORAGE_KEY = "blockedUsers";
  let blockedUsers = new Set();
  let scanTimer = null;

  function normalize(text) {
    return (text || "").trim().toLowerCase();
  }

  function isDeclineButton(button) {
    const text = normalize(button.textContent);
    return text.includes("decline") || text.includes("ignore") || text.includes("deny");
  }

  function extractUsernameFromCard(card) {
    const link = card.querySelector('a[href*="/users/"]');
    if (link?.textContent) {
      return normalize(link.textContent);
    }

    const dataName = card.getAttribute("data-username") || card.dataset?.username;
    if (dataName) {
      return normalize(dataName);
    }

    const heading = card.querySelector("h1, h2, h3, h4, strong, .username");
    return normalize(heading?.textContent);
  }

  function scanAndDecline() {
    if (!blockedUsers.size) {
      return;
    }

    const buttons = Array.from(document.querySelectorAll("button, a.btn"));
    for (const button of buttons) {
      if (button.dataset.polyBlockerDone === "1" || !isDeclineButton(button)) {
        continue;
      }

      const card = button.closest(".card, .friend-request, .request, li, tr, .media") || button.parentElement;
      if (!card) {
        continue;
      }

      const username = extractUsernameFromCard(card);
      if (!username || !blockedUsers.has(username)) {
        continue;
      }

      button.dataset.polyBlockerDone = "1";
      button.click();
      console.info(`[Polytoria Blocker] Declined request from ${username}.`);
    }
  }

  function scheduleScan() {
    if (scanTimer) {
      clearTimeout(scanTimer);
    }

    scanTimer = setTimeout(scanAndDecline, 120);
  }

  function readUsersFromStorage(callback) {
    chrome.storage.sync.get([STORAGE_KEY], (result) => {
      const users = Array.isArray(result[STORAGE_KEY]) ? result[STORAGE_KEY] : [];
      blockedUsers = new Set(users.map(normalize).filter(Boolean));
      callback();
    });
  }

  readUsersFromStorage(scanAndDecline);

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "sync" || !changes[STORAGE_KEY]) {
      return;
    }

    const next = Array.isArray(changes[STORAGE_KEY].newValue) ? changes[STORAGE_KEY].newValue : [];
    blockedUsers = new Set(next.map(normalize).filter(Boolean));
    scheduleScan();
  });

  const observer = new MutationObserver(scheduleScan);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  scheduleScan();
})();
