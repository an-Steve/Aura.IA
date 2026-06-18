/* ══════════════════════════════════════
   AURA.AI — script.js
   ══════════════════════════════════════ */

// ── Éléments DOM ──────────────────────────
const chatContainer  = document.getElementById('chat-container');
const userInput      = document.getElementById('user-input');
const sendBtn        = document.getElementById('send-btn');
const charCount      = document.getElementById('char-count');
const clearInputBtn  = document.getElementById('clear-input');
const tokenCounter   = document.getElementById('token-counter');
const welcomeOverlay = document.getElementById('welcome-overlay');
const themeToggle    = document.getElementById('theme-toggle');
const themeLabel     = document.getElementById('theme-label');
const sidebarToggle  = document.getElementById('sidebar-toggle');
const sidebar        = document.getElementById('sidebar');
const newChatBtn     = document.getElementById('new-chat-btn');
const historyList    = document.getElementById('history-list');
const navItems       = document.querySelectorAll('.nav-item');

// ── État de l'application ─────────────────
let conversationHistory = []; // [{role, content}]
let messageCount = 0;
let isLoading = false;
let sessions = [];
let currentSessionId = null;

// ── Config marked.js ──────────────────────
marked.setOptions({
    breaks: true,
    gfm: true,
    highlight: (code, lang) => {
        if (lang && hljs.getLanguage(lang)) {
            return hljs.highlight(code, { language: lang }).value;
        }
        return hljs.highlightAuto(code).value;
    }
});

// ══════════════════════════════════════════
//  THEME
// ══════════════════════════════════════════
function initTheme() {
    const saved = localStorage.getItem('aura-theme') || 'dark';
    setTheme(saved);
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('aura-theme', theme);
    themeLabel.textContent = theme === 'dark' ? 'Mode clair' : 'Mode sombre';
}

themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
});

// ══════════════════════════════════════════
//  SIDEBAR
// ══════════════════════════════════════════
function toggleSidebar() {
    sidebar.classList.toggle('collapsed');
}

sidebarToggle.addEventListener('click', toggleSidebar);

navItems.forEach(item => {
    item.addEventListener('click', () => {
        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        const mode = item.dataset.mode;
        const modeMap = {
            image:   'Génère une image de ',
            weather: 'Météo ',
            calc:    'Calcule ',
            joke:    'Raconte-moi une blague'
        };
        if (mode !== 'chat' && modeMap[mode]) {
            fillInput(modeMap[mode]);
        }
        if (window.innerWidth <= 640) sidebar.classList.add('collapsed');
    });
});

// ══════════════════════════════════════════
//  HISTORIQUE DE SESSIONS
// ══════════════════════════════════════════
function saveSession(firstMessage) {
    if (!currentSessionId) {
        currentSessionId = Date.now();
        sessions.unshift({ id: currentSessionId, title: firstMessage.slice(0, 40), history: conversationHistory });
        renderHistory();
    } else {
        const s = sessions.find(s => s.id === currentSessionId);
        if (s) s.history = conversationHistory;
    }
}

function renderHistory() {
    historyList.innerHTML = '';
    if (sessions.length === 0) {
        historyList.innerHTML = '<span class="history-empty">Aucune conversation</span>';
        return;
    }
    sessions.forEach(s => {
        const btn = document.createElement('button');
        btn.className = 'history-item';
        btn.textContent = s.title || 'Conversation';
        btn.title = s.title;
        btn.addEventListener('click', () => loadSession(s));
        historyList.appendChild(btn);
    });
}

function loadSession(session) {
    // Clear chat
    chatContainer.innerHTML = '';
    conversationHistory = [...session.history];
    currentSessionId = session.id;
    messageCount = conversationHistory.filter(m => m.role === 'user').length;
    updateTokenCounter();

    // Re-render messages (texte seulement)
    conversationHistory.forEach(msg => {
        if (msg.role === 'user') {
            appendMessage(msg.content, 'user', false);
        } else {
            appendMessage(msg.content, 'ai', false);
        }
    });

    if (window.innerWidth <= 640) sidebar.classList.add('collapsed');
}

newChatBtn.addEventListener('click', () => {
    if (conversationHistory.length > 0) {
        saveSession(conversationHistory[0]?.content || 'Conversation');
    }
    chatContainer.innerHTML = '';
    chatContainer.appendChild(buildWelcome());
    conversationHistory = [];
    currentSessionId = null;
    messageCount = 0;
    updateTokenCounter();
});

