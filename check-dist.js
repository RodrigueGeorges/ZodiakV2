const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
const html = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');
const match = html.match(/src="\/(index\.[^"']+\.js)"/);

if (match) {
  const jsFile = match[1];
  if (!fs.existsSync(path.join(distDir, jsFile))) {
    console.error(`❌ Le fichier JS référencé (${jsFile}) n'existe pas dans dist/`);
    process.exit(1);
  } else {
    console.log(`✅ Le fichier JS référencé (${jsFile}) existe bien dans dist/`);
  }
} else {
  console.error('❌ Aucun fichier JS principal trouvé dans index.html');
  process.exit(1);
} 