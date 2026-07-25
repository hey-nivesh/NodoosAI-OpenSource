const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'Nodoos AI Suite', 'src', 'assets');
const dstDir = path.join(__dirname, 'frontend', 'public');

if (!fs.existsSync(dstDir)) {
  fs.mkdirSync(dstDir, { recursive: true });
}

const files = fs.readdirSync(srcDir);
files.forEach(file => {
  const srcFile = path.join(srcDir, file);
  const dstFile = path.join(dstDir, file);
  fs.copyFileSync(srcFile, dstFile);
  console.log(`Copied ${file} -> ${dstFile}`);
});
console.log('All assets copied successfully!');
