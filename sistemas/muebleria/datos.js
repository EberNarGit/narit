// Mueblería "Casa Olmo": datos de ejemplo y reglas del negocio que usan la tienda y el panel.
import { base, uid, haceDias } from '../_base/sis.js';
import { CONFIG } from '../../config.js';

export const ESTADOS = ['nuevo', 'confirmado', 'preparando', 'en camino', 'entregado'];
export const ESTADO_TXT = { nuevo: 'Recibido', confirmado: 'Confirmado', preparando: 'En preparación', 'en camino': 'En camino', entregado: 'Entregado', cancelado: 'Cancelado' };
export const ESTADO_BADGE = { nuevo: 'b-info', confirmado: 'b-warn', preparando: 'b-warn', 'en camino': 'b-warn', entregado: 'b-ok', cancelado: 'b-mut' };
export const PAGOS = { transferencia: 'Transferencia', tarjeta: 'Tarjeta en entrega', efectivo: 'Efectivo en tienda', apartado: 'Apartado con anticipo' };

const CATS = [
  { id: 'salas', n: 'Salas', foto: 'photo-1759722665629-29df6ee4f9a5' },
  { id: 'sillones', n: 'Sillones', foto: 'photo-1759722667456-71e7bfd118b2' },
  { id: 'comedor', n: 'Comedor', foto: 'photo-1758977404039-6e834be8eca8' },
  { id: 'recamara', n: 'Recámara', foto: 'photo-1718894071402-fb944e2a1849' },
  { id: 'almacenaje', n: 'Almacenaje', foto: 'photo-1788506663473-394c2bec66a8' },
  { id: 'iluminacion', n: 'Iluminación', foto: 'photo-1494438639946-1ebd1d20bf85' },
];

// [id, nombre, cat, precio, oferta, costo, stock, mínimo, foto, medidas, material, colores, descripción, destacado]
const P = [
  ['sofa-lino', 'Sofá Lino 3 plazas', 'salas', 18900, 15900, 9800, 4, 2, 'photo-1759722665629-29df6ee4f9a5', '210 × 90 × 85 cm', 'Lino y estructura de pino', ['Arena', 'Gris perla'], 'Sofá amplio con cojines desenfundables. Asiento de espuma de alta densidad que no se hunde.', true],
  ['sofa-brisa', 'Sala modular Brisa', 'salas', 32500, 0, 17200, 2, 1, 'photo-1759722668253-1767030ad9b2', '280 × 180 × 82 cm', 'Tela antimanchas', ['Gris'], 'Sala en L de cuatro módulos que se acomodan a tu espacio. Tela fácil de limpiar, ideal con niños y mascotas.', true],
  ['sofa-bosque', 'Sofá Bosque terciopelo', 'salas', 21400, 0, 11300, 3, 1, 'photo-1590251024078-8a6d9f90b02d', '200 × 88 × 80 cm', 'Terciopelo y patas de encino', ['Verde bosque'], 'Sofá de terciopelo verde con capitoneado vertical. Una pieza que se vuelve el centro de la sala.', false],
  ['sillon-nube', 'Sillón Nube', 'sillones', 8900, 7400, 4300, 6, 2, 'photo-1759722667456-71e7bfd118b2', '95 × 90 × 75 cm', 'Bouclé', ['Hueso'], 'Sillón redondo y envolvente, para leer o descansar. Tapiz bouclé suave al tacto.', true],
  ['sillon-roble', 'Sillón Roble', 'sillones', 6200, 0, 2900, 5, 2, 'photo-1580480055273-228ff5388ef8', '70 × 78 × 80 cm', 'Madera de roble y tela', ['Gris'], 'Sillón ocasional con brazos de madera maciza. Ligero y fácil de mover.', false],
  ['sillon-mostaza', 'Sillón Mostaza', 'sillones', 5800, 0, 2700, 1, 2, 'photo-1586023492125-27b2c045efd7', '68 × 75 × 82 cm', 'Madera de haya y tela', ['Mostaza'], 'Sillón de estilo mid-century con cojín grueso. Da color a cualquier rincón.', false],
  ['comedor-roble', 'Comedor Roble 6 sillas', 'comedor', 27800, 0, 14600, 2, 1, 'photo-1758977404039-6e834be8eca8', 'Mesa 180 × 90 cm', 'Roble macizo y tela', ['Natural'], 'Mesa de roble macizo con seis sillas tapizadas. Hecho para durar generaciones.', true],
  ['comedor-nogal', 'Comedor Nogal 4 sillas', 'comedor', 16500, 13900, 8200, 3, 1, 'photo-1547062200-f195b1c77e30', 'Mesa 140 × 80 cm', 'Madera tono nogal oscuro', ['Nogal'], 'Comedor compacto para departamentos. Acabado oscuro resistente a manchas.', false],
  ['silla-cojin', 'Silla Encino con cojín', 'comedor', 2300, 0, 1050, 18, 8, 'photo-1774294067819-91abcd349372', '45 × 50 × 82 cm', 'Encino', ['Natural'], 'Silla de encino con cojín de lino. Se vende por pieza.', false],
  ['cama-roble', 'Cama matrimonial Roble', 'recamara', 14200, 0, 7100, 4, 2, 'photo-1517912158475-fb0ab8c8eed1', 'Matrimonial 140 × 190', 'Roble y triplay', ['Natural'], 'Base de cama con cabecera de madera. Colchón no incluido.', true],
  ['recamara-serena', 'Recámara Serena King', 'recamara', 29900, 0, 15400, 1, 1, 'photo-1718894071402-fb944e2a1849', 'King size + 2 burós', 'Madera y tapiz', ['Arena'], 'Cama king con cabecera tapizada y dos burós. Colchón no incluido.', false],
  ['aparador-teca', 'Aparador Teca', 'almacenaje', 12600, 0, 6100, 3, 1, 'photo-1788506663473-394c2bec66a8', '160 × 45 × 75 cm', 'Teca', ['Teca'], 'Aparador de tres cajones con jaladeras talladas. Para comedor o recibidor.', true],
  ['cajonera-nogal', 'Cajonera Nogal 5 cajones', 'almacenaje', 7400, 0, 3500, 0, 1, 'photo-1544691560-fc2053d97726', '80 × 45 × 120 cm', 'Madera tono nogal', ['Nogal'], 'Cajonera alta con correderas de extensión total.', false],
  ['credenza-luz', 'Credenza Luz', 'almacenaje', 10900, 9200, 5300, 2, 1, 'photo-1767963758785-b9def36c13e3', '180 × 40 × 55 cm', 'Encino claro', ['Natural'], 'Mueble bajo para TV con puertas corredizas y pasacables.', false],
  ['lampara-arco', 'Lámpara de pie Negra', 'iluminacion', 3900, 0, 1600, 7, 3, 'photo-1494438639946-1ebd1d20bf85', 'Altura 165 cm', 'Metal', ['Negro'], 'Lámpara de pie minimalista con pantalla orientable.', false],
  ['lampara-onda', 'Lámpara Onda madera', 'iluminacion', 4600, 0, 2000, 4, 2, 'photo-1780571189324-326018f0dfac', 'Altura 150 cm', 'Madera y LED', ['Natural'], 'Lámpara escultural con luz LED cálida regulable.', false],
];

