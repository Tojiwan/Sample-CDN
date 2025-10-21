(async () => {
    const currentScript = document.currentScript;
    const scriptUrl = new URL(currentScript.src);
    const id = scriptUrl.searchParams.get("id");                                        // required
    const apiBase = scriptUrl.searchParams.get("api") || (window.location.origin + "/api");  // NEW
    const BRAND = scriptUrl.searchParams.get("brand") || "Tigernethost";                   // NEW
    const CHAT_INPUT_KEY = "chatInput";

    if (!id) return;

    let enabled = false;                                  // NEW
    let webhookUrlFromAPI = null;                         // NEW
    try {                                                 // NEW
        const res = await fetch(
            `${apiBase.replace(/\/$/, '')}/ai/bots/${encodeURIComponent(id)}/status`,
            { method: "GET", headers: { "Accept": "application/json" } }
        );
        if (res.ok) {
            const data = await res.json();
            enabled = !!data.enabled;
            webhookUrlFromAPI = data.webhookUrl || null;
        }
    } catch (_) {
        // If status check fails (network/CORS), fail closed: render nothing
        return; // NEW
    }
    if (!enabled) return; // NEW

    // 2) Build webhook URL (prefer server-provided URL, fallback to calculated)
    const WEBHOOK = webhookUrlFromAPI || `https://n8n.tigernethost.com/webhook/${id}/chat`; // CHANGED

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
    const panel = document.getElementById("cw-panel");
    const body = document.getElementById("cw-body");
    const input = document.getElementById("cw-input");
    const send = document.getElementById("cw-send");
    const launch = document.getElementById("cw-launcher");
    const closeBtn = panel.querySelector(".cw-close");

    let sessionId = localStorage.getItem("n8n-chat/sessionId");
    if (!sessionId) {
        sessionId = window.crypto.randomUUID();
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
                t.innerHTML =
                    '<span class="cw-dots"><span></span><span></span><span></span></span> typing…';
                body.appendChild(t);
            }
        } else if (t) t.remove();
        body.scrollTop = body.scrollHeight;
    }

    async function checkStatusAndHide() {// NEW
        try {
            const res = await fetch(
                `${apiBase.replace(/\/$/, '')}/ai/bots/${encodeURIComponent(id)}/status`,
                { headers: { "Accept": "application/json" } }
            );
            const j = await res.json();
            if (!j.enabled) {
                document.getElementById('cw-panel')?.remove();
                document.getElementById('cw-launcher')?.remove();
            }
        } catch (_) { /* ignore */ }
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
                reply =
                    data.output ??
                    data.data?.response ??
                    data.response ??
                    data.reply ??
                    JSON.stringify(data);
            } else {
                reply = await res.text(); // ⬅️ plain text from n8n
            }

            typing(false);
            addBubble(BRAND, reply || "(no reply)");
        } catch (e) {
            typing(false);
            addBubble("System", "Error: " + e.message);
            checkStatusAndHide(); // NEW: if a send fails, re-check status and hide if deactivated
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

    setTimeout(checkStatusAndHide, 0);
})();