function buildWelcome() {
    const div = document.createElement('div');
    div.id = 'welcome-overlay';
    div.className = 'welcome-overlay';
    div.innerHTML = document.getElementById('welcome-overlay')?.innerHTML || '';
    return div;
}

// ══════════════════════════════════════════
//  TEXTAREA — auto-resize & compteur
// ══════════════════════════════════════════
userInput.addEventListener('input', () => {
    userInput.style.height = 'auto';
    userInput.style.height = Math.min(userInput.scrollHeight, 160) + 'px';
    charCount.textContent = userInput.value.length;
    clearInputBtn.style.display = userInput.value ? 'flex' : 'none';
});

clearInputBtn.addEventListener('click', () => {
    userInput.value = '';
    userInput.style.height = 'auto';
    charCount.textContent = 0;
    clearInputBtn.style.display = 'none';
    userInput.focus();
});

userInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
});

sendBtn.addEventListener('click', handleSend);

function fillInput(text) {
    userInput.value = text;
    userInput.dispatchEvent(new Event('input'));
    userInput.focus();
    userInput.setSelectionRange(text.length, text.length);
}

function updateTokenCounter() {
    tokenCounter.textContent = `${messageCount} msg`;
}

// ══════════════════════════════════════════
//  AFFICHAGE DES MESSAGES
// ══════════════════════════════════════════
function hideWelcome() {
    const overlay = document.getElementById('welcome-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.4s ease';
        setTimeout(() => overlay.remove(), 400);
    }
}

function appendMessage(content, role, animate = true) {
    hideWelcome();

    const row = document.createElement('div');
    row.className = `message-row ${role}`;
    if (!animate) row.style.animation = 'none';

    const avatar = document.createElement('div');
    avatar.className = `avatar ${role === 'ai' ? 'ai-avatar' : 'user-avatar'}`;
    avatar.textContent = role === 'ai' ? 'A' : 'V';

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';

    if (role === 'ai') {
        // Rendu Markdown pour les réponses IA
        if (typeof content === 'string') {
            bubble.innerHTML = marked.parse(content);
            // Coloration syntaxique
            bubble.querySelectorAll('pre code').forEach(el => hljs.highlightElement(el));
        } else {
            // Contenu HTML brut (météo, image, etc.)
            bubble.innerHTML = content;
        }
    } else {
        // Messages utilisateur en texte brut
        bubble.textContent = content;
    }

    // Actions sur les messages IA
    if (role === 'ai' && typeof content === 'string') {
        const actions = document.createElement('div');
        actions.className = 'message-actions';

        const copyBtn = document.createElement('button');
        copyBtn.className = 'msg-action-btn';
        copyBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copier`;
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(content).then(() => showToast('Copié !', 'success'));
        });

        const regenBtn = document.createElement('button');
        regenBtn.className = 'msg-action-btn';
        regenBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg> Régénérer`;
        regenBtn.addEventListener('click', () => {
            const lastUser = [...conversationHistory].reverse().find(m => m.role === 'user');
            if (lastUser) {
                row.remove();
                conversationHistory = conversationHistory.slice(0, -1);
                regenerateResponse(lastUser.content);
            }
        });

        actions.appendChild(copyBtn);
        actions.appendChild(regenBtn);
        row.appendChild(avatar);
        row.appendChild(document.createElement('div'));
        row.lastChild.style.display = 'flex';
        row.lastChild.style.flexDirection = 'column';
        row.lastChild.style.gap = '4px';
        row.lastChild.appendChild(bubble);
        row.lastChild.appendChild(actions);
    } else {
        row.appendChild(avatar);
        row.appendChild(bubble);
    }

    chatContainer.appendChild(row);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return { row, bubble };
}

function showTyping() {
    const row = document.createElement('div');
    row.className = 'message-row ai';
    row.id = 'typing-row';

    const avatar = document.createElement('div');
    avatar.className = 'avatar ai-avatar';
    avatar.textContent = 'A';

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';

    const typing = document.createElement('div');
    typing.className = 'typing-indicator';
    typing.innerHTML = '<span></span><span></span><span></span>';

    bubble.appendChild(typing);
    row.appendChild(avatar);
    row.appendChild(bubble);
    chatContainer.appendChild(row);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return row;
}

function removeTyping() {
    const el = document.getElementById('typing-row');
    if (el) el.remove();
}

