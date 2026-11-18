"use strict";
/* Opération Dossier Secret — mini-jeu en 5 épreuves qui débloque le CV.
   Tout est simulé dans le navigateur, aucune requête réseau. */

const $ = (s, r = document) => r.querySelector(s);
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const game = $("#game"), cv = $("#cv"), stage = $("#stage"), logBox = $("#log");
const hud = $("#hud"), steps = $("#steps"), screenBox = $(".console");
const introHTML = stage.innerHTML;

const S = { run: 0, score: 0, combo: 1, lives: 3, step: 0, t0: 0, timer: null };

/* ---------- Outils ---------- */
const wait = ms => new Promise(r => setTimeout(r, ms));
const rand = (a, b) => Math.random() * (b - a) + a;
const fmt = s => Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");

function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "class") el.className = v;
    else if (k === "text") el.textContent = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v);
  }
  for (const c of kids.flat()) if (c != null) el.append(c);
  return el;
}
const panel = (...kids) => stage.replaceChildren(...kids.flat().filter(Boolean));
function focusFirst() {
  const el = stage.querySelector("input, button:not([disabled])");
  if (el) el.focus({ preventScroll: true });
}
function readBest() { try { return Number(localStorage.getItem("cvBest")) || 0; } catch (e) { return 0; } }
function saveBest(v) { try { localStorage.setItem("cvBest", String(v)); } catch (e) {} }

/* ---------- Terminal ---------- */
async function log(text, cls = "") {
  const vis = h("span", { "aria-hidden": "true" });
  logBox.append(h("p", { class: "ln " + cls }, vis, h("span", { class: "sr", text })));
  while (logBox.children.length > 5) logBox.firstChild.remove();
  if (reduce) { vis.textContent = text; return; }
  const my = S.run;
  for (let i = 1; i <= text.length; i += 2) {
    if (my !== S.run) return;
    vis.textContent = text.slice(0, i);
    await wait(16);
  }
  vis.textContent = text;
}

/* ---------- Score, vies, progression ---------- */
function renderHud() {
  $("#score").textContent = S.score;
  $("#combo").textContent = "×" + S.combo;
  $("#lives").replaceChildren(
    h("span", { "aria-hidden": "true", text: "♥".repeat(S.lives) + "♡".repeat(3 - S.lives) }),
    h("span", { class: "sr", text: S.lives + " sur 3" }));
  [...steps.children].forEach((li, i) => {
    li.className = i < S.step ? "done" : i === S.step ? "now" : "";
    if (i === S.step) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
  });
}
function popText(text, bad) {
  const p = h("span", { class: "pop" + (bad ? " bad" : ""), "aria-hidden": "true", text });
  screenBox.append(p);
  setTimeout(() => p.remove(), 1000);
}
function gain(base, label) {
  const pts = Math.round(base * S.combo);
  S.score += pts;
  S.combo = Math.min(S.combo + 1, 3);
  renderHud();
  popText("+" + pts + (label ? " " + label : ""));
}
/* Retourne false si la partie est perdue */
function mistake() {
  S.combo = 1;
  S.lives--;
  renderHud();
  popText("TRACE !", true);
  screenBox.classList.remove("hit"); void screenBox.offsetWidth; screenBox.classList.add("hit");
  if (S.lives <= 0) { caught(); return false; }
  return true;
}

