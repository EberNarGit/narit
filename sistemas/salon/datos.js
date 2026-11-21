// Salón de belleza "Bella Alma": datos de ejemplo y reglas (agenda por estilista, visitas y premio, niveles, cupones, tienda).
import { base, uid } from '../_base/sis.js';
import { CONFIG } from '../../config.js';

export const dia = (n = 0) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toLocaleDateString('en-CA'); };
export const loc = (s) => (s.length > 10 ? new Date(s).toLocaleDateString('en-CA') : s);
export const diasEntre = (a, b) => Math.round((Date.parse(loc(b)) - Date.parse(loc(a))) / 864e5);
export const fDia = (s) => new Date(loc(s) + 'T12:00').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
export const domingo = (s) => new Date(s + 'T12:00').getDay() === 0;
export const min = (h) => +h.slice(0, 2) * 60 + +h.slice(3);
export const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
export const fin = (c) => hhmm(min(c.hora) + c.dur);

export const CATS = { cabello: 'Cabello', color: 'Color', unas: 'Uñas', mirada: 'Pestañas y cejas', maquillaje: 'Maquillaje' };
export const EST_TXT = { reservada: 'Reservada', llego: 'Llegó', atencion: 'En atención', terminada: 'Terminada', cancelada: 'Cancelada', falto: 'No llegó' };
export const PED_TXT = { nuevo: 'Recibido', listo: 'Listo para recoger', entregado: 'Entregado', cancelado: 'Cancelado' };

const SERVS = [
  ['corte', 'Corte y peinado', 'cabello', 450, 60, 'Lavado, corte a tu medida y peinado.', 'photo-1634449571010-02389ed0f9b0'],
  ['peinado', 'Peinado / brushing', 'cabello', 350, 60, 'Ondas, lacio o recogido para cualquier ocasión.', 'photo-1580618672591-eb180b1a973f'],
  ['keratina', 'Tratamiento de keratina', 'cabello', 1800, 150, 'Cabello liso y sin frizz hasta por 4 meses.', 'photo-1793328556262-79fab6efd759'],
  ['tinte', 'Tinte completo', 'color', 1100, 120, 'Color uniforme de raíz a puntas con tu fórmula guardada.', 'photo-1785456411888-c2e842552820'],
  ['balayage', 'Balayage / mechas', 'color', 2600, 180, 'Iluminación natural pintada a mano.', 'photo-1785456283212-338f5bc44d50'],
  ['gel', 'Manicure en gel', 'unas', 380, 60, 'Esmalte en gel que dura 3 semanas.', 'photo-1610992015762-45dca7fa3a85'],
  ['acrilico', 'Uñas acrílicas', 'unas', 650, 90, 'Largo y forma a tu gusto, con diseño sencillo.', 'photo-1607779097040-26e80aa78e66'],
  ['pedicure', 'Pedicure spa', 'unas', 420, 60, 'Exfoliación, hidratación y esmalte.', 'photo-1632345031435-8727f6897d53'],
  ['pestanas', 'Extensiones de pestañas', 'mirada', 900, 90, 'Pelo a pelo, efecto natural.', 'photo-1589710751893-f9a6770ad71b'],
  ['cejas', 'Diseño de cejas', 'mirada', 250, 30, 'Diseño, depilación y tinte.', 'photo-1674049406467-824ea37c7184'],
  ['maquillaje', 'Maquillaje social', 'maquillaje', 900, 60, 'Para fiestas, graduaciones y eventos.', 'photo-1773688189414-7637b9b138e1'],
];
const ESTS = [
  ['e1', 'Valeria', 'Color y balayage', ['cabello', 'color'], 'photo-1761839256840-7780a45b85dc', 40],
  ['e2', 'Daniela', 'Cortes y peinados', ['cabello', 'maquillaje'], 'photo-1709477542149-f4e0e21d590b', 40],
  ['e3', 'Fer', 'Uñas, pestañas y cejas', ['unas', 'mirada'], 'photo-1594465919760-441fe5908ab0', 45],
];
const PRODS = [
  ['p1', 'Shampoo reparador 300 ml', 'Cabello', 380, 160, 12, 'photo-1631390179406-0bfe17e9f89d', 'Para cabello teñido o maltratado.'],
  ['p2', 'Mascarilla nutritiva', 'Cabello', 420, 170, 8, 'photo-1631729371254-42c2892f0e6e', 'Una vez por semana, 5 minutos.'],
  ['p3', 'Protector térmico en spray', 'Cabello', 360, 140, 3, 'photo-1610595426075-eed5a3f521ee', 'Antes de secadora o plancha.'],
  ['p4', 'Aceite de argán', 'Cabello', 450, 180, 10, 'photo-1622866027662-14e3c5ee67e7', 'Brillo y puntas sin frizz.'],
  ['p5', 'Shampoo matizador', 'Cabello', 400, 165, 6, 'photo-1636740599648-ae84f705fc2e', 'Mantiene el rubio sin tonos amarillos.'],
  ['p6', 'Aceite de cutícula', 'Uñas', 180, 60, 15, 'photo-1624939461078-66a124b3539c', 'Uñas y cutículas hidratadas.'],
  ['p7', 'Kit de brochas', 'Maquillaje', 690, 280, 4, 'photo-1596462502278-27bfdc403348', '8 brochas para rostro y ojos.'],
  ['p8', 'Paleta de sombras nude', 'Maquillaje', 520, 210, 0, 'photo-1512496015851-a90fb38ba796', '12 tonos mate y satinados.'],
];

