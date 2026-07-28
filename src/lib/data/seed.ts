import type {
  Banner,
  Brand,
  Category,
  Database,
  Offer,
  Order,
  Product,
  ProductTag,
  SizeStock,
} from "@/lib/types";
import {
  DEFAULT_SYNC_SETTINGS,
  PRODUCT_SYNC_DEFAULTS,
} from "@/lib/sync/defaults";

const DAY = 86_400_000;
/** Fecha base fija: el catálogo semilla tiene que ser reproducible. */
const BASE = Date.parse("2026-07-20T12:00:00.000Z");

const SIZE_RUN = ["38", "39", "40", "41", "42", "43", "44", "45"];

function buildSizes(stock: number[]): SizeStock[] {
  return SIZE_RUN.map((size, i) => ({
    size,
    stock: stock[i] ?? 0,
    available: true,
  }));
}

/* -------------------------------------------------------------------------- */
/* Marcas                                                                     */
/* -------------------------------------------------------------------------- */

const BRAND_SEED: Array<[slug: string, name: string, description: string]> = [
  ["nike", "Nike", "El archivo más profundo del sportswear. Air, Dunk y todo lo que vino después."],
  ["adidas", "Adidas", "Terraza, cancha y pista. Las tres tiras que nunca salieron de moda."],
  ["new-balance", "New Balance", "Ingeniería sobre hype. Hechas para caminar diez horas y seguir."],
  ["puma", "Puma", "Velocidad y archivo alemán. Suede, Speedcat y el revival completo."],
  ["jordan", "Jordan", "La línea que convirtió una zapatilla de básquet en objeto de culto."],
  ["reebok", "Reebok", "Cuero limpio y court classics. Menos ruido, más forma."],
  ["asics", "Asics", "Gel, mesh y siluetas de running que el lifestyle adoptó."],
  ["converse", "Converse", "Lona, goma y cien años de la misma idea perfecta."],
  ["vans", "Vans", "Skate desde el día uno. Suela waffle, cero pretensión."],
];

const brands: Brand[] = BRAND_SEED.map(([slug, name, description], i) => ({
  id: `brand_${slug}`,
  slug,
  name,
  wordmark: name.toUpperCase(),
  logo: null,
  banner: `/brands/${slug}.svg`,
  description,
  order: i,
}));

/* -------------------------------------------------------------------------- */
/* Categorías (colecciones transversales a las marcas)                        */
/* -------------------------------------------------------------------------- */

const CATEGORY_SEED: Array<[slug: string, name: string, description: string]> = [
  ["lifestyle", "Lifestyle", "Las que se usan todos los días y aguantan todo."],
  ["running", "Running", "Amortiguación real, para correr o para no correr nunca."],
  ["basketball", "Basketball", "Siluetas de cancha con historia."],
  ["skate", "Skate", "Suela vulcanizada, refuerzos y cero cuidado."],
  ["retro", "Retro", "Reediciones fieles de los archivos de los 80 y 90."],
  ["edicion-limitada", "Edición limitada", "Pares contados. Cuando se van, se van."],
];

const categories: Category[] = CATEGORY_SEED.map(([slug, name, description]) => ({
  id: `cat_${slug}`,
  slug,
  name,
  cover: null,
  description,
}));

/* -------------------------------------------------------------------------- */
/* Productos                                                                  */
/* -------------------------------------------------------------------------- */

interface Spec {
  name: string;
  brand: string;
  slug: string;
  price: number;
  discount?: number;
  color: string;
  colorHex: string;
  cats: string[];
  tags?: ProductTag[];
  materials: string[];
  stock: number[];
  sold: number;
  views: number;
  featured?: boolean;
  description: string;
  features: string[];
}

