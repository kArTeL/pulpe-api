import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORIES = [
  { slug: 'abarrotes', name: 'Abarrotes' },
  { slug: 'bebidas', name: 'Bebidas' },
  { slug: 'lacteos', name: 'Lácteos' },
  { slug: 'limpieza', name: 'Limpieza' },
  { slug: 'snacks', name: 'Snacks' },
  { slug: 'higiene', name: 'Higiene personal' },
  { slug: 'panaderia', name: 'Panadería' },
  { slug: 'congelados', name: 'Congelados' },
];

// Templates per category. Prices are in colón cents.
// Product names, brands and descriptions are kept in Spanish on purpose:
// this is real catalog data (as it would appear in an actual store), not UI copy.
const TEMPLATES = {
  abarrotes: [
    { base: 'Arroz', brands: ['Tío Pelón', 'Doña María', 'Roa'], sizes: ['900 g', '1.8 kg', '5 kg'], min: 90000, max: 480000 },
    { base: 'Frijoles negros', brands: ['Tío Pelón', 'Doña María'], sizes: ['400 g', '900 g'], min: 85000, max: 210000 },
    { base: 'Aceite vegetal', brands: ['Clover', 'Numar'], sizes: ['750 ml', '1.5 L'], min: 160000, max: 390000 },
    { base: 'Azúcar', brands: ['Doña María', 'Central Azucarera'], sizes: ['1 kg', '2 kg'], min: 95000, max: 180000 },
    { base: 'Pasta espagueti', brands: ['Roma', 'Barilla'], sizes: ['250 g', '500 g'], min: 60000, max: 190000 },
    { base: 'Atún en agua', brands: ['Sardimar', 'Calvo'], sizes: ['110 g', '140 g'], min: 90000, max: 165000 },
    { base: 'Salsa de tomate', brands: ['Lizano', 'Naturas'], sizes: ['215 g', '400 g'], min: 70000, max: 145000 },
  ],
  bebidas: [
    { base: 'Agua embotellada', brands: ['Cristal', 'Alpina'], sizes: ['600 ml', '1.5 L', '5 L'], min: 45000, max: 220000 },
    { base: 'Gaseosa cola', brands: ['Coca-Cola', 'Pepsi'], sizes: ['355 ml', '600 ml', '2 L'], min: 60000, max: 210000 },
    { base: 'Jugo de naranja', brands: ['Del Valle', 'Tropical'], sizes: ['300 ml', '1 L'], min: 75000, max: 195000 },
    { base: 'Café molido', brands: ['Britt', 'Rey', 'Volio'], sizes: ['250 g', '500 g'], min: 220000, max: 680000 },
    { base: 'Té frío', brands: ['Lipton', 'Tropical'], sizes: ['500 ml', '1 L'], min: 65000, max: 155000 },
  ],
  lacteos: [
    { base: 'Leche entera', brands: ['Dos Pinos', 'Coopeleche'], sizes: ['1 L', '200 ml'], min: 55000, max: 135000 },
    { base: 'Queso turrialba', brands: ['Dos Pinos', 'Monteverde'], sizes: ['250 g', '500 g'], min: 180000, max: 420000 },
    { base: 'Yogurt natural', brands: ['Dos Pinos', 'Yoplait'], sizes: ['150 g', '1 kg'], min: 60000, max: 290000 },
    { base: 'Natilla', brands: ['Dos Pinos', 'Monteverde'], sizes: ['200 g', '450 g'], min: 95000, max: 210000 },
    { base: 'Mantequilla', brands: ['Dos Pinos', 'Numar'], sizes: ['200 g', '500 g'], min: 170000, max: 380000 },
  ],
  limpieza: [
    { base: 'Detergente en polvo', brands: ['Irex', 'Ariel'], sizes: ['500 g', '1 kg', '3 kg'], min: 130000, max: 620000 },
    { base: 'Jabón de lavar', brands: ['Irex', 'Rinso'], sizes: ['200 g', '400 g'], min: 50000, max: 120000 },
    { base: 'Cloro', brands: ['Magia Blanca', 'Kloro'], sizes: ['950 ml', '3.8 L'], min: 70000, max: 240000 },
    { base: 'Limpiavidrios', brands: ['Windex', 'Protex'], sizes: ['500 ml', '1 L'], min: 110000, max: 230000 },
    { base: 'Papel higiénico', brands: ['Scott', 'Nevax'], sizes: ['4 rollos', '12 rollos'], min: 140000, max: 480000 },
  ],
  snacks: [
    { base: 'Tortillas de maíz fritas', brands: ['Tosty', 'Doritos'], sizes: ['45 g', '150 g'], min: 50000, max: 180000 },
    { base: 'Galletas de soda', brands: ['Pozuelo', 'Gama'], sizes: ['180 g', '430 g'], min: 70000, max: 200000 },
    { base: 'Maní salado', brands: ['Jack', 'Del Monte'], sizes: ['100 g', '250 g'], min: 65000, max: 175000 },
    { base: 'Chocolate en barra', brands: ['Jet', 'Snickers'], sizes: ['40 g', '90 g'], min: 45000, max: 130000 },
    { base: 'Palomitas para microondas', brands: ['Act II', 'Pop Secret'], sizes: ['85 g', '270 g'], min: 60000, max: 190000 },
  ],
  higiene: [
    { base: 'Jabón de baño', brands: ['Protex', 'Palmolive'], sizes: ['110 g', '3 unidades'], min: 60000, max: 210000 },
    { base: 'Shampoo', brands: ['Head & Shoulders', 'Sedal'], sizes: ['400 ml', '700 ml'], min: 210000, max: 520000 },
    { base: 'Pasta dental', brands: ['Colgate', 'Oral-B'], sizes: ['75 ml', '150 ml'], min: 90000, max: 240000 },
    { base: 'Desodorante', brands: ['Rexona', 'Speed Stick'], sizes: ['50 g', '90 g'], min: 130000, max: 310000 },
  ],
  panaderia: [
    { base: 'Pan cuadrado', brands: ['Bimbo', 'Musmanni'], sizes: ['480 g', '680 g'], min: 110000, max: 260000 },
    { base: 'Tortillas de harina', brands: ['Tortiricas', 'Bimbo'], sizes: ['10 unidades', '18 unidades'], min: 90000, max: 195000 },
    { base: 'Queque seco', brands: ['Musmanni', 'Pozuelo'], sizes: ['300 g', '600 g'], min: 130000, max: 290000 },
  ],
  congelados: [
    { base: 'Nuggets de pollo', brands: ['Pipasa', 'Kimby'], sizes: ['400 g', '900 g'], min: 220000, max: 540000 },
    { base: 'Papas prefritas', brands: ['McCain', 'Pipasa'], sizes: ['500 g', '1 kg'], min: 180000, max: 380000 },
    { base: 'Helado de vainilla', brands: ['Dos Pinos', 'Pops'], sizes: ['500 ml', '1.5 L'], min: 190000, max: 470000 },
    { base: 'Vegetales mixtos', brands: ['Kimby', 'Natura'], sizes: ['400 g', '1 kg'], min: 150000, max: 330000 },
  ],
};

