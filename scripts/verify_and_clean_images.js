const fs = require('fs');
const path = require('path');

const catalogPath = path.join(__dirname, '../data/products.json');
const prods = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));

// First reset all products to imagen = null to eliminate any fuzzy/bad match
prods.forEach(p => {
  p.imagen = null;
});

// We only attach 100% visually verified images where package label matches exactly
const VERIFIED_EXACT = [
  // Smams (Sin TACC)
  { id: 736, img: 'data/images/img_149.jpg', label: 'Smams Crackers Clasicas 150g' },
  { id: 739, img: 'data/images/img_150.jpg', label: 'Smams Chocosmams 200g' },
  { id: 744, img: 'data/images/img_151.jpg', label: 'Smams Rellenas Frutilla 105g' },
  { id: 747, img: 'data/images/img_153.jpg', label: 'Smams Galletitas con Chips de Chocolate 150g' },
  { id: 723, img: 'data/images/img_152.jpg', label: 'Smams Biscuits Artesanales 120g' },

  // Mani King
  { id: 520, img: 'data/images/img_130.jpg', label: 'Mani King Manteca de Mani Sabor Chocolate 350g' },
  { id: 521, img: 'data/images/img_128.jpg', label: 'Mani King Manteca de Mani Original 350g' },
  { id: 522, img: 'data/images/img_129.jpg', label: 'Mani King Pasta de Mani Natural 485g' },

  // Dulri Stevia
  { id: 1230, img: 'data/images/img_75.jpg', label: 'Dulri Stevia en polvo 90g' },
  { id: 1234, img: 'data/images/img_74.jpg', label: 'Dulri Stevia 100 sobres' },
  { id: 1231, img: 'data/images/img_76.jpg', label: 'Dulri Stevia liquida 120cc' },

  // Doña Magdalena
  { id: 5,   img: 'data/images/img_143.jpg', label: 'Doña Magdalena Dulce de Leche con Stevia 400g' },
  { id: 243, img: 'data/images/img_143.jpg', label: 'Doña Magdalena DULCE DE LECHE CON STEVIA X 400 G' },
  { id: 251, img: 'data/images/img_145.jpg', label: 'Doña Magdalena Dulce Vegano de Coco 360g' },
  { id: 3,   img: 'data/images/img_144.jpg', label: 'Doña Magdalena Pasta de Mani Crunchy 400g' },
  { id: 260, img: 'data/images/img_144.jpg', label: 'Doña Magdalena Pasta de Mani Crunchy 400g' },
  { id: 6,   img: 'data/images/img_154.jpg', label: 'Doña Magdalena Manteca Clarificada Ghee 270g' },
  { id: 253, img: 'data/images/img_154.jpg', label: 'Doña Magdalena Manteca Clarificada Ghee 270g' },
  { id: 255, img: 'data/images/img_146.jpg', label: 'Doña Magdalena Mermelada Durazno con Stevia 360g' },
  { id: 254, img: 'data/images/img_147.jpg', label: 'Doña Magdalena Mermelada Arandanos con Stevia 360g' },
  { id: 262, img: 'data/images/img_155.jpg', label: 'Doña Magdalena Tabletas de Dulce de Leche con Stevia 25g' },

  // La Francia
  { id: 31,  img: 'data/images/img_41.jpg', label: 'La Francia Pepas Rusticas Membrillo y Chia 1 kg' },
  { id: 876, img: 'data/images/img_41.jpg', label: 'La Francia Membrillo y Chia 1KG' },
  { id: 32,  img: 'data/images/img_38.jpg', label: 'La Francia Pan Rustico Multicereal Masa Madre 560g' },
  { id: 885, img: 'data/images/img_42.jpg', label: 'La Francia Pan Rustico Doble Salvado 560g' },

  // Mylen
  { id: 34,  img: 'data/images/img_48.jpg', label: 'Mylen Cookies Integrales Vainilla con Chips 240g' },

  // Destaccados (Sin TACC)
  { id: 35,  img: 'data/images/img_45.jpg', label: 'Destaccados Pan de Molde Clasico Sin TACC 500g' },
  { id: 874, img: 'data/images/img_45.jpg', label: 'Destaccados Pan s/tacc natural 500g' },
  { id: 875, img: 'data/images/img_45.jpg', label: 'Destaccados Pan s/tacc c/semillas 500g' },

  // Biba (Leches Vegetales Sin TACC)
  { id: 224, img: 'data/images/img_160.jpg', label: 'Biba Leche de Almendra Sin Azucar 1L' },
  { id: 226, img: 'data/images/img_161.jpg', label: 'Biba Leche de Avena 1L' },
  { id: 228, img: 'data/images/img_162.jpg', label: 'Biba Leche de Quinoa 1L' },

  // Kony Stevia
  { id: 1645, img: 'data/images/img_166.jpg', label: 'Kony Edulcorante Liquido 500ml' },
  { id: 1647, img: 'data/images/img_167.jpg', label: 'Kony Edulcorante 50 Sobres' },
  { id: 1646, img: 'data/images/img_168.jpg', label: 'Kony Edulcorante 100 Sobres' },
  { id: 485,  img: 'data/images/img_165.jpg', label: 'Kony Edulcorante Liquido 200ml' },

  // Dietafrit (Rocio Vegetal)
  { id: 1127, img: 'data/images/img_215.jpg', label: 'Dietafrit Rocio Vegetal Oliva 180g' },
  { id: 1128, img: 'data/images/img_214.jpg', label: 'Dietafrit Rocio Vegetal Manteca 180g' },
  { id: 1129, img: 'data/images/img_213.jpg', label: 'Dietafrit Rocio Vegetal Tradicional/Girasol 180g' },

  // Wakas (Pastas Sin TACC)
  { id: 853, img: 'data/images/img_181.jpg', label: 'Wakas Pasta Fusilli Multicereal con Chia 250g' },
  { id: 856, img: 'data/images/img_182.jpg', label: 'Wakas Pasta Multicereal Quinoa Fusilli 300g' },
  { id: 857, img: 'data/images/img_184.jpg', label: 'Wakas Pasta Risoni Clasico 300g' },
  { id: 858, img: 'data/images/img_184.jpg', label: 'Wakas Pasta Risoni Espinaca 300g' },
  { id: 859, img: 'data/images/img_184.jpg', label: 'Wakas Pasta Risoni Zanahoria 300g' },

  // Macrozen (Sales Marinas)
  { id: 1180, img: 'data/images/img_186.jpg', label: 'Macrozen Sal Marina Fina 500g' },
  { id: 1181, img: 'data/images/img_187.jpg', label: 'Macrozen Sal Marina Gruesa 500g' },

  // Heredia (Infusiones & Tes)
  { id: 378, img: 'data/images/img_250.jpg', label: 'Heredia Te Verde Monohierba 25 saquitos' },
  { id: 364, img: 'data/images/img_251.jpg', label: 'Heredia Te Surtido Bienestar 20 saquitos' },
  { id: 376, img: 'data/images/img_252.jpg', label: 'Heredia Te Rosa Mosqueta 25 saquitos' },
  { id: 358, img: 'data/images/img_253.jpg', label: 'Heredia Te Herby Digestivo 25 saquitos' },
  { id: 325, img: 'data/images/img_256.jpg', label: 'Heredia Te Curcuma y Jengibre 25 saquitos' },
  { id: 362, img: 'data/images/img_255.jpg', label: 'Heredia Te Meditacion 20 saquitos' },
  { id: 324, img: 'data/images/img_254.jpg', label: 'Heredia Sustentable Flower Fresh 10 saquitos' },

  // Sagrada Madre (Sahumerios & Aromas)
  { id: 11, img: 'data/images/img_377.jpg', label: 'Sagrada Madre Incienso Blanco 9 Varillas' },
  { id: 41, img: 'data/images/img_377.jpg', label: 'Sagrada Madre Incienso Blanco' },
  { id: 42, img: 'data/images/img_374.jpg', label: 'Sagrada Madre Rosas y Olibano 9 Varillas' },
  { id: 44, img: 'data/images/img_376.jpg', label: 'Sagrada Madre Lavanda y Olibano 9 Varillas' },
  { id: 45, img: 'data/images/img_375.jpg', label: 'Sagrada Madre Eucalipto, Laurel y Cedro 9 Varillas' },
  { id: 50, img: 'data/images/img_380.jpg', label: 'Sagrada Madre Palo Santo con Mirra' },
  { id: 51, img: 'data/images/img_379.jpg', label: 'Sagrada Madre Palo Santo con Fresias' },
  { id: 63, img: 'data/images/img_381.jpg', label: 'Sagrada Madre Palo Santo con Incienso' },
  { id: 62, img: 'data/images/img_382.jpg', label: 'Sagrada Madre Violeta y Lavanda Yagra' },
  { id: 61, img: 'data/images/img_383.jpg', label: 'Sagrada Madre Rosa y Vainilla Yagra' },
  { id: 59, img: 'data/images/img_384.jpg', label: 'Sagrada Madre Manzanilla y Olibano Yagra' },
  { id: 60, img: 'data/images/img_385.jpg', label: 'Sagrada Madre Orquidea y Laurel Yagra' },

  // Veganis (Cosmetica Sustentable)
  { id: 172, img: 'data/images/img_404.jpg', label: 'Veganis Serum Facial Acido Hialuronico 30ml' },
  { id: 166, img: 'data/images/img_405.jpg', label: 'Veganis Protector Solar FPS 30 x 135ml' },
  { id: 23,  img: 'data/images/img_406.jpg', label: 'Veganis Leche Corporal Palta y Oliva 500g' },
  { id: 161, img: 'data/images/img_406.jpg', label: 'Veganis Leche Corporal Palta y Oliva 500g' },
  { id: 167, img: 'data/images/img_407.jpg', label: 'Veganis Protector Solar FPS 50 x 135ml' },
  { id: 152, img: 'data/images/img_408.jpg', label: 'Veganis Exfoliante Corporal Pera y Macadamia 500g' },

  // Refugio Lunar
  { id: 134, img: 'data/images/img_400.jpg', label: 'Refugio Lunar Combo Blends Magicos' },

  // Botanika
  { id: 209, img: 'data/images/img_414.jpg', label: 'Botanika Shampoo Solido Caida 90g' },
  { id: 187, img: 'data/images/img_415.jpg', label: 'Botanika Acondicionador Solido Normal a Seco 60g' },
  { id: 196, img: 'data/images/img_413.jpg', label: 'Botanika Desodorante Roll On Aloe Vera 60cc' },

  // Lasfor / Lafor (Cereales)
  { id: 980, img: 'data/images/img_70.jpg', label: 'Lasfor Osito de Frutilla 2kg' },
  { id: 979, img: 'data/images/img_71.jpg', label: 'Lasfor Osito de Avena y Miel 2kg' },
  { id: 973, img: 'data/images/img_72.jpg', label: 'Lasfor Anillitos Frutales 2.5kg' },

  // Ying Yang
  { id: 985, img: 'data/images/img_78.jpg', label: 'Ying Yang Quinoa Pop con Algarroba 3kg' },
  { id: 983, img: 'data/images/img_79.jpg', label: 'Ying Yang Quinoa Pop Natural 3kg' },
  { id: 974, img: 'data/images/img_80.jpg', label: 'Ying Yang / Lafor Bastoncitos de Salvado 2.5kg' },
  { id: 975, img: 'data/images/img_81.jpg', label: 'Ying Yang / Lafor Bolitas de Chocolate 2kg' },

  // Integra
  { id: 459, img: 'data/images/img_116.jpg', label: 'Integra Barras Proteicas Mani y Chocolate 10u' },
  { id: 460, img: 'data/images/img_116.jpg', label: 'Integra Barras Proteicas Pasta de Mani y Arandanos 10u' },
  { id: 454, img: 'data/images/img_124.jpg', label: 'Integra Barras Almendra y Nuez 10u' },
  { id: 456, img: 'data/images/img_124.jpg', label: 'Integra Barras Cacao y Chocolate 10u' },
  { id: 464, img: 'data/images/img_120.jpg', label: 'Integra Bocaditos Mani y Chocolate 20u' },
  { id: 452, img: 'data/images/img_118.jpg', label: 'Integra Barras Base Chocolate y Mani 10u' },
  { id: 480, img: 'data/images/img_123.jpg', label: 'Integra Granola Clasica Almendra Caju Arandanos 350g' },

  // Arco de Oro
  { id: 1569, img: 'data/images/img_337.jpg', label: 'Arco de Oro Dulce de Batata 5kg' },
  { id: 39,   img: 'data/images/img_338.jpg', label: 'Arco de Oro Dulce de Membrillo 5kg' },

  // Mapsa
  { id: 40,   img: 'data/images/img_331.jpg', label: 'Mapsa Cuber Chocolate con Leche 500g' },
  { id: 1570, img: 'data/images/img_332.jpg', label: 'Mapsa Cuber Semiamargo 500g' },
  { id: 1571, img: 'data/images/img_335.jpg', label: 'Mapsa Cuber Frutilla Rosa 500g' },

  // Hierbas del Oasis
  { id: 1394, img: 'data/images/img_240.jpg', label: 'Oasis Te Negro Organico 25 saquitos' },
  { id: 1380, img: 'data/images/img_241.jpg', label: 'Oasis Te Mezcla Nro 2 Adelgazante 25 saquitos' },
  { id: 1379, img: 'data/images/img_242.jpg', label: 'Oasis Te Mezcla Nro 1 Sedante 25 saquitos' },
  { id: 1346, img: 'data/images/img_243.jpg', label: 'Oasis Te de Arandano 20 saquitos' },
  { id: 1396, img: 'data/images/img_246.jpg', label: 'Oasis Te Verde Organico 25 saquitos' },

  // Prodenza Life (Suplementos & Capsulas)
  { id: 1304, img: 'data/images/img_286.jpg', label: 'Prodenza Noni + Graviola Capsulas' },
  { id: 1313, img: 'data/images/img_288.jpg', label: 'Prodenza Yacon Capsulas' },
  { id: 1308, img: 'data/images/img_291.jpg', label: 'Prodenza Moringa Capsulas' },
  { id: 1310, img: 'data/images/img_285.jpg', label: 'Prodenza Prostasan Capsulas' },
  { id: 1500, img: 'data/images/img_287.jpg', label: 'Prodenza Cartilago de Tiburon 100 Capsulas' },

  // Cuarto Creciente (Page 16)
  { id: 1285, img: 'data/images/img_228.jpg', label: 'Cuarto Creciente Jugo de Arándano con Stevia 1.5L' },
  { id: 1292, img: 'data/images/img_229.jpg', label: 'Cuarto Creciente Mermelada Frutilla con Stevia 280g' },
  { id: 1289, img: 'data/images/img_230.jpg', label: 'Cuarto Creciente Mermelada Higo con Stevia 280g' },
  { id: 1298, img: 'data/images/img_232.jpg', label: 'Cuarto Creciente Mermelada Arándano con Semillas 400g' },

  // Entrenuts (Page 16)
  { id: 1215, img: 'data/images/img_223.jpg', label: 'Entrenuts Aceite de Coco Virgen 200cc' },
  { id: 1214, img: 'data/images/img_224.jpg', label: 'Entrenuts Aceite de Coco Neutro 360cc' },

  // Aromanza & Iluminarte (Page 28)
  { id: 13,   img: 'data/images/img_392.jpg', label: 'Aromanza Esferas Mágicas Defumación' },
  { id: 67,   img: 'data/images/img_392.jpg', label: 'Aromanza Esferas Mágicas Fortuna' },
  { id: 68,   img: 'data/images/img_392.jpg', label: 'Aromanza Esferas Mágicas 7 Poderes' },
  { id: 80,   img: 'data/images/img_394.jpg', label: 'Iluminarte 12 Velas de Noche Blancas' },
  { id: 14,   img: 'data/images/img_395.jpg', label: 'Iluminarte Esencia Concentrada para Hornillos' },

  // CGA Industrial / Repostería / Golosinas (Pages 25 & 26)
  { id: 1560, img: 'data/images/img_348.jpg', label: 'Lentejas Frutales 1kg' },
  { id: 1576, img: 'data/images/img_349.jpg', label: 'Harina 0000 Molino Lourdes 25kg' },
  { id: 1567, img: 'data/images/img_350.jpg', label: 'Morochitas con Cacao Par Nor 4.5kg' },
  { id: 1563, img: 'data/images/img_353.jpg', label: 'Redondelas (marroc/bananitas/frutillas) 1kg' },
  { id: 1568, img: 'data/images/img_354.jpg', label: 'Dulce de Leche Repostero Serranito 10kg' },
  { id: 38,   img: 'data/images/img_354.jpg', label: 'Dulce de Leche Repostero Serranito 10kg' },
  { id: 37,   img: 'data/images/img_359.jpg', label: 'Rocklets Confites de Chocolate 1kg' },
  { id: 1559, img: 'data/images/img_359.jpg', label: 'Mini Rocklets 1kg' },
  { id: 1578, img: 'data/images/img_361.jpg', label: 'Polvo de Hornear CGA Industrial 1kg' },
  { id: 36,   img: 'data/images/img_365.jpg', label: 'Granas de Color Decor Magic 1kg' },
  { id: 1557, img: 'data/images/img_365.jpg', label: 'Granas de Color Decor Magic 1kg' },
  { id: 1558, img: 'data/images/img_369.jpg', label: 'Granas Doradas y Plateadas Decor Magic 1kg' },

  // Cumaná Especias (Page 13)
  { id: 99,   img: 'data/images/img_191.jpg', label: 'Cumaná Condimento para Pizza 1kg' },
  { id: 19,   img: 'data/images/img_192.jpg', label: 'Cumaná Provenzal Premium con Ajo Chino 1kg' },
  { id: 107,  img: 'data/images/img_192.jpg', label: 'Cumaná Provenzal Selección 1kg' },
  { id: 104,  img: 'data/images/img_193.jpg', label: 'Cumaná Curry en Polvo 1kg' },
  { id: 15,   img: 'data/images/img_194.jpg', label: 'Cumaná Ají Molido 1kg' },
  { id: 81,   img: 'data/images/img_194.jpg', label: 'Cumaná Ají Molido Selección 1kg' },
  { id: 1086, img: 'data/images/img_190.jpg', label: 'Cumaná Harina de Almendra Sin TACC 1kg' },

  // Delician (Page 3)
  { id: 1527, img: 'data/images/img_53.jpg', label: 'Delician Pan para Hamburguesas 90g' },
  { id: 1529, img: 'data/images/img_54.jpg', label: 'Delician Pan Chip x 4u 140g' },
  { id: 1528, img: 'data/images/img_55.jpg', label: 'Delician Pizzetas x 4u 160g' },
  { id: 1530, img: 'data/images/img_56.jpg', label: 'Delician Mini Coco 140g' },
  { id: 1622, img: 'data/images/img_56.jpg', label: 'Delician Mini Coco 150g' },
  { id: 1531, img: 'data/images/img_57.jpg', label: 'Delician Mini Bombón 150g' },
  { id: 1623, img: 'data/images/img_57.jpg', label: 'Delician Mini Bombón 150g' },
  { id: 1534, img: 'data/images/img_58.jpg', label: 'Delician Coquitos 90g' },
  { id: 1626, img: 'data/images/img_58.jpg', label: 'Delician Coquitos 90g' },
  { id: 1533, img: 'data/images/img_59.jpg', label: 'Delician Brownie 90g' },
  { id: 1625, img: 'data/images/img_59.jpg', label: 'Delician Brownie 90g' },
  { id: 1532, img: 'data/images/img_60.jpg', label: 'Delician Pastafrola 90g' },
  { id: 1624, img: 'data/images/img_60.jpg', label: 'Delician Pastafrola 90g' },
  { id: 1535, img: 'data/images/img_61.jpg', label: 'Delician Alfajor Maizena con Coco 60g' },
  { id: 1627, img: 'data/images/img_61.jpg', label: 'Delician Alfajor Maizena con Coco 60g' },
  { id: 1536, img: 'data/images/img_62.jpg', label: 'Delician Crackers Mix de Semillas 80g' },
  { id: 1628, img: 'data/images/img_62.jpg', label: 'Delician Crackers Mix de Semillas 80g' },

  // Nani (Page 5)
  { id: 1076, img: 'data/images/img_86.jpg', label: 'Nani Fideos Mostacholes Arroz Espinaca 350g' },
  { id: 1075, img: 'data/images/img_87.jpg', label: 'Nani Fideos Mostacholes Arroz al Huevo 350g' },
  { id: 1078, img: 'data/images/img_88.jpg', label: 'Nani Fideos Mostacholes Arroz Natural 350g' },
  { id: 1077, img: 'data/images/img_89.jpg', label: 'Nani Fideos Mostacholes Arroz Morrón 350g' },
  { id: 1081, img: 'data/images/img_91.jpg', label: 'Nani Rebozador Sin TACC 500g' },

  // Noble Apicultor (Page 6)
  { id: 643,  img: 'data/images/img_109.jpg', label: 'Noble Apicultor Propóleo Premium al 20% 125cc' },
  { id: 644,  img: 'data/images/img_110.jpg', label: 'Noble Apicultor Tónico de Propóleo con Miel y Eucalipto 125cc' },
  { id: 638,  img: 'data/images/img_111.jpg', label: 'Noble Apicultor Bebible Propóleo y Ginseng 125cc' },

  // Sol Azteca (Page 22)
  { id: 784,  img: 'data/images/img_298.jpg', label: 'Sol Azteca Pasta de Girasol 350g' },
  { id: 775,  img: 'data/images/img_299.jpg', label: 'Sol Azteca Aceite de Lino con Vitamina E 150cc' },
  { id: 786,  img: 'data/images/img_300.jpg', label: 'Sol Azteca Pasta de Sésamo Integral 350g' },
  { id: 774,  img: 'data/images/img_302.jpg', label: 'Sol Azteca Aceite de Chía con Vitamina E 150cc' },
  { id: 794,  img: 'data/images/img_303.jpg', label: 'Sol Azteca Semilla de Sésamo Entera 250g' },
  { id: 790,  img: 'data/images/img_304.jpg', label: 'Sol Azteca Semilla de Chía 250g' },

  // Hierbas del Oasis (Yerba y Tinturas - Page 17)
  { id: 1259, img: 'data/images/img_244.jpg', label: 'Hierbas del Oasis Tintura Madre de Carqueja 66cc' },
  { id: 1265, img: 'data/images/img_244.jpg', label: 'Hierbas del Oasis Tintura Madre de Fucus 66cc' },
  { id: 1267, img: 'data/images/img_244.jpg', label: 'Hierbas del Oasis Tintura Madre de Ginkgo Biloba 66cc' }
];

