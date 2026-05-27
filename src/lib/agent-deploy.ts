import JSZip from "jszip";

export type AgentExport = {
  id: string;
  name: string;
  type: string;
  personality: string;
  purpose: string;
  instructions: string;
  trainingPrompts: string[];
  avatar?: string;
};

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

const buildSystemPrompt = (a: AgentExport) =>
  `You are "${a.name}". Personality: ${a.personality}. Purpose: ${a.purpose}. Instructions: ${a.instructions}. Training:\n${a.trainingPrompts.map((p, i) => `${i + 1}. ${p}`).join("\n")}\nAlways stay in character.`;

const chatHtml = (a: AgentExport, opts: { title: string; mode: "pwa" | "desktop" | "ext" }) => {
  const sys = buildSystemPrompt(a);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(a.name)} — ${opts.title}</title>
${opts.mode === "pwa" ? '<link rel="manifest" href="manifest.json" />' : ""}
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin:0; font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    background: radial-gradient(1200px 600px at 20% -10%, #1e3a8a33, transparent), radial-gradient(800px 600px at 100% 100%, #6d28d933, transparent), #05070d;
    color:#e6edf7; min-height:100vh; display:flex; flex-direction:column; }
  header { padding:14px 18px; display:flex; align-items:center; gap:12px; border-bottom:1px solid #1b2333;
    background: linear-gradient(90deg, #0b1224cc, #0b122488); backdrop-filter: blur(10px); position:sticky; top:0; }
  header .dot { width:10px; height:10px; border-radius:50%; background:#22d3ee; box-shadow:0 0 12px #22d3ee; animation:pulse 1.6s ease-in-out infinite; }
  header h1 { font-size:14px; margin:0; font-weight:700; letter-spacing:.3px; }
  header span { font-size:11px; color:#9aa7bf; }
  main { flex:1; overflow-y:auto; padding:18px; display:flex; flex-direction:column; gap:10px; max-width:780px; width:100%; margin:0 auto; }
  .msg { max-width:80%; padding:10px 14px; border-radius:16px; font-size:14px; line-height:1.45; white-space:pre-wrap; }
  .user { align-self:flex-end; background: linear-gradient(135deg,#2563eb,#7c3aed); color:#fff; border-bottom-right-radius:4px; }
  .bot  { align-self:flex-start; background:#121a2b; border:1px solid #1b2333; border-bottom-left-radius:4px; }
  .hint { color:#8aa0c2; font-size:12px; text-align:center; margin-top:40px; }
  form { display:flex; gap:8px; padding:12px; border-top:1px solid #1b2333; background:#070b15;
    position:sticky; bottom:0; }
  textarea { flex:1; resize:none; background:#0d1424; color:#e6edf7; border:1px solid #1b2333; border-radius:12px; padding:10px 12px; font:inherit; max-height:120px; }
  textarea:focus { outline:none; border-color:#3b82f6; box-shadow:0 0 0 3px #3b82f633; }
  button { background: linear-gradient(135deg,#3b82f6,#8b5cf6); color:#fff; border:0; border-radius:12px; padding:0 16px; font-weight:600; cursor:pointer; box-shadow:0 6px 24px -8px #3b82f6aa; }
  button:disabled { opacity:.4; cursor:not-allowed; }
  .cfg { padding:10px 12px; background:#0d1424; border:1px solid #1b2333; border-radius:10px; font-size:12px; color:#9aa7bf; margin:0 18px; }
  .cfg input { width:100%; margin-top:6px; background:#070b15; color:#e6edf7; border:1px solid #1b2333; border-radius:8px; padding:8px 10px; }
  @keyframes pulse { 0%,100%{opacity:.6} 50%{opacity:1} }
</style>
</head>
<body>
<header>
  <span class="dot"></span>
  <h1>${escapeHtml(a.name)}</h1>
  <span>· ${opts.title}</span>
</header>
<div class="cfg">
  <label>OpenAI-compatible API endpoint (optional)
    <input id="ep" placeholder="https://api.openai.com/v1/chat/completions" />
  </label>
  <label style="display:block;margin-top:8px;">API Key (stored locally)
    <input id="key" type="password" placeholder="sk-..." />
  </label>
  <label style="display:block;margin-top:8px;">Model
    <input id="model" placeholder="gpt-4o-mini" />
  </label>
</div>
<main id="chat">
  <div class="hint">Say hi to ${escapeHtml(a.name)} 👋</div>
</main>
<form id="f">
  <textarea id="t" rows="1" placeholder="Message ${escapeHtml(a.name)}..."></textarea>
  <button id="send">Send</button>
</form>
<script>
const SYSTEM = ${JSON.stringify(sys)};
const AGENT = ${JSON.stringify(a.name)};
const chat = document.getElementById("chat");
const form = document.getElementById("f");
const ta = document.getElementById("t");
const epEl = document.getElementById("ep");
const keyEl = document.getElementById("key");
const modelEl = document.getElementById("model");
const STORE = "agent_" + ${JSON.stringify(a.id)};

const state = JSON.parse(localStorage.getItem(STORE) || '{"messages":[],"cfg":{}}');
epEl.value = state.cfg.ep || "https://api.openai.com/v1/chat/completions";
keyEl.value = state.cfg.key || "";
modelEl.value = state.cfg.model || "gpt-4o-mini";
[epEl,keyEl,modelEl].forEach(el => el.addEventListener("change", () => {
  state.cfg = { ep: epEl.value, key: keyEl.value, model: modelEl.value };
  localStorage.setItem(STORE, JSON.stringify(state));
}));

function render() {
  chat.innerHTML = state.messages.length === 0
    ? '<div class="hint">Say hi to ' + AGENT + ' 👋</div>'
    : state.messages.map(m => '<div class="msg ' + (m.role === "user" ? "user" : "bot") + '">' + m.content.replace(/[&<>]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;"}[c])) + '</div>').join("");
  chat.scrollTop = chat.scrollHeight;
}
render();

async function send(text) {
  state.messages.push({ role: "user", content: text });
  render();
  localStorage.setItem(STORE, JSON.stringify(state));
  if (!keyEl.value) {
    state.messages.push({ role: "assistant", content: "[Add an API key above to enable real responses. Running in echo mode.]\\n\\nYou said: " + text });
    render();
    localStorage.setItem(STORE, JSON.stringify(state));
    return;
  }
  try {
    const r = await fetch(epEl.value, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + keyEl.value },
      body: JSON.stringify({
        model: modelEl.value,
        messages: [{ role: "system", content: SYSTEM }, ...state.messages],
      }),
    });
    const j = await r.json();
    const reply = j.choices?.[0]?.message?.content || j.error?.message || "...";
    state.messages.push({ role: "assistant", content: reply });
  } catch (e) {
    state.messages.push({ role: "assistant", content: "Error: " + e.message });
  }
  render();
  localStorage.setItem(STORE, JSON.stringify(state));
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const v = ta.value.trim();
  if (!v) return;
  ta.value = "";
  send(v);
});
ta.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); }
});
${opts.mode === "pwa" ? `if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(()=>{});` : ""}
</script>
</body>
</html>`;
};

const svgIcon = (initial: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#3b82f6"/><stop offset="1" stop-color="#8b5cf6"/></linearGradient></defs><rect width="128" height="128" rx="28" fill="url(#g)"/><text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-family="Inter,system-ui,sans-serif" font-size="64" font-weight="700" fill="#fff">${escapeHtml(initial.toUpperCase())}</text></svg>`;

export async function buildBrowserExtension(a: AgentExport): Promise<Blob> {
  const zip = new JSZip();
  const slug = a.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "agent";
  const manifest = {
    manifest_version: 3,
    name: `${a.name} — AI Agent`,
    version: "1.0.0",
    description: a.purpose.slice(0, 130) || "AI agent built with YAIDEV",
    action: { default_popup: "popup.html", default_icon: "icon.png" },
    permissions: ["storage", "activeTab", "sidePanel"],
    side_panel: { default_path: "popup.html" },
    icons: { "128": "icon.png" },
  };
  zip.file("manifest.json", JSON.stringify(manifest, null, 2));
  zip.file("popup.html", chatHtml(a, { title: "Browser Extension", mode: "ext" }));
  zip.file("icon.svg", svgIcon(a.name[0] || "A"));
  // PNG fallback: a tiny placeholder PNG (1x1 transparent) — Chrome accepts SVG via icon field in MV3? Use base64 PNG.
  const png1x1 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  zip.file("icon.png", png1x1, { base64: true });
  zip.file("README.txt",
`${a.name} — Browser Extension (Chrome / Edge / Brave / Firefox)

Install in Chromium browsers:
1. Unzip this archive
2. Open chrome://extensions
3. Enable "Developer mode"
4. Click "Load unpacked" and select the unzipped folder
5. Pin the extension and open ${a.name} from the toolbar or side panel

Firefox: visit about:debugging → This Firefox → Load Temporary Add-on → select manifest.json
`);
  return zip.generateAsync({ type: "blob" });
}

export async function buildPwa(a: AgentExport): Promise<Blob> {
  const zip = new JSZip();
  const slug = a.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "agent";
  zip.file("index.html", chatHtml(a, { title: "Web App", mode: "pwa" }));
  zip.file("manifest.json", JSON.stringify({
    name: `${a.name} — AI Agent`,
    short_name: a.name,
    start_url: "./index.html",
    display: "standalone",
    background_color: "#05070d",
    theme_color: "#3b82f6",
    icons: [{ src: "icon.svg", sizes: "any", type: "image/svg+xml" }],
  }, null, 2));
  zip.file("icon.svg", svgIcon(a.name[0] || "A"));
  zip.file("sw.js",
`const CACHE = "${slug}-v1";
const ASSETS = ["./index.html","./manifest.json","./icon.svg"];
self.addEventListener("install", e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS))));
self.addEventListener("fetch", e => e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))));`);
  zip.file("README.txt",
`${a.name} — Progressive Web App
1. Host these files on any static server (Netlify, Vercel, GitHub Pages, or a local server)
2. Open the URL on desktop or mobile
3. Use your browser's "Install App" / "Add to Home Screen" option
`);
  return zip.generateAsync({ type: "blob" });
}

export async function buildDesktopPackage(a: AgentExport): Promise<Blob> {
  const zip = new JSZip();
  const slug = a.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "agent";
  zip.file("index.html", chatHtml(a, { title: "Desktop App", mode: "desktop" }));
  zip.file("icon.svg", svgIcon(a.name[0] || "A"));
  zip.file("package.json", JSON.stringify({
    name: slug,
    version: "1.0.0",
    description: `${a.name} desktop AI agent`,
    main: "main.cjs",
    scripts: {
      start: "electron .",
      "build:win": "electron-packager . \"" + a.name + "\" --platform=win32 --arch=x64 --overwrite",
      "build:mac": "electron-packager . \"" + a.name + "\" --platform=darwin --arch=universal --overwrite",
      "build:linux": "electron-packager . \"" + a.name + "\" --platform=linux --arch=x64 --overwrite",
    },
    devDependencies: { electron: "^31.0.0", "@electron/packager": "^18.3.3" },
  }, null, 2));
  zip.file("main.cjs",
`const { app, BrowserWindow, Notification } = require("electron");
const path = require("path");
function createWindow() {
  const win = new BrowserWindow({
    width: 1024, height: 720, title: ${JSON.stringify(a.name)},
    backgroundColor: "#05070d",
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });
  win.loadFile(path.join(__dirname, "index.html"));
  if (Notification.isSupported()) new Notification({ title: ${JSON.stringify(a.name)}, body: "Agent is ready." }).show();
}
app.whenReady().then(createWindow);
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });`);
  zip.file("README.txt",
`${a.name} — Desktop App (Windows / macOS / Linux)

Quick run:
  npm install
  npm start

Build installers:
  npm run build:win    → .exe folder
  npm run build:mac    → .app bundle (zip for .dmg)
  npm run build:linux  → executable folder (.AppImage via electron-builder optional)

Includes: chat UI, agent memory (localStorage), API integration field, offline/online modes, desktop notifications, custom branding.
`);
  return zip.generateAsync({ type: "blob" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
