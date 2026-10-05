const fs = require('fs');
const prods = JSON.parse(fs.readFileSync('./data/products.json'));
const withImgs = prods.filter(p => p.imagen);
console.log('Total with images:', withImgs.length);
withImgs.forEach(p => {
  console.log(`[ID ${p.id}] ${p.marca} | ${p.producto} (${p.presentacion}) -> ${p.imagen}`);
});
