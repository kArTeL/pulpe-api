import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORIAS = [
  { slug: 'abarrotes', nombre: 'Abarrotes' },
  { slug: 'bebidas', nombre: 'Bebidas' },
  { slug: 'lacteos', nombre: 'Lácteos' },
  { slug: 'limpieza', nombre: 'Limpieza' },
  { slug: 'snacks', nombre: 'Snacks' },
  { slug: 'higiene', nombre: 'Higiene personal' },
  { slug: 'panaderia', nombre: 'Panadería' },
  { slug: 'congelados', nombre: 'Congelados' },
];

// Plantillas por categoría. Los precios van en céntimos de colón.
const PLANTILLAS = {
  abarrotes: [
    { base: 'Arroz', marcas: ['Tío Pelón', 'Doña María', 'Roa'], presentaciones: ['900 g', '1.8 kg', '5 kg'], min: 90000, max: 480000 },
    { base: 'Frijoles negros', marcas: ['Tío Pelón', 'Doña María'], presentaciones: ['400 g', '900 g'], min: 85000, max: 210000 },
    { base: 'Aceite vegetal', marcas: ['Clover', 'Numar'], presentaciones: ['750 ml', '1.5 L'], min: 160000, max: 390000 },
    { base: 'Azúcar', marcas: ['Doña María', 'Central Azucarera'], presentaciones: ['1 kg', '2 kg'], min: 95000, max: 180000 },
    { base: 'Pasta espagueti', marcas: ['Roma', 'Barilla'], presentaciones: ['250 g', '500 g'], min: 60000, max: 190000 },
    { base: 'Atún en agua', marcas: ['Sardimar', 'Calvo'], presentaciones: ['110 g', '140 g'], min: 90000, max: 165000 },
    { base: 'Salsa de tomate', marcas: ['Lizano', 'Naturas'], presentaciones: ['215 g', '400 g'], min: 70000, max: 145000 },
  ],
  bebidas: [
    { base: 'Agua embotellada', marcas: ['Cristal', 'Alpina'], presentaciones: ['600 ml', '1.5 L', '5 L'], min: 45000, max: 220000 },
    { base: 'Gaseosa cola', marcas: ['Coca-Cola', 'Pepsi'], presentaciones: ['355 ml', '600 ml', '2 L'], min: 60000, max: 210000 },
    { base: 'Jugo de naranja', marcas: ['Del Valle', 'Tropical'], presentaciones: ['300 ml', '1 L'], min: 75000, max: 195000 },
    { base: 'Café molido', marcas: ['Britt', 'Rey', 'Volio'], presentaciones: ['250 g', '500 g'], min: 220000, max: 680000 },
    { base: 'Té frío', marcas: ['Lipton', 'Tropical'], presentaciones: ['500 ml', '1 L'], min: 65000, max: 155000 },
  ],
  lacteos: [
    { base: 'Leche entera', marcas: ['Dos Pinos', 'Coopeleche'], presentaciones: ['1 L', '200 ml'], min: 55000, max: 135000 },
    { base: 'Queso turrialba', marcas: ['Dos Pinos', 'Monteverde'], presentaciones: ['250 g', '500 g'], min: 180000, max: 420000 },
    { base: 'Yogurt natural', marcas: ['Dos Pinos', 'Yoplait'], presentaciones: ['150 g', '1 kg'], min: 60000, max: 290000 },
    { base: 'Natilla', marcas: ['Dos Pinos', 'Monteverde'], presentaciones: ['200 g', '450 g'], min: 95000, max: 210000 },
    { base: 'Mantequilla', marcas: ['Dos Pinos', 'Numar'], presentaciones: ['200 g', '500 g'], min: 170000, max: 380000 },
  ],
  limpieza: [
    { base: 'Detergente en polvo', marcas: ['Irex', 'Ariel'], presentaciones: ['500 g', '1 kg', '3 kg'], min: 130000, max: 620000 },
    { base: 'Jabón de lavar', marcas: ['Irex', 'Rinso'], presentaciones: ['200 g', '400 g'], min: 50000, max: 120000 },
    { base: 'Cloro', marcas: ['Magia Blanca', 'Kloro'], presentaciones: ['950 ml', '3.8 L'], min: 70000, max: 240000 },
    { base: 'Limpiavidrios', marcas: ['Windex', 'Protex'], presentaciones: ['500 ml', '1 L'], min: 110000, max: 230000 },
    { base: 'Papel higiénico', marcas: ['Scott', 'Nevax'], presentaciones: ['4 rollos', '12 rollos'], min: 140000, max: 480000 },
  ],
  snacks: [
    { base: 'Tortillas de maíz fritas', marcas: ['Tosty', 'Doritos'], presentaciones: ['45 g', '150 g'], min: 50000, max: 180000 },
    { base: 'Galletas de soda', marcas: ['Pozuelo', 'Gama'], presentaciones: ['180 g', '430 g'], min: 70000, max: 200000 },
    { base: 'Maní salado', marcas: ['Jack', 'Del Monte'], presentaciones: ['100 g', '250 g'], min: 65000, max: 175000 },
    { base: 'Chocolate en barra', marcas: ['Jet', 'Snickers'], presentaciones: ['40 g', '90 g'], min: 45000, max: 130000 },
    { base: 'Palomitas para microondas', marcas: ['Act II', 'Pop Secret'], presentaciones: ['85 g', '270 g'], min: 60000, max: 190000 },
  ],
  higiene: [
    { base: 'Jabón de baño', marcas: ['Protex', 'Palmolive'], presentaciones: ['110 g', '3 unidades'], min: 60000, max: 210000 },
    { base: 'Shampoo', marcas: ['Head & Shoulders', 'Sedal'], presentaciones: ['400 ml', '700 ml'], min: 210000, max: 520000 },
    { base: 'Pasta dental', marcas: ['Colgate', 'Oral-B'], presentaciones: ['75 ml', '150 ml'], min: 90000, max: 240000 },
    { base: 'Desodorante', marcas: ['Rexona', 'Speed Stick'], presentaciones: ['50 g', '90 g'], min: 130000, max: 310000 },
  ],
  panaderia: [
    { base: 'Pan cuadrado', marcas: ['Bimbo', 'Musmanni'], presentaciones: ['480 g', '680 g'], min: 110000, max: 260000 },
    { base: 'Tortillas de harina', marcas: ['Tortiricas', 'Bimbo'], presentaciones: ['10 unidades', '18 unidades'], min: 90000, max: 195000 },
    { base: 'Queque seco', marcas: ['Musmanni', 'Pozuelo'], presentaciones: ['300 g', '600 g'], min: 130000, max: 290000 },
  ],
  congelados: [
    { base: 'Nuggets de pollo', marcas: ['Pipasa', 'Kimby'], presentaciones: ['400 g', '900 g'], min: 220000, max: 540000 },
    { base: 'Papas prefritas', marcas: ['McCain', 'Pipasa'], presentaciones: ['500 g', '1 kg'], min: 180000, max: 380000 },
    { base: 'Helado de vainilla', marcas: ['Dos Pinos', 'Pops'], presentaciones: ['500 ml', '1.5 L'], min: 190000, max: 470000 },
    { base: 'Vegetales mixtos', marcas: ['Kimby', 'Natura'], presentaciones: ['400 g', '1 kg'], min: 150000, max: 330000 },
  ],
};

