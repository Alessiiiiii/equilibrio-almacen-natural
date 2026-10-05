const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const pdfPath = path.join(__dirname, '../drive-download-20260916T192642Z-1-001/Catalogo VISUAL.pdf');
const buf = fs.readFileSync(pdfPath);
const content = buf.toString('latin1');

function getDict(startPos) {
  let depth = 0;
  let dictStart = -1;
  for (let i = startPos; i < content.length; i++) {
    if (content[i] === '<' && content[i+1] === '<') {
      if (depth === 0) dictStart = i;
      depth++;
      i++;
    } else if (content[i] === '>' && content[i+1] === '>') {
      depth--;
      i++;
      if (depth === 0) return { text: content.slice(dictStart, i + 1) };
    }
  }
  return null;
}

const pagesMatch = content.match(/\/Type\/Pages\/Count\s+(\d+)\/Kids\[([^\]]+)\]/);
const pageRefs = pagesMatch[2].trim().split(/\s+R\s*/).filter(Boolean).map(s => s.trim());

const products = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/products.json')));

function normalize(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const pageMappings = [];

pageRefs.forEach((pref, pIdx) => {
  const pageNum = pIdx + 1;
  const pObjId = pref + ' obj';
  const pos = content.indexOf(pObjId);
  const dict = getDict(pos).text;

  const xobjMap = {};
  const xoMatch = dict.match(/\/XObject\s*<<([\s\S]*?)>>/);
  if (xoMatch) {
    const pairs = xoMatch[1].match(/\/([A-Za-z0-9_]+)\s+(\d+)\s+0\s+R/g);
    if (pairs) pairs.forEach(pr => {
      const parts = pr.split(/\s+/);
      xobjMap[parts[0].replace('/', '')] = parts[1];
    });
  }

  const cMatch = dict.match(/\/Contents\s+(\d+)\s+0\s+R/);
  if (!cMatch) return;
  const cId = cMatch[1] + ' 0 obj';
  const cPos = content.indexOf(cId);
  const sStart = content.indexOf('stream', cPos) + 6;
  let s = sStart;
  if (buf[s] === 13 && buf[s+1] === 10) s += 2;
  else if (buf[s] === 10 || buf[s] === 13) s += 1;
  const sEnd = content.indexOf('endstream', s);
  let decomp = '';
  try { decomp = zlib.inflateSync(buf.slice(s, sEnd)).toString('latin1'); } catch(e) { return; }

  const texts = [];
  const tmRegex = /1\s+0\s+0\s+1\s+([\d\.\-]+)\s+([\d\.\-]+)\s+Tm[\s\S]*?\[(.*?)\]\s*TJ/g;
  let m;
  while ((m = tmRegex.exec(decomp)) !== null) {
    const rawInner = m[3];
    const parts = rawInner.match(/\(([^)]*)\)/g);
    if (parts) {
      const clean = parts.map(p => p.slice(1, -1)).join('').trim();
      if (clean && clean.length > 1) {
        texts.push({ x: parseFloat(m[1]), y: parseFloat(m[2]), text: clean });
      }
    }
  }

  const images = [];
  const doRegex = /([\d\.\-]+)\s+([\d\.\-]+)\s+([\d\.\-]+)\s+([\d\.\-]+)\s+([\d\.\-]+)\s+([\d\.\-]+)\s+cm\s*\/([A-Za-z0-9_]+)\s+Do/g;
  while ((m = doRegex.exec(decomp)) !== null) {
    const name = m[7];
    const objId = xobjMap[name];
    if (objId && fs.existsSync(path.join(__dirname, '../data/extracted_images/img_' + objId + '.jpg'))) {
      images.push({
        x: parseFloat(m[5]),
        y: parseFloat(m[6]),
        w: parseFloat(m[1]),
        h: parseFloat(m[4]),
        objId,
        file: 'data/extracted_images/img_' + objId + '.jpg'
      });
    }
  }

  pageMappings.push({
    pageNum,
    texts,
    images
  });
});

console.log('Indexed pages:', pageMappings.length);

// Let's see matches for each page
let totalMatches = 0;
const productImagesMap = {}; // productId -> imagePath

pageMappings.forEach(pm => {
  if (pm.pageNum === 1) return; // Cover
  const pageTextsStr = pm.texts.map(t => t.text).join(' ');
  const normPageText = normalize(pageTextsStr);

  pm.images.forEach(img => {
    // Ignore tiny images (< 30px) or banner logos (usually very wide or at top-left)
    if (img.w < 20 || img.h < 20) return;
    
    // Find nearest text line in Y
    const sortedTexts = [...pm.texts].sort((a, b) => Math.abs(a.y - (img.y + img.h/2)) - Math.abs(b.y - (img.y + img.h/2)));
    const nearbyTexts = sortedTexts.slice(0, 3).map(t => t.text).join(' ');
    const normNearby = normalize(nearbyTexts);

    // Search candidate products
    let bestProduct = null;
    let bestScore = 0;

    for (const prod of products) {
      if (productImagesMap[prod.id]) continue; // already has image
      const normProd = normalize(prod.producto);
      const normBrand = normalize(prod.marca);

      let score = 0;
      // Check if brand matches page text
      if (normPageText.includes(normBrand) || normBrand.includes(normPageText)) score += 20;

      // Check title keywords in nearby text
      const prodWords = normProd.split(' ').filter(w => w.length > 2);
      let matchedWords = 0;
      for (const w of prodWords) {
        if (normNearby.includes(w)) matchedWords++;
      }

      if (matchedWords > 0) {
        score += (matchedWords / prodWords.length) * 50;
        if (normNearby.includes(normProd)) score += 50;
      }

      if (score > bestScore && score >= 40) {
        bestScore = score;
        bestProduct = prod;
      }
    }

    if (bestProduct) {
      productImagesMap[bestProduct.id] = img.file;
      totalMatches++;
    }
  });
});

console.log('Automated high-confidence image-to-product matches:', totalMatches);
console.log('Sample matched products:');
Object.entries(productImagesMap).slice(0, 15).forEach(([pId, imgPath]) => {
  const p = products.find(x => x.id === parseInt(pId));
  console.log(`  [ID ${p.id}] ${p.marca} - ${p.producto} (${p.presentacion}) -> ${imgPath}`);
});