const SPECS: Spec[] = [
  {
    name: "Air Max 95",
    brand: "nike",
    slug: "nike-air-max-95",
    price: 289000,
    color: "Gris neón",
    colorHex: "#b9bec4",
    cats: ["lifestyle", "retro"],
    tags: ["mas-vendido"],
    materials: ["Malla técnica", "Gamuza", "Cuero sintético"],
    stock: [2, 4, 6, 5, 7, 3, 1, 0],
    sold: 148,
    views: 4210,
    featured: true,
    description:
      "El diseño que rompió con todo en 1995: capas graduadas inspiradas en la anatomía humana y la primera unidad Air visible en el antepié. Sigue siendo la más reconocible del archivo.",
    features: [
      "Unidad Air visible en talón y antepié",
      "Capas graduadas en malla y gamuza",
      "Suela de goma con tracción multidireccional",
      "Cuello acolchado de perfil alto",
    ],
  },
  {
    name: "Air Force 1 '07",
    brand: "nike",
    slug: "nike-air-force-1-07",
    price: 239000,
    color: "Triple blanco",
    colorHex: "#f2f2ef",
    cats: ["lifestyle", "basketball"],
    tags: ["mas-vendido"],
    materials: ["Cuero vacuno", "Goma"],
    stock: [3, 5, 8, 9, 6, 4, 2, 1],
    sold: 231,
    views: 6180,
    featured: true,
    description:
      "Cuarenta y tres años después sigue siendo la respuesta correcta. Cuero limpio, suela gruesa y una silueta que no necesita explicación.",
    features: [
      "Cuero vacuno de grano completo",
      "Unidad Air encapsulada",
      "Suela de goma con patrón pivote",
      "Perforaciones de ventilación en el antepié",
    ],
  },
  {
    name: "Dunk Low Retro",
    brand: "nike",
    slug: "nike-dunk-low-retro",
    price: 265000,
    discount: 15,
    color: "Blanco y negro",
    colorHex: "#ededea",
    cats: ["lifestyle", "basketball", "retro"],
    tags: ["oferta"],
    materials: ["Cuero", "Goma"],
    stock: [1, 3, 5, 4, 6, 2, 0, 0],
    sold: 189,
    views: 5340,
    description:
      "Nació para las canchas universitarias en el 85 y terminó siendo la zapatilla de skate más copiada de la historia. El bloque de color de dos tonos es todo lo que necesita.",
    features: [
      "Corte de cuero con paneles superpuestos",
      "Lengüeta acolchada",
      "Suela de goma con patrón pivote",
      "Espuma en la entresuela",
    ],
  },
  {
    name: "Air Max Plus",
    brand: "nike",
    slug: "nike-air-max-plus",
    price: 319000,
    color: "Carbón y crema",
    colorHex: "#302f2b",
    cats: ["running", "lifestyle"],
    tags: ["nuevo"],
    materials: ["Malla", "TPU", "Goma"],
    stock: [0, 2, 3, 4, 3, 2, 1, 0],
    sold: 74,
    views: 2890,
    featured: true,
    description:
      "Las nervaduras de TPU se dibujaron mirando palmeras contra el atardecer de Florida. La unidad Air Tuned debajo es la razón por la que todavía se siente distinta.",
    features: [
      "Air Tuned con cámaras hemisféricas",
      "Nervaduras de TPU moldeadas",
      "Corte de malla con degradado",
      "Refuerzo en el talón",
    ],
  },
  {
    name: "Campus 00s",
    brand: "adidas",
    slug: "adidas-campus-00s",
    price: 219000,
    color: "Gris grafito",
    colorHex: "#9aa0a8",
    cats: ["lifestyle", "retro"],
    tags: ["mas-vendido"],
    materials: ["Gamuza", "Goma"],
    stock: [4, 6, 7, 8, 5, 3, 2, 0],
    sold: 267,
    views: 7020,
    featured: true,
    description:
      "La versión gorda del Campus, tal como se usaba a principios de los 2000. Gamuza espesa, lengüeta enorme y una suela que levanta un centímetro de más.",
    features: [
      "Empeine de gamuza premium",
      "Lengüeta y cuello sobredimensionados",
      "Suela de goma vulcanizada",
      "Tres tiras de gamuza cosidas",
    ],
  },
  {
    name: "Samba OG",
    brand: "adidas",
    slug: "adidas-samba-og",
    price: 209000,
    color: "Negro y crema",
    colorHex: "#1d1d21",
    cats: ["lifestyle", "retro"],
    tags: ["mas-vendido"],
    materials: ["Cuero", "Gamuza", "Goma"],
    stock: [2, 5, 9, 7, 6, 4, 1, 1],
    sold: 302,
    views: 8410,
    featured: true,
    description:
      "Diseñada en 1950 para entrenar sobre suelo congelado. Setenta y cinco años después es la zapatilla más usada del mundo y no cambió casi nada.",
    features: [
      "Cuero de grano completo",
      "Puntera de gamuza",
      "Suela de goma tipo espiga",
      "Horma baja de perfil ajustado",
    ],
  },
  {
    name: "Gazelle Bold",
    brand: "adidas",
    slug: "adidas-gazelle-bold",
    price: 224000,
    discount: 20,
    color: "Arena",
    colorHex: "#b5ac8e",
    cats: ["lifestyle", "retro"],
    tags: ["oferta"],
    materials: ["Gamuza", "Goma"],
    stock: [3, 4, 5, 3, 2, 0, 0, 0],
    sold: 118,
    views: 3640,
    description:
      "La Gazelle de siempre sobre una plataforma de cuatro centímetros. Misma gamuza, misma línea, veinte años más de altura.",
    features: [
      "Plataforma elevada de goma",
      "Empeine de gamuza",
      "Tres tiras contrastadas",
      "Plantilla acolchada",
    ],
  },
  {
    name: "Ultraboost Light",
    brand: "adidas",
    slug: "adidas-ultraboost-light",
    price: 349000,
    color: "Negro core",
    colorHex: "#18181c",
    cats: ["running"],
    tags: ["nuevo"],
    materials: ["Primeknit", "Boost", "Continental"],
    stock: [1, 3, 4, 5, 4, 3, 2, 1],
    sold: 96,
    views: 3120,
    description:
      "La espuma Boost más liviana que hicieron hasta ahora: 30% menos peso que la generación anterior, con el mismo retorno de energía.",
    features: [
      "Entresuela Light BOOST",
      "Corte Primeknit sin costuras",
      "Suela Continental™ Rubber",
      "Contrafuerte Linear Energy Push",
    ],
  },
  {
    name: "550",
    brand: "new-balance",
    slug: "new-balance-550",
    price: 254000,
    color: "Blanco y gris",
    colorHex: "#efefec",
    cats: ["lifestyle", "basketball", "retro"],
    tags: ["mas-vendido"],
    materials: ["Cuero", "Goma"],
    stock: [2, 4, 6, 6, 5, 3, 1, 0],
    sold: 214,
    views: 5980,
    featured: true,
    description:
      "Estuvo veinte años olvidada en el archivo hasta que alguien la desenterró en 2020. Es una zapatilla de básquet de 1989 y se nota en cada línea.",
    features: [
      "Cuero perforado en el antepié",
      "Paneles superpuestos con logo N",
      "Suela de goma con patrón de espiga",
      "Contrafuerte reforzado",
    ],
  },
  {
    name: "9060",
    brand: "new-balance",
    slug: "new-balance-9060",
    price: 329000,
    color: "Sea salt",
    colorHex: "#d8d4cc",
    cats: ["lifestyle", "running"],
    tags: ["nuevo", "mas-vendido"],
    materials: ["Malla", "Gamuza", "ABZORB"],
    stock: [1, 2, 4, 5, 4, 2, 1, 0],
    sold: 163,
    views: 6740,
    featured: true,
    description:
      "Toma el ADN del 99 y lo distorsiona: entresuela ondulada, paneles inflados y una suela que parece dibujada en otra década. La más rara del catálogo, y la que más se vende.",
    features: [
      "Amortiguación ABZORB y SBS",
      "Entresuela ondulada de perfil grueso",
      "Corte de malla y gamuza en capas",
      "Cordones planos anchos",
    ],
  },
  {
    name: "2002R",
    brand: "new-balance",
    slug: "new-balance-2002r",
    price: 312000,
    discount: 10,
    color: "Rain cloud",
    colorHex: "#a9aeb4",
    cats: ["running", "lifestyle"],
    tags: ["oferta"],
    materials: ["Malla", "Gamuza", "N-ergy"],
    stock: [0, 2, 3, 4, 3, 1, 0, 0],
    sold: 132,
    views: 4380,
    description:
      "Tecnología de 2010 con estética de archivo. La combinación de N-ergy y ABZORB debajo es de las más cómodas que se consiguen.",
    features: [
      "Amortiguación N-ergy en el talón",
      "Placa estabilizadora de TPU",
      "Corte de gamuza y malla técnica",
      "Suela de goma con canales flexibles",
    ],
  },
  {
    name: "530",
    brand: "new-balance",
    slug: "new-balance-530",
    price: 229000,
    color: "Plata metalizado",
    colorHex: "#e4e4e1",
    cats: ["running", "retro"],
    materials: ["Malla", "Cuero sintético", "ABZORB"],
    stock: [3, 5, 7, 6, 5, 4, 2, 1],
    sold: 178,
    views: 4920,
    description:
      "Una zapatilla de running de los 90 que se convirtió en uniforme urbano. Ligera, ancha en la puntera y con esa entresuela que parece de otra era.",
    features: [
      "Entresuela ABZORB",
      "Corte de malla con superposiciones",
      "Suela de goma duradera",
      "Horma cómoda de ajuste holgado",
    ],
  },
  {
    name: "Palermo",
    brand: "puma",
    slug: "puma-palermo",
    price: 189000,
    color: "Gris sedado",
    colorHex: "#8c8f91",
    cats: ["lifestyle", "retro"],
    tags: ["nuevo"],
    materials: ["Gamuza", "Goma"],
    stock: [4, 6, 5, 7, 4, 2, 1, 0],
    sold: 141,
    views: 3860,
    description:
      "Rescatada del archivo de fútbol sala de los 80. Gamuza gruesa, suela de goma cruda y una forma que le pelea de igual a igual a la Samba.",
    features: [
      "Empeine de gamuza premium",
      "Suela de goma cruda",
      "Formstrip de gamuza",
      "Plantilla SoftFoam+",
    ],
  },
  {
    name: "Suede XL",
    brand: "puma",
    slug: "puma-suede-xl",
    price: 179000,
    discount: 25,
    color: "Negro carbón",
    colorHex: "#26251f",
    cats: ["lifestyle", "retro"],
    tags: ["oferta", "ultimos-pares"],
    materials: ["Gamuza", "Goma"],
    stock: [0, 1, 2, 2, 1, 0, 0, 0],
    sold: 97,
    views: 2740,
    description:
      "La Suede de 1968 con todo exagerado: lengüeta más gruesa, suela más alta, formstrip más ancho. Un clásico pasado por una lupa.",
    features: [
      "Gamuza de peso pesado",
      "Suela de goma sobredimensionada",
      "Lengüeta y cuello acolchados XL",
      "Formstrip ampliado",
    ],
  },
  {
    name: "Speedcat OG",
    brand: "puma",
    slug: "puma-speedcat-og",
    price: 199000,
    color: "Grafito",
    colorHex: "#25252b",
    cats: ["lifestyle", "retro"],
    tags: ["nuevo", "mas-vendido"],
    materials: ["Gamuza", "Goma"],
    stock: [2, 4, 5, 4, 3, 1, 0, 0],
    sold: 156,
    views: 5410,
    featured: true,
    description:
      "Diseñada para pilotos de rally: suela ultrafina, perfil bajísimo y una puntera afilada. Volvió en 2024 y se agotó en todos lados.",
    features: [
      "Suela plana de goma delgada",
      "Perfil bajo tipo racing",
      "Empeine de gamuza",
      "Talón con pull tab",
    ],
  },
  {
    name: "RS-X Efekt",
    brand: "puma",
    slug: "puma-rs-x-efekt",
    price: 234000,
    color: "Gris y arena",
    colorHex: "#b6b3a6",
    cats: ["running", "lifestyle"],
    materials: ["Malla", "Cuero sintético", "Goma"],
    stock: [1, 3, 4, 3, 2, 2, 1, 0],
    sold: 68,
    views: 2210,
    description:
      "Chunky sin disculpas. Capas sobre capas, volumen en el talón y un sistema de amortiguación RS que viene del archivo de los 80.",
    features: [
      "Tecnología RS en la entresuela",
      "Construcción en capas de malla y sintético",
      "Suela de goma con relieve",
      "Plantilla SoftFoam+",
    ],
  },
  {
    name: "Air Jordan 1 Low",
    brand: "jordan",
    slug: "jordan-air-jordan-1-low",
    price: 279000,
    color: "Shadow grey",
    colorHex: "#c3c6ca",
    cats: ["basketball", "lifestyle"],
    tags: ["mas-vendido"],
    materials: ["Cuero", "Goma"],
    stock: [3, 5, 6, 7, 5, 3, 1, 0],
    sold: 203,
    views: 6320,
    featured: true,
    description:
      "La versión baja del par que empezó todo. Mismo corte de cuero, misma suela, con la libertad de tobillo que la High no te da.",
    features: [
      "Cuero de grano completo",
      "Unidad Air encapsulada en el talón",
      "Suela de goma con patrón pivote",
      "Alas bordadas en la lengüeta",
    ],
  },
  {
    name: "Air Jordan 1 High OG",
    brand: "jordan",
    slug: "jordan-air-jordan-1-high-og",
    price: 419000,
    color: "Negro y blanco",
    colorHex: "#1e1e22",
    cats: ["basketball", "retro", "edicion-limitada"],
    tags: ["ultimos-pares"],
    materials: ["Cuero premium", "Goma"],
    stock: [0, 1, 2, 2, 1, 1, 0, 0],
    sold: 89,
    views: 8930,
    featured: true,
    description:
      "El par de 1985 reproducido con las proporciones originales: cuero más rígido, forma más afilada, sin concesiones modernas. Pocos pares.",
    features: [
      "Cuero premium de grano completo",
      "Horma OG fiel a 1985",
      "Alas bordadas en el cuello",
      "Suela de goma con el pivote original",
    ],
  },
  {
    name: "Air Jordan 4 Retro",
    brand: "jordan",
    slug: "jordan-air-jordan-4-retro",
    price: 449000,
    color: "Plata glaciar",
    colorHex: "#cfd2d6",
    cats: ["basketball", "edicion-limitada"],
    tags: ["nuevo"],
    materials: ["Nubuck", "Malla", "Goma"],
    stock: [0, 2, 3, 3, 2, 1, 0, 0],
    sold: 61,
    views: 7480,
    description:
      "Las alas de plástico, la malla en los laterales y el talón esculpido. La 4 es la más arquitectónica de toda la línea.",
    features: [
      "Alas de TPU ajustables",
      "Paneles de malla ventilada",
      "Unidad Air visible en el talón",
      "Nubuck en el corte",
    ],
  },
  {
    name: "Air Jordan 3 Retro",
    brand: "jordan",
    slug: "jordan-air-jordan-3-retro",
    price: 429000,
    discount: 12,
    color: "Cemento gris",
    colorHex: "#dededb",
    cats: ["basketball", "retro"],
    tags: ["oferta"],
    materials: ["Cuero", "Cuero martillado", "Goma"],
    stock: [1, 2, 4, 3, 2, 1, 0, 0],
    sold: 74,
    views: 5620,
    description:
      "La que convenció a Michael Jordan de quedarse. Primera con Air visible, primera con el Jumpman y la primera con el print de elefante.",
    features: [
      "Print de elefante en puntera y talón",
      "Unidad Air visible",
      "Logo Jumpman en lengüeta",
      "Cuero de grano completo",
    ],
  },
  {
    name: "Club C 85",
    brand: "reebok",
    slug: "reebok-club-c-85",
    price: 169000,
    color: "Blanco tiza",
    colorHex: "#f1f1ee",
    cats: ["lifestyle", "retro"],
    materials: ["Cuero", "Goma"],
    stock: [4, 6, 8, 7, 6, 4, 2, 1],
    sold: 187,
    views: 4110,
    description:
      "Una zapatilla de tenis de 1985 que nunca intentó ser otra cosa. Cuero blanco, suela fina, cero decoración.",
    features: [
      "Cuero suave de grano completo",
      "Suela de goma de perfil bajo",
      "Cuello acolchado",
      "Detalle de gamuza en el talón",
    ],
  },
  {
    name: "Classic Leather",
    brand: "reebok",
    slug: "reebok-classic-leather",
    price: 179000,
    color: "Gris acero",
    colorHex: "#c8ccd1",
    cats: ["lifestyle", "running", "retro"],
    materials: ["Cuero", "EVA", "Goma"],
    stock: [3, 5, 6, 5, 4, 2, 1, 0],
    sold: 124,
    views: 3220,
    description:
      "Salió en 1983 como zapatilla de running y duró cuarenta años como zapatilla de todos los días. La entresuela de EVA todavía se siente bien.",
    features: [
      "Corte de cuero blando",
      "Entresuela de EVA moldeada",
      "Suela de goma",
      "Plantilla die-cut",
    ],
  },
  {
    name: "Instapump Fury",
    brand: "reebok",
    slug: "reebok-instapump-fury",
    price: 289000,
    color: "Grafito y crema",
    colorHex: "#34332c",
    cats: ["running", "edicion-limitada"],
    tags: ["nuevo"],
    materials: ["Nylon", "TPU", "Hexalite"],
    stock: [0, 1, 3, 3, 2, 1, 0, 0],
    sold: 43,
    views: 3910,
    description:
      "Sin cordones, sin lengüeta convencional, sin nada que se parezca a una zapatilla normal. En 1994 parecía del futuro y sigue pareciéndolo.",
    features: [
      "Sistema de inflado Pump",
      "Amortiguación Hexalite",
      "Chasis expuesto de TPU",
      "Construcción sin cordones",
    ],
  },
  {
    name: "Gel-Kayano 14",
    brand: "asics",
    slug: "asics-gel-kayano-14",
    price: 339000,
    color: "Plata y crema",
    colorHex: "#d3d6da",
    cats: ["running", "lifestyle"],
    tags: ["mas-vendido"],
    materials: ["Malla", "Sintético", "GEL"],
    stock: [2, 4, 5, 6, 4, 3, 1, 0],
    sold: 171,
    views: 6890,
    featured: true,
    description:
      "Una zapatilla de running de 2008 que el lifestyle adoptó entera. Los paneles de plata y el gel visible la volvieron la más pedida de los últimos dos años.",
    features: [
      "Amortiguación GEL™ en talón y antepié",
      "Sistema Trusstic de estabilidad",
      "Corte de malla con superposiciones metalizadas",
      "Suela AHAR de alta abrasión",
    ],
  },
  {
    name: "Gel-1130",
    brand: "asics",
    slug: "asics-gel-1130",
    price: 279000,
    color: "Blanco y arcilla",
    colorHex: "#e8e6e0",
    cats: ["running", "lifestyle"],
    materials: ["Malla", "Sintético", "GEL"],
    stock: [3, 5, 6, 5, 4, 2, 1, 0],
    sold: 149,
    views: 4560,
    description:
      "La hermana accesible de la Kayano, con la misma silueta de principios de los 2000 y el mismo gel en el talón.",
    features: [
      "GEL™ en la zona del talón",
      "Corte de malla transpirable",
      "Entresuela EVA",
      "Suela de goma resistente",
    ],
  },
  {
    name: "Gel-NYC",
    brand: "asics",
    slug: "asics-gel-nyc",
    price: 299000,
    discount: 18,
    color: "Gris ostra",
    colorHex: "#bcbcb8",
    cats: ["running", "lifestyle"],
    tags: ["oferta"],
    materials: ["Malla", "Gamuza", "GEL"],
    stock: [1, 3, 4, 4, 3, 2, 0, 0],
    sold: 108,
    views: 3740,
    description:
      "Un híbrido entre la NIMBUS 3 y la MK3, armado en 2023. Volumen alto, gamuza en capas y una suela que no se parece a nada del catálogo.",
    features: [
      "Híbrido de dos siluetas de archivo",
      "GEL™ en el talón",
      "Capas de gamuza y malla",
      "Entresuela de perfil alto",
    ],
  },
  {
    name: "Chuck 70 High",
    brand: "converse",
    slug: "converse-chuck-70-high",
    price: 159000,
    color: "Negro",
    colorHex: "#1c1c20",
    cats: ["lifestyle", "skate", "retro"],
    tags: ["mas-vendido"],
    materials: ["Lona", "Goma"],
    stock: [4, 6, 7, 8, 6, 4, 2, 1],
    sold: 246,
    views: 5180,
    featured: true,
    description:
      "La reedición fiel de la Chuck de los años 70: lona más gruesa, suela más alta y la plantilla OrthoLite que la original no tenía.",
    features: [
      "Lona de peso pesado",
      "Suela de goma con franja elevada",
      "Plantilla OrthoLite",
      "Licence plate negro en el talón",
    ],
  },
  {
    name: "Chuck Taylor All Star Low",
    brand: "converse",
    slug: "converse-chuck-taylor-low",
    price: 129000,
    color: "Blanco óptico",
    colorHex: "#f3f2ee",
    cats: ["lifestyle", "skate"],
    materials: ["Lona", "Goma"],
    stock: [5, 7, 9, 8, 7, 5, 3, 1],
    sold: 288,
    views: 4720,
    description:
      "Cien años sin cambiar de forma. Lona, ojales metálicos, suela de goma y nada más.",
    features: [
      "Lona de algodón",
      "Ojales metálicos de ventilación",
      "Puntera de goma",
      "Suela vulcanizada",
    ],
  },
  {
    name: "Run Star Hike",
    brand: "converse",
    slug: "converse-run-star-hike",
    price: 219000,
    color: "Negro plataforma",
    colorHex: "#191a1e",
    cats: ["lifestyle", "edicion-limitada"],
    tags: ["nuevo"],
    materials: ["Lona", "Goma"],
    stock: [1, 3, 4, 3, 2, 1, 0, 0],
    sold: 82,
    views: 3050,
    description:
      "La Chuck 70 montada sobre una suela dentada que sobresale por todos lados. Es fea a propósito y funciona.",
    features: [
      "Suela dentada sobredimensionada",
      "Corte de lona Chuck 70",
      "Plantilla OrthoLite",
      "Altura de plataforma de 4 cm",
    ],
  },
  {
    name: "Old Skool",
    brand: "vans",
    slug: "vans-old-skool",
    price: 149000,
    color: "Negro y blanco",
    colorHex: "#1b1b1f",
    cats: ["skate", "lifestyle", "retro"],
    tags: ["mas-vendido"],
    materials: ["Gamuza", "Lona", "Goma"],
    stock: [5, 7, 8, 9, 7, 5, 3, 1],
    sold: 274,
    views: 5640,
    featured: true,
    description:
      "La primera con la raya lateral, dibujada a mano por Paul Van Doren en 1977. Sigue siendo la zapatilla de skate por defecto.",
    features: [
      "Paneles de gamuza y lona resistente",
      "Suela waffle de goma",
      "Cuello acolchado",
      "Refuerzo en la puntera",
    ],
  },
  {
    name: "Knu Skool",
    brand: "vans",
    slug: "vans-knu-skool",
    price: 179000,
    color: "Grafito",
    colorHex: "#4a4a53",
    cats: ["skate", "lifestyle"],
    tags: ["nuevo"],
    materials: ["Gamuza", "Goma"],
    stock: [2, 4, 5, 4, 3, 2, 1, 0],
    sold: 117,
    views: 3480,
    description:
      "La Old Skool de los 90 con todo inflado: lengüeta gorda, cordones gruesos y una raya lateral el doble de ancha.",
    features: [
      "Lengüeta y cuello sobredimensionados",
      "Raya lateral ampliada",
      "Cordones gruesos redondos",
      "Suela waffle",
    ],
  },
  {
    name: "Sk8-Hi",
    brand: "vans",
    slug: "vans-sk8-hi",
    price: 169000,
    discount: 15,
    color: "Negro",
    colorHex: "#202024",
    cats: ["skate", "lifestyle", "retro"],
    tags: ["oferta"],
    materials: ["Gamuza", "Lona", "Goma"],
    stock: [3, 4, 6, 5, 4, 3, 1, 0],
    sold: 163,
    views: 3890,
    description:
      "La versión alta de la Old Skool, pensada para proteger el tobillo del skate. Terminó en más escenarios que rampas.",
    features: [
      "Caña alta con acolchado en el tobillo",
      "Gamuza y lona reforzadas",
      "Suela waffle de goma",
      "Refuerzo en la puntera",
    ],
  },
];

