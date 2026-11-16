/* ============ CONFIG: fill these in at launch ============ */
const CONFIG = {
  ca: "",                 // contract address (relaunch pending)
  buy: "https://pump.fun", // https://pump.fun/coin/<CA>
  chart: "",              // https://dexscreener.com/solana/<CA>
  x: "https://x.com/ant0nsol",
  tg: "https://t.me/Ant0NSOL",
  site: "https://antonsolana.meme",
};
/* ========================================================== */

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove("show"), 1800);
}

async function copy(text, msg) {
  try { await navigator.clipboard.writeText(text); toast(msg); }
  catch { toast("Couldn't copy. Select it manually."); }
}

/* links + CA */
$$("[data-link]").forEach((a) => {
  const url = CONFIG[a.dataset.link];
  if (url) a.href = url;
  else { a.removeAttribute("href"); a.setAttribute("aria-disabled", "true"); a.style.opacity = ".55"; a.title = "Coming soon"; }
});
$$("[data-ca]").forEach((el) => (el.textContent = CONFIG.ca || "Coming soon…"));
$$("[data-copy-ca]").forEach((b) =>
  b.addEventListener("click", () => (CONFIG.ca ? copy(CONFIG.ca, "CA copied. For the colony.") : toast("CA drops soon. Stay tuned.")))
);

/* ============ LOAD HIM UP ============ */
const ITEMS = [
  { id: "crumb", name: "Crumb", mult: 1 },
  { id: "sugar", name: "Sugar cube", mult: 10 },
  { id: "leaf", name: "Leaf", mult: 25 },
  { id: "coin", name: "Gold coin", mult: 50 },
  { id: "bags", name: "Your bags", mult: 100 },
  { id: "colony", name: "The whole colony", mult: 1000 },
].map((it) => ({ ...it, src: `assets/items/${it.id}.png` }));
const itemImg = (it) => `<img src="${it.src}" alt="" draggable="false" />`;
const STRAIN_AT = 100;
// preload
[...ITEMS.map((i) => i.src), "assets/ant-strain.png"].forEach((u) => { const i = new Image(); i.src = u; });

const state = { load: 0, items: [] };
const stack = $("#stack");
const carrier = $("#carrier");

function moodFor(load) {
  if (load === 0) return "Ready for work.";
  if (load < 20) return "Easy. Next.";
  if (load < 50) return "Fine. Totally fine.";
  if (load < 100) return "Past the science limit. Still going.";
  if (load < 500) return "Sweating. Not dropping it.";
  if (load < 2000) return "For. The. Colony.";
  return "He has transcended ants.";
}

function render() {
  $("#totalLoad").textContent = state.load.toLocaleString() + "×";
  $("#itemCount").textContent = state.items.length.toLocaleString();
  $("#barFill").style.width = Math.min(100, (state.load / 100) * 100) + "%";
  $("#mood").textContent = moodFor(state.load);

  carrier.classList.toggle("strain", state.load >= 50 && state.load < 500);
  carrier.classList.toggle("heavy", state.load >= 500);
  const want = state.load >= STRAIN_AT ? "assets/ant-strain.png" : "assets/ant-carrier.png";
  if (!$("#carrierImg").src.endsWith(want)) $("#carrierImg").src = want;

  const MAX = 7;
  const shown = state.items.slice(-MAX);
  stack.innerHTML = "";
  shown.forEach((it, i) => {
    const d = document.createElement("div");
    d.className = "stack-item";
    const r = ((i * 37) % 9) - 4;
    d.style.setProperty("--r", r + "deg");
    d.style.transform = `rotate(${r}deg)`;
    if (i < shown.length - 1) d.style.animation = "none";
    d.innerHTML = itemImg(it);
    stack.appendChild(d);
  });
  if (state.items.length > MAX) {
    const m = document.createElement("div");
    m.className = "stack-more";
    m.textContent = `+${state.items.length - MAX} more underneath`;
    stack.appendChild(m);
  }
}