/* ---------- Épreuve 1 : infiltration ---------- */
function pick(question, opts, cls = "choice") {
  return new Promise(res => {
    const list = h("div", { class: cls === "file" ? "files" : "choices" });
    opts.forEach((o, i) => list.append( // ordre fixe : les réponses restent toujours au même endroit
      h("button", { class: cls, type: "button", "data-key": String(i + 1), onclick: () => { list.querySelectorAll("button").forEach(b => { b.disabled = true; }); res(o); } },
        h("kbd", { text: String(i + 1) }),
        h("span", { class: "fname", text: o.c }),
        o.s ? h("span", { class: "fsize", text: o.s }) : null)));
    panel(h("p", { class: "q", text: question }), list);
    focusFirst();
  });
}
async function stInfiltration(my) {
  await log("> Cible : srv-dossier.local — épreuve 1 : s'infiltrer.", "sys");
  const opts = [
    { c: "ping google.fr", msg: "Le ping répond… mais Google n'est pas notre cible." },
    { c: "ssh agent@srv-dossier", ok: true },
    { c: "rm -rf /", msg: "Commande bloquée : trop radical, agent !" },
    { c: "sudo make me-a-sandwich", msg: "Permission refusée. Et pas de sandwich." }
  ];
  for (;;) {
    const o = await pick("Quelle commande pour se connecter au serveur ?", opts);
    if (my !== S.run) return false;
    await log("$ " + o.c, "cmd");
    if (o.ok) { gain(100); await log("Connexion établie ✔ Bienvenue, agent.", "ok"); return true; }
    await log(o.msg, "err");
    if (!mistake()) return false;
  }
}

