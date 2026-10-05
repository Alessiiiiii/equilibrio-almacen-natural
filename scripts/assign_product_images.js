const fs = require('fs');
const path = require('path');

const products = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/products.json'), 'utf-8'));
const pages = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/pages_structure.json'), 'utf-8'));

function normalize(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Brand mapping for each page in Catalogo VISUAL.pdf
const PAGE_BRANDS = {
  2: ['La Francia'],
  3: ['Destaccados', 'La Francia'],
  4: ['Lasfor', 'Dulri', 'Cumaná'],
  5: ['Wakas', 'Smams', 'Blue Patna', 'Natuzen'],
  6: ['Sol Azteca', 'Natier'],
  7: ['Integra', 'Smookies'],
  8: ['Entrenuts', 'Maní King', 'Doña Magdalena'],
  9: ['Doña Magdalena', 'Smams'],
  10: ['Tratenfu', 'Biba', 'Kony', 'Dulri'],
  11: ['Veganis', 'Natier'],
  12: ['Wakas', 'Cumaná'],
  13: ['Cumaná'],
  14: ['Integra', 'Tratenfu'],
  15: ['Dietafrit', 'Godet'],
  16: ['Oasis', 'Entrenuts'],
  17: ['Hierbas y Esencias', 'Heredia'],
  18: ['Heredia', 'The Blenders'],
  19: ['Entrenuts', 'Oasis'],
  20: ['Kraus', 'Roapipo', 'Heredia'],
  21: ['Natier', 'Organikal'],
  22: ['Integra', 'Natier'],
  23: ['Adelga', 'Natier'],
  24: ['Mylen'],
  25: ['Mylen'],
  26: ['Mylen'],
  27: ['Sagrada Madre'],
  28: ['Sagrada Madre'],
  29: ['Refugio Lunar'],
  30: ['Refugio Lunar', 'Veganis']
};

// Direct verified high-confidence mappings
const VERIFIED_MAP = {
  // La Francia
  31: 'data/images/img_40.jpg', // Pepas Rústicas
  32: 'data/images/img_38.jpg', // Pan Rústico Multicereal
  
  // Lasfor & Dulri
  979: 'data/images/img_70.jpg', // Ositos
  1230: 'data/images/img_75.jpg', // Stevia polvo 90g
  1231: 'data/images/img_76.jpg', // Stevia líquida
  1234: 'data/images/img_74.jpg', // Stevia 100 sobres
  
  // Smams
  725: 'data/images/img_152.jpg', // Biscuits
  736: 'data/images/img_149.jpg', // Crackers
  739: 'data/images/img_150.jpg', // Chocosmams
  744: 'data/images/img_151.jpg', // Rellenas frutilla
  747: 'data/images/img_153.jpg', // Chips chocolate
  
  // Doña Magdalena
  1: 'data/images/img_143.jpg', // Miel Cremosa
  2: 'data/images/img_144.jpg', // Pasta de Maní
  5: 'data/images/img_146.jpg', // Dulce de leche con stevia
  6: 'data/images/img_147.jpg', // Ghee manteca clarificada
  7: 'data/images/img_154.jpg', // Mermelada frutilla
  250: 'data/images/img_145.jpg', // Dulce vegano de coco
  251: 'data/images/img_145.jpg', // Dulce vegano de coco
  258: 'data/images/img_143.jpg', // Miel Cremosa 500g
  
  // Sagrada Madre
  48: 'data/images/img_378.jpg', // Yagra
  58: 'data/images/img_373.jpg', // Palo Santo
  
  // Refugio Lunar
  135: 'data/images/img_401.jpg', // Gel de limpieza
  
  // Biba & Kony
  226: 'data/images/img_159.jpg', // Leche avena
  228: 'data/images/img_160.jpg', // Leche quinoa
  484: 'data/images/img_163.jpg', // Edulcorante líquido Kony
  
  // Integra & Natier
  479: 'data/images/img_117.jpg', // Granola clásica
  635: 'data/images/img_108.jpg'  // Cápsulas K2 + D3
};

// Automated page & layout alignment pass
const assignedImages = new Set(Object.values(VERIFIED_MAP));
const productImages = { ...VERIFIED_MAP };

pages.forEach(p => {
  const allowedBrands = PAGE_BRANDS[p.pageNum];
  if (!allowedBrands || allowedBrands.length === 0) return;

  // Filter products belonging to these brands
  const candidateProds = products.filter(prod => {
    return allowedBrands.some(b => normalize(prod.marca).includes(normalize(b)) || normalize(b).includes(normalize(prod.marca)));
  });

  p.images.forEach(img => {
    if (assignedImages.has(img.file)) return;
    if (img.w < 30 || img.h < 30) return; // skip icons
    if (img.w > 170 && img.h < 120 && img.x < 50) return; // likely brand banner/logo

    // Find nearest text
    const sorted = [...p.texts].sort((a, b) => Math.abs(a.y - (img.y + img.h/2)) - Math.abs(b.y - (img.y + img.h/2)));
    const nearby = sorted.slice(0, 3).map(t => t.text).join(' ');
    const normNearby = normalize(nearby);

    let bestProd = null;
    let bestScore = 0;

    for (const prod of candidateProds) {
      if (productImages[prod.id]) continue;
      const normName = normalize(prod.producto);
      const words = normName.split(' ').filter(w => w.length > 2);
      let matchCount = 0;
      for (const w of words) {
        if (normNearby.includes(w)) matchCount++;
      }
      const score = (matchCount / (words.length || 1)) * 100;
      if (score > bestScore && score >= 35) {
        bestScore = score;
        bestProd = prod;
      }
    }

    if (bestProd) {
      productImages[bestProd.id] = img.file;
      assignedImages.add(img.file);
    }
  });
});

console.log(`Mapped ${Object.keys(productImages).length} products with photos!`);

// Update products list
let totalWithImages = 0;
const updatedProducts = products.map(prod => {
  const img = productImages[prod.id] || null;
  if (img) totalWithImages++;
  return {
    ...prod,
    imagen: img
  };
});

fs.writeFileSync(path.join(__dirname, '../data/products.json'), JSON.stringify(updatedProducts, null, 2), 'utf-8');

// Also update js/data.js
const jsPath = path.join(__dirname, '../js/data.js');
let jsCode = fs.readFileSync(jsPath, 'utf-8');

// Replace RAW_PRODUCTS in js/data.js
const rawStart = jsCode.indexOf('const RAW_PRODUCTS = [');
const rawEnd = jsCode.indexOf('// Enriquecemos cada producto');

const newRaw = `const RAW_PRODUCTS = ${JSON.stringify(updatedProducts, null, 2)};\n\n`;
jsCode = jsCode.slice(0, rawStart) + newRaw + jsCode.slice(rawEnd);

fs.writeFileSync(jsPath, jsCode, 'utf-8');
console.log(`✅ Success! Updated products.json and js/data.js. Total products with images: ${totalWithImages}`);