const btnWrap = $("#buttons");
ITEMS.forEach((it) => {
  const b = document.createElement("button");
  b.className = "item-btn";
  b.innerHTML = `${itemImg(it)}<span><b>${it.name}</b><small>+${it.mult.toLocaleString()}× body weight</small></span>`;
  b.addEventListener("click", () => {
    state.load += it.mult;
    state.items.push(it);
    if (state.load < 50) { carrier.classList.remove("bump"); void carrier.offsetWidth; carrier.classList.add("bump"); }
    render();
  });
  btnWrap.appendChild(b);
});

$("#reset").addEventListener("click", () => { state.load = 0; state.items = []; render(); toast("Clocked out. See you tomorrow."); });
render();

/* ============ SHIFT REPORT ============ */
let size = "portrait";
$$(".seg-btn").forEach((b) =>
  b.addEventListener("click", () => {
    size = b.dataset.size;
    $$(".seg-btn").forEach((x) => { x.classList.toggle("is-on", x === b); x.setAttribute("aria-checked", x === b); });
  })
);

function caption() {
  const top = summary().slice(0, 3).map(([n, c]) => `${c}× ${n.toLowerCase()}`).join(", ");
  return state.load
    ? `My ant just carried ${state.load.toLocaleString()}× his body weight${top ? ` (${top})` : ""}. Complaints filed: 0. For the colony. $ANT`
    : `Tiny guy. Carries 50× his body weight. Never complains. For the colony. $ANT`;
}
function summary() {
  const m = new Map();
  state.items.forEach((it) => m.set(it.name, (m.get(it.name) || 0) + 1));
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

function updateShare() {
  const text = caption() + (CONFIG.site ? `\n${CONFIG.site}` : "");
  $("#shareX").href = "https://x.com/intent/post?text=" + encodeURIComponent(text);
}
btnWrap.addEventListener("click", updateShare);
$("#reset").addEventListener("click", updateShare);
updateShare();
$("#copyCaption").addEventListener("click", () => copy(caption() + "\n" + CONFIG.site, "Caption copied."));


function loadImg(src) {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => res(null);
    img.src = src;
  });
}

function grain(ctx, w, h) {
  const d = ctx.getImageData(0, 0, w, h);
  for (let i = 0; i < d.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 22;
    d.data[i] += n; d.data[i + 1] += n; d.data[i + 2] += n;
  }
  ctx.putImageData(d, 0, 0);
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
}

