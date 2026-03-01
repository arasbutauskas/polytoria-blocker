const STORAGE_KEY = "blockedUsers";

const addForm = document.getElementById("add-form");
const usernameInput = document.getElementById("username");
const blockedList = document.getElementById("blocked-list");
const emptyState = document.getElementById("empty-state");
const statusEl = document.getElementById("status");

let blockedUsers = [];

function normalizeUsername(value) {
  return value.trim().toLowerCase();
}

function showStatus(text, isError = false) {
  statusEl.textContent = text;
  statusEl.style.color = isError ? "#fca5a5" : "#34d399";
}

function saveUsers() {
  chrome.storage.sync.set({ [STORAGE_KEY]: blockedUsers }, () => {
    showStatus("Saved.");
  });
}

function renderUsers() {
  blockedList.innerHTML = "";
  emptyState.style.display = blockedUsers.length ? "none" : "block";

  blockedUsers.forEach((username) => {
    const li = document.createElement("li");

    const label = document.createElement("span");
    label.textContent = username;

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";
    removeBtn.className = "remove";
    removeBtn.type = "button";
    removeBtn.addEventListener("click", () => {
      blockedUsers = blockedUsers.filter((u) => u !== username);
      saveUsers();
      renderUsers();
    });

    li.append(label, removeBtn);
    blockedList.appendChild(li);
  });
}

addForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const normalized = normalizeUsername(usernameInput.value);

  if (!normalized) {
    showStatus("Username cannot be empty.", true);
    return;
  }

  if (blockedUsers.includes(normalized)) {
    showStatus("That username is already blocked.", true);
    return;
  }

  blockedUsers.push(normalized);
  blockedUsers.sort();

  saveUsers();
  renderUsers();

  usernameInput.value = "";
  usernameInput.focus();
});

chrome.storage.sync.get([STORAGE_KEY], (result) => {
  blockedUsers = Array.isArray(result[STORAGE_KEY])
    ? result[STORAGE_KEY].map(normalizeUsername).filter(Boolean)
    : [];
  blockedUsers = [...new Set(blockedUsers)].sort();
  renderUsers();
});
