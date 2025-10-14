(() => {
    const BRAND          = "Tigernethost";
    const WEBHOOK        = "https://n8n.tigernethost.com/webhook/cdefd253-6cb3-4ae7-b5b6-598f6253d410/chat";
    const CHAT_INPUT_KEY = "chatInput";

    // Create HTML elements dynamically
    const html = `
    <div id="cw-panel" class="cw-panel">
      <div class="cw-header">
        <div><strong>${BRAND}</strong></div>
        <button class="cw-close">&times;</button>
      </div>
      <div id="cw-body" class="cw-body">
        <div class="cw-row cw-bot"><div class="cw-bubble">Hi! Welcome to ${BRAND}. How can I help you today? If you have any questions or need assistance, just let me know!</div></div>
      </div>
      <div class="cw-footer">
        <input id="cw-input" class="cw-input" placeholder="Type a message..." />
        <button id="cw-send" class="cw-send">Send</button>
      </div>
    </div>
    <button id="cw-launcher" class="cw-launcher" aria-label="Open chat">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/>
      </svg>
    </button>
  `;
    document.body.insertAdjacentHTML("beforeend", html);

    // JS Logic
    const panel    = document.getElementById("cw-panel");
    const body     = document.getElementById("cw-body");
    const input    = document.getElementById("cw-input");
    const send     = document.getElementById("cw-send");
    const launch   = document.getElementById("cw-launcher");
    const closeBtn = panel.querySelector(".cw-close");

    let sessionId = localStorage.getItem("n8n-chat/sessionId");
    if (!sessionId) {
        sessionId = crypto.randomUUID();
        localStorage.setItem("n8n-chat/sessionId", sessionId);
    }

    function addBubble(who, text) {
        const row = document.createElement("div");
        row.className = "cw-row " + (who === "You" ? "cw-you" : "cw-bot");
        const b = document.createElement("div");
        b.className = "cw-bubble";
        b.textContent = text;
        row.appendChild(b);
        body.appendChild(row);
        body.scrollTop = body.scrollHeight;
    }

    function typing(on) {
        let t = document.getElementById("cw-typing");
        if (on) {
            if (!t) {
                t = document.createElement("div");
                t.id = "cw-typing";
                t.className = "cw-typing";
                t.innerHTML = '<span class="cw-dots"><span></span><span></span><span></span></span> typing…';
                body.appendChild(t);
            }
        } else if (t) t.remove();
        body.scrollTop = body.scrollHeight;
    }

    async function sendMsg() {
        const msg = input.value.trim();
        if (!msg) return;
        addBubble("You", msg);
        input.value = "";
        typing(true);
        send.disabled = true;

        try {

            const payload = { [CHAT_INPUT_KEY]: msg, sessionId };

            const res = await fetch(WEBHOOK, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const ct = res.headers.get("content-type") || "";
            let reply;

            if (ct.includes("application/json")) {
                const data = await res.json();
                reply = data.output ?? data.data?.response ?? data.response ?? data.reply ?? JSON.stringify(data);
            } else {
                reply = await res.text(); // ⬅️ plain text from n8n
            }

            typing(false);
            addBubble(BRAND, reply || "(no reply)");
        } catch (e) {
            typing(false);
            addBubble("System", "Error: " + e.message);
        } finally {
            send.disabled = false;
        }
    }

    send.addEventListener("click", sendMsg);
    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMsg();
        }
    });
    launch.addEventListener("click", () => {
        panel.style.display = panel.style.display === "flex" ? "none" : "flex";
        if (panel.style.display === "flex") input.focus();
    });
    closeBtn.addEventListener("click", () => (panel.style.display = "none"));
})();

