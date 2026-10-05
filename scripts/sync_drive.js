/**
 * Sincronizador Automático de Catálogo desde Google Drive
 * Equilibrio Distribuciones - Almacén Natural
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const FILES = [
  { name: 'Aromas y Fragancias - Equilibrio.pdf', id: '1PYgN5t_JnkfqNoU1-cpk6tQvjSeLmGi8' },
  { name: 'Condimentos - Equilibrio.pdf', id: '1sMYtdoKcKmJzPw5b5_zbRgLwMVLEU3oo' },
  { name: 'Cosmetica - Equilibrio.pdf', id: '1jo5TUMsqOXbKmAG8Uuoc54K9behDYt6a' },
  { name: 'Destaccados - Equilibrio.pdf', id: '1th6Ke2n8BfFW0hX0Dju8Ih5hAeq4E9Gq' },
  { name: 'Hierbas - Equilibrio.pdf', id: '1lXdapBj9GWt6UK343zk7z8MLXoIOAUaI' },
  { name: 'La Francia - Equilibrio.pdf', id: '1woQvr3oGMSNMrUwYkiRbeV3CZUygnzEM' },
  { name: 'Murke - Equilibrio.pdf', id: '1YJrJDE1JdQZZCv5KS-YtiunRQBCTZAYX' },
  { name: 'Mylen - Equilibrio.pdf', id: '1BXitJgFheWxZYexFwtGdPmJM1GK62mYv' },
  { name: 'Principal 1 - Equilibrio.pdf', id: '1xe0eGY_cuuFQX3R22nPpv8Bf1mKpaRh2' },
  { name: 'Principal 2 - Equilibrio.pdf', id: '1MWtLXcMKOKvqNFgQnVyzaB_7n4T3QJGn' },
  { name: 'Reposteria - Equilibrio.pdf', id: '1xUWIaF3jjMEYGC2rgnhbz9QCtHl5SUp0' }
];

const tempDir = path.join(__dirname, '../data/temp_drive');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

function downloadFile(id, destPath) {
  return new Promise((resolve, reject) => {
    function get(url) {
      https.get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return get(res.headers.location);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        const file = fs.createWriteStream(destPath);
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      }).on('error', reject);
    }
    get(`https://drive.google.com/uc?export=download&id=${id}`);
  });
}

function parsePdfText(filePath) {
  const buf = fs.readFileSync(filePath);
  let pos = 0;
  let text = '';
  while ((pos = buf.indexOf('stream', pos)) !== -1) {
    const start = pos + 6 + (buf[pos+6] === 13 && buf[pos+7] === 10 ? 2 : buf[pos+6] === 10 ? 1 : 0);
    const end = buf.indexOf('endstream', start);
    if (end === -1) break;
    const stream = buf.slice(start, end);
    pos = end + 9;
    try {
      const decomp = zlib.inflateSync(stream);
      const str = decomp.toString('latin1');
      if (str.includes('BT')) {
        const matches = str.match(/(?:\[([^\]]+)\]\s*TJ|\(([^)]+)\)\s*Tj)/g);
        if (matches) {
          matches.forEach(m => {
            const inner = m.replace(/TJ|Tj/g, '').trim();
            const parts = inner.match(/\(([^)]*)\)/g);
            if (parts) {
              const line = parts.map(p => p.slice(1, -1)).join('');
              text += line + '\n';
            }
          });
        }
      }
    } catch(e) {}
  }
  return text;
}

function extractPresentation(str) {
  const match = str.match(/(?:x\s*|de\s*)?(\d+(?:[\.,]\d+)?\s*(?:kg|kgrs|grs|gr|g|gs|ml|cc|cm|cm3|lts|lt|l|saquitos|saq|unid|unidades|un|comp|caps|sobres|blisters|blister))\b/i);
  if (match) {
    let pres = match[1].trim();
    pres = pres.replace(/kgrs|grs|gs/i, 'g')
               .replace(/lts|lt/i, 'L')
               .replace(/cm3|cc/i, 'ml')
               .replace(/caps/i, 'cápsulas')
               .replace(/comp/i, 'comprimidos')
               .replace(/unid/i, 'unidades');
    return pres;
  }
  if (/\b(?:por kilo|a granel|x kg)\b/i.test(str)) return '1 kg';
  if (/\bx\s*un\b/i.test(str)) return '1 un';
  return '1 un';
}

function cleanTitle(raw) {
  let title = raw.replace(/\\/g, '').trim();
  title = title.replace(/\*\*\*[^\*]+\*\*\*/gi, '')
               .replace(/\([^\)]*consultar[^\)]*\)/gi, '')
               .replace(/\([^\)]*min[^\)]*\)/gi, '')
               .replace(/[\-\–]\s*$/g, '')
               .trim();
  return title;
}

