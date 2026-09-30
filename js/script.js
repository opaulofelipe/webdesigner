"use strict";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const PROJECTS = {
  psicologa: {
    title: "Marina Azevedo — Psicóloga Clínica",
    url: "https://opaulofelipe.github.io/psicologa/"
  },
  artesrupestres: {
    title: "Vestígios — Atlas de Arte Rupestre",
    url: "https://opaulofelipe.github.io/artesrupestres/"
  }
};

function initMenu() {
  const button = $(".menu-btn");
  const menu = $("#menu");
  if (!button || !menu) return;

  const close = () => {
    menu.classList.remove("aberto");
    button.setAttribute("aria-expanded", "false");
  };

  button.addEventListener("click", () => {
    const open = menu.classList.toggle("aberto");
    button.setAttribute("aria-expanded", String(open));
  });

  menu.addEventListener("click", event => {
    if (event.target.closest("a")) close();
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") close();
  });
}

function initViewer() {
  const dialog = $("#viewer");
  const frame = $("#viewer-frame");
  const title = $("#viewer-title");
  const external = $("#viewer-external");
  const close = $("#viewer-close");
  if (!dialog || !frame || !title || !external || !close) return;

  $$(".project-open").forEach(button => {
    button.addEventListener("click", () => {
      const project = PROJECTS[button.dataset.project];
      if (!project) return;
      title.textContent = project.title;
      external.href = project.url;
      frame.src = project.url;
      dialog.showModal();
    });
  });

  const reset = () => {
    frame.removeAttribute("src");
  };

  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", reset);

  dialog.addEventListener("click", event => {
    const rect = dialog.getBoundingClientRect();
    const inside = event.clientX >= rect.left && event.clientX <= rect.right &&
      event.clientY >= rect.top && event.clientY <= rect.bottom;
    if (!inside) dialog.close();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const year = $("#ano");
  if (year) year.textContent = new Date().getFullYear();
  initMenu();
  initViewer();
});