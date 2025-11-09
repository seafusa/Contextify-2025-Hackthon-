const GEMINI_API_KEY = "YOUR API KEY";
const GEMINI_MODEL = "gemini-2.5-flash"; //or your model
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

console.log("[Contextify] Background loaded");

// Clean output
function cleanExplanation(text) {
  if (!text) return "";
  return text.replace(/[*_`]/g, "").replace(/\s*\n\s*/g, "\n").trim();
}

// Fetch from Gemini
async function fetchGeminiExplanation(inputText) {
  const prompt = `Explain this simply (middle-school level). Define complex words. Keep it short.\n\nText:\n${inputText}`;
  const body = { contents: [{ role: "user", parts: [{ text: prompt }] }] };

  try {
    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    const raw = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("") || "No explanation returned";
    const explanation = cleanExplanation(raw);
    return `"${inputText}"?\n${explanation}`;
  } catch (err) {
    console.error("[Contextify] Gemini API error:", err);
    return `"${inputText}"?\nError fetching explanation.`;
  }
}

// Save to storage
function saveToHistory(inputText, explanation) {
  chrome.storage.local.get({ explanations: [] }, ({ explanations }) => {
    const updated = [{ text: inputText, explanation, time: Date.now() }, ...explanations].slice(0, 50);
    chrome.storage.local.set({ explanations: updated, currentText: explanation });
  });
}

// Handle messages
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === "EXPLAIN") {
    const text = msg.text?.trim();
    if (!text) return;
    console.log("[Contextify] Explaining text:", text);

    fetchGeminiExplanation(text).then(explanation => {
      saveToHistory(text, explanation);
      if (sender?.tab?.id !== undefined) {
        chrome.tabs.sendMessage(sender.tab.id, { type: "EXPLAIN_RESULT", text: explanation });
      }
    });
  }
});

// Handle keyboard shortcut (Ctrl+Shift+U)
chrome.commands.onCommand.addListener((command) => {
  if (command === "trigger_contextify") {
    console.log("[Contextify] Shortcut triggered");
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      chrome.tabs.sendMessage(tab.id, { type: "TRIGGER_CONTEXTIFY" });
    });
  }
});
