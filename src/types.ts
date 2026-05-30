/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewsCount: number;
  category: 'damas' | 'caballeros' | 'ninos' | 'bebes';
  style: 'Casual' | 'Formal' | 'Deportivo' | 'Elegante' | 'Urbano' | 'Invierno';
  image: string;
  description: string;
  sizes: string[];
  colors: { name: string; class: string }[];
  isBestSeller?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
}

export interface PaymentValidation {
  success: boolean;
  amount: number;
  operationNumber: string;
  sender: string;
  bank: string;
  date: string;
  message: string;
  confidenceScore: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  customerEmail: string;
  customerName: string;
  status: 'draft' | 'checkout' | 'validating' | 'approved' | 'failed';
  paymentValidation?: PaymentValidation;
  createdAt: string;
}

export const CLOTHING_CATALOG: Product[] = [
  {
    id: 'p1',
    name: 'Casaca Cortaviento Térmico Gamarra',
    price: 89.90,
    originalPrice: 129.90,
    rating: 4.8,
    reviewsCount: 154,
    category: 'damas',
    style: 'Deportivo',
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=600&auto=format&fit=crop',
    description: 'Perfecta casaca impermeable con forro de micropolar térmico ideal para las mañanas de Lima y deporte al aire libre. Calidad exportación.',
    sizes: ['S', 'M', 'L'],
    colors: [
      { name: 'Negro', class: 'bg-black' },
      { name: 'Rosado Neón', class: 'bg-rose-500' },
      { name: 'Azul Eléctrico', class: 'bg-blue-600' }
    ],
    isBestSeller: true
  },
  {
    id: 'p2',
    name: 'Vestido Midi Floreado Girasoles',
    price: 65.00,
    originalPrice: 85.00,
    rating: 4.7,
    reviewsCount: 92,
    category: 'damas',
    style: 'Casual',
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=600&auto=format&fit=crop',
    description: 'Hermoso vestido de crepe stretch con estampado de margaritas. Súper fresco, ideal para paseos y salidas por la tarde.',
    sizes: ['M', 'L', 'XL'],
    colors: [
      { name: 'Negro con Flores', class: 'bg-zinc-900 border-2 border-yellow-400' },
      { name: 'Rojo Guinda', class: 'bg-red-800' }
    ],
    isBestSeller: false
  },
  {
    id: 'p3',
    name: 'Terno Slim Fit Alpaca Premium',
    price: 380.00,
    originalPrice: 450.00,
    rating: 4.9,
    reviewsCount: 43,
    category: 'caballeros',
    style: 'Elegante',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=600&auto=format&fit=crop',
    description: 'Terno confeccionado por sastres expertos de Gamarra con fina mezcla de lana de alpaca. Tacto ultrasuave, corte slim fit moderno.',
    sizes: ['48', '50', '52', '54'],
    colors: [
      { name: 'Azul Noche', class: 'bg-slate-900' },
      { name: 'Gris Grafito', class: 'bg-gray-700' }
    ],
    isBestSeller: true
  },
  {
    id: 'p4',
    name: 'Conjunto Jogger & Polera Oversize Urban',
    price: 95.00,
    originalPrice: 130.00,
    rating: 4.6,
    reviewsCount: 112,
    category: 'damas',
    style: 'Urbano',
    image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=600&auto=format&fit=crop',
    description: 'Conjunto de polera con capucha y jogger a juego en algodón perchado pesado. Comodidad y estilo urbano en una sola prenda.',
    sizes: ['Standard', 'XL'],
    colors: [
      { name: 'Gris Melange', class: 'bg-gray-400' },
      { name: 'Crema Matcha', class: 'bg-emerald-100 hover:ring-2 hover:ring-emerald-400' },
      { name: 'Negro Puro', class: 'bg-zinc-950' }
    ],
    isBestSeller: true
  },
  {
    id: 'p5',
    name: 'Saco Blazer Sastre Entallado',
    price: 120.00,
    originalPrice: 160.00,
    rating: 4.5,
    reviewsCount: 78,
    category: 'damas',
    style: 'Formal',
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=600&auto=format&fit=crop',
    description: 'Blazer para oficina y reuniones formales en tela bengalina de alta resistencia. Amolda perfectamente gracias a su diseño estruturado.',
    sizes: ['S', 'M', 'L'],
    colors: [
      { name: 'Blanco Crema', class: 'bg-orange-50' },
      { name: 'Marrón Caramelo', class: 'bg-amber-800' },
      { name: 'Negro Clásico', class: 'bg-black' }
    ],
    isBestSeller: false
  },
  {
    id: 'p6',
    name: 'Chompa Trenzada de Algodón Orgánico',
    price: 75.00,
    originalPrice: 110.00,
    rating: 4.8,
    reviewsCount: 88,
    category: 'caballeros',
    style: 'Invierno',
    image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=600&auto=format&fit=crop',
    description: 'Tejido artesanal trenzado de 100% algodón nativo peruano. Grueso, abrigador y sumamente elástico.',
    sizes: ['M', 'L', 'XL'],
    colors: [
      { name: 'Beige Arena', class: 'bg-stone-300' },
      { name: 'Verde Pino', class: 'bg-emerald-950' },
      { name: 'Azul Marino', class: 'bg-blue-950' }
    ],
    isBestSeller: false
  },
  {
    id: 'p7',
    name: 'Jeans Mujer High Waist Gamarra Denim',
    price: 69.90,
    originalPrice: 99.90,
    rating: 4.7,
    reviewsCount: 231,
    category: 'damas',
    style: 'Urbano',
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=600&auto=format&fit=crop',
    description: 'Jeans de tiro súper alto con efecto levanta cola (push-up) característico de la costura de alta ingeniería de Gamarra. Denim premium stretch.',
    sizes: ['28', '30', '32', '34'],
    colors: [
      { name: 'Azul Claro', class: 'bg-blue-300' },
      { name: 'Azul Medio', class: 'bg-blue-500' },
      { name: 'Negro Gastado', class: 'bg-neutral-800' }
    ],
    isBestSeller: true
  },
  {
    id: 'p8',
    name: 'Camisa Linen Premium Cuello Nerú',
    price: 55.00,
    originalPrice: 80.00,
    rating: 4.6,
    reviewsCount: 65,
    category: 'caballeros',
    style: 'Casual',
    image: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?q=80&w=600&auto=format&fit=crop',
    description: 'Camisa ligera de lino premium en corte cuello nerú, fresca y perfecta para climas cálidos o salidas casuales de fin de semana.',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [
      { name: 'Blanco Lino', class: 'bg-white border' },
      { name: 'Celeste Pastel', class: 'bg-sky-200' },
      { name: 'Verde Musgo', class: 'bg-green-700' }
    ],
    isBestSeller: false
  },
  {
    id: 'p9',
    name: 'Pantalón Chino Slim Fit de Dril',
    price: 79.90,
    originalPrice: 109.90,
    rating: 4.7,
    reviewsCount: 142,
    category: 'caballeros',
    style: 'Formal',
    image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=600&auto=format&fit=crop',
    description: 'Pantalón de dril de algodón satinado premium importado. Estira ligeramente brindando una excelente comodidad para oficina o paseos elegantes.',
    sizes: ['30', '32', '34', '36'],
    colors: [
      { name: 'Khaki Beige', class: 'bg-amber-100' },
      { name: 'Azul Marino', class: 'bg-blue-950' },
      { name: 'Marrón Café', class: 'bg-amber-900' }
    ],
    isBestSeller: true
  },
  {
    id: 'p10',
    name: 'Polera con Capucha Algodón Oxford',
    price: 85.00,
    originalPrice: 115.00,
    rating: 4.8,
    reviewsCount: 110,
    category: 'caballeros',
    style: 'Urbano',
    image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=600&auto=format&fit=crop',
    description: 'Polera urbana confeccionada con hilo de algodón grueso de 400gr. Súper abrigadora y de corte holgado moderno.',
    sizes: ['M', 'L', 'XL'],
    colors: [
      { name: 'Gris Oscuro', class: 'bg-gray-600' },
      { name: 'Verde Militar', class: 'bg-emerald-900' },
      { name: 'Negro', class: 'bg-black' }
    ],
    isBestSeller: false
  },
  {
    id: 'p11',
    name: 'Casaca Cortaviento Waterproof Pro',
    price: 110.00,
    originalPrice: 149.90,
    rating: 4.9,
    reviewsCount: 89,
    category: 'caballeros',
    style: 'Deportivo',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=600&auto=format&fit=crop',
    description: 'Casaca rompevientos de alta gama para trekking o running, con costuras termo-selladas y forro de malla transpirable.',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [
      { name: 'Negro Mate', class: 'bg-zinc-900' },
      { name: 'Naranja Deportivo', class: 'bg-orange-500' }
    ],
    isBestSeller: true
  }
];
