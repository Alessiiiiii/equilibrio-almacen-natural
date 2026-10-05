const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

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
      if (depth === 0) {
        return { start: dictStart, end: i + 1, text: content.slice(dictStart, i + 1) };
      }
    }
  }
  return null;
}

const pagesMatch = content.match(/\/Type\/Pages\/Count\s+(\d+)\/Kids\[([^\]]+)\]/);
const pageRefs = pagesMatch[2].trim().split(/\s+R\s*/).filter(Boolean).map(s => s.trim());

const products = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/products.json')));

function cleanText(raw) {
  return raw.replace(/[\*\.\-\:]+/g, ' ').replace(/\s+/g, ' ').trim();
}

[2, 4].forEach(pNum => {
  const pref = pageRefs[pNum - 1];
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
  const cId = cMatch[1] + ' 0 obj';
  const cPos = content.indexOf(cId);
  const sStart = content.indexOf('stream', cPos) + 6;
  let s = sStart;
  if (buf[s] === 13 && buf[s+1] === 10) s += 2;
  else if (buf[s] === 10 || buf[s] === 13) s += 1;
  const sEnd = content.indexOf('endstream', s);
  const decomp = zlib.inflateSync(buf.slice(s, sEnd)).toString('latin1');

  const texts = [];
  const tmRegex = /1\s+0\s+0\s+1\s+([\d\.\-]+)\s+([\d\.\-]+)\s+Tm[\s\S]*?\[(.*?)\]\s*TJ/g;
  let m;
  while ((m = tmRegex.exec(decomp)) !== null) {
    const rawInner = m[3];
    const parts = rawInner.match(/\(([^)]*)\)/g);
    if (parts) {
      const clean = parts.map(p => p.slice(1, -1)).join('').trim();
      if (clean && clean.length > 1) {
        texts.push({ x: parseFloat(m[1]), y: parseFloat(m[2]), text: cleanText(clean) });
      }
    }
  }

  const images = [];
  const doRegex = /([\d\.\-]+)\s+([\d\.\-]+)\s+([\d\.\-]+)\s+([\d\.\-]+)\s+([\d\.\-]+)\s+([\d\.\-]+)\s+cm\s*\/([A-Za-z0-9_]+)\s+Do/g;
  while ((m = doRegex.exec(decomp)) !== null) {
    const name = m[7];
    const objId = xobjMap[name];
    if (objId) {
      images.push({
        x: parseFloat(m[5]),
        y: parseFloat(m[6]),
        w: parseFloat(m[1]),
        h: parseFloat(m[4]),
        objId,
        file: 'img_' + objId + '.jpg'
      });
    }
  }

  console.log('\n================ PAGE ' + pNum + ' ================');
  console.log('Texts count:', texts.length);
  texts.forEach(t => console.log('  TXT [y=' + Math.round(t.y) + ', x=' + Math.round(t.x) + ']: ' + t.text));
  console.log('Images count:', images.length);
  images.forEach(img => {
    const sortedTexts = [...texts].sort((a, b) => Math.abs(a.y - (img.y + img.h/2)) - Math.abs(b.y - (img.y + img.h/2)));
    const nearest = sortedTexts[0] ? sortedTexts[0].text : 'none';
    const dist = sortedTexts[0] ? Math.round(Math.abs(sortedTexts[0].y - img.y)) : 0;
    console.log('  IMG [y=' + Math.round(img.y) + ', x=' + Math.round(img.x) + ', w=' + Math.round(img.w) + ', h=' + Math.round(img.h) + ']: ' + img.file + ' -> nearest: "' + nearest + '" (dist: ' + dist + ')');
  });
});