/* ---------- Épreuve 2 : crack du mot de passe (timing) ---------- */
async function stCrack(my) {
  await log("> Épreuve 2 : cracker le mot de passe root.", "sys");
  return new Promise(res => {
    const parts = ["5I5", "R-2", "026"];
    const widths = [38, 32, 26];                          // zones larges = plus facile
    const speeds = reduce ? [25, 30, 35] : [32, 40, 48];  // % de la barre par seconde (lent)
    let hits = 0, pos = 0, raw = 0, dir = 1, zl = 0, last = performance.now(), raf = 0;

    const pwd = h("p", { class: "pwd", "aria-live": "polite" });
    const zone = h("div", { class: "zone" }, h("i"));
    const cursor = h("div", { class: "cursor" });
    const btn = h("button", { class: "btn primary big", type: "button", "data-key": "space" }, "⚡ Cracker ", h("kbd", { text: "Espace" }));
    const setZone = () => { const w = widths[hits]; zl = rand(4, 96 - w); zone.style.left = zl + "%"; zone.style.width = w + "%"; };
    const showPwd = () => { pwd.textContent = "Mot de passe : " + parts.map((p, i) => i < hits ? p : "•••").join(""); };
    setZone(); showPwd();
    panel(h("p", { class: "q", text: "Appuie quand le curseur rose est dans la zone verte (3 fois). Pas de stress : rater ne coûte pas de vie." }),
      pwd, h("div", { class: "track", "aria-hidden": "true" }, zone, cursor), btn);
    focusFirst();

    const loop = now => {
      if (my !== S.run) return;
      const dt = Math.min((now - last) / 1000, .05); last = now;
      raw += dir * speeds[hits] * dt;
      if (raw >= 100) { raw = 100; dir = -1; } else if (raw <= 0) { raw = 0; dir = 1; }
      pos = Math.round(raw / 2) * 2; // déplacement « pixel » par pas de 2 %
      cursor.style.left = pos + "%";
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    btn.addEventListener("click", async () => {
      if (btn.disabled || my !== S.run) return;
      const w = widths[hits];
      if (pos >= zl && pos <= zl + w) {
        const prec = 1 - Math.abs(pos - (zl + w / 2)) / (w / 2);
        const perfect = prec > .7;
        gain(120 + Math.round(prec * 80), perfect ? "PARFAIT" : "");
        hits++; showPwd();
        if (hits === parts.length) {
          btn.disabled = true; cancelAnimationFrame(raf);
          await log("Session root ouverte ✔", "ok");
          res(true);
        } else {
          setZone();
          log("Fragment " + hits + "/3 craqué" + (perfect ? " — tir parfait !" : "."), "ok");
        }
      } else {
        // Épreuve d'entraînement : un raté casse seulement le combo, sans perdre de vie
        S.combo = 1; renderHud(); popText("RATÉ", true);
        log("Raté ! Réessaie, tu as tout ton temps.", "err");
      }
    });
  });
}

/* ---------- Épreuve 3 : pare-feu (mémoire) ---------- */
async function stFirewall(my) {
  await log("> Épreuve 3 : le pare-feu exige la bonne séquence de ports.", "sys");
  const ports = [["22", "SSH"], ["80", "HTTP"], ["443", "HTTPS"], ["3306", "SQL"]];
  const btns = ports.map(([p, n], i) => h("button", { class: "node n" + i, type: "button", "data-key": String(i + 1), disabled: "" },
    h("kbd", { text: String(i + 1) }), h("b", { text: p }), h("span", { text: n })));
  const info = h("p", { class: "q", "aria-live": "polite" });
  panel(info, h("div", { class: "nodes" }, btns));
  const flash = (b, ms) => { b.classList.add("lit"); setTimeout(() => b.classList.remove("lit"), ms); };

  for (const len of [3, 4]) {
    const seq = Array.from({ length: len }, () => Math.floor(Math.random() * 4));
    for (;;) {
      if (my !== S.run) return false;
      btns.forEach(b => { b.disabled = true; });
      info.textContent = "Mémorise la séquence de " + len + " ports…";
      await wait(700);
      const shown = [];
      for (const k of seq) {
        if (my !== S.run) return false;
        shown.push(ports[k][0]);
        info.textContent = "Séquence : " + shown.join(" · ");
        btns[k].classList.add("lit"); await wait(reduce ? 700 : 520);
        btns[k].classList.remove("lit"); await wait(200);
      }
      info.textContent = "À toi ! Reproduis la séquence (" + len + " ports).";
      btns.forEach(b => { b.disabled = false; });
      btns[0].focus({ preventScroll: true });
      const ok = await new Promise(res => {
        let i = 0;
        btns.forEach((b, k) => { b.onclick = () => {
          flash(b, 180);
          if (k !== seq[i]) return res(false);
          if (++i === seq.length) res(true);
        }; });
      });
      btns.forEach(b => { b.onclick = null; });
      if (my !== S.run) return false;
      if (ok) { gain(100 + len * 25); await log("Séquence de " + len + " ports acceptée ✔", "ok"); break; }
      await log("Mauvais port : le pare-feu devient méfiant…", "err");
      if (!mistake()) return false;
    }
  }
  await log("Pare-feu contourné ✔ … oups, une alarme se déclenche !", "warn");
  return true;
}

/* ---------- Épreuve 4 : alarme (code à recopier) ---------- */
function alarmRound(my, code) {
  return new Promise(res => {
    let t = 10;
    const count = h("p", { class: "count", text: String(t) });
    const input = h("input", { id: "code", type: "text", maxlength: "4", autocomplete: "off", autocapitalize: "characters", spellcheck: "false" });
    panel(
      h("p", { class: "q", text: "⚠ Intrusion détectée ! Recopie le code d'urgence avant la fin du compte à rebours :" }),
      h("p", { class: "code", text: code.split("").join(" ") }),
      count,
      h("label", { for: "code", text: "Code d'urgence (4 caractères)" }),
      input);
    input.focus({ preventScroll: true });
    const iv = setInterval(() => {
      if (my !== S.run) { clearInterval(iv); return; }
      t--; count.textContent = String(t);
      if (t <= 0) { clearInterval(iv); res(0); }
    }, 1000);
    input.addEventListener("input", () => {
      const v = input.value.toUpperCase().replace(/[^0-9A-F]/g, "");
      input.value = v;
      if (v === code) { clearInterval(iv); res(t); }
      else if (v.length === 4) { input.classList.remove("bad"); void input.offsetWidth; input.classList.add("bad"); input.value = ""; }
    });
  });
}
async function stAlarm(my) {
  document.body.classList.add("alarm");
  await log("⚠ ALARME ! Coupe-la avant l'arrivée de la sécurité.", "err");
  for (;;) {
    const code = Array.from({ length: 4 }, () => "0123456789ABCDEF"[Math.floor(Math.random() * 16)]).join("");
    const left = await alarmRound(my, code);
    if (my !== S.run) return false;
    if (left > 0) {
      document.body.classList.remove("alarm");
      gain(100 + left * 25, left >= 6 ? "ÉCLAIR" : "");
      await log("Alarme coupée ✔ avec " + left + " s d'avance.", "ok");
      return true;
    }
    await log("Trop lent : le code a changé !", "err");
    if (!mistake()) return false;
  }
}

/* ---------- Épreuve 5 : extraction ---------- */
async function stExtract(my) {
  await log("> Épreuve 5 : ls -lh /secret", "sys");
  await log("Indice : le vrai dossier est chiffré (.enc) et pèse moins de 300 ko.", "hint");
  const files = [
    { c: "CV_TOP_SECRET.pdf", s: "4,2 Mo", msg: "Leurre ! Un vrai agent vérifie l'extension." },
    { c: "cv_top_secret.enc", s: "148 ko", ok: true },
    { c: "cv_backup.enc", s: "12 Mo", msg: "Trop lourd : le transfert te ferait repérer." },
    { c: "photos_de_shrek.zip", s: "666 ko", msg: "Beurk, un marais… pas notre cible !" }
  ];
  for (;;) {
    const o = await pick("Quel fichier extraire ?", files, "file");
    if (my !== S.run) return false;
    await log("$ download " + o.c, "cmd");
    if (o.ok) break;
    await log(o.msg, "err");
    if (!mistake()) return false;
  }
  gain(150);
  const fill = h("i");
  const bar = h("div", { class: "dl", role: "progressbar", "aria-label": "Extraction du dossier", "aria-valuemin": "0", "aria-valuemax": "100", "aria-valuenow": "0" }, fill);
  const pct = h("p", { class: "q", text: "Extraction… 0 %" });
  panel(pct, bar);
  for (let p = 0; p <= 100; p += 5) {
    if (my !== S.run) return false;
    fill.style.width = p + "%"; bar.setAttribute("aria-valuenow", String(p));
    pct.textContent = "Extraction… " + p + " %";
    await wait(60);
  }
  await log("DOSSIER EXTRAIT AVEC SUCCÈS ✔", "ok");
  return true;
}

/* ---------- Déroulé de la partie ---------- */
const STAGES = [stInfiltration, stCrack, stFirewall, stAlarm, stExtract];

async function startGame() {
  const my = ++S.run;
  Object.assign(S, { score: 0, combo: 1, lives: 3, step: 0 });
  $("#jail").hidden = true;
  document.body.classList.remove("alarm");
  logBox.replaceChildren();
  hud.hidden = false; steps.hidden = false;
  renderHud();
  clearInterval(S.timer);
  S.t0 = Date.now();
  $("#time").textContent = "0:00";
  S.timer = setInterval(() => { $("#time").textContent = fmt(Math.floor((Date.now() - S.t0) / 1000)); }, 1000);
  game.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });

  for (let i = 0; i < STAGES.length; i++) {
    S.step = i; renderHud();
    const ok = await STAGES[i](my);
    if (!ok || my !== S.run) return;
  }
  S.step = STAGES.length; renderHud();
  win();
}

