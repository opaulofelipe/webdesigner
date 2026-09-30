"use strict";

/* ============================================================
   PROJETOS — edite esta lista com os seus repositórios.
   repo: "usuario/repositorio". Sem repo, o cartão aparece como "Em breve".
   ============================================================ */
const PROJETOS = [
  { titulo: "Demonstração: Spoon-Knife", desc: "Repositório público de exemplo do GitHub, aberto direto do código-fonte. Troque pelos seus projetos.", tags: ["HTML", "CSS"], repo: "octocat/Spoon-Knife" },
  { titulo: "Projeto 2", desc: "Descrição curta do que foi feito e qual problema resolveu.", tags: ["UI/UX", "JavaScript"], repo: "" },
  { titulo: "Projeto 3", desc: "Descrição curta do que foi feito e qual problema resolveu.", tags: ["Front-end"], repo: "" }
];

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------- Cartões de projeto ---------- */
function renderProjetos() {
  const ul = $("#lista");
  PROJETOS.forEach(p => {
    const li = document.createElement("li");
    li.className = "card";
    li.innerHTML = `<h3></h3><p></p><ul class="tags" role="list"></ul>`;
    $("h3", li).textContent = p.titulo;
    $("p", li).textContent = p.desc;
    p.tags.forEach(t => { const i = document.createElement("li"); i.textContent = t; $(".tags", li).append(i); });
    const b = document.createElement("button");
    b.type = "button";
    b.className = "btn";
    if (p.repo) { b.textContent = "Experimentar site"; b.addEventListener("click", () => abrirRepo(p.repo, p.titulo)); }
    else { b.textContent = "Em breve"; b.disabled = true; }
    li.append(b);
    ul.append(li);
  });
}

