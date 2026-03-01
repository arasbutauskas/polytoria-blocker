(() => {
  const STORAGE_KEY = "blockedEntries";
  let blockedEntries = new Set();
  let scanTimer = null;

  function normalize(value) {
    return (value || "").trim().toLowerCase();
  }

  function isDeclineButton(el) {
    const text = normalize(el.textContent);
    const onClickText = normalize(el.getAttribute("onclick"));
    const classText = normalize(el.className);

    return (
      text.includes("decline") ||
      text.includes("ignore") ||
      text.includes("deny") ||
      onClickText.includes("declinefriendrequest") ||
      classText.includes("btn-danger")
    );
  }

  function extractUserIdFromButton(button) {
    return normalize(button.getAttribute("data-user-id") || button.dataset?.userId || "");
  }

  function extractUsernameFromCard(card) {
    const userSpan = card.querySelector(".userlink-default");
    if (userSpan?.textContent) {
      return normalize(userSpan.textContent);
    }

    const userHeading = card.querySelector("h5, h4, h3, h2, h1, strong, .username");
    if (userHeading?.textContent) {
      return normalize(userHeading.textContent);
    }

    const profileLink = card.querySelector('a[href^="/users/"]');
    if (profileLink?.textContent) {
      return normalize(profileLink.textContent);
    }

    return "";
  }

  function shouldBlock({ username, userId }) {
    if (userId && blockedEntries.has(userId)) {
      return true;
    }

    if (username && blockedEntries.has(username)) {
      return true;
    }

    return false;
  }

  function scanAndDecline() {
    if (!blockedEntries.size) {
      return;
    }

    const candidates = Array.from(document.querySelectorAll("a.btn, button"));

    for (const button of candidates) {
      if (button.dataset.polyBlockerDone === "1" || !isDeclineButton(button)) {
        continue;
      }

      const card = button.closest(".card-body, .card, .friend-request, .request, li, tr, .media") || button.parentElement;
      if (!card) {
        continue;
      }

      const userId = extractUserIdFromButton(button);
      const username = extractUsernameFromCard(card);

      if (!shouldBlock({ username, userId })) {
        continue;
      }

      button.dataset.polyBlockerDone = "1";
      button.click();
      console.info(`[Polytoria Blocker] Declined request from ${username || "unknown"} (id: ${userId || "unknown"}).`);
    }
  }

  function scheduleScan() {
    if (scanTimer) {
      clearTimeout(scanTimer);
    }

    scanTimer = setTimeout(scanAndDecline, 120);
  }

  function loadBlockedEntries(callback) {
    chrome.storage.sync.get([STORAGE_KEY, "blockedUsers"], (result) => {
      const entries = Array.isArray(result[STORAGE_KEY]) ? result[STORAGE_KEY] : [];
      const legacy = Array.isArray(result.blockedUsers) ? result.blockedUsers : [];
      blockedEntries = new Set([...entries, ...legacy].map(normalize).filter(Boolean));
      callback();
    });
  }

  loadBlockedEntries(scanAndDecline);

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "sync") {
      return;
    }

    if (!changes[STORAGE_KEY] && !changes.blockedUsers) {
      return;
    }

    const nextPrimary = Array.isArray(changes[STORAGE_KEY]?.newValue) ? changes[STORAGE_KEY].newValue : [];
    const nextLegacy = Array.isArray(changes.blockedUsers?.newValue) ? changes.blockedUsers.newValue : [];

    blockedEntries = new Set([...nextPrimary, ...nextLegacy].map(normalize).filter(Boolean));
    scheduleScan();
  });

  const observer = new MutationObserver(scheduleScan);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  scheduleScan();
})();
