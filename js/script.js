"use strict";
document.documentElement.classList.add("js");

/* ===================== CONFIGURAÇÃO =====================
   Para adicionar um projeto, escreva o NOME DO REPOSITÓRIO
   na lista abaixo. O card aparece sozinho no site: título,
   descrição e prévia vêm do próprio site publicado no GitHub Pages.
   Opcional: troque o texto por um objeto, ex.:
   { repo: "meu-site", nome: "Outro título", descricao: "Outra descrição" }
   ======================================================== */
const GITHUB_USER = "opaulofelipe";
const REPOS = [
  "psicologa",
  "artesrupestres",
  "advogado",
   "globoterrestre",
   "personaltrainer",
   "geeknews",
   "cursodehistoria",
   "esteticalume",
  // "nome-do-novo-repositorio",
];
/* ======================================================== */

const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pretty = n => n.replace(/[-_]+/g, " ").replace(/\b\w/g, c => c.toUpperCase());
const TTL = 6 * 36e5, PREVIEW_W = 1280;

const projects = REPOS.map((item, i) => {
  const o = typeof item === "string" ? { repo: item } : item;
  const root = o.repo.toLowerCase() === `${GITHUB_USER}.github.io`.toLowerCase();
  return { ...o, i, live: false,
    site: o.site || `https://${GITHUB_USER}.github.io/${root ? "" : o.repo + "/"}`,
    github: `https://github.com/${GITHUB_USER}/${o.repo}` };
});

async function getMeta(p) {
  const key = "pf1:" + p.repo;
  try { const c = JSON.parse(localStorage.getItem(key)); if (c && Date.now() - c.t < TTL) return c.d; } catch {}
  const d = { live: false };
  try {
    const r = await fetch(p.site, { signal: AbortSignal.timeout(8000) });
    if (r.ok) {
      const doc = new DOMParser().parseFromString(await r.text(), "text/html");
      d.live = true;
      d.title = doc.title.trim();
      d.desc = doc.querySelector('meta[name="description"]')?.content.trim();
    }
  } catch {}
  if (!d.desc) {
    try {
      const r = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${p.repo}`);
      if (r.ok) d.desc = (await r.json()).description || "";
    } catch {}
  }
  if (d.live) try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), d })); } catch {}
  return d;
}

/* ---------- cards ---------- */
const grade = $("#grade");
const io = new IntersectionObserver(entries => entries.forEach(e => {
  if (!e.isIntersecting) return;
  io.unobserve(e.target);
  e.target.classList.contains("thumb") ? loadPreview(e.target) : e.target.classList.add("in");
}), { rootMargin: "200px" });

function buildCard(p) {
  const el = document.createElement("article");
  el.className = "card reveal";
  el.innerHTML = `
    <div class="thumb" aria-hidden="true"><span class="thumb__ph">${esc(pretty(p.repo)[0])}</span></div>
    <div class="card__body">
      <div class="card__row"><span>${String(p.i + 1).padStart(2, "0")}</span><span class="tag"></span></div>
      <h3><button type="button" class="card__open">${esc(p.nome || pretty(p.repo))}</button></h3>
      <p class="card__desc"></p>
    </div>`;
  p.el = el;
  $(".card__open", el).addEventListener("click", () => p.live ? openViewer(p) : window.open(p.github, "_blank", "noopener"));
  io.observe(el);
  io.observe($(".thumb", el));
  return el;
}

function loadPreview(thumb) {
  const p = projects.find(x => x.el.contains(thumb));
  if (!p?.live) return;
  const f = document.createElement("iframe");
  f.title = "Prévia de " + (p.nome || p.repo);
  f.tabIndex = -1;
  f.loading = "lazy";
  f.sandbox = "allow-scripts allow-same-origin";
  const fit = () => {
    const s = thumb.clientWidth / PREVIEW_W;
    f.style.transform = `scale(${s})`;
    f.style.height = thumb.clientHeight / s + "px";
  };
  fit();
  new ResizeObserver(fit).observe(thumb);
  f.addEventListener("load", () => f.classList.add("ok"));
  f.src = p.site;
  thumb.append(f);
}

async function hydrate(p) {
  const d = await getMeta(p);
  p.live = d.live;
  const [nome, ...resto] = (d.title || "").split(/\s+[—–|·-]\s+/);
  if (!p.nome && nome) { p.nome = nome; $(".card__open", p.el).textContent = nome; }
  $(".tag", p.el).textContent = resto.join(" · ") || (d.live ? "Site" : "Repositório");
  $(".card__desc", p.el).textContent = p.descricao || d.desc || "";
  if (!d.live) $(".thumb", p.el).classList.add("sem-site");
}

/* ---------- visualizador ---------- */
const dlg = $("#viewer"), frame = $("#v-frame");
let current = null;
const livePs = () => projects.filter(p => p.live);

function openViewer(p) {
  current = p;
  $("#viewer-title").textContent = p.nome || pretty(p.repo);
  $("#v-ext").href = p.site;
  frame.src = p.site;
  history.replaceState(null, "", "#/" + p.repo);
  if (!dlg.open) dlg.showModal();
}
function step(dir) {
  const l = livePs();
  if (l.length > 1) openViewer(l[(l.indexOf(current) + dir + l.length) % l.length]);
}
$("#v-prev").addEventListener("click", () => step(-1));
$("#v-next").addEventListener("click", () => step(1));
$("#v-close").addEventListener("click", () => dlg.close());
dlg.addEventListener("close", () => {
  frame.removeAttribute("src");
  history.replaceState(null, "", location.pathname + location.search);
});
dlg.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft") step(-1);
  if (e.key === "ArrowRight") step(1);
});
document.querySelectorAll(".v-devices button").forEach(b => b.addEventListener("click", () => {
  frame.style.setProperty("--w", b.dataset.w);
  document.querySelectorAll(".v-devices button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
}));

/* ---------- início ---------- */
(async function init() {
  $("#ano").textContent = new Date().getFullYear();
  document.querySelectorAll(".hero__img").forEach(el => io.observe(el));
  if (!projects.length) {
    grade.innerHTML = '<p class="vazio">Adicione repositórios à lista REPOS em js/script.js.</p>';
    return;
  }
  $("#contagem").textContent = String(projects.length).padStart(2, "0") + (projects.length === 1 ? " projeto" : " projetos");
  projects.forEach(p => grade.append(buildCard(p)));
  await Promise.allSettled(projects.map(hydrate));
  const m = location.hash.match(/^#\/(.+)$/);
  const target = m && projects.find(p => p.repo === decodeURIComponent(m[1]) && p.live);
  if (target) openViewer(target);
})();