const products: Product[] = SPECS.map((spec, i) => {
  const created = new Date(BASE - i * 4 * DAY).toISOString();
  const brandName = BRAND_SEED.find(([s]) => s === spec.brand)?.[1] ?? spec.brand;

  return {
    id: `prod_${spec.slug}`,
    slug: spec.slug,
    name: spec.name,
    brandId: `brand_${spec.brand}`,
    categoryIds: spec.cats.map((c) => `cat_${c}`),
    price: spec.price,
    discount: spec.discount ?? 0,
    description: spec.description,
    features: spec.features,
    color: spec.color,
    colorHex: spec.colorHex,
    materials: spec.materials,
    tags: spec.tags ?? [],
    sku: `TC-${spec.brand.slice(0, 3).toUpperCase()}-${String(i + 1).padStart(3, "0")}`,
    images: [0, 1, 2].map((n) => ({
      id: `${spec.slug}-img-${n + 1}`,
      url: `/products/${spec.slug}-${n + 1}.svg`,
      alt: `${brandName} ${spec.name} — vista ${n + 1}`,
    })),
    sizes: buildSizes(spec.stock),
    featured: spec.featured ?? false,
    views: spec.views,
    sold: spec.sold,
    createdAt: created,
    updatedAt: created,
    // El catálogo semilla no viene de ningún PDF: precio manual y sin
    // referencia de proveedor, así que la sincronización no lo toca.
    ...PRODUCT_SYNC_DEFAULTS,
  } satisfies Product;
});

