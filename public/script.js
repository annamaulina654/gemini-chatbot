const form = document.getElementById("chat-form");
const input = document.getElementById("user-input");
const chatBox = document.getElementById("chat-box");
const avatarTemplates = document.getElementById("avatar-templates");
const sendButton = form.querySelector("button");

function updateButtonState() {
  if (input.value.trim() === "") {
    sendButton.disabled = true;
  } else {
    sendButton.disabled = false;
  }
}

input.addEventListener("input", updateButtonState);

function appendMessage(sender, text) {
  const msgContainer = document.createElement("div");
  msgContainer.classList.add("message", sender);

  const avatar = avatarTemplates.querySelector(`.${sender}-avatar`).cloneNode();
  msgContainer.appendChild(avatar);

  const contentWrapper = document.createElement("div");
  contentWrapper.classList.add("content-wrapper");

  const msgBubble = document.createElement("div");
  msgBubble.classList.add("bubble");

  msgBubble.innerHTML = marked.parse(text);

  contentWrapper.appendChild(msgBubble);

  const timestamp = document.createElement("div");
  timestamp.classList.add("timestamp");
  timestamp.textContent = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  contentWrapper.appendChild(timestamp);

  msgContainer.appendChild(contentWrapper);
  chatBox.appendChild(msgContainer);
  chatBox.scrollTop = chatBox.scrollHeight;
  return msgContainer;
}

document.addEventListener("DOMContentLoaded", () => {
  appendMessage("bot", "Halo! Ada yang bisa saya bantu hari ini?");
  updateButtonState();
});

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    form.dispatchEvent(new Event("submit"));
  }
});

function showTypingIndicator() {
  const indicator = document.createElement("div");
  indicator.classList.add("message", "bot", "typing-indicator");
  const avatar = avatarTemplates.querySelector(".bot-avatar").cloneNode();
  indicator.appendChild(avatar);
  indicator.innerHTML += `
    <div class="bubble">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
    </div>
  `;
  chatBox.appendChild(indicator);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function hideTypingIndicator() {
  const indicator = document.querySelector(".typing-indicator");
  if (indicator) indicator.remove();
}

form.addEventListener("submit", async function (e) {
  e.preventDefault();
  const userMessage = input.value.trim();
  if (!userMessage) return;

  appendMessage("user", userMessage);
  input.value = "";
  updateButtonState();
  showTypingIndicator();

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    hideTypingIndicator();
    if (!response.ok) throw new Error(`Server error: ${response.status}`);

    const data = await response.json();
    appendMessage("bot", data.reply || "Maaf, tidak ada balasan diterima.");
  } catch (error) {
    console.error("Failed to fetch chat response:", error);
    hideTypingIndicator();
    appendMessage("bot", "Gagal mendapatkan respons dari server.");
  }
});
