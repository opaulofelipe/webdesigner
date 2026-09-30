# Portfólio — Paulo Felipe

Site estático (HTML, CSS e JS separados) para GitHub Pages.

## Como adicionar um projeto
Abra `js/script.js` e escreva o nome do repositório na lista `REPOS`:

```js
const REPOS = [
  "psicologa",
  "artesrupestres",
  "nome-do-novo-repositorio",
];
```

O card aparece sozinho. Título, descrição e prévia vêm do site publicado em
`https://opaulofelipe.github.io/<repositorio>/` (título da página e `<meta name="description">`).
Se o repositório não tiver GitHub Pages ativo, o card abre o código no GitHub.

## Estrutura
```
index.html
css/style.css
js/script.js
img/paulo.webp
```
