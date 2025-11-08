const GEMINI_API_KEY = "YOUR API KEY";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Check if this message is asking for a Gemini explanation
  if (message.action === "getGeminiExplanation") {
    //request to Gemini API
    fetch("https://api.gemini.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${YOUR API KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gemini-1.5", // Choose your model
        messages: [
          {
            role: "system",
            content: "Explain the concept in simple, easy-to-understand terms. Clearly describe what it is, how it works, and why it happens or matters. Use short sentences, plain language, and a simple real-life analogy if possible so that anyone can understand it"
          },
          {
            role: "user",
            content: message.text //the highlighted text
          }
        ]
      })
    })
      .then(response => response.json()) // Parse JSON response
      .then(data => {
        //explanation to content.js
        if (data.choices && data.choices.length > 0) {
          sendResponse({ result: data.choices[0].message.content });
        } else {
          sendResponse({ error: "No response from Gemini API" });
        }
      })
      .catch(error => {
        console.error("Gemini API error:", error);
        sendResponse({ error: error.message });
      });
    return true;
  }
});
