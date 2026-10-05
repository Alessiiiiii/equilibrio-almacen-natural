const fs = require('fs');
const path = require('path');

const pages = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/pages_structure.json'), 'utf-8'));
const prods = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/products.json'), 'utf-8'));

console.log('Total pages with structure:', pages.length);

pages.forEach(p => {
  if (p.pageNum === 1 || p.images.length === 0) return;
  console.log(`\n========================================`);
  console.log(`PAGE ${p.pageNum} (Images: ${p.images.length})`);
  console.log(`Texts: ${p.texts.map(t => t.text).join(' | ')}`);
  
  // Sort images top-to-bottom (Y descending in PDF), then left-to-right (X ascending)
  const sorted = [...p.images].sort((a, b) => (b.y - a.y) || (a.x - b.x));
  sorted.forEach(img => {
    console.log(`  ${img.file} -> x=${Math.round(img.x)}, y=${Math.round(img.y)}, w=${Math.round(img.w)}, h=${Math.round(img.h)}`);
  });
});
