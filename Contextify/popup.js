document.addEventListener("DOMContentLoaded", () => {
  const historyContainer = document.getElementById("history");
  const clearButton = document.getElementById("clearHistory");

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

  clearButton.addEventListener("click", () => {
    chrome.storage.local.remove("explanations", () => {
      historyContainer.innerHTML = "<p>History cleared.</p>";
    });
  });
});