function semilla() {
  const db = {
    v: 1,
    conf: { nombre: 'Bella Alma', whatsapp: CONFIG.whatsapp, pin: '1234', direccion: 'Av. Ejemplo 900, Ciudad de México', abre: '09:00', cierra: '20:00', visitas: 10, premio: 'Peinado gratis', premioServ: 'peinado', anticipoDesde: 1000, anticipoPct: 30, inactivo: 45, comProd: 10,
      niveles: [{ n: 'Rosa', desde: 0, desc: 0 }, { n: 'Plata', desde: 5, desc: 5 }, { n: 'Oro', desde: 15, desc: 10 }] },
    servs: SERVS.map(([id, n, cat, precio, dur, desc, foto]) => ({ id, n, cat, precio, dur, desc, foto })),
    ests: ESTS.map(([id, n, esp, cats, foto, com]) => ({ id, n, esp, cats, foto, com, activo: true })),
    prods: PRODS.map(([id, n, cat, precio, costo, stock, foto, desc]) => ({ id, n, cat, precio, costo, stock, foto, desc, min: 3, pub: true })),
    clis: [], citas: [], pedidos: [], ventas: [], avisos: {}, sig: 301,
    cupones: [
      { codigo: 'REGRESA20', titulo: '20% para que regreses', tipo: '%', valor: 20, cat: '', vence: dia(30), grupo: 'inactivas', usos: 1, max: 50, activo: true },
      { codigo: 'MANOS100', titulo: '$100 en tu manicure en gel', tipo: '$', valor: 100, cat: 'unas', vence: dia(15), grupo: 'todas', usos: 4, max: 30, activo: true },
      { codigo: 'CUMPLE', titulo: '30% en tu mes de cumpleaños', tipo: '%', valor: 30, cat: '', vence: dia(365), grupo: 'cumple', usos: 2, max: 999, activo: true },
    ],
  };
  // [id, nombre, tel, estilista, servicio, cada cuántos días, días desde la última, cumpleaños, alergias, fórmula de color, notas]
  const C = [
    ['c1', 'Mariana Ríos', '5512340001', 'e1', 'tinte', 30, 25, '02-11', '', '7.1 + 7.3 (1:1), oxidante 20 vol, 35 min. Matizar con 9.1.', 'Le gusta el café sin azúcar.'],
    ['c2', 'Paola Méndez', '5512340002', 'e3', 'gel', 21, 9, '11-30', 'Acetona: irritación', '', 'Uñas cortas, almendra. Tonos nude.'],
    ['c3', 'Lucía Fernández', '5512340003', 'e2', 'corte', 45, 60, '06-18', '', '', 'Capas largas, no muy corto.'],
    ['c4', 'Sofía Herrera', '5512340004', 'e1', 'balayage', 75, 70, '11-12', '', 'Decoloración 9 vol 30 + tóner 10.21, 20 min.', 'Cuero cabelludo sensible.'],
    ['c5', 'Andrea Castillo', '5512340005', 'e3', 'pestanas', 21, 15, '09-03', 'Pegamento con látex', '', 'Efecto natural 10-12 mm.'],
    ['c6', 'Gabriela Ortiz', '5512340006', 'e2', 'peinado', 14, 6, '04-25', '', '', 'Ondas sueltas.'],
    ['c7', 'Carmen Vega', '5512340007', 'e3', 'pedicure', 30, 95, '01-08', '', '', ''],
    ['c8', 'Ximena Torres', '5512340008', 'e2', 'maquillaje', 40, 20, '11-21', '', '', 'Piel mixta, le gusta el delineado.'],
  ];
  const sv = (id) => db.servs.find((s) => s.id === id);
  for (const [id, n, tel, est, serv, cada, ult, cumple, alergias, formula, notas] of C) {
    db.clis.push({ id, n, tel, cumple, alergias, formula, notas, alta: dia(-400), visitas: 0, canjes: 0 });
    for (let d = ult; d <= 360; d += cada) {
      const fecha = domingo(dia(-d)) ? dia(-d - 1) : dia(-d);
      const c = { id: uid(), cli: id, est, serv, fecha, hora: ['10:00', '12:00', '16:00'][d % 3], dur: sv(serv).dur, estado: 'terminada', origen: d % 2 ? 'en línea' : 'salón', nota: '' };
      db.citas.push(c);
      terminar(db, c, { propina: [0, 50, 80][d % 3], met: d % 2 ? 'Tarjeta' : 'Efectivo', f: fecha + 'T' + c.hora + ':00', sinStock: true });
    }
  }
  for (const c of db.clis) c.visitas %= db.conf.visitas; // la tarjeta se reinicia en cada premio
  db.clis.find((c) => c.id === 'c6').visitas = 10; // ya ganó su peinado
  db.clis.find((c) => c.id === 'c2').visitas = 9;
  const hoy = domingo(dia()) ? dia(1) : dia();
  const cita = (cli, est, serv, fecha, hora, estado, origen = 'en línea', nota = '') => { const c = { id: uid(), cli, est, serv, fecha, hora, dur: sv(serv).dur, estado, origen, nota }; c.anticipo = anticipoDe(db, sv(serv)); db.citas.push(c); return c; };
  cita('c2', 'e3', 'gel', hoy, '10:00', 'terminada', 'salón');
  terminar(db, db.citas.at(-1), { productos: [{ id: 'p6', cant: 1 }], propina: 40, met: 'Tarjeta' });
  cita('c1', 'e1', 'tinte', hoy, '11:00', 'atencion', 'en línea', 'Retoque de raíz').anticipo.pagado = true;
  cita('c6', 'e2', 'peinado', hoy, '13:00', 'llego', 'en línea', 'Evento en la noche');
  cita('c5', 'e3', 'pestanas', hoy, '16:00', 'reservada', 'en línea', 'Relleno');
  cita('c8', 'e2', 'maquillaje', hoy, '18:00', 'reservada', 'en línea', 'Cumpleaños hoy 🎂');
  cita('c4', 'e1', 'balayage', dia(domingo(dia(1)) ? 2 : 1), '10:00', 'reservada', 'en línea');
  // Pedidos de la tienda en línea.
  const ped = (cli, items, estado, hace) => { const p = crearPedido(db, cli, items, dia(-hace) + 'T18:00:00'); p.estado = estado; if (estado === 'entregado') p.pagado = true; };
  ped('c1', [{ id: 'p5', cant: 1 }, { id: 'p4', cant: 1 }], 'listo', 1);
  ped('c3', [{ id: 'p2', cant: 1 }], 'nuevo', 0);
  ped('c4', [{ id: 'p1', cant: 2 }], 'entregado', 12);
  return db;
}