// ══════════════════════════════════════════
//  ROUTEUR D'INTENTIONS
// ══════════════════════════════════════════
async function handleSend() {
    const text = userInput.value.trim();
    if (!text || isLoading) return;

    isLoading = true;
    sendBtn.disabled = true;

    appendMessage(text, 'user');
    conversationHistory.push({ role: 'user', content: text });
    messageCount++;
    updateTokenCounter();
    saveSession(text);

    userInput.value = '';
    userInput.style.height = 'auto';
    charCount.textContent = 0;
    clearInputBtn.style.display = 'none';

    const typingRow = showTyping();
    const clean = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    let response = '';
    let isHtml = false;

    try {
        // 1. IMAGE
        if (/\b(image|genere|dessine|cree|photo|illustration|dessin|peins|visualise)\b/.test(clean)) {
            const result = generateImage(text);
            isHtml = true;
            response = result;
        }
        // 2. BLAGUE
        else if (/\b(blague|humour|drole|raconte.*(blague|histoire)|joke)\b/.test(clean)) {
            response = await fetchJoke();
            isHtml = true;
        }
        // 3. MÉTÉO
        else if (/\b(meteo|temps|temperature|climat|pleut|neige|soleil)\b/.test(clean)) {
            const city = extractCity(text);
            const result = await fetchWeather(city);
            isHtml = true;
            response = result;
        }
        // 4. CALCUL MATHÉMATIQUE PUR
        else if (/^[\d\s+\-*/().^%,]+$/.test(text.trim())) {
            response = calculateMaths(text);
        }
        // 5. CALCUL EN LANGAGE NATUREL
        else if (/\b(calcule|combien|quelle.*(valeur|resultat)|=([\s\d]*)$)\b/.test(clean)) {
            const expr = text.replace(/calcule\s*|=\s*$/gi, '').trim();
            response = calculateMaths(expr);
        }
        // 6. TRADUCTION — via Pollinations text (gratuit)
        else if (/\b(traduis|traduire|translate|en anglais|en espagnol|en allemand|en italien|en japonais|en portugais|en chinois|en arabe)\b/.test(clean)) {
            // Détecte la langue cible
            const langMap = {
                'anglais': 'English', 'espagnol': 'Spanish', 'allemand': 'German',
                'italien': 'Italian', 'japonais': 'Japanese', 'portugais': 'Portuguese',
                'chinois': 'Chinese', 'arabe': 'Arabic'
            };
            const langKey = Object.keys(langMap).find(k => clean.includes(k));
            const targetLang = langMap[langKey] || 'English';

            // Extrait le texte à traduire (après ":" ou les mots-clés)
            const toTranslate = text.replace(/traduis?\s*(en\s*\w+)?\s*[:\-]?\s*/i, '').trim();
            response = await callAI(
                `Translate the following text to ${targetLang}. Return ONLY the translation, nothing else:\n\n${toTranslate}`,
                `You are a professional translator. Translate accurately and naturally.`
            );
        }
        // 7. RÉSUMÉ
        else if (/\b(resume|synthese|resumé|tl;dr|résume|résumé)\b/.test(clean)) {
            response = await callAI(
                text,
                'Tu es un assistant expert en synthèse. Résume le texte fourni en points clés clairs en Markdown. Réponds en français.'
            );
        }
        // 8. IA GÉNÉRALISTE avec mémoire
        else {
            response = await callAIWithHistory();
        }
    } catch (err) {
        response = `❌ Une erreur s'est produite : ${err.message || 'Erreur inconnue'}`;
    }

    removeTyping();

    if (isHtml) {
        // Pour les contenus HTML, on passe le contenu brut
        const row = document.createElement('div');
        row.className = 'message-row ai';
        const avatar = document.createElement('div');
        avatar.className = 'avatar ai-avatar';
        avatar.textContent = 'A';
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.innerHTML = response;
        row.appendChild(avatar);
        row.appendChild(bubble);
        chatContainer.appendChild(row);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    } else {
        appendMessage(response, 'ai');
        conversationHistory.push({ role: 'assistant', content: response });
    }

    isLoading = false;
    sendBtn.disabled = false;
    userInput.focus();
}

async function regenerateResponse(prompt) {
    isLoading = true;
    sendBtn.disabled = true;
    const typingRow = showTyping();

    try {
        const response = await callAI(prompt);
        removeTyping();
        appendMessage(response, 'ai');
        conversationHistory.push({ role: 'assistant', content: response });
    } catch {
        removeTyping();
        appendMessage('❌ Erreur lors de la régénération.', 'ai');
    }

    isLoading = false;
    sendBtn.disabled = false;
}