/* -------------------------------------------------------------------------- */
/* Banners, ofertas y pedidos de ejemplo                                      */
/* -------------------------------------------------------------------------- */

const banners: Banner[] = [
  {
    id: "banner_hero",
    placement: "hero",
    eyebrow: "Temporada 2026",
    title: "Tu próximo par empieza en Twenty Club.",
    subtitle:
      "Zapatillas originales de nueve marcas, curadas de a una. Sin catálogos infinitos ni pares que no vas a usar.",
    image: "/products/nike-dunk-low-retro-1.svg",
    ctaLabel: "Explorar colección",
    ctaHref: "/productos",
    active: true,
    order: 0,
  },
  {
    id: "banner_promo_drop",
    placement: "promo",
    eyebrow: "Nuevos ingresos",
    title: "Llegaron 8 pares nuevos esta semana",
    subtitle: "Speedcat OG, 9060 y Gel-NYC entre ellos. Talles completos por ahora.",
    image: "/brands/promo-drop.svg",
    ctaLabel: "Ver ingresos",
    ctaHref: "/productos?orden=nuevos",
    active: true,
    order: 0,
  },
  {
    id: "banner_promo_sale",
    placement: "promo",
    eyebrow: "Ofertas",
    title: "Hasta 25% en pares seleccionados",
    subtitle: "Siete modelos con descuento real, mientras queden talles.",
    image: "/brands/promo-sale.svg",
    ctaLabel: "Ver ofertas",
    ctaHref: "/ofertas",
    active: true,
    order: 1,
  },
  {
    id: "banner_secondary_envio",
    placement: "secondary",
    eyebrow: "Envíos",
    title: "Envío sin cargo desde $250.000",
    subtitle: "A todo el país. CABA y GBA en 24 a 48 horas.",
    image: null,
    ctaLabel: "Cómo comprar",
    ctaHref: "/contacto",
    active: true,
    order: 0,
  },
];