function refineProduct(rawItem, fileName, currentSection) {
  let { rawName, price } = rawItem;
  let cleanName = cleanTitle(rawName);
  let brand = 'Equilibrio';
  let category = 'Almacén';
  let presentation = extractPresentation(cleanName);

  if (fileName.includes('Condimentos')) {
    category = 'Condimentos';
    brand = 'Cumaná';
    if (cleanName.includes('CASTELLO PONTE')) brand = 'Castello Ponte';
    if (cleanName.includes('EL CID')) brand = 'El Cid';
    presentation = extractPresentation(cleanName);
    if (cleanName.toLowerCase().includes('x kg')) presentation = 'Por Kilo (1 kg)';
  } else if (fileName.includes('Aromas')) {
    category = 'Aromas y Fragancias';
    if (currentSection.includes('SAGRADA MADRE')) brand = 'Sagrada Madre';
    else if (currentSection.includes('AROMANZA')) brand = 'Aromanza';
    else if (currentSection.includes('ILUMINARTE')) brand = 'Iluminarte';
    else if (cleanName.toLowerCase().includes('bombitas')) brand = 'Aromanza';
    else brand = 'Sagrada Madre';
  } else if (fileName.includes('Cosmetica')) {
    category = 'Cosmética Natural';
    if (currentSection.includes('REFUGIO LUNAR')) brand = 'Refugio Lunar';
    else if (currentSection.includes('VEGANIS')) brand = 'Veganis';
    else if (currentSection.includes('BOTANIKA')) brand = 'Botanika';
    else if (currentSection.includes('NATIER')) brand = 'Natier';
    else if (cleanName.includes('VEGANIS')) brand = 'Veganis';
    else if (cleanName.includes('BOTANIKA')) brand = 'Botanika';
  } else if (fileName.includes('Destaccados')) {
    category = 'Panificados (Sin TACC)';
    brand = 'Destaccados';
  } else if (fileName.includes('Hierbas -')) {
    category = 'Hierbas Medicinales';
    brand = 'Sueltas / A Granel';
    presentation = cleanName.includes('500') ? '500 g' : 'Por Kilo (1 kg)';
  } else if (fileName.includes('La Francia')) {
    category = 'Panificados y Galletitas';
    brand = 'La Francia';
  } else if (fileName.includes('Murke')) {
    category = 'Panificados y Galletitas';
    brand = 'Murke';
    if (cleanName.toLowerCase().includes('tagliatelle') || cleanName.toLowerCase().includes('pastas')) {
      category = 'Almacén';
    }
  } else if (fileName.includes('Mylen')) {
    category = 'Panificados y Galletitas';
    brand = 'Mylen';
  } else if (fileName.includes('Reposteria')) {
    category = 'Repostería';
    if (cleanName.includes('Arcor') || cleanName.includes('Rocklet')) brand = 'Arcor';
    else if (cleanName.includes('Arco de oro') || cleanName.includes('Arco de Oro')) brand = 'Arco de Oro';
    else if (cleanName.includes('Serranito')) brand = 'El Serranito';
    else if (cleanName.includes('Mapsa')) brand = 'Mapsa';
    else if (cleanName.includes('Lourdes')) brand = 'Lourdes';
    else if (cleanName.includes('Florencia')) brand = 'Florencia';
    else if (cleanName.includes('CGA')) brand = 'CGA';
    else if (cleanName.includes('Nani')) brand = 'Nani';
    else if (cleanName.includes('EL CASTILLO')) brand = 'El Castillo';
    else if (cleanName.includes('Cumana')) brand = 'Cumaná';
    else brand = 'Insumos Varios';
  } else {
    const s = currentSection.toUpperCase();
    const p = cleanName.toUpperCase();

    const knownBrands = [
      'ALWA', 'BIBA', 'BLUE PATNA', 'DOÑA MAGDALENA', 'DOÑA PACHA', 'FRENZZI', 'HEREDIA',
      'HIERBAS Y ESENCIAS', 'INTEGRA', 'KONY', 'LE-FIT', 'LE FIT', 'LEGUME', 'MACROSALUD',
      'MANI KING', 'MEDINATURAL', 'MENOYO', 'MULINI', 'NATIER', 'NOBLE APICULTOR', 'ORGANIKAL',
      'PIPER POL', 'SINERGIA', 'SMAMS', 'SMOOKIES', 'SMUDIS', 'SOL AZTECA', 'SPIRULINE',
      'TIMON CRUZ', 'TRATENFU', 'TREVER', 'TUTTI', 'WAKAS', 'ZELFA', 'COSMICO', 'ANDIAMO',
      'YING YANG', 'LAFOR', 'SINGLUKO', 'OASIS', 'VALLE VERDE', 'CUMANA', 'CASALTA', 'FUMEIGA',
      'SAKANASHI', 'NAPUS', 'ENTRENUTS', 'CASA IRWO', 'GARCIA HNOS', 'DULRI', 'YERUTI',
      'NUTRASEM', 'CUARTO CRECIENTE', 'LENS', 'MASABIA', 'COPANI', 'NATUZEN', 'SANAMUNDI',
      'DICOMERE', 'DELICIAN', 'SALVIA MORADA', 'GREEN CROPS'
    ];

    for (const b of knownBrands) {
      if (s.includes(b) || p.endsWith(b) || p.includes(`- ${b}`) || p.includes(`X ${b}`)) {
        brand = b.split(' ')[0] + (b.split(' ')[1] ? ' ' + b.split(' ')[1] : '');
        brand = brand.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
        break;
      }
    }

    if (s.includes('INFUSIONES') || s.includes('TÉS') || s.includes('HEREDIA') || s.includes('PIPER POL') || p.startsWith('TE ') || p.startsWith('TÉ ')) {
      category = 'Infusiones';
    } else if (s.includes('COSMÉTICA') || s.includes('FRENZZI') || s.includes('BOTANIKA') || s.includes('ACEITES (USO COSMÉTICO)') || s.includes('HIERBAS Y ESENCIAS')) {
      category = p.includes('ACEITE') && !p.includes('VEGETAL') ? 'Aromas y Fragancias' : 'Cosmética Natural';
    } else if (s.includes('AROMAS') || s.includes('SAHUMERIO')) {
      category = 'Aromas y Fragancias';
    } else if (s.includes('HIERBAS') || s.includes('TINTURAS MADRE')) {
      category = 'Hierbas Medicinales';
    } else if (s.includes('PANIFICADOS') || s.includes('GALLETITAS') || s.includes('PEPAS') || s.includes('SMAMS') || s.includes('ZELFA') || s.includes('SMOOKIES') || s.includes('TOSTADAS')) {
      category = (s.includes('SIN TACC') || p.includes('SIN TACC') || p.includes('S/TACC')) ? 'Panificados (Sin TACC)' : 'Panificados y Galletitas';
    } else if (s.includes('REPOSTERIA') || s.includes('CACAO') || s.includes('CHOCOLATE')) {
      category = 'Repostería';
    } else if (s.includes('CONDIMENTOS') || s.includes('ESPECIAS')) {
      category = 'Condimentos';
    } else {
      if (s.includes('SIN TACC') || p.includes('SIN TACC') || p.includes('S/TACC') || p.includes('GLUTEN FREE')) {
        category = 'Almacén (Sin TACC)';
      } else {
        category = 'Almacén';
      }
    }
  }

  let finalProdName = cleanName;
  const brandRegex = new RegExp(`[\\-\\–\\/\\s]+${brand}\\b.*$`, 'i');
  finalProdName = finalProdName.replace(brandRegex, '').trim();
  finalProdName = finalProdName.replace(/^[\-\•\*\s]+/, '').replace(/[\-\s]+$/, '').trim();

  if (brand.toLowerCase().includes('cumaná') || brand.toLowerCase().includes('cumana')) brand = 'Cumaná';
  if (brand.toLowerCase().includes('doña magdalena')) brand = 'Doña Magdalena';
  if (brand.toLowerCase().includes('doña pacha')) brand = 'Doña Pacha';
  if (brand.toLowerCase().includes('sagrada madre')) brand = 'Sagrada Madre';
  if (brand.toLowerCase().includes('refugio lunar')) brand = 'Refugio Lunar';
  if (brand.toLowerCase().includes('hierbas y esencias')) brand = 'Hierbas y Esencias';
  if (brand.toLowerCase().includes('sueltas') || brand.toLowerCase().includes('granel')) brand = 'Sueltas / A Granel';

  return {
    categoria: category,
    marca: brand,
    producto: finalProdName,
    presentacion: presentation,
    precio: price
  };
}

