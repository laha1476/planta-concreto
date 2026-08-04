// build.js
// Este script lo corre GitHub Actions automáticamente (nunca hace falta correrlo a mano).
// Toma index.html, saca el bloque <script type="text/babel"> con todo el código de la app,
// lo compila a JavaScript normal con Babel de verdad (no el que corre en el navegador),
// y genera dist/index.html ya listo — sin necesitar Babel en el navegador del usuario final.

const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

const babelScriptRegex = /<script type="text\/babel"[^>]*>([\s\S]*?)<\/script>/;
const match = html.match(babelScriptRegex);
if (!match) {
  console.error('No se encontró el bloque <script type="text/babel"> en index.html — build cancelado.');
  process.exit(1);
}

const jsxCode = match[1];

const result = babel.transform(jsxCode, {
  presets: ['@babel/preset-react'],
  filename: 'app.jsx',
  compact: false,
});

if (!result || !result.code) {
  console.error('Babel no pudo compilar el código — build cancelado.');
  process.exit(1);
}

let outputHtml = html.replace(babelScriptRegex, `<script>\n${result.code}\n</script>`);

// Ya no se necesita cargar Babel en el navegador — se quita la librería y su respaldo.
outputHtml = outputHtml.replace(
  /<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@babel\/standalone[^"]*"><\/script>\s*\n?/g,
  ''
);
outputHtml = outputHtml.replace(
  /<script>window\.Babel \|\| document\.write\([^)]*\)<\/script>\s*\n?/g,
  ''
);

fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'dist', 'index.html'), outputHtml);

console.log('✅ Build completo: dist/index.html (JSX ya compilado, sin Babel en el navegador)');
