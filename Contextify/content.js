// == Content Script for Chrome Extension ==
// This script injects a floating "?" button on text selection.
// On clicking the button, it sends selected text to the background script to get an explanation,
// then displays the explanation in a styled tooltip near the selection.
// Each step is clearly commented.

// ===================
// STEP 1: Listen for text selection events
// When the user releases mouse (mouseup), check if text is selected
// ===================
document.addEventListener("mouseup", (event) => {
    // Get the current selection object
    const selection = window.getSelection();
    const selectedText = selection.toString().trim(); // Only use non-whitespace text

    // Log selected text (Checkpoint 1)
    console.log("Selected Text:", selectedText);

    // Show or hide the quick-action button based on selection (Task 2)
    showOrHideQuickButton(selectedText, selection, event);
});

// ===========================
// Helper: Show or hide the floating "?" button depending on text selection
// ===========================
function showOrHideQuickButton(selectedText, selection, mouseEvent) {
    // Remove any existing button if present (prevents multiple buttons)
    removeQuickButton();

    // Only show button if there is non-empty text selected
    if (selectedText.length > 0) {
        // Calculate anchor for button position (Task 3)
        // Attempt to position near the bounding rectangle of selection
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        // Create floating button
        const quickBtn = document.createElement("button");
        quickBtn.textContent = "?"; // Task 2: Small round "?" button
        quickBtn.id = "explain-quick-btn";

        // Style for round, small button (Task 2)
        Object.assign(quickBtn.style, {
            position: "fixed",
            top: `${Math.min(rect.bottom + 6, window.innerHeight - 48)}px`, // Don't float off-screen
            left: `${Math.min(rect.right + 6, window.innerWidth - 48)}px`,
            zIndex: 99999,
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: "#4078c0",
            color: "#fff",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            border: "none",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
        });

        // Only show while selection persists
        document.body.appendChild(quickBtn);

        // When button is clicked: send selected text to background (Task 4)
        quickBtn.addEventListener("click", () => {
            // Send message to background with the selected text
            chrome.runtime.sendMessage({ type: "EXPLAIN", text: selectedText });

            // Build the tooltip with placeholder text (Task 5)
            injectTooltip(rect);

            // Remove button (not needed while tooltip shown)
            removeQuickButton();
        });
    }
}

// ====================
// Helper: Remove the quick-action "?" button if it exists
// ====================
function removeQuickButton() {
    const existing = document.getElementById("explain-quick-btn");
    if (existing) existing.remove();
}

// ========================
// STEP 5: Build explanation tooltip with styles and dummy text
// ========================
function injectTooltip(selectionRect) {
    // Remove old tooltip if any
    removeTooltip();

    // Create new tooltip element
    const tooltip = document.createElement("div");
    tooltip.id = "explanation-tooltip";
    tooltip.textContent = "Loading explanation..."; // Dummy text (Task 5 checkpoint)

    // Style: floating card, rounded corners, shadow, fade-in (Task 5)
    Object.assign(tooltip.style, {
        position: "fixed",
        top: `${Math.min(selectionRect.bottom + 10, window.innerHeight - 120)}px`,
        left: `${Math.min(selectionRect.left, window.innerWidth - 320)}px`,
        maxWidth: "300px",
        padding: "16px",
        background: "#fff",
        color: "#222",
        borderRadius: "10px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
        zIndex: 99999,
        opacity: 0,
        transition: "opacity 0.3s",
        fontSize: "16px",
        pointerEvents: "auto",
        fontFamily: "sans-serif"
    });

    document.body.appendChild(tooltip);
    // Trigger fade-in animation
    setTimeout(() => { tooltip.style.opacity = "1"; }, 50);
}

// ====================
// Helper: Remove existing tooltip
// ====================
function removeTooltip() {
    const tip = document.getElementById("explanation-tooltip");
    if (tip) tip.remove();
}

// =======================
// STEP 6: Listen for the explanation from background and update tooltip
// =======================
// The background script will send a message with Gemini's explanation.
// Example: chrome.runtime.sendMessage({ type: 'EXPLAIN_RESULT', text: explanation });

chrome.runtime.onMessage.addEventListener("message", (msg) => {
    // Only handle explanation result messages
    if (msg.type === "EXPLAIN_RESULT") {
        const tooltip = document.getElementById("explanation-tooltip");
        if (tooltip) {
            tooltip.textContent = msg.text; // Fill in Gemini's output
        }
    }
});

// ===========================
// Optional: Remove button/tooltip on outside click (cleanup)
// ===========================
document.addEventListener("mousedown", (event) => {
    // If user clicks outside a selection/button, remove floating elements
    const quickBtn = document.getElementById("explain-quick-btn");
    const tooltip = document.getElementById("explanation-tooltip");
    if (
        quickBtn && !quickBtn.contains(event.target) ||
        tooltip && !tooltip.contains(event.target)
    ) {
        removeQuickButton();
        removeTooltip();
    }
});
