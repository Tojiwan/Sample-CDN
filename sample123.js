(() => {
	const currentScript = document.currentScript;
	const scriptUrl = new URL(currentScript.src);

	const id = scriptUrl.searchParams.get("id");
	const api = scriptUrl.searchParams.get("api");
	const BRAND_OVERRIDE = scriptUrl.searchParams.get("brand"); // optional

	if (!id || !api) {
		console.warn("[ChatWidget] Missing required params ?id=...&api=...");
		return; // Do not render anything
	}

	// 1) Call boot endpoint to check if enabled
	const bootUrl = `${api.replace(/\/$/, "")}/ai/widgets/${encodeURIComponent(id)}/boot`;

	fetch(bootUrl, { method: "GET", headers: { "Accept": "application/json" } })
		.then(async (res) => {
			if (!res.ok) throw new Error(`Boot HTTP ${res.status}`);
			return res.json();
		})
		.then((boot) => {
			if (!boot.enabled) {
				// Hard stop: do not render the widget at all
				console.info("[ChatWidget] Bot is disabled; widget not rendered.");
				return;
			}

			// 2) Proceed only when enabled
			const WEBHOOK = boot.webhookUrl; // already resolved by server
			const BRAND = BRAND_OVERRIDE || boot.brand || "Assistant";

			// --- Existing code from here down (slightly patched to use BRAND + WEBHOOK) ---

			const CHAT_INPUT_KEY = "chatInput";

			const html = `
				<div id="cw-panel" class="cw-panel">
				<div class="cw-header">
					<div><strong>${BRAND}</strong></div>
					<button class="cw-close">&times;</button>
				</div>
				<div id="cw-body" class="cw-body">
					<div class="cw-row cw-bot">
					<div class="cw-bubble">Hi! Welcome to ${BRAND}. How can I help you today?</div>
					</div>
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

			const panel = document.getElementById("cw-panel");
			const body = document.getElementById("cw-body");
			const input = document.getElementById("cw-input");
			const send = document.getElementById("cw-send");
			const launch = document.getElementById("cw-launcher");
			const closeBtn = panel.querySelector(".cw-close");

			let sessionId = localStorage.getItem("n8n-chat/sessionId");
			if (!sessionId) {
				sessionId = (window.crypto?.randomUUID?.() || Date.now().toString());
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
						headers: { "Content-Type": "application/json", "Accept": "application/json" },
						body: JSON.stringify(payload),
					});

					const ct = res.headers.get("content-type") || "";
					let reply;
					if (ct.includes("application/json")) {
						const data = await res.json();
						reply = data.output ?? data.data?.response ?? data.response ?? data.reply ?? JSON.stringify(data);
					} else {
						reply = await res.text();
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
		})
		.catch((err) => {
			console.warn("[ChatWidget] Boot failed:", err?.message || err);
		});
})();