async function syncCatalog() {
  console.log('🌿 Sincronizando catálogo con Google Drive...');
  
  const extractedItems = [];
  const seenKeys = new Set();

  for (const item of FILES) {
    const dest = path.join(tempDir, item.name);
    process.stdout.write(`  📥 Descargando ${item.name}... `);
    try {
      await downloadFile(item.id, dest);
      const text = parsePdfText(dest);
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      let currentSection = '';

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('341') || line.includes('Fecha') || line.includes('equilibrio') || line.includes('MAYORISTAS') || line.includes('SUJETA A') || line === 'PRODUCTOS' || line === 'PRODUCTO' || line === 'PRECIO' || line === 'PRECIOS') {
          continue;
        }

        const nextLine = lines[i + 1] || '';
        const priceMatch = nextLine.match(/^\$\s*([0-9\.,]+)$/);

        if (priceMatch) {
          const priceNum = parseFloat(priceMatch[1].replace(/\./g, '').replace(',', '.'));
          if (priceNum > 0 && line.length > 2 && !line.startsWith('$') && !line.toLowerCase().includes('precio')) {
            const prod = refineProduct({ rawName: line, price: priceNum }, item.name, currentSection);
            const k = (prod.producto + '__' + prod.marca).toLowerCase().replace(/[^a-z0-9]/g, '');
            if (!seenKeys.has(k)) {
              seenKeys.add(k);
              extractedItems.push(prod);
            }
          }
          i++;
        } else if (!line.startsWith('$') && !line.startsWith('(') && line.length < 55 && !line.includes('$') && (i + 1 < lines.length && !lines[i + 1].startsWith('$'))) {
          currentSection = line;
        }
      }
      console.log(`[OK] (${extractedItems.length} acumulados)`);
    } catch (e) {
      console.log(`[ERROR: ${e.message}]`);
    }
  }

  // Cargar catálogo actual para merge sin pérdidas
  const catalogPath = path.join(__dirname, '../data/products.json');
  const currentCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));

  const newExtractedMap = new Map();
  extractedItems.forEach(p => {
    const k = (p.producto + '__' + p.marca).toLowerCase().replace(/[^a-z0-9]/g, '');
    newExtractedMap.set(k, p);
  });

  let updatedPrices = 0;
  const merged = currentCatalog.map(p => {
    const k = (p.producto + '__' + p.marca).toLowerCase().replace(/[^a-z0-9]/g, '');
    const match = newExtractedMap.get(k);
    if (match) {
      if (match.precio !== p.precio) updatedPrices++;
      return {
        ...p,
        precio: match.precio,
        presentacion: match.presentacion || p.presentacion,
        categoria: match.categoria || p.categoria
      };
    }
    return p;
  });

  const existingKeys = new Set(currentCatalog.map(p => (p.producto + '__' + p.marca).toLowerCase().replace(/[^a-z0-9]/g, '')));
  let addedCount = 0;
  let maxId = Math.max(...merged.map(p => p.id));

  extractedItems.forEach(p => {
    const k = (p.producto + '__' + p.marca).toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!existingKeys.has(k)) {
      addedCount++;
      existingKeys.add(k);
      merged.push({
        id: ++maxId,
        categoria: p.categoria,
        marca: p.marca,
        producto: p.producto,
        presentacion: p.presentacion,
        precio: p.precio
      });
    }
  });

  // Guardar data/products.json
  fs.writeFileSync(catalogPath, JSON.stringify(merged, null, 2), 'utf-8');

  // Guardar js/data.js
  const jsPath = path.join(__dirname, '../js/data.js');
  const jsContent = `/**
 * Catálogo Oficial Completo de Productos y Configuración de Categorías
 * Equilibrio Distribuciones - Almacén Natural
 * Total de productos: ${merged.length}
 */

const RAW_PRODUCTS = ${JSON.stringify(merged, null, 2)};

// Enriquecemos cada producto con metadatos de búsqueda, sin TACC y categorías
function enrichProducts(rawList) {
  return rawList.map(p => {
    const isSinTacc = 
      p.categoria.toLowerCase().includes('sin tacc') || 
      p.producto.toLowerCase().includes('sin tacc') ||
      p.producto.toLowerCase().includes('s/tacc') ||
      p.producto.toLowerCase().includes('gluten free') ||
      p.marca.toLowerCase() === 'destaccados' ||
      p.marca.toLowerCase() === 'doña pacha' ||
      p.marca.toLowerCase() === 'smams' ||
      p.marca.toLowerCase() === 'wakas' ||
      p.marca.toLowerCase() === 'blue patna' ||
      p.marca.toLowerCase() === 'natuzen';

    let mainCategory = p.categoria;
    if (p.categoria === 'Almacén (Sin TACC)') mainCategory = 'Almacén';
    if (p.categoria === 'Panificados (Sin TACC)') mainCategory = 'Panificados y Galletitas';

    let icon = 'package';
    if (mainCategory === 'Almacén') icon = 'archive';
    if (mainCategory === 'Aromas y Fragancias') icon = 'sparkles';
    if (mainCategory === 'Condimentos') icon = 'flame';
    if (mainCategory === 'Cosmética Natural') icon = 'heart-pulse';
    if (mainCategory === 'Hierbas Medicinales') icon = 'leaf';
    if (mainCategory === 'Infusiones') icon = 'coffee';
    if (mainCategory === 'Panificados y Galletitas') icon = 'cookie';
    if (mainCategory === 'Repostería') icon = 'cake-slice';

    return {
      ...p,
      isSinTacc,
      mainCategory,
      icon,
      searchString: (p.producto + ' ' + p.marca + ' ' + p.presentacion + ' ' + p.categoria + ' ' + (isSinTacc ? 'sin tacc celiaco libre de gluten' : '')).toLowerCase()
    };
  });
}

const PRODUCTS = enrichProducts(RAW_PRODUCTS);
if (typeof window !== 'undefined') {
  window.RAW_PRODUCTS = RAW_PRODUCTS;
  window.PRODUCTS = PRODUCTS;
  window.enrichProducts = enrichProducts;
}

const CATEGORIES = [
  { id: 'all', label: 'Todas', icon: 'layout-grid' },
  { id: 'Almacén', label: 'Almacén', icon: 'archive' },
  { id: 'Sin TACC', label: 'Sin TACC', icon: 'wheat-off', highlight: true },
  { id: 'Condimentos', label: 'Condimentos', icon: 'flame' },
  { id: 'Aromas y Fragancias', label: 'Aromas', icon: 'sparkles' },
  { id: 'Cosmética Natural', label: 'Cosmética', icon: 'heart-pulse' },
  { id: 'Hierbas Medicinales', label: 'Hierbas', icon: 'leaf' },
  { id: 'Infusiones', label: 'Infusiones', icon: 'coffee' },
  { id: 'Panificados y Galletitas', label: 'Panificados y Galletitas', icon: 'cookie' },
  { id: 'Repostería', label: 'Repostería', icon: 'cake-slice' }
];

const ARS_FORMATTER = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

function formatPrice(amount) {
  return ARS_FORMATTER.format(amount);
}
`;
  fs.writeFileSync(jsPath, jsContent, 'utf-8');

  console.log(`\n🎉 Sincronización completada con éxito:`);
  console.log(`   - Total productos en catálogo: ${merged.length}`);
  console.log(`   - Precios actualizados: ${updatedPrices}`);
  console.log(`   - Nuevos productos agregados: ${addedCount}`);

  return {
    success: true,
    total: merged.length,
    updatedPrices,
    addedCount,
    products: merged
  };
}

module.exports = { syncCatalog };

if (require.main === module) {
  syncCatalog().catch(console.error);
}
