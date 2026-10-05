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

const report = [];

pageRefs.forEach((pref, idx) => {
  const pageNum = idx + 1;
  const pObjId = pref + ' obj';
  const pos = content.indexOf(pObjId);
  const dict = getDict(pos).text;

  const xobjMap = {};
  const xoMatch = dict.match(/\/XObject\s*<<([\s\S]*?)>>/);
  if (xoMatch) {
    xoMatch[1].match(/\/([A-Za-z0-9_]+)\s+(\d+)\s+0\s+R/g)?.forEach(pr => {
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
    const parts = m[3].match(/\(([^)]*)\)/g);
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
        file: 'data/images/img_' + objId + '.jpg'
      });
    }
  }

  report.push({ pageNum, texts, images });
});

fs.writeFileSync(path.join(__dirname, '../data/pages_structure.json'), JSON.stringify(report, null, 2), 'utf-8');
console.log('Saved data/pages_structure.json with ' + report.length + ' pages.');
