const GEMINI_API_KEY = "YOUR API KEY";
const GEMINI_MODEL = "gemini-2.5-flash"; //yout model
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

console.log("[Contextify] Background loaded");

// Strip markdown and clean output
function cleanExplanation(text) {
  if (!text) return "";
  return text.replace(/[*_`]/g, "").replace(/\s*\n\s*/g, "\n").trim();
}

// Fetch explanation from Gemini
async function fetchGeminiExplanation(inputText) {
  const prompt = `Explain this simply (middle-school level). Define complex words. Keep it short. What, How and Why?\n\nText:\n${inputText}`;
  const body = { contents: [{ role: "user", parts: [{ text: prompt }] }] };

  try {
    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
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

// Save explanation to Chrome storage
function saveToHistory(inputText, explanation) {
  chrome.storage.local.get({ explanations: [] }, ({ explanations }) => {
    const updated = [{ text: inputText, explanation, time: Date.now() }, ...explanations].slice(0, 50);
    chrome.storage.local.set({ explanations: updated, currentText: explanation });
  });
}

// Handle messages from content script
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

// Handle keyboard shortcut
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "trigger_contextify") {
    console.log("[Contextify] Shortcut triggered");
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) return;

      // Ensure content script exists
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] });

      chrome.tabs.sendMessage(tab.id, { type: "TRIGGER_CONTEXTIFY" }, (res) => {
        if (chrome.runtime.lastError) {
          console.warn("[Contextify] Could not send message:", chrome.runtime.lastError.message);
        } else {
          console.log("[Contextify] Command delivered");
        }
      });
    } catch (err) {
      console.error("[Contextify] Shortcut error:", err);
    }
  }
});