export const abrir = () => base('salon', semilla);
export const serv = (db, id) => db.servs.find((s) => s.id === id);
export const est = (db, id) => db.ests.find((e) => e.id === id);
export const cli = (db, id) => db.clis.find((c) => c.id === id);
export const prod = (db, id) => db.prods.find((p) => p.id === id);
export const anticipoDe = (db, s) => (s.precio >= db.conf.anticipoDesde ? { monto: Math.round(s.precio * db.conf.anticipoPct / 100), pagado: false } : null);
export const visitasTot = (db, cId) => db.citas.filter((c) => c.cli === cId && c.estado === 'terminada').length;
export function nivel(db, cId) { const v = visitasTot(db, cId); return [...db.conf.niveles].reverse().find((n) => v >= n.desde); }
export const ultima = (db, cId) => db.citas.filter((c) => c.cli === cId && c.estado === 'terminada').map((c) => c.fecha).sort().at(-1);
export const esCumple = (c) => !!c.cumple && c.cumple.slice(0, 2) === dia().slice(5, 7);

export function libres(db, estId, fecha, dur) {
  if (domingo(fecha)) return [];
  const ocup = db.citas.filter((c) => c.est === estId && c.fecha === fecha && !['cancelada', 'falto'].includes(c.estado)).map((c) => [min(c.hora), min(c.hora) + c.dur]);
  const ahora = fecha === dia() ? new Date().getHours() * 60 + new Date().getMinutes() : 0;
  const l = [];
  for (let m = min(db.conf.abre); m + dur <= min(db.conf.cierra); m += 30) if (m > ahora && !ocup.some(([a, b]) => m < b && m + dur > a)) l.push(hhmm(m));
  return l;
}
export const estsPara = (db, servId) => db.ests.filter((e) => e.activo && e.cats.includes(serv(db, servId).cat));
export function libresTodas(db, servId, fecha) {
  const m = new Map(); const s = serv(db, servId);
  for (const e of estsPara(db, servId)) for (const h of libres(db, e.id, fecha, s.dur)) if (!m.has(h)) m.set(h, e.id);
  return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

export function reservar(db, { cli: cId, est: eId, serv: sId, fecha, hora, origen = 'en línea', nota = '', cupon = '' }) {
  const s = serv(db, sId); const e = est(db, eId);
  if (!e || !e.cats.includes(s.cat)) throw new Error('Esa estilista no hace ese servicio.');
  if (!libres(db, eId, fecha, s.dur).includes(hora)) throw new Error('Ese horario ya se ocupó. Elige otro.');
  if (cupon) { const v = validarCupon(db, cupon, sId, cId); if (!v.ok) throw new Error(v.msg); }
  const c = { id: uid(), cli: cId, est: eId, serv: sId, fecha, hora, dur: s.dur, estado: 'reservada', origen, nota, cupon: cupon.toUpperCase(), anticipo: anticipoDe(db, s) };
  db.citas.push(c);
  return c;
}

// Cupón: vigente, con usos, para la categoría del servicio y para el grupo de la clienta.
export function validarCupon(db, codigo, servId, cId) {
  const k = db.cupones.find((x) => x.codigo === String(codigo).trim().toUpperCase());
  if (!k || !k.activo) return { ok: false, msg: 'Ese código no existe.' };
  if (k.vence < dia()) return { ok: false, msg: 'Ese código ya venció.' };
  if (k.usos >= k.max) return { ok: false, msg: 'Ese código ya se agotó.' };
  const s = serv(db, servId);
  if (k.cat && s.cat !== k.cat) return { ok: false, msg: `Ese código es solo para ${CATS[k.cat].toLowerCase()}.` };
  const c = cId && cli(db, cId);
  if (k.grupo === 'cumple' && !(c && esCumple(c))) return { ok: false, msg: 'Ese código es para tu mes de cumpleaños.' };
  if (k.grupo === 'inactivas' && !(c && ultima(db, c.id) && diasEntre(ultima(db, c.id), dia()) > db.conf.inactivo)) return { ok: false, msg: 'Ese código es para clientas que no han venido en un tiempo.' };
  if (k.grupo === 'oro' && !(c && nivel(db, c.id).n === 'Oro')) return { ok: false, msg: 'Ese código es para clientas nivel Oro.' };
  const desc = k.tipo === '%' ? Math.round(s.precio * k.valor / 100) : Math.min(s.precio, k.valor);
  return { ok: true, desc, k, msg: `${k.titulo}: -$${desc}` };
}

// Total de una cita: servicio − cupón − premio, productos con descuento de nivel, menos el anticipo ya pagado.
export function cobroDe(db, c, { productos = [], canje = false, cupon = c.cupon || '' } = {}) {
  const s = serv(db, c.serv); const cl = cli(db, c.cli);
  const vc = cupon ? validarCupon(db, cupon, c.serv, c.cli) : null;
  const dCupon = vc?.ok ? vc.desc : 0;
  const dPremio = canje ? Math.min(s.precio - dCupon, serv(db, db.conf.premioServ).precio) : 0;
  const pct = cl ? nivel(db, cl.id).desc : 0;
  const prods = productos.reduce((t, p) => t + Math.round(prod(db, p.id).precio * p.cant * (1 - pct / 100)), 0);
  const servicio = s.precio - dCupon - dPremio;
  const ant = c.anticipo?.pagado ? c.anticipo.monto : 0;
  return { servicio, prods, dCupon, dPremio, pct, ant, cuponOk: vc?.ok ? vc.k.codigo : '', cuponMsg: vc && !vc.ok ? vc.msg : '' };
}
export function terminar(db, c, { productos = [], propina = 0, met = 'Efectivo', canje = false, cupon, f = new Date().toISOString(), sinStock = false } = {}) {
  const cl = cli(db, c.cli);
  if (canje && (!cl || cl.visitas < db.conf.visitas)) throw new Error('Todavía no junta las visitas para el premio.');
  if (!sinStock) for (const p of productos) if (prod(db, p.id).stock < p.cant) throw new Error(`Solo hay ${prod(db, p.id).stock} de ${prod(db, p.id).n}.`);
  const k = cobroDe(db, c, { productos, canje, cupon: cupon ?? c.cupon ?? '' });
  if (!sinStock) for (const p of productos) prod(db, p.id).stock -= p.cant;
  if (k.cuponOk) db.cupones.find((x) => x.codigo === k.cuponOk).usos++;
  c.venta = { servicio: k.servicio, prods: k.prods, productos, propina: Math.max(0, Math.round(propina)), met, ant: k.ant, cupon: k.cuponOk, dCupon: k.dCupon, dPremio: k.dPremio, f };
  c.estado = 'terminada';
  if (cl) { if (canje) { cl.visitas -= db.conf.visitas; cl.canjes++; } cl.visitas++; }
  return c.venta;
}

// Pedido de la tienda: aparta las piezas y aplica el descuento del nivel de la clienta.
export function crearPedido(db, cId, items, f = new Date().toISOString()) {
  if (!items.length) throw new Error('Tu bolsa está vacía.');
  for (const it of items) { const p = prod(db, it.id); if (!p || !p.pub || p.stock < it.cant) throw new Error(`Ya no hay suficiente ${p?.n || 'producto'}.`); }
  const pct = nivel(db, cId).desc;
  const lin = items.map((it) => ({ id: it.id, cant: it.cant, precio: Math.round(prod(db, it.id).precio * (1 - pct / 100)) }));
  for (const it of items) prod(db, it.id).stock -= it.cant;
  const p = { folio: 'BA-' + db.sig++, cli: cId, items: lin, total: lin.reduce((s, x) => s + x.precio * x.cant, 0), pct, estado: 'nuevo', pagado: false, f };
  db.pedidos.push(p);
  return p;
}
export function cancelarPedido(db, p) { if (p.estado === 'cancelado') return; for (const it of p.items) prod(db, it.id).stock += it.cant; p.estado = 'cancelado'; }

export function comisiones(db, desde, hasta) {
  return db.ests.map((e) => {
    const cs = db.citas.filter((c) => c.est === e.id && c.venta && loc(c.venta.f) >= desde && loc(c.venta.f) <= hasta);
    const s = cs.reduce((t, c) => t + c.venta.servicio, 0), p = cs.reduce((t, c) => t + c.venta.prods, 0), pr = cs.reduce((t, c) => t + c.venta.propina, 0);
    return { e, n: cs.length, serv: s, prods: p, prop: pr, pagar: Math.round(s * e.com / 100 + p * db.conf.comProd / 100 + pr) };
  });
}

// Autochequeo.
{
  const db = semilla();
  const f = domingo(dia(3)) ? dia(4) : dia(3);
  let err = false; try { reservar(db, { cli: 'c3', est: 'e3', serv: 'corte', fecha: f, hora: '10:00' }); } catch { err = true; }
  console.assert(err, 'la estilista debe hacer ese servicio');
  const c = reservar(db, { cli: 'c3', est: 'e1', serv: 'balayage', fecha: f, hora: libres(db, 'e1', f, 180)[0] });
  console.assert(c.anticipo?.monto === 780 && !libres(db, 'e1', f, 30).includes(hhmm(min(c.hora) + 150)), 'anticipo 30% y bloque de 3 horas');
  console.assert(validarCupon(db, 'manos100', 'gel', 'c3').desc === 100 && !validarCupon(db, 'MANOS100', 'tinte', 'c3').ok, 'cupón por categoría');
  console.assert(validarCupon(db, 'REGRESA20', 'corte', 'c3').ok && !validarCupon(db, 'REGRESA20', 'corte', 'c6').ok, 'cupón por grupo');
  c.anticipo.pagado = true;
  const v = terminar(db, c, { cupon: 'REGRESA20', productos: [{ id: 'p1', cant: 1 }] });
  console.assert(v.servicio === 2600 - 520 && v.ant === 780, 'cupón y anticipo en el cobro');
  const g = cli(db, 'c6'); const cp = { id: 'x', cli: 'c6', est: 'e2', serv: 'corte', fecha: f, hora: '09:00', dur: 60, estado: 'atencion' };
  terminar(db, cp, { canje: true });
  console.assert(cp.venta.servicio === 100 && g.visitas === 1, 'premio vale el peinado y reinicia la tarjeta');
  const ped = crearPedido(db, 'c1', [{ id: 'p4', cant: 1 }]);
  console.assert(ped.pct === nivel(db, 'c1').desc && ped.total === Math.round(450 * (1 - ped.pct / 100)), 'descuento de nivel en tienda');
  let agot = false; try { crearPedido(db, 'c1', [{ id: 'p8', cant: 1 }]); } catch { agot = true; }
  console.assert(agot, 'no vende agotado');
}