// ══════════════════════════════════════════
//  APIS
// ══════════════════════════════════════════

// ── IA Texte avec historique — Pollinations text API (gratuit, sans clé) ──
async function callAIWithHistory() {
    const systemPrompt = `Tu es Aura, une IA assistante bienveillante, intelligente et précise.
Tu réponds toujours en français sauf si on te demande autre chose.
Tu utilises le Markdown quand c'est utile (listes, titres, blocs de code).
Tu es concise mais complète. La date actuelle est ${new Date().toLocaleDateString('fr-FR')}.`;

    // Construit le tableau messages complet pour l'API
    const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-10) // 10 derniers messages max
    ];

    return await callPollinationsText(messages);
}

async function callAI(singlePrompt, systemOverride = '') {
    const messages = [
        { role: 'system', content: systemOverride || 'Tu es Aura, une IA assistante. Réponds en français.' },
        { role: 'user', content: singlePrompt }
    ];
    return await callPollinationsText(messages);
}

// Appel direct à l'API Pollinations texte (100% gratuit, pas de clé requise)
async function callPollinationsText(messages) {
    const ENDPOINTS = [
        'https://text.pollinations.ai',
        'https://text.pollinations.ai/openai'  // fallback
    ];

    for (const endpoint of ENDPOINTS) {
        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages,
                    model: 'openai',       // GPT-4o-mini via Pollinations
                    seed: Math.floor(Math.random() * 999999),
                    private: true,
                    stream: false
                })
            });

            if (!res.ok) continue;

            const text = await res.text();
            if (text && text.trim().length > 0) return text.trim();
        } catch { /* essaie le suivant */ }
    }

    throw new Error('Service IA temporairement indisponible. Réessayez dans quelques secondes.');
}

// ── Météo (Open-Meteo) ────────────────────
const weatherCodes = {
    0: ['☀️', 'Ciel dégagé'],
    1: ['🌤️', 'Principalement dégagé'],
    2: ['⛅', 'Partiellement nuageux'],
    3: ['☁️', 'Couvert'],
    45: ['🌫️', 'Brouillard'],
    48: ['🌫️', 'Brouillard givrant'],
    51: ['🌦️', 'Bruine légère'],
    61: ['🌧️', 'Pluie légère'],
    63: ['🌧️', 'Pluie modérée'],
    65: ['🌧️', 'Pluie forte'],
    71: ['🌨️', 'Neige légère'],
    80: ['🌦️', 'Averses'],
    95: ['⛈️', 'Orage'],
};

function extractCity(text) {
    const stop = ['météo', 'meteo', 'temps', 'température', 'climat', 'à', 'dans', 'sur', 'de', 'la', 'le', 'les', 'pour', 'quel', 'quelle', 'est', 'il', 'fait'];
    return text
        .replace(/[?!.]/g, '')
        .split(/\s+/)
        .filter(w => !stop.includes(w.toLowerCase()) && w.length > 1)
        .join(' ')
        .trim() || 'Paris';
}