const offers: Offer[] = [
  {
    id: "offer_invierno",
    title: "Selección de invierno",
    description: "Siete pares con descuento directo hasta agotar talles.",
    discount: 20,
    productIds: [
      "prod_nike-dunk-low-retro",
      "prod_adidas-gazelle-bold",
      "prod_puma-suede-xl",
      "prod_new-balance-2002r",
      "prod_jordan-air-jordan-3-retro",
      "prod_asics-gel-nyc",
      "prod_vans-sk8-hi",
    ],
    startsAt: new Date(BASE - 20 * DAY).toISOString(),
    endsAt: new Date(BASE + 25 * DAY).toISOString(),
    active: true,
  },
];

const ORDER_SEED: Array<[
  code: string,
  name: string,
  phone: string,
  daysAgo: number,
  status: Order["status"],
  items: Array<[slug: string, size: string, qty: number]>,
]> = [
  ["TC-2418", "Martina Ríos", "+54 9 11 5544 2210", 1, "pendiente", [["nike-air-max-95", "41", 1]]],
  ["TC-2417", "Bruno Cattaneo", "+54 9 11 6621 8890", 2, "contactado", [["adidas-samba-og", "43", 1], ["vans-old-skool", "43", 1]]],
  ["TC-2416", "Sol Aguirre", "+54 9 351 447 9021", 3, "finalizado", [["new-balance-9060", "39", 1]]],
  ["TC-2415", "Iván Peralta", "+54 9 11 3390 5512", 5, "finalizado", [["jordan-air-jordan-1-low", "42", 2]]],
  ["TC-2414", "Camila Ferrer", "+54 9 341 512 7788", 6, "cancelado", [["puma-speedcat-og", "40", 1]]],
  ["TC-2413", "Tomás Bustos", "+54 9 11 4477 1290", 8, "finalizado", [["asics-gel-kayano-14", "44", 1], ["converse-chuck-70-high", "44", 1]]],
  ["TC-2412", "Lucía Márquez", "+54 9 261 660 3341", 9, "contactado", [["adidas-campus-00s", "38", 1]]],
  ["TC-2411", "Federico Sosa", "+54 9 11 2298 4470", 12, "finalizado", [["nike-air-force-1-07", "42", 1]]],
];

