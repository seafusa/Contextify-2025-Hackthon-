document.addEventListener("DOMContentLoaded", () => {
  const historyContainer = document.getElementById("history");
  const clearButton = document.getElementById("clearHistory");
  const themeToggle = document.getElementById("themeToggle");

  chrome.storage.local.get("theme", (data) => {
    if (data.theme === "dark") {
      document.body.classList.add("dark");
      themeToggle.textContent = "☀️";
    }
  });

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      document.body.classList.toggle("dark");
      const isDark = document.body.classList.contains("dark");
      themeToggle.textContent = isDark ? "☀️" : "🌙";
      chrome.storage.local.set({ theme: isDark ? "dark" : "light" });
    });
  }

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
        <h4>Query ${index + 1}</h4>
        <p><strong>Input:</strong> ${item.text}</p>
        <p><strong>Output:</strong> ${item.explanation}</p>
        <small>${new Date(item.time).toLocaleString()}</small>
      `;
      historyContainer.appendChild(card);
    });
  });

  if (clearButton) {
    clearButton.addEventListener("click", () => {
      chrome.storage.local.remove("explanations", () => {
        historyContainer.innerHTML = "<p>History cleared.</p>";
      });
    });
  }
});