const CLIENTES = [
  ['Mariana López', '5512345678', 'Av. Coyoacán 1200, Col. del Valle, CDMX'],
  ['Jorge Ramírez', '5523456789', 'Calle Pino 45, Naucalpan, Edo. Méx.'],
  ['Lucía Hernández', '5534567890', 'Insurgentes Sur 890, Benito Juárez, CDMX'],
  ['Carlos Mendoza', '5545678901', 'Recoge en tienda'],
  ['Ana Torres', '5556789012', 'Av. Universidad 300, Coyoacán, CDMX'],
  ['Roberto Díaz', '5567890123', 'Calle Olivo 12, Tlalpan, CDMX'],
];

function semilla() {
  const prods = P.map(([id, n, cat, precio, oferta, costo, stock, min, foto, medidas, material, colores, desc, dest], i) =>
    ({ id, n, cat, precio, oferta, costo, stock, min, foto, medidas, material, colores, desc, dest, pub: true, creado: haceDias(60 - i) }));
  const db = {
    v: 1,
    conf: { nombre: 'Casa Olmo', lema: 'Muebles que se quedan', whatsapp: CONFIG.whatsapp, envio: 650, envioGratis: 15000, anticipo: 30, pin: '1234', sig: 1001,
      promo: { activa: true, titulo: 'Temporada de aguinaldo', texto: 'Hasta 20% en salas y comedores seleccionados. Aparta con el 30%.', cat: 'salas' } },
    cats: CATS, prods, pedidos: [], movs: [],
  };
  // Pedidos de ejemplo de las últimas semanas, para que el panel tenga historia.
  const ej = [
    [27, 0, [['sofa-lino', 1]], 'transferencia', 'entregado'], [24, 1, [['silla-cojin', 4], ['comedor-nogal', 1]], 'apartado', 'entregado'],
    [20, 2, [['sillon-nube', 2]], 'tarjeta', 'entregado'], [16, 4, [['cama-roble', 1], ['lampara-arco', 1]], 'transferencia', 'entregado'],
    [12, 3, [['aparador-teca', 1]], 'efectivo', 'entregado'], [9, 5, [['sofa-brisa', 1]], 'apartado', 'en camino'],
    [6, 0, [['lampara-onda', 2]], 'transferencia', 'preparando'], [3, 1, [['comedor-roble', 1]], 'apartado', 'confirmado'],
    [1, 2, [['sillon-roble', 1], ['credenza-luz', 1]], 'transferencia', 'nuevo'], [0, 4, [['sofa-bosque', 1]], 'apartado', 'nuevo'],
  ];
  for (const [dias, c, items, pago, estado] of ej) {
    const [n, tel, dir] = CLIENTES[c];
    const p = armarPedido(db, { n, tel, dir: dir === 'Recoge en tienda' ? '' : dir, entrega: dir === 'Recoge en tienda' ? 'tienda' : 'domicilio', pago, notas: '' },
      items.map(([id, cant]) => ({ id, cant })), haceDias(dias, 11 + c));
    const idx = ESTADOS.indexOf(estado);
    p.hist = ESTADOS.slice(0, idx + 1).map((e, k) => ({ e, f: haceDias(Math.max(dias - k, 0), 10 + k) }));
    p.estado = estado;
    p.pagado = estado === 'entregado' ? p.total : pago === 'apartado' ? Math.round(p.total * db.conf.anticipo / 100) : estado === 'nuevo' ? 0 : p.total;
    db.pedidos.push(p);
  }
  db.movs.push({ id: uid(), prod: 'silla-cojin', tipo: 'entrada', cant: 12, nota: 'Llegó pedido del taller', f: haceDias(14, 9) });
  db.movs.push({ id: uid(), prod: 'sillon-nube', tipo: 'entrada', cant: 4, nota: 'Proveedor Tapicería Hidalgo', f: haceDias(8, 9) });
  db.movs.push({ id: uid(), prod: 'cajonera-nogal', tipo: 'ajuste', cant: -1, nota: 'Pieza dañada en exhibición', f: haceDias(5, 18) });
  db.movs.sort((a, b) => b.f.localeCompare(a.f));
  return db;
}

