// Hermes — Tethron AI employee live chat widget (tethron.ai cyan build)
// Self-contained. Works two ways:
//   1) Floating bubble bottom-right (always on-screen)
//   2) Any element with [data-khaleesi-open] or window.Khaleesi.open()
(function () {
    if (window.__khaleesiLoaded) return;
    window.__khaleesiLoaded = true;

    const API_URL = 'https://tethron-onboard.vercel.app/api/ask-khaleesi';
    const AVATAR = '/hermes-avatar.png';

    const CSS = `
    .kh-root{position:fixed;bottom:24px;right:24px;z-index:999998;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;display:none;align-items:center;gap:12px;}
    .kh-label{background:rgba(10,11,13,.92);backdrop-filter:blur(14px) saturate(1.6);-webkit-backdrop-filter:blur(14px) saturate(1.6);border:1px solid rgba(0,212,232,.25);color:#e8fbff;font-size:13px;font-weight:600;letter-spacing:.2px;padding:10px 14px 10px 16px;border-radius:999px;box-shadow:0 10px 30px rgba(0,0,0,.5),0 0 0 1px rgba(0,212,232,.12);white-space:nowrap;cursor:pointer;transform-origin:right center;animation:kh-label-in .5s cubic-bezier(.16,1,.3,1) both;}
    .kh-label .kh-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#00d4e8;margin-right:8px;vertical-align:middle;box-shadow:0 0 10px rgba(0,212,232,.9);animation:kh-dot-pulse 1.8s ease-in-out infinite;}
    @keyframes kh-label-in{from{opacity:0;transform:translateX(12px) scale(.94);}to{opacity:1;transform:translateX(0) scale(1);}}
    @keyframes kh-dot-pulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:.55;transform:scale(.85);}}
    .kh-bubble{position:relative;width:68px;height:68px;border-radius:50%;cursor:pointer;background:radial-gradient(circle at 30% 25%,#18e4f8 0%,#00d4e8 45%,#0A9AC0 100%);border:2px solid rgba(255,255,255,.18);box-shadow:0 14px 44px rgba(0,212,232,.45),0 0 0 0 rgba(0,212,232,.5),inset 0 1px 1px rgba(255,255,255,.35);overflow:visible;display:flex;align-items:center;justify-content:center;transition:transform .25s cubic-bezier(.16,1,.3,1),box-shadow .25s ease;animation:kh-pulse 2.6s ease-out infinite;}
    .kh-bubble::before{content:'';position:absolute;inset:-6px;border-radius:50%;border:1.5px solid rgba(0,212,232,.45);animation:kh-ring 2.6s ease-out infinite;pointer-events:none;}
    .kh-bubble:hover{transform:scale(1.08);box-shadow:0 20px 60px rgba(0,212,232,.65),0 0 0 8px rgba(0,212,232,.12),inset 0 1px 1px rgba(255,255,255,.4);}
    .kh-bubble-inner{width:60px;height:60px;border-radius:50%;overflow:hidden;background:#07080a;}
    .kh-bubble-inner img{width:100%;height:100%;object-fit:cover;object-position:50% 42%;filter:saturate(1.05) contrast(1.03);}
    .kh-online{position:absolute;bottom:2px;right:2px;width:16px;height:16px;border-radius:50%;background:#4ade80;border:2.5px solid #07080a;box-shadow:0 0 10px rgba(74,222,128,.8);}
    @keyframes kh-pulse{0%{box-shadow:0 14px 44px rgba(0,212,232,.45),0 0 0 0 rgba(0,212,232,.55),inset 0 1px 1px rgba(255,255,255,.35);}70%{box-shadow:0 14px 44px rgba(0,212,232,.45),0 0 0 18px rgba(0,212,232,0),inset 0 1px 1px rgba(255,255,255,.35);}100%{box-shadow:0 14px 44px rgba(0,212,232,.45),0 0 0 0 rgba(0,212,232,0),inset 0 1px 1px rgba(255,255,255,.35);}}
    @keyframes kh-ring{0%{opacity:.7;transform:scale(1);}100%{opacity:0;transform:scale(1.35);}}
    .kh-panel{position:fixed;bottom:24px;right:24px;width:400px;max-width:calc(100vw - 32px);height:min(640px,calc(100dvh - 48px));max-height:calc(100dvh - 48px);background:#0b0c0e;border:1px solid rgba(0,212,232,.18);border-radius:22px;box-shadow:0 30px 100px rgba(0,0,0,.8),0 0 0 1px rgba(27,28,30,.8),0 0 80px rgba(0,212,232,.08);display:none;flex-direction:column;overflow:hidden;color:#f5f6f7;z-index:999999;}
    .kh-panel.open{display:flex;animation:kh-slide .32s cubic-bezier(.16,1,.3,1);}
    @keyframes kh-slide{from{opacity:0;transform:translateY(24px) scale(.96);}to{opacity:1;transform:translateY(0) scale(1);}}
    .kh-header{padding:18px 20px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;gap:13px;background:linear-gradient(180deg,rgba(0,212,232,.08),rgba(0,212,232,.02) 60%,transparent);position:relative;}
    .kh-header::after{content:'';position:absolute;left:0;right:0;bottom:-1px;height:1px;background:linear-gradient(90deg,transparent,rgba(0,212,232,.35),transparent);}
    .kh-header .kh-avatar{width:46px;height:46px;border-radius:50%;overflow:hidden;background:#141517;border:1.5px solid rgba(0,212,232,.3);flex-shrink:0;box-shadow:0 0 18px rgba(0,212,232,.2);}
    .kh-header .kh-avatar img{width:100%;height:100%;object-fit:cover;object-position:50% 42%;}
    .kh-header .kh-meta{flex:1;min-width:0;}
    .kh-header .kh-title{font-size:16px;font-weight:700;color:#fff;letter-spacing:-.01em;line-height:1.2;}
    .kh-header .kh-sub{font-size:11px;color:#00d4e8;margin-top:3px;letter-spacing:.08em;text-transform:uppercase;font-weight:600;display:flex;align-items:center;gap:6px;}
    .kh-header .kh-sub::before{content:'';width:6px;height:6px;border-radius:50%;background:#4ade80;box-shadow:0 0 8px rgba(74,222,128,.8);}
    .kh-close{margin-left:auto;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);color:rgba(245,246,247,.7);cursor:pointer;width:32px;height:32px;font-size:18px;line-height:1;border-radius:8px;transition:all .15s;display:flex;align-items:center;justify-content:center;}
    .kh-close:hover{color:#fff;background:rgba(0,212,232,.12);border-color:rgba(0,212,232,.3);}
    .kh-body{flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:14px;scroll-behavior:smooth;background:linear-gradient(180deg,#0b0c0e 0%,#0a0b0d 100%);}
    .kh-body::-webkit-scrollbar{width:6px;}
    .kh-body::-webkit-scrollbar-track{background:transparent;}
    .kh-body::-webkit-scrollbar-thumb{background:rgba(0,212,232,.12);border-radius:3px;}
    .kh-body::-webkit-scrollbar-thumb:hover{background:rgba(0,212,232,.25);}
    .kh-msg{max-width:86%;padding:12px 16px;border-radius:18px;font-size:14.5px;line-height:1.52;letter-spacing:-.003em;word-wrap:break-word;animation:kh-msg-in .24s cubic-bezier(.16,1,.3,1);}
    @keyframes kh-msg-in{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
    .kh-msg.ai{background:#141517;color:#f0f1f3;border:1px solid rgba(255,255,255,.05);align-self:flex-start;border-bottom-left-radius:5px;box-shadow:0 2px 10px rgba(0,0,0,.25);}
    .kh-msg.ai strong{color:#00d4e8;font-weight:700;}
    .kh-msg.ai a{color:#00d4e8;text-decoration:underline;text-underline-offset:2px;word-break:break-word;}
    .kh-msg.ai a:hover{color:#4de8f6;}
    .kh-msg.me{background:linear-gradient(135deg,#00d4e8 0%,#0A9AC0 100%);color:#051a1f;align-self:flex-end;border-bottom-right-radius:5px;font-weight:600;box-shadow:0 6px 20px rgba(0,212,232,.35);}
    .kh-msg.me a{color:#051a1f;text-decoration:underline;font-weight:700;word-break:break-word;}
    body.kh-lock-scroll{position:fixed;width:100%;left:0;right:0;overflow:hidden;}
    .kh-typing{display:inline-flex;gap:5px;padding:14px 18px;}
    .kh-typing span{width:7px;height:7px;border-radius:50%;background:#00d4e8;animation:kh-blink 1.2s infinite;box-shadow:0 0 8px rgba(0,212,232,.6);}
    .kh-typing span:nth-child(2){animation-delay:.2s;}
    .kh-typing span:nth-child(3){animation-delay:.4s;}
    @keyframes kh-blink{0%,60%,100%{opacity:.3;transform:translateY(0);}30%{opacity:1;transform:translateY(-4px);}}
    .kh-input{padding:14px 16px 14px;border-top:1px solid rgba(255,255,255,.06);background:#0b0c0e;display:flex;gap:10px;align-items:flex-end;}
    .kh-input textarea{flex:1;background:#141517;border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:12px 16px;color:#f5f6f7;font-family:inherit;font-size:16px;resize:none;min-height:44px;max-height:120px;outline:none;transition:border-color .18s,box-shadow .18s;}
    .kh-input textarea:focus{border-color:rgba(0,212,232,.5);box-shadow:0 0 0 3px rgba(0,212,232,.12);}
    .kh-input textarea::placeholder{color:rgba(245,246,247,.35);}
    .kh-send{background:linear-gradient(135deg,#00d4e8,#0A9AC0);color:#051a1f;border:none;border-radius:14px;width:44px;height:44px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;transition:transform .15s,box-shadow .15s,opacity .15s;flex-shrink:0;box-shadow:0 4px 14px rgba(0,212,232,.35);}
    .kh-send:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 18px rgba(0,212,232,.5);}
    .kh-send:disabled{opacity:.3;cursor:not-allowed;transform:none;box-shadow:none;}
    .kh-footer{text-align:center;padding:8px 0 12px;font-size:10px;color:rgba(245,246,247,.3);letter-spacing:.08em;text-transform:uppercase;font-weight:600;background:#0b0c0e;}
    .kh-footer span{color:#00d4e8;}
    @media (max-width:480px){.kh-panel{width:auto;max-width:none;left:10px;right:10px;top:auto;bottom:max(14px,env(safe-area-inset-bottom));height:70vh;max-height:calc(100dvh - 80px);border-radius:20px;}.kh-header{padding:14px 16px;}.kh-header .kh-avatar{width:40px;height:40px;}.kh-header .kh-title{font-size:15px;}.kh-header .kh-sub{font-size:10px;}.kh-body{padding:16px;gap:12px;}.kh-input{padding:12px 14px;}.kh-footer{padding:6px 0 10px;font-size:9px;}.kh-root{bottom:16px;right:16px;}.kh-label{display:none;}.kh-bubble{width:52px;height:52px;}.kh-bubble-inner{width:46px;height:46px;}}
    /* Floating widget hides while hero Khaleesi chip is on-screen — dedupes overlapping CTAs on mobile */
    .kh-root.kh-hidden{opacity:0;pointer-events:none;transform:translateY(10px);transition:opacity .3s ease,transform .3s ease;}
    `;

    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    const root = document.createElement('div');
    root.className = 'kh-root';
    root.innerHTML = `
        <div class="kh-label" id="kh-label"><span class="kh-dot"></span>Ask Hermes</div>
        <div class="kh-bubble" id="kh-bubble" aria-label="Chat with Hermes" role="button" tabindex="0">
            <div class="kh-bubble-inner"><img src="${AVATAR}" alt="Hermes" /></div>
            <span class="kh-online"></span>
        </div>
    `;
    document.body.appendChild(root);

    const panel = document.createElement('div');
    panel.className = 'kh-panel';
    panel.innerHTML = `
        <div class="kh-header">
            <div class="kh-avatar"><img src="${AVATAR}" alt="Hermes" /></div>
            <div class="kh-meta">
                <div class="kh-title">Hermes</div>
                <div class="kh-sub">AI Employee · Tethron</div>
            </div>
            <button class="kh-close" id="kh-close" aria-label="Close">×</button>
        </div>
        <div class="kh-body" id="kh-body"></div>
        <div class="kh-input">
            <textarea id="kh-textarea" placeholder="Ask me anything about Tethron…" rows="1"></textarea>
            <button class="kh-send" id="kh-send" disabled aria-label="Send">↑</button>
        </div>
        <div class="kh-footer">AI EMPLOYEE · BUILT BY <span>TETHRON</span></div>
    `;
    document.body.appendChild(panel);

    const bubble = document.getElementById('kh-bubble');
    const label = document.getElementById('kh-label');
    const closeBtn = document.getElementById('kh-close');
    const body = document.getElementById('kh-body');
    const textarea = document.getElementById('kh-textarea');
    const sendBtn = document.getElementById('kh-send');

    const STORAGE_KEY = 'kh_messages';
    const messages = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
    let awaiting = false;
    let opened = false;
    let savedScrollY = 0;

    function saveMessages() {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }

    function isMobile() {
        return window.matchMedia('(max-width:480px)').matches;
    }
    function lockScroll() {
        if (!isMobile()) return;
        savedScrollY = window.scrollY || window.pageYOffset || 0;
        document.body.style.top = `-${savedScrollY}px`;
        document.body.classList.add('kh-lock-scroll');
    }
    function unlockScroll() {
        if (!document.body.classList.contains('kh-lock-scroll')) return;
        document.body.classList.remove('kh-lock-scroll');
        document.body.style.top = '';
        window.scrollTo(0, savedScrollY);
    }

    function restoreChat() {
        if (messages.length === 0) return false;
        body.innerHTML = '';
        messages.forEach(m => renderMsg(m.role, m.content));
        return true;
    }

    function open() {
        panel.classList.add('open');
        root.style.display = 'none';
        lockScroll();
        setTimeout(() => textarea.focus(), 200);
        if (!opened) {
            opened = true;
            if (!restoreChat()) {
                fetchReply();
            }
        }
    }
    function close() {
        panel.classList.remove('open');
        root.style.display = 'flex';
        unlockScroll();
    }
    function toggle() {
        if (panel.classList.contains('open')) close();
        else open();
    }

    window.Khaleesi = { open, close, toggle };

    bubble.addEventListener('click', open);
    bubble.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    label.addEventListener('click', open);
    closeBtn.addEventListener('click', close);

    // Wire any element with [data-khaleesi-open] to open the panel
    function wireTriggers() {
        document.querySelectorAll('[data-khaleesi-open]').forEach(el => {
            if (el.__khWired) return;
            el.__khWired = true;
            el.addEventListener('click', (e) => { e.preventDefault(); open(); });
        });
    }
    wireTriggers();
    // Re-wire if content changes
    const mo = new MutationObserver(wireTriggers);
    mo.observe(document.body, { childList: true, subtree: true });

    // DEDUPE: hide floating widget when it would visually collide with featured CTAs/demos.
    try {
        const heroChip = document.querySelector('[data-khaleesi-open]');
        const phoneDemo = document.querySelector('.tg2-demo-stage');
        const targets = [heroChip, phoneDemo].filter(Boolean);
        if (targets.length) {
            const visible = new WeakMap();
            const syncHidden = () => {
                root.classList.toggle('kh-hidden', targets.some(t => visible.get(t)));
            };
            const io = new IntersectionObserver((entries) => {
                entries.forEach(e => visible.set(e.target, e.isIntersecting));
                syncHidden();
            }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
            targets.forEach(t => io.observe(t));
        }
    } catch (err) { /* observer unavailable — widget simply stays visible */ }

    function renderMsg(role, text) {
        const el = document.createElement('div');
        el.className = 'kh-msg ' + (role === 'assistant' ? 'ai' : 'me');
        el.innerHTML = escapeAndFormat(text);
        body.appendChild(el);
        body.scrollTop = body.scrollHeight;
        return el;
    }

    function escapeAndFormat(text) {
        let out = String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        const stash = [];
        const park = (html) => `\u0001K${stash.push(html) - 1}\u0001`;

        const trimPunct = (u) => {
            let t = '';
            while (/[.,!?;:)\]]$/.test(u)) { t = u.slice(-1) + t; u = u.slice(0, -1); }
            return [u, t];
        };

        out = out.replace(/\[([^\]]+)\]\(([^\s)]+)\)/g, (_, label, url) => {
            const href = /^https?:\/\//i.test(url)
                ? url
                : (url.startsWith('/') || url.startsWith('#') ? url : 'https://' + url);
            return park(`<a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`);
        });

        out = out.replace(/(\bhttps?:\/\/[^\s<]+)/g, (match) => {
            const [url, trailing] = trimPunct(match);
            return park(`<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`) + trailing;
        });

        const TLDS = /^(ai|com|org|net|io|co|app|dev|gg|so|sh|me|us|uk|ca|tv|fm|xyz|tech|agency|studio|design|page|site|online|biz|info)$/i;
        out = out.replace(/\b([a-z0-9][a-z0-9-]*(?:\.[a-z0-9][a-z0-9-]*)+)(\/[^\s<]*)?/gi, (match, domain, path) => {
            const tld = domain.split('.').pop();
            if (!TLDS.test(tld)) return match;
            const [clean, trailing] = trimPunct(match);
            return park(`<a href="https://${clean}" target="_blank" rel="noopener noreferrer">${clean}</a>`) + trailing;
        });

        out = out
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*([^\s*](?:[^*]*[^\s*])?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');

        out = out.replace(/\u0001K(\d+)\u0001/g, (_, i) => stash[+i]);

        return out;
    }

    function showTyping() {
        const el = document.createElement('div');
        el.className = 'kh-msg ai';
        el.id = 'kh-typing-el';
        el.innerHTML = '<div class="kh-typing"><span></span><span></span><span></span></div>';
        body.appendChild(el);
        body.scrollTop = body.scrollHeight;
        return el;
    }
    function hideTyping() {
        const el = document.getElementById('kh-typing-el');
        if (el) el.remove();
    }

    async function fetchReply() {
        if (awaiting) return;
        awaiting = true;
        sendBtn.disabled = true;
        showTyping();
        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages })
            });
            const data = await res.json();
            hideTyping();
            const reply = data.reply || '...';
            messages.push({ role: 'assistant', content: reply });
            saveMessages();
            renderMsg('assistant', reply);
        } catch (e) {
            hideTyping();
            renderMsg('assistant', "Sorry — I hit a snag connecting. Mind trying that again in a sec?");
        } finally {
            awaiting = false;
            sendBtn.disabled = textarea.value.trim().length === 0;
        }
    }

    async function sendMessage() {
        const text = textarea.value.trim();
        if (!text || awaiting) return;
        messages.push({ role: 'user', content: text });
        saveMessages();
        renderMsg('user', text);
        textarea.value = '';
        textarea.style.height = 'auto';
        sendBtn.disabled = true;
        await fetchReply();
    }

    sendBtn.addEventListener('click', sendMessage);
    textarea.addEventListener('input', () => {
        sendBtn.disabled = textarea.value.trim().length === 0 || awaiting;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    });
    textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
})();
