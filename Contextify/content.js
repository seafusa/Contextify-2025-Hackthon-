console.log("[Contextify] Content script loaded");

let quickBtn = null;
let boxOverlay = null;

function showQuickButton(selectionText, range) {
  removeQuickButton();

  const rect = range.getBoundingClientRect();
  const middleX = rect.left + rect.width / 2;
  const bottomY = rect.bottom + 6;

  quickBtn = document.createElement("button");
  quickBtn.textContent = "?";
  Object.assign(quickBtn.style, {
    position: "fixed",
    top: `${Math.min(bottomY, window.innerHeight - 40)}px`,
    left: `${Math.min(middleX - 16, window.innerWidth - 40)}px`,
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "#FFA500",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    zIndex: 99999,
    fontSize: "20px",
    fontWeight: "bold",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
    transition: "transform 0.2s, background 0.2s"
  });

  quickBtn.addEventListener("mouseenter", () => {
    quickBtn.style.background = "#ff8c00";
    quickBtn.style.transform = "scale(1.1)";
  });
  quickBtn.addEventListener("mouseleave", () => {
    quickBtn.style.background = "#FFA500";
    quickBtn.style.transform = "scale(1)";
  });

  quickBtn.addEventListener("click", () => {
    console.log("[Contextify] Button clicked");
    handleTrigger(selectionText);
    removeQuickButton();
  });

  document.body.appendChild(quickBtn);
}

function removeQuickButton() {
  if (quickBtn) {
    quickBtn.remove();
    quickBtn = null;
  }
}

function showBox(text) {
  if (!boxOverlay) {
    boxOverlay = document.createElement("div");
    Object.assign(boxOverlay.style, {
      position: "fixed",
      top: "20px",
      right: "20px",
      width: "320px",
      maxHeight: "420px",
      overflowY: "auto",
      background: "#fff",
      border: "1px solid #ddd",
      borderRadius: "14px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      padding: "14px 16px 16px",
      zIndex: 999999,
      fontFamily: "Segoe UI, sans-serif",
      fontSize: "14px",
      lineHeight: "1.4",
      whiteSpace: "pre-wrap",
      color: "#333",
      opacity: "0",
      transition: "opacity 0.25s ease"
    });

    // Close button
    const closeBtn = document.createElement("button");
    closeBtn.textContent = "✖";
    Object.assign(closeBtn.style, {
      position: "absolute",
      top: "6px",
      right: "8px",
      border: "none",
      background: "transparent",
      color: "#FFA500",
      fontSize: "18px",
      cursor: "pointer",
      transition: "color 0.2s"
    });

    closeBtn.addEventListener("mouseenter", () => (closeBtn.style.color = "#ff8c00"));
    closeBtn.addEventListener("mouseleave", () => (closeBtn.style.color = "#FFA500"));
    closeBtn.addEventListener("click", () => {
      boxOverlay.remove();
      boxOverlay = null;
    });

    boxOverlay.appendChild(closeBtn);
    document.body.appendChild(boxOverlay);
    requestAnimationFrame(() => (boxOverlay.style.opacity = "1"));
  }

  // Remove previous content but keep close button
  boxOverlay.childNodes.forEach(node => {
    if (node.tagName !== "BUTTON") node.remove();
  });
  const content = document.createElement("div");
  content.textContent = text;
  content.style.marginTop = "8px";
  boxOverlay.appendChild(content);
}

function handleTrigger(selectedText) {
  const text = selectedText?.trim();
  if (!text) {
    console.warn("[Contextify] No text selected");
    return;
  }

  showBox("Thinking...");
  chrome.runtime.sendMessage({ type: "EXPLAIN", text }, () => {
    if (chrome.runtime.lastError) {
      showBox("Thinking..");
    }
  });
}

document.addEventListener("mouseup", () => {
  const sel = window.getSelection();
  const text = sel.toString().trim();
  if (text.length > 0) {
    const range = sel.getRangeAt(0);
    showQuickButton(text, range);
  } else {
    removeQuickButton();
  }
});

chrome.runtime.onMessage.addListener(msg => {
  if (msg.type === "EXPLAIN_RESULT") showBox(msg.text);
  if (msg.type === "TRIGGER_CONTEXTIFY") {
    const selectedText = window.getSelection().toString().trim();
    console.log("[Contextify] Command triggered");
    handleTrigger(selectedText);
    removeQuickButton();
  }
});