function win() {
  clearInterval(S.timer);
  const secs = Math.floor((Date.now() - S.t0) / 1000);
  const lifeBonus = S.lives * 200, timeBonus = Math.max(0, 600 - secs * 4);
  S.score += lifeBonus + timeBonus;
  renderHud();
  const rank = S.score >= 4500 ? "S" : S.score >= 3300 ? "A" : S.score >= 2200 ? "B" : "C";
  const best = readBest(), record = S.score > best;
  if (record) saveBest(S.score);
  const stat = (k, v) => h("div", {}, h("dt", { text: k }), h("dd", { text: v }));
  panel(
    h("p", { class: "win-t", text: "Mission accomplie" }),
    h("p", { class: "rank r" + rank }, h("span", { class: "sr", text: "Rang " }), rank),
    h("dl", { class: "stats" },
      stat("Score", S.score + " pts"), stat("Temps", fmt(secs)),
      stat("Vies restantes", S.lives + "/3"), stat("Bonus", "+" + (lifeBonus + timeBonus))),
    record ? h("p", { class: "record", text: "🏆 Nouveau record !" }) : h("p", { class: "q", text: "Record à battre : " + best + " pts" }),
    h("div", { class: "row" },
      h("button", { class: "btn primary big", type: "button", onclick: () => openCV("cv"), text: "📂 Ouvrir le dossier" }),
      h("button", { class: "btn ghost", type: "button", onclick: startGame, text: "↻ Rejouer" })));
  confetti();
  focusFirst();
}

