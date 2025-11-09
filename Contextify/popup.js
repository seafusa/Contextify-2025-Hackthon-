document.addEventListener("DOMContentLoaded", () => {
  const historyContainer = document.getElementById("history");
  const clearButton = document.getElementById("clearHistory");
  const themeToggle = document.getElementById("themeToggle");
  const readButton = document.getElementById("readButton");
  const logo = document.getElementById("logo");

  // Theme setup
  chrome.storage.local.get("theme", (data) => {
    if (data.theme === "dark") {
      document.body.classList.add("dark");
      themeToggle.textContent = "☀️";
    }
  });

  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    themeToggle.textContent = isDark ? "☀️" : "🌙";
    chrome.storage.local.set({ theme: isDark ? "dark" : "light" });
  });

  // Read explanation aloud
  readButton.addEventListener("click", () => {
    chrome.storage.local.get(["currentText"], (data) => {
      const textToRead = data.currentText || "Please highlight some text first.";
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = "en-US";
      utterance.onstart = () => logo.classList.add("logo-speaking");
      utterance.onend = () => logo.classList.remove("logo-speaking");
      speechSynthesis.cancel();
      speechSynthesis.speak(utterance);
    });
  });

  // Load and render history
  function loadHistory() {
    chrome.storage.local.get(["explanations"], (result) => {
      const explanations = result.explanations || [];
      if (explanations.length === 0) {
        historyContainer.innerHTML = "<p>No history yet.</p>";
        return;
      }
      historyContainer.innerHTML = "";
      explanations.forEach((item, index) => {
        const card = document.createElement("div");
        card.className = "history-card";
        card.innerHTML = `
          <p><strong>Input:</strong> ${item.text}</p>
          <p><strong>Output:</strong> ${item.explanation}</p>
          <small>${new Date(item.time).toLocaleString()}</small>
        `;
        historyContainer.appendChild(card);
      });
    });
  }

  clearButton.addEventListener("click", () => {
    chrome.storage.local.remove("explanations", () => {
      historyContainer.innerHTML = "<p>History cleared.</p>";
    });
  });

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "UPDATE_HISTORY") loadHistory();
  });

  loadHistory();

  // Logo animation
  logo.addEventListener("click", () => {
    logo.classList.add("logo-bounce");
    setTimeout(() => logo.classList.remove("logo-bounce"), 600);
  });
});