async function drawReport() {
  await document.fonts.ready;
  const antImg = await loadImg(state.load >= STRAIN_AT ? "assets/ant-strain.png" : "assets/ant-carrier.png");
  const wide = size === "wide";
  const W = wide ? 1200 : 1080, H = wide ? 630 : 1350;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d");
  const INK = "#141010", CREAM = "#f3e9d2", AMBER = "#ec8424", PAPER = "#fff8e8";

  ctx.fillStyle = AMBER; ctx.fillRect(0, 0, W, H);

  // paper
  const pad = wide ? 36 : 54;
  const px = pad, py = pad, pw = W - pad * 2, ph = H - pad * 2;
  ctx.fillStyle = INK; rr(ctx, px + 10, py + 10, pw, ph, 30); ctx.fill();
  ctx.fillStyle = PAPER; rr(ctx, px, py, pw, ph, 30); ctx.fill();
  ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();

  const font = (s) => `${s}px "Lilita One", sans-serif`;
  const body = (s) => `800 ${s}px Nunito, sans-serif`;
  ctx.fillStyle = INK; ctx.textBaseline = "alphabetic";

  const antH = wide ? 330 : 380;
  const antW = antImg ? antH * (antImg.width / antImg.height) : antH;
  const faceSize = antW; // used for layout below
  const fx = wide ? px + pw - antW - 50 : px + (pw - antW) / 2;
  const fy = wide ? py + 40 : py + 50;
  if (antImg) ctx.drawImage(antImg, fx, fy, antW, antH);
  const lx = wide ? px + 48 : px + 60;
  let y = wide ? py + 92 : fy + antH + 70;
  const center = !wide;
  ctx.textAlign = center ? "center" : "left";
  const tx = center ? W / 2 : lx;

  ctx.font = font(wide ? 30 : 34); ctx.fillStyle = AMBER;
  ctx.fillText("ANT SHIFT REPORT", tx, y);
  y += wide ? 78 : 104;
  ctx.fillStyle = INK; ctx.font = font(wide ? 84 : 120);
  ctx.fillText(`${state.load.toLocaleString()}×`, tx, y);
  y += wide ? 40 : 52;
  ctx.font = body(wide ? 26 : 32);
  ctx.fillText("his body weight. carried.", tx, y);

  // line items
  y += wide ? 44 : 64;
  const rows = summary().slice(0, wide ? 3 : 4);
  const listW = wide ? 520 : pw - 160;
  const listX = center ? (W - listW) / 2 : lx;
  ctx.setLineDash([10, 10]); ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(listX, y - 30); ctx.lineTo(listX + listW, y - 30); ctx.stroke(); ctx.setLineDash([]);
  y += wide ? 22 : 40;
  const iconCache = {};
  for (const [name] of rows) {
    const it = ITEMS.find((i) => i.name === name);
    if (!iconCache[name]) iconCache[name] = await loadImg(it.src);
  }
  const rowH = wide ? 42 : 66;
  if (!rows.length) {
    ctx.font = body(wide ? 24 : 30); ctx.textAlign = center ? "center" : "left";
    ctx.fillText("Nothing yet. He's waiting.", center ? W / 2 : listX, y + 16);
    y += rowH;
  }
  for (const [name, count] of rows) {
    const it = ITEMS.find((i) => i.name === name);
    const ic = iconCache[name];
    if (ic) { const box = rowH * 0.9, k = Math.min(box / ic.width, box / ic.height); const w = ic.width * k, h = ic.height * k; ctx.drawImage(ic, listX + (box - w) / 2, y - rowH * 0.72 + (box - h) / 2, w, h); }
    ctx.textAlign = "left"; ctx.font = body(wide ? 24 : 34);
    ctx.fillText(`${count}× ${name.toLowerCase()}`, listX + rowH * 1.2, y);
    ctx.textAlign = "right";
    ctx.fillText(`${(count * it.mult).toLocaleString()}×`, listX + listW, y);
    y += rowH;
  }
  ctx.textAlign = "left"; ctx.font = font(wide ? 26 : 32);
  ctx.fillText("Complaints filed", listX, y + 4);
  ctx.textAlign = "right"; ctx.fillText("0", listX + listW, y + 4);

  // footer stamp
  ctx.textAlign = "center"; ctx.font = font(wide ? 34 : 44); ctx.fillStyle = AMBER;
  const sx = wide ? fx + faceSize / 2 : W / 2;
  const sy = wide ? fy + antH + 70 : py + ph - 70;
  ctx.save(); ctx.translate(sx, sy); ctx.rotate(-0.05);
  ctx.lineWidth = 8; ctx.strokeStyle = INK; ctx.strokeText("FOR THE COLONY", 0, 0);
  ctx.fillText("FOR THE COLONY", 0, 0); ctx.restore();
  ctx.fillStyle = INK; ctx.font = body(wide ? 20 : 24);
  ctx.fillText("$ANT", sx, sy + (wide ? 40 : 48));

  grain(ctx, W, H);
  return c;
}

/* ============ STORY PANELS ============ */
$$("[data-story]").forEach((box) => {
  const n = box.dataset.story;
  const img = new Image();
  img.alt = ["", "ANT waking up in his leaf bed", "ANT staring up at a giant crumb", "ANT carrying the crumb home as the colony cheers"][n];
  img.onload = () => { box.classList.add("has-img"); box.appendChild(img); };
  img.src = `assets/story/story-${n}.jpg`;
});

/* ============ MEME LIBRARY ============
   Drop images in assets/memes/<file>.jpg (optional thumb in assets/memes/thumb/<file>.jpg).
   Missing files are skipped automatically. */