const orders: Order[] = ORDER_SEED.map(([code, name, phone, daysAgo, status, rawItems]) => {
  const items = rawItems.map(([slug, size, qty]) => {
    const p = products.find((x) => x.slug === slug)!;
    const brand = brands.find((b) => b.id === p.brandId)!;
    const unit = p.discount ? Math.round(p.price * (1 - p.discount / 100)) : p.price;
    return {
      productId: p.id,
      slug: p.slug,
      name: p.name,
      brand: brand.name,
      size,
      qty,
      unitPrice: unit,
      image: p.images[0].url,
    };
  });

  return {
    id: `order_${code.toLowerCase()}`,
    code,
    createdAt: new Date(BASE - daysAgo * DAY).toISOString(),
    customer: { name, phone, note: "" },
    items,
    total: items.reduce((acc, it) => acc + it.unitPrice * it.qty, 0),
    status,
  } satisfies Order;
});

/* -------------------------------------------------------------------------- */

export function createSeedDatabase(): Database {
  return {
    products,
    brands,
    categories,
    banners,
    offers,
    orders,
    settings: {
      storeName: "Twenty Club",
      whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "5491123389725",
      email: "hola@twentyclub.com",
      instagram: "twentyclub",
      tiktok: "twentyclub",
      address: "Buenos Aires, Argentina",
      freeShippingFrom: 250000,
      sync: DEFAULT_SYNC_SETTINGS,
    },
    syncRules: [],
  };
}
