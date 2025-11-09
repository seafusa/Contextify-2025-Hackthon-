document.addEventListener("DOMContentLoaded", () => {
  const historyContainer = document.getElementById("history");
  const clearButton = document.getElementById("clearHistory");
  const themeToggle = document.getElementById("themeToggle");
  const readButton = document.getElementById("readButton");
  const logo = document.getElementById("logo");

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

  readButton.addEventListener("click", () => {
    chrome.storage.local.get(["currentText"], (data) => {
      const textToRead = data.currentText || "Please highlight some text first.";
      const utterance = new SpeechSynthesisUtterance(textToRead);

      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.lang = "en-US";

      utterance.onstart = () => {
        logo.classList.add("logo-speaking");
      };

      utterance.onend = () => {
        logo.classList.remove("logo-speaking");
      };

      utterance.onerror = () => {
        logo.classList.remove("logo-speaking");
      };

      speechSynthesis.cancel();
      speechSynthesis.speak(utterance);
    });
  });

  document.querySelectorAll(".mini-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.textContent.trim();
      alert(`${action} feature coming soon! 🚀`);
    });
  });

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

  logo.addEventListener("click", () => {
    logo.classList.add("logo-bounce");
    createLetterEffect(logo);
    setTimeout(() => logo.classList.remove("logo-bounce"), 600);
  });

  function createLetterEffect(centerElement) {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ!?@#";
    const rect = centerElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    for (let i = 0; i < 12; i++) {
      const span = document.createElement("span");
      span.classList.add("flying-letter");
      span.textContent = letters.charAt(Math.floor(Math.random() * letters.length));
      document.body.appendChild(span);

      const angle = (Math.PI * 2 * i) / 12;
      const distance = 40 + Math.random() * 25;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;

      span.style.left = `${centerX}px`;
      span.style.top = `${centerY}px`;

      requestAnimationFrame(() => {
        span.style.transform = `translate(${x}px, ${y}px) rotate(${Math.random() * 360}deg) scale(${1 + Math.random()})`;
        span.style.opacity = "1";
      });

      setTimeout(() => {
        span.style.opacity = "0";
        span.style.transform += " scale(0)";
        setTimeout(() => span.remove(), 400);
      }, 1200 + Math.random() * 300);
    }
  }
});
