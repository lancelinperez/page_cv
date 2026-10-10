const $ = s => document.querySelector(s);
const say = t => { const b = $("#bubble"); b.style.animation = "none"; b.offsetWidth; b.style.animation = ""; b.textContent = t; };
const show = id => { document.querySelectorAll(".scene").forEach(s => s.classList.remove("on")); $(id).classList.add("on"); };
const mood = m => $("#mouth").setAttribute("d", m ? "M80 108q20 26 40 0z" : "M84 112q16 12 32 0");

say("Psst ! Agent, j'ai une mission pour toi !");
setTimeout(() => say("Un fichier ultra-secret est caché dans cet ordinateur. Il contient un CV… On va le récupérer !"), 1800);

$("#go").onclick = () => { show("#s1"); say("D'abord, on pirate le système !"); };

$("#hack").onclick = e => {
  e.target.disabled = true; $("#fill").style.width = "100%";
  $("#log").textContent = "> PIRATAGE EN COURS… 💻";
  say("Je suis un génie de l'informatique ! Enfin… je crois.");
  setTimeout(() => { $("#log").textContent = "> ACCÈS OBTENU ✅"; }, 1000);
  setTimeout(() => { show("#s2"); say("Oh oh… l'alarme se déclenche ! Éteins-la !"); }, 1500);
};

$("#off").onclick = e => {
  e.target.disabled = true; $("#alarm").classList.add("off");
  say("Ouf ! Personne n'a rien remarqué.");
  setTimeout(() => { show("#s3"); say("Vite, prends le fichier CV_TOP_SECRET !"); }, 1100);
};

document.querySelectorAll(".file").forEach(f => f.onclick = () => {
  const n = f.dataset.n;
  if (n === "chat") return say("Mignon… mais ce n'est pas notre cible !");
  if (n === "fact") return say("Beurk, ennuyeux ! Cherche le fichier doré.");
  const r = f.getBoundingClientRect(), h = $("#hacker").getBoundingClientRect();
  const fl = document.createElement("div");
  fl.className = "fly"; fl.textContent = "📄";
  fl.style.left = r.left + r.width / 2 - 24 + "px"; fl.style.top = r.top + "px";
  document.body.appendChild(fl); f.style.visibility = "hidden";
  requestAnimationFrame(() => {
    fl.style.left = h.left + h.width / 2 - 24 + "px";
    fl.style.top = h.top + h.height / 2 + "px";
    fl.style.transform = "rotate(720deg) scale(.5)";
  });
  setTimeout(() => { fl.remove(); win(); }, 950);
});

function confetti() {
  const col = ["#39ff14", "#ff8a1f", "#19d3e6", "#6c2bd9", "#ff3b3b"];
  for (let i = 0; i < 70; i++) {
    const c = document.createElement("i"); c.className = "conf";
    c.style.left = Math.random() * 100 + "vw"; c.style.background = col[i % 5];
    c.style.animationDuration = 1.8 + Math.random() * 1.8 + "s";
    c.style.animationDelay = Math.random() * .5 + "s";
    document.body.appendChild(c); setTimeout(() => c.remove(), 4500);
  }
}
function win() {
  show("#s4"); mood(1); $("#hacker").classList.add("joy"); confetti();
  say("Jackpot ! On a trouvé ton CV ! Maintenant, ouvrons ce dossier.");
}

function openCV() {
  $("#game").style.display = "none"; $("#skip").style.display = "none";
  $("#cv").classList.add("on"); window.scrollTo(0, 0);
  try { history.replaceState(null, "", "#cv"); } catch (e) {}
  setTimeout(() => document.querySelectorAll(".t i").forEach(i => i.style.width = i.dataset.w + "%"), 80);
}
$("#open").onclick = openCV;
$("#skip").onclick = e => { e.preventDefault(); openCV(); };
if (location.hash === "#cv") openCV();