export const precioFinal = (p) => (p.oferta > 0 && p.oferta < p.precio ? p.oferta : p.precio);

export function totales(db, items) {
  const sub = items.reduce((s, it) => s + it.precio * it.cant, 0);
  const envio = sub === 0 || sub >= db.conf.envioGratis ? 0 : db.conf.envio;
  return { sub, envio, total: sub + envio };
}

// Crea el pedido y descuenta inventario. Lanza error si ya no hay piezas (el cliente pudo tardar y otro compró).
export function armarPedido(db, cliente, carrito, f = new Date().toISOString()) {
  const items = carrito.map(({ id, cant }) => {
    const p = db.prods.find((x) => x.id === id);
    if (!p || !p.pub) throw new Error('Un producto de tu carrito ya no está disponible.');
    if (p.stock < cant) throw new Error(`Solo quedan ${p.stock} de «${p.n}».`);
    return { id, n: p.n, precio: precioFinal(p), cant, foto: p.foto };
  });
  const t = totales(db, items);
  const envio = cliente.entrega === 'tienda' ? 0 : t.envio;
  for (const it of items) {
    db.prods.find((x) => x.id === it.id).stock -= it.cant;
    db.movs.unshift({ id: uid(), prod: it.id, tipo: 'venta', cant: -it.cant, nota: 'Pedido CO-' + db.conf.sig, f });
  }
  return { folio: 'CO-' + db.conf.sig++, f, cliente, items, sub: t.sub, envio, total: t.sub + envio, pagado: 0, estado: 'nuevo', hist: [{ e: 'nuevo', f }], pagos: [] };
}

export function cancelar(db, p) {
  if (p.estado === 'cancelado') return;
  for (const it of p.items) {
    const prod = db.prods.find((x) => x.id === it.id);
    if (prod) prod.stock += it.cant;
    db.movs.unshift({ id: uid(), prod: it.id, tipo: 'cancelación', cant: it.cant, nota: 'Cancelación ' + p.folio, f: new Date().toISOString() });
  }
  p.estado = 'cancelado';
  p.hist.push({ e: 'cancelado', f: new Date().toISOString() });
}

export const abrir = () => base('muebleria', semilla);

// Autochequeo de las reglas: inventario, envío gratis y cancelación.
{
  const db = semilla();
  const s0 = db.prods.find((p) => p.id === 'lampara-arco').stock;
  const p = armarPedido(db, { n: 't', tel: '1', entrega: 'domicilio' }, [{ id: 'lampara-arco', cant: 2 }]);
  console.assert(p.total === 3900 * 2 + db.conf.envio, 'total con envío');
  console.assert(db.prods.find((x) => x.id === 'lampara-arco').stock === s0 - 2, 'descuenta stock');
  cancelar(db, p);
  console.assert(db.prods.find((x) => x.id === 'lampara-arco').stock === s0, 'cancelar regresa stock');
  console.assert(totales(db, [{ precio: 20000, cant: 1 }]).envio === 0, 'envío gratis');
  let error = false; try { armarPedido(db, {}, [{ id: 'cajonera-nogal', cant: 1 }]); } catch { error = true; }
  console.assert(error, 'no vende sin stock');
}