let assignedCount = 0;
VERIFIED_EXACT.forEach(v => {
  const p = prods.find(x => x.id === v.id);
  if (p) {
    p.imagen = v.img;
    assignedCount++;
    console.log(`[ASSIGNED] ID ${p.id}: ${p.marca} - ${p.producto} (${p.presentacion}) -> ${v.img}`);
  }
});

// Guardar data/products.json
fs.writeFileSync(catalogPath, JSON.stringify(prods, null, 2), 'utf-8');

// Guardar js/data.js manteniendo su estructura
const jsPath = path.join(__dirname, '../js/data.js');
let jsCode = fs.readFileSync(jsPath, 'utf-8');
const rawStart = jsCode.indexOf('const RAW_PRODUCTS = [');
const rawEnd = jsCode.indexOf('// Enriquecemos cada producto');

if (rawStart !== -1 && rawEnd !== -1) {
  const newRaw = `const RAW_PRODUCTS = ${JSON.stringify(prods, null, 2)};\n\n`;
  jsCode = jsCode.slice(0, rawStart) + newRaw + jsCode.slice(rawEnd);
  fs.writeFileSync(jsPath, jsCode, 'utf-8');
  console.log('Updated js/data.js successfully.');
} else {
  console.error('Markers not found in js/data.js!');
}

console.log(`\n========================================`);
console.log(`Verified assignment complete! Total assigned: ${assignedCount} products.`);
console.log(`========================================\n`);