async function fetchWeather(city) {
    try {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=fr&format=json`);
        const geoData = await geoRes.json();

        if (!geoData.results?.length) {
            return `<span>❌ Ville "<strong>${city}</strong>" introuvable. Vérifiez l'orthographe.</span>`;
        }

        const { latitude, longitude, name, country, timezone } = geoData.results[0];
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=relative_humidity_2m,apparent_temperature&timezone=${encodeURIComponent(timezone)}&forecast_days=1`;
        const wRes = await fetch(url);
        const wData = await wRes.json();

        const cw = wData.current_weather;
        const code = cw.weathercode;
        const [icon, desc] = weatherCodes[code] || ['🌡️', 'Conditions variables'];
        const humidity = wData.hourly?.relative_humidity_2m?.[new Date().getHours()] ?? '—';
        const feels = wData.hourly?.apparent_temperature?.[new Date().getHours()]?.toFixed(1) ?? '—';

        return `
            <div class="weather-card">
                <div class="weather-city">${icon} ${name}, ${country}</div>
                <div class="weather-temp">${cw.temperature}°C</div>
                <div class="weather-meta">
                    <span>🌡️ Ressenti : ${feels}°C</span>
                    <span>💨 Vent : ${cw.windspeed} km/h</span>
                    <span>💧 Humidité : ${humidity}%</span>
                    <span>📍 ${desc}</span>
                </div>
            </div>`;
    } catch (err) {
        return '❌ Erreur réseau lors de la récupération météo.';
    }
}

// ── Générateur d'images (Pollinations AI) ─
// URL correcte 2025 : https://pollinations.ai/p/{prompt}
function generateImage(prompt) {
    const keywords = ['génère', 'génere', 'génères','dessine', 'crée', 'cree', 'fais', 'moi', 'une', 'un', 'image', 'de', 'du', 'photo', 'illustration', 'dessin', 'peins', 'visualise', 'montre', 'me'];
    const cleanPrompt = prompt
        .split(' ')
        .filter(w => !keywords.includes(w.toLowerCase().replace(/[.,!?]/g, '')))
        .join(' ')
        .trim() || 'beautiful landscape';

    const seed = Math.floor(Math.random() * 999999);
    // Format URL officiel Pollinations 2025
    const encoded = encodeURIComponent(cleanPrompt.replace(/\s+/g, '_'));
    const url = `https://pollinations.ai/p/${encoded}?width=512&height=512&seed=${seed}&nologo=true`;

    return `
        <div class="ai-image-wrapper">
            <span class="image-label">🎨 <strong>Génération :</strong> "${cleanPrompt}"</span>
            <img class="generated-img" src="${url}" alt="${cleanPrompt}"
                 onload="this.style.opacity=1; document.getElementById('chat-container').scrollTop=9999;"
                 onerror="this.outerHTML='<span style=\\'color:var(--red)\\'>❌ Image indisponible — le service Pollinations est peut-être surchargé. Réessayez.</span>'"
                 style="opacity:0;transition:opacity 0.6s ease;">
        </div>`;
}

// ── Blagues (JokeAPI + secours) ───────────
async function fetchJoke() {
    try {
        const res = await fetch('https://v2.jokeapi.dev/joke/Any?lang=fr&type=twopart,single&blacklistFlags=racist,sexist,explicit');
        const data = await res.json();
        if (data.type === 'single') return `🎭 **Blague**\n\n${data.joke}`;
        if (data.type === 'twopart') return `🎭 **Blague**\n\n${data.setup}\n\n> *${data.delivery}*`;
        throw new Error('Format inattendu');
    } catch {
        try {
            const res = await fetch('https://official-joke-api.appspot.com/jokes/programming/random');
            const [d] = await res.json();
            return `🎭 **Blague de dev**\n\n${d.setup}\n\n> *${d.punchline}*`;
        } catch {
            const fallbacks = [
                '🎭 **Blague**\n\nPourquoi les plongeurs plongent-ils en arrière ?\n\n> *Parce que sinon ils tomberaient dans le bateau !*',
                '🎭 **Blague**\n\nUn développeur entre dans un bar et commande 1 bière. Puis 0 bière.\n\n> *Le barman lui dit : "Vous avez l\'air assoiffé !"*',
                '🎭 **Blague**\n\nComment appelle-t-on un chat tombé dans un pot de peinture le jour de Noël ?\n\n> *Un chat-peint de Noël !*'
            ];
            return fallbacks[Math.floor(Math.random() * fallbacks.length)];
        }
    }
}

// ── Calculatrice ──────────────────────────
function calculateMaths(expr) {
    try {
        const sanitized = expr.replace(/[^0-9+\-*/().^%\s]/g, '').replace(/\^/g, '**');
        if (!sanitized.trim()) throw new Error('Expression vide');
        const result = Function('"use strict"; return (' + sanitized + ')')();
        if (typeof result !== 'number' || !isFinite(result)) throw new Error('Résultat invalide');

        const formatted = Number.isInteger(result) ? result.toLocaleString('fr-FR') : result.toLocaleString('fr-FR', { maximumFractionDigits: 6 });
        return `🧮 **Calcul**\n\n\`${sanitized.trim()}\` = **${formatted}**`;
    } catch {
        return '❌ Expression mathématique invalide. Exemple : `25 * 4 + 10 / 2`';
    }
}

// ══════════════════════════════════════════
//  TOAST NOTIFICATIONS
// ══════════════════════════════════════════
function showToast(msg, type = '') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// ══════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════
initTheme();
renderHistory();
userInput.focus();

// Fermer la sidebar sur mobile en cliquant ailleurs
document.addEventListener('click', e => {
    if (window.innerWidth <= 640 && !sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
        sidebar.classList.add('collapsed');
    }
});