const MEMES = [
  { file: "trenches", title: "Carrying the trenches", caption: "someone has to carry this cycle. $ANT" },
  { file: "opening-bell", title: "Opening bell", caption: "the only ANT listing you can buy today. $ANT" },
  { file: "god-candle", title: "God candle", caption: "he's been carrying candles for weeks. now one is carrying him. $ANT" },
  { file: "jeets", title: "Jeets drop, ants pick up", caption: "jeets drop. ants pick up. $ANT" },
  { file: "bonding-curve", title: "Carrying the curve", caption: "carried the bonding curve. graduated with honors. 🎓 $ANT" },
  { file: "wrong-door", title: "Invite only", caption: "they didn't let him in. he went back to work. 🐜 $ANT" },
  { file: "seven-weeks", title: "Week 7", caption: "7 red weeks. still clocked in. $ANT" },
  { file: "crumb-heist", title: "Crumb heist", caption: "everyone starts their first heist thursday. he's been running crumb heists for years. $ANT" },
  { file: "colony-march", title: "The colony is coming", caption: "the colony is coming 🐜🐜🐜 $ANT" },
  { file: "this-is-fine", title: "This is fine", caption: "the market today. back to work tomorrow. $ANT" },
  { file: "wojak", title: "He's doing his best", caption: "he's doing his best $ANT" },
  { file: "giga", title: "Giga ANT", caption: "carries 50x his weight. no complaints. no days off. $ANT" },
  { file: "bags", title: "Carries your bags", caption: "drop your bags. ANT will carry them. $ANT" },
  { file: "antwifhat", title: "antwifhat", caption: "antwifhat $ANT" },
  { file: "cousins", title: "Doodle cousins", caption: "same art teacher $ANT" },
];

const memeGrid = $("#memeGrid");
const postUrl = (text) => "https://x.com/intent/post?text=" + encodeURIComponent(text + (CONFIG.site ? `\n${CONFIG.site}` : ""));
let memesSettled = 0, memesFound = 0;
function memeSettled(found) {
  memesSettled++;
  if (found) memesFound++;
  if (memesSettled === MEMES.length) $("#memeEmpty").hidden = memesFound > 0;
}

MEMES.forEach((m) => {
  const full = `assets/memes/${m.file}.jpg`;
  const card = document.createElement("button");
  card.className = "meme-card";
  card.hidden = true;
  card.setAttribute("aria-label", `Open meme: ${m.title}`);
  const img = new Image();
  img.alt = m.title;
  img.onerror = () => {
    if (img.dataset.fallback) return memeSettled(false);
    img.dataset.fallback = "1";
    img.src = full;
  };
  img.onload = () => { card.hidden = false; memeSettled(true); };
  img.src = `assets/memes/thumb/${m.file}.jpg`;
  card.appendChild(img);
  const foot = document.createElement("div");
  foot.className = "mc-foot";
  foot.innerHTML = `<span class="mc-title"></span><span class="mc-save">Save ↓</span>`;
  foot.querySelector(".mc-title").textContent = m.title;
  card.appendChild(foot);
  card.addEventListener("click", () => openMeme(m, full));
  memeGrid.appendChild(card);
});

const lb = $("#lightbox");
let lastFocus = null;
function openMeme(m, full) {
  lastFocus = document.activeElement;
  $("#lbImg").src = full;
  $("#lbImg").alt = m.title;
  $("#lbCaption").textContent = m.caption;
  $("#lbSave").href = full;
  $("#lbSave").setAttribute("download", `ant-${m.file}.jpg`);
  $("#lbPost").href = postUrl(m.caption);
  $("#lbCopy").onclick = () => copy(m.caption + (CONFIG.site ? `\n${CONFIG.site}` : ""), "Caption copied.");
  lb.hidden = false;
  document.body.style.overflow = "hidden";
  $("#lbClose").focus();
}
function closeMeme() {
  lb.hidden = true;
  document.body.style.overflow = "";
  if (lastFocus) lastFocus.focus();
}
$("#lbClose").addEventListener("click", closeMeme);
lb.addEventListener("click", (e) => { if (e.target === lb) closeMeme(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !lb.hidden) closeMeme(); });

$("#saveReport").addEventListener("click", async () => {
  const c = await drawReport();
  c.toBlob((blob) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ant-shift-report-${size}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast("Shift report saved.");
  }, "image/png");
});