/* ---------- Menu mobile ---------- */
function iniciarMenu() {
  const btn = $(".menu-btn"), menu = $("#menu");
  const fechar = () => { menu.classList.remove("aberto"); btn.setAttribute("aria-expanded", "false"); };
  btn.addEventListener("click", () => {
    const aberto = menu.classList.toggle("aberto");
    btn.setAttribute("aria-expanded", String(aberto));
  });
  menu.addEventListener("click", e => { if (e.target.closest("a")) fechar(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") fechar(); });
}

/* ---------- Formulário de contato (mailto, sem back-end) ---------- */
function iniciarContato() {
  $("#contato-form").addEventListener("submit", e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const corpo = `${f.get("msg")}\n\n— ${f.get("nome")} (${f.get("email")})`;
    location.href = `mailto:paulofelipetavares@protonmail.com?subject=${encodeURIComponent("Contato pelo portfólio")}&body=${encodeURIComponent(corpo)}`;
  });
}

/* ============================================================
   VISUALIZADOR DE REPOSITÓRIOS GITHUB
   1) Se o repositório tem GitHub Pages, abre o site publicado.
   2) Senão, lê o index.html do repositório, embute CSS e JS
      e roda tudo dentro de um iframe isolado (sandbox).
   ============================================================ */
const viewer = $("#viewer"), frame = $("#viewer-frame"), status = $("#viewer-status"), stage = $(".stage");
let atual = null;

function lerRepo(entrada) {
  const m = entrada.trim().replace(/\.git$/i, "").match(/^(?:https?:\/\/(?:www\.)?github\.com\/)?([\w.-]+)\/([\w.-]+)/i);
  return m ? { dono: m[1], nome: m[2] } : null;
}

function mostrarStatus(msg, erro = false) {
  status.textContent = msg;
  status.classList.toggle("erro", erro);
}

async function abrirRepo(entrada, titulo) {
  const r = lerRepo(entrada);
  if (!r) return alert("Use o formato usuario/repositorio ou cole o link do GitHub.");
  atual = { r, titulo: titulo || `${r.dono}/${r.nome}` };
  $("#viewer-titulo").textContent = atual.titulo;
  $("#viewer-externo").href = `https://github.com/${r.dono}/${r.nome}`;
  frame.removeAttribute("src"); frame.removeAttribute("srcdoc");
  if (!viewer.open) viewer.showModal();
  mostrarStatus("Carregando o site…");
  try {
    const meta = await buscarJSON(`https://api.github.com/repos/${r.dono}/${r.nome}`);
    if (meta.has_pages) {
      const url = /github\.io/i.test(meta.homepage || "") ? meta.homepage
        : `https://${r.dono}.github.io/${r.nome.toLowerCase() === `${r.dono}.github.io`.toLowerCase() ? "" : r.nome + "/"}`;
      frame.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms allow-popups allow-modals");
      frame.src = url;
      $("#viewer-externo").href = url;
    } else {
      // Sem allow-same-origin: o código do repositório não acessa esta página.
      frame.setAttribute("sandbox", "allow-scripts allow-forms allow-popups allow-modals");
      frame.srcdoc = await montarSite(r, meta.default_branch);
    }
    mostrarStatus("");
  } catch (err) {
    mostrarStatus(`Não consegui abrir este repositório. ${err.message || ""} Confira se ele é público e tem um index.html na raiz — ou abra o código no GitHub.`, true);
  }
}

async function buscarJSON(url) {
  const res = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
  if (res.status === 404) throw new Error("Repositório não encontrado.");
  if (res.status === 403) throw new Error("Limite de consultas do GitHub atingido; tente em alguns minutos.");
  if (!res.ok) throw new Error(`Erro ${res.status}.`);
  return res.json();
}

async function montarSite({ dono, nome }, ramo) {
  const raw = p => `https://raw.githubusercontent.com/${dono}/${nome}/${ramo}/${p}`;
  const texto = async u => { const r = await fetch(u); if (!r.ok) throw new Error(u); return r.text(); };
  const externo = u => /^(?:[a-z]+:|\/\/|#)/i.test(u);

  let html;
  try { html = await texto(raw("index.html")); }
  catch { throw new Error("index.html não encontrado na raiz."); }
  const doc = new DOMParser().parseFromString(html, "text/html");

  const corrigirCss = (css, base) => css.replace(/url\(\s*(['"]?)(?![a-z]+:|\/\/|#)([^)'"]+)\1\s*\)/gi,
    (_, q, p) => `url("${new URL(p, base).href}")`);

  const tarefas = [];
  $$("link[rel~=stylesheet][href]", doc).forEach(l => {
    const h = l.getAttribute("href"); if (externo(h)) return;
    tarefas.push((async () => {
      try {
        const u = new URL(h, raw("")).href, s = doc.createElement("style");
        s.textContent = corrigirCss(await texto(u), u); l.replaceWith(s);
      } catch { /* arquivo ausente: mantém o restante da página */ }
    })());
  });
  $$("script[src]", doc).forEach(old => {
    const h = old.getAttribute("src"); if (externo(h)) return;
    tarefas.push((async () => {
      try {
        const s = doc.createElement("script");
        if (old.type) s.type = old.type;
        s.textContent = (await texto(new URL(h, raw("")).href)).replace(/<\/script/gi, "<\\/script");
        old.replaceWith(s);
      } catch { /* idem */ }
    })());
  });
  await Promise.all(tarefas);

  $$("img[src],source[src],video[src],audio[src]", doc).forEach(e => {
    const s = e.getAttribute("src"); if (!externo(s)) e.setAttribute("src", new URL(s, raw("")).href);
  });
  $$("img[srcset],source[srcset]", doc).forEach(e => e.removeAttribute("srcset"));
  return "<!DOCTYPE html>" + doc.documentElement.outerHTML;
}

function iniciarViewer() {
  $("#repo-form").addEventListener("submit", e => { e.preventDefault(); abrirRepo($("#repo-input").value); });
  $("#viewer-fechar").addEventListener("click", () => viewer.close());
  $("#viewer-reload").addEventListener("click", () => atual && abrirRepo(`${atual.r.dono}/${atual.r.nome}`, atual.titulo));
  viewer.addEventListener("close", () => { frame.removeAttribute("src"); frame.removeAttribute("srcdoc"); mostrarStatus(""); });
  $$(".devices button").forEach(b => b.addEventListener("click", () => {
    stage.dataset.device = b.dataset.device;
    $$(".devices button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
  }));
}

document.addEventListener("DOMContentLoaded", () => {
  $("#ano").textContent = new Date().getFullYear();
  renderProjetos(); iniciarMenu(); iniciarContato(); iniciarViewer();
});