// Pseudo-random generator with a fixed seed: the seed data is reproducible across runs.
function createRandom(seed) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

const random = createRandom(20260920);

function betweenRange(min, max) {
  return Math.round((min + random() * (max - min)) / 5000) * 5000;
}

async function main() {
  console.log('Clearing previous data…');
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  console.log('Creating categories…');
  const categories = new Map();
  for (const cat of CATEGORIES) {
    const created = await prisma.category.create({ data: cat });
    categories.set(cat.slug, created.id);
  }

  console.log('Creating products…');
  const products = [];
  let counter = 1;
  const today = Date.now();

  for (const [slug, templates] of Object.entries(TEMPLATES)) {
    const categoryId = categories.get(slug);

    for (const template of templates) {
      for (const brand of template.brands) {
        for (const size of template.sizes) {
          const stock = random() < 0.18 ? 0 : Math.floor(random() * 120) + 1;
          const daysAgo = Math.floor(random() * 540);

          products.push({
            sku: `PLP-${String(counter).padStart(4, '0')}`,
            name: `${template.base} ${brand} ${size}`,
            description: `${template.base} marca ${brand}, presentación de ${size}. Producto de rotación en pulperías y minisúper.`,
            price: betweenRange(template.min, template.max),
            stock,
            active: random() > 0.04,
            categoryId,
            createdAt: new Date(today - daysAgo * 24 * 60 * 60 * 1000),
          });
          counter++;
        }
      }
    }
  }

  for (const product of products) {
    await prisma.product.create({ data: product });
  }

  const total = await prisma.product.count();
  const outOfStock = await prisma.product.count({ where: { stock: 0 } });

  console.log('\nDone.');
  console.log(`  Categories: ${CATEGORIES.length}`);
  console.log(`  Products:   ${total} (${outOfStock} out of stock)`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