// Generador pseudoaleatorio con semilla fija: el seed es reproducible entre corridas.
function crearRandom(semilla) {
  let estado = semilla;
  return () => {
    estado = (estado * 1664525 + 1013904223) % 4294967296;
    return estado / 4294967296;
  };
}

const random = crearRandom(20260920);

function entreRango(min, max) {
  return Math.round((min + random() * (max - min)) / 5000) * 5000;
}

async function main() {
  console.log('Limpiando datos previos…');
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  console.log('Creando categorías…');
  const categorias = new Map();
  for (const cat of CATEGORIAS) {
    const creada = await prisma.category.create({ data: cat });
    categorias.set(cat.slug, creada.id);
  }

  console.log('Creando productos…');
  const productos = [];
  let contador = 1;
  const hoy = Date.now();

  for (const [slug, plantillas] of Object.entries(PLANTILLAS)) {
    const categoryId = categorias.get(slug);

    for (const plantilla of plantillas) {
      for (const marca of plantilla.marcas) {
        for (const presentacion of plantilla.presentaciones) {
          const existencias = random() < 0.18 ? 0 : Math.floor(random() * 120) + 1;
          const diasAtras = Math.floor(random() * 540);

          productos.push({
            sku: `PLP-${String(contador).padStart(4, '0')}`,
            nombre: `${plantilla.base} ${marca} ${presentacion}`,
            descripcion: `${plantilla.base} marca ${marca}, presentación de ${presentacion}. Producto de rotación en pulperías y minisúper.`,
            precio: entreRango(plantilla.min, plantilla.max),
            existencias,
            activo: random() > 0.04,
            categoryId,
            createdAt: new Date(hoy - diasAtras * 24 * 60 * 60 * 1000),
          });
          contador++;
        }
      }
    }
  }

  for (const producto of productos) {
    await prisma.product.create({ data: producto });
  }

  const total = await prisma.product.count();
  const sinExistencias = await prisma.product.count({ where: { existencias: 0 } });

  console.log('\nListo.');
  console.log(`  Categorías: ${CATEGORIAS.length}`);
  console.log(`  Productos:  ${total} (${sinExistencias} sin existencias)`);
}

main()
  .catch((error) => {
    console.error('Falló el seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