function caught() {
  S.run++;
  clearInterval(S.timer);
  document.body.classList.remove("alarm");
  $("#jail-score").textContent = S.score;
  $("#jail").hidden = false;
  $("#retry").focus();
}

function confetti() {
  if (reduce) return;
  const colors = ["#22e3ff", "#ff5cdc", "#7dff6b", "#ffc04d"];
  for (let i = 0; i < 46; i++) {
    const c = h("span", { class: "confetti", "aria-hidden": "true" });
    c.style.left = rand(0, 97) + "vw";
    c.style.background = colors[i % colors.length];
    c.style.animationDuration = rand(1.6, 3.2) + "s";
    c.style.animationDelay = rand(0, .6) + "s";
    document.body.append(c);
    setTimeout(() => c.remove(), 4200);
  }
}

function showIntro() {
  S.run++;
  clearInterval(S.timer);
  document.body.classList.remove("alarm");
  hud.hidden = true; steps.hidden = true;
  logBox.replaceChildren();
  stage.innerHTML = introHTML;
  bindIntro();
}
function bindIntro() {
  $("#start").addEventListener("click", startGame);
  const best = readBest(), b = $("#best");
  if (best) { b.textContent = "🏆 Ton record : " + best + " pts"; b.hidden = false; }
}

/* ---------- Affichage du CV ---------- */
function openCV(id) {
  S.run++;
  clearInterval(S.timer);
  document.body.classList.remove("alarm");
  $("#jail").hidden = true;
  game.hidden = true;
  cv.classList.add("on");
  try { history.replaceState(null, "", "#" + (id || "cv")); } catch (e) {}
  const target = (id && document.getElementById(id)) || cv;
  cv.focus({ preventScroll: true });
  requestAnimationFrame(() => target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }));
  setTimeout(() => document.querySelectorAll(".lvl i").forEach(i => { i.style.width = i.dataset.w + "%"; }), 200);
}
function showGame() {
  cv.classList.remove("on");
  game.hidden = false;
  showIntro();
  try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
  game.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  $("#start").focus({ preventScroll: true });
}

/* ---------- Événements ---------- */
document.addEventListener("click", e => {
  const a = e.target.closest("a[href^='#']");
  if (!a) return;
  const id = a.getAttribute("href").slice(1);
  const el = document.getElementById(id);
  if (id === "game") { e.preventDefault(); showGame(); }
  else if (el && (el === cv || cv.contains(el))) { e.preventDefault(); openCV(id); }
});

document.addEventListener("keydown", e => {
  if (game.hidden || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.target.matches("input, textarea")) return;
  const key = e.key === " " ? "space" : e.key;
  const b = stage.querySelector('[data-key="' + key + '"]');
  if (!b || b.disabled) return;
  if (key === "space" && e.target === b) return; // le bouton gère déjà Espace
  e.preventDefault();
  b.click();
});

$("#retry").addEventListener("click", startGame);
$("#cvjail").addEventListener("click", () => openCV("cv"));
$("#print").addEventListener("click", () => window.print());
$("#replay").addEventListener("click", showGame);

bindIntro();
const startHash = location.hash.slice(1);
if (startHash && startHash !== "game") {
  const el = document.getElementById(startHash);
  if (el && (el === cv || cv.contains(el))) openCV(startHash);
}
