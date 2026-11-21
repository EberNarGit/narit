// Óptica "Mirada": datos de ejemplo y reglas (armazones, micas, graduaciones, órdenes de laboratorio, garantías).
import { base, uid, haceDias } from '../_base/sis.js';
import { CONFIG } from '../../config.js';

export const dia = (n = 0) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toLocaleDateString('en-CA'); };
export const loc = (s) => (s.length > 10 ? new Date(s).toLocaleDateString('en-CA') : s); // fecha local, no UTC
export const diasEntre = (a, b) => Math.round((Date.parse(loc(b)) - Date.parse(loc(a))) / 864e5);
export const fDia = (s) => new Date(loc(s) + 'T12:00').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
export const fAno = (s) => new Date(loc(s) + 'T12:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
const habil = (n) => (new Date(dia(n) + 'T12:00').getDay() === 0 ? dia(n + 1) : dia(n));

export const ESTADOS = ['recibida', 'laboratorio', 'montaje', 'calidad', 'lista', 'entregada'];
export const EST_TXT = { recibida: 'Recibida', laboratorio: 'En laboratorio', montaje: 'Montaje', calidad: 'Control de calidad', lista: 'Lista para entregar', entregada: 'Entregada', cancelada: 'Cancelada' };
export const EST_DESC = { recibida: 'Tomamos tus medidas y tu graduación.', laboratorio: 'Tus micas se están fabricando.', montaje: 'Estamos colocando tus micas en el armazón.', calidad: 'Revisamos la graduación con el lensómetro.', lista: '¡Ya puedes pasar por tus lentes!', entregada: 'Entregados. ¡Disfrútalos!' };
export const FORMAS = ['Rectangular', 'Redondo', 'Cuadrado', 'Aviador', 'Cat-eye'];
export const MATERIALES = ['Acetato', 'Metal', 'Titanio', 'TR90'];
export const MICAS = { mono: { n: 'Monofocal', p: 900, dias: 4, desc: 'Para ver de lejos o de cerca' }, bifo: { n: 'Bifocal', p: 1600, dias: 6, desc: 'Lejos y cerca, con línea' }, prog: { n: 'Progresivo', p: 3800, dias: 8, desc: 'Lejos, intermedio y cerca, sin línea' }, lc: { n: 'Lentes de contacto (6 meses)', p: 1100, dias: 2, desc: 'Caja para 6 meses', sinArm: true } };
export const TRATS = { ar: { n: 'Antirreflejante', p: 450 }, blue: { n: 'Filtro de luz azul', p: 550 }, foto: { n: 'Fotocromático', p: 1200 }, alto: { n: 'Alto índice (más delgada)', p: 900 } };
export const LABS = ['Laboratorio Visión Centro', 'Lentes Precisión'];
export const HORAS = ['10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'];
export const CITA_TXT = { pendiente: 'Por confirmar', confirmada: 'Confirmada', completada: 'Atendida', cancelada: 'Cancelada', falto: 'No llegó' };

function semilla() {
  // [id, marca, modelo, forma, material, género, color, precio, costo, stock, foto, días en tienda, días desde última venta]
  const A = [
    ['a1', 'Kora', 'Lía', 'Cat-eye', 'Acetato', 'Mujer', 'Carey', 2190, 820, 4, 'photo-1602703522866-fb486308da5d', 90, 6],
    ['a2', 'Norte', 'Bruno', 'Rectangular', 'Acetato', 'Hombre', 'Negro mate', 1890, 690, 6, 'photo-1591843336309-cbf414ad7978', 200, 3],
    ['a3', 'Lumen', 'Aire', 'Redondo', 'Titanio', 'Unisex', 'Plata', 3290, 1350, 2, 'photo-1614715838608-dd527c46231d', 120, 15],
    ['a4', 'Norte', 'Ciro', 'Cuadrado', 'Acetato', 'Unisex', 'Negro', 1690, 610, 8, 'photo-1556306510-31ca015374b0', 300, 9],
    ['a5', 'Ámbar', 'Sol', 'Redondo', 'Acetato', 'Unisex', 'Negro y miel', 2490, 940, 3, 'photo-1603578119639-798b8413d8d7', 60, 2],
    ['a6', 'Kora', 'Vera', 'Rectangular', 'TR90', 'Mujer', 'Transparente', 1590, 540, 5, 'photo-1646084081219-1090f72a531c', 30, 30],
    ['a7', 'Lumen', 'Piloto', 'Aviador', 'Metal', 'Hombre', 'Dorado', 2890, 1100, 1, 'photo-1615468822882-4828d2602857', 240, 40],
    ['a8', 'Ámbar', 'Dante', 'Rectangular', 'Acetato', 'Hombre', 'Café', 1990, 720, 4, 'photo-1608539733377-5557e02926b5', 180, 12],
    ['a9', 'Norte', 'Teo', 'Rectangular', 'Metal', 'Unisex', 'Negro', 1490, 520, 7, 'photo-1608906709312-fe17f7c1a5a6', 400, 160],
    ['a10', 'Kora', 'Mila', 'Redondo', 'Acetato', 'Mujer', 'Cristal', 1790, 640, 3, 'photo-1574258495973-f010dfbb5371', 45, 20],
    ['a11', 'Lumen', 'Marco', 'Cuadrado', 'Acetato', 'Hombre', 'Negro brillante', 2290, 860, 0, 'photo-1519419166318-4f5c601b8e6c', 210, 8],
    ['a12', 'Ámbar', 'Nube', 'Redondo', 'TR90', 'Unisex', 'Negro', 1390, 460, 9, 'photo-1686165862816-ed104011f9a9', 500, 220],
  ];
  const db = {
    v: 1,
    conf: { nombre: 'Óptica Mirada', whatsapp: CONFIG.whatsapp, pin: '1234', direccion: 'Av. Ejemplo 321, Ciudad de México', horario: 'Lun a sáb 10:00 a 19:00', examen: 250, anticipo: 50, garantia: 12, recall: 12 },
    micas: JSON.parse(JSON.stringify(MICAS)), trats: JSON.parse(JSON.stringify(TRATS)),
    arms: A.map(([id, marca, modelo, forma, material, genero, color, precio, costo, stock, foto, enTienda, ult]) => ({ id, marca, modelo, forma, material, genero, color, precio, costo, stock, min: 1, foto, pub: true, alta: dia(-enTienda), ultVenta: dia(-ult) })),
    pacs: [
      ['p1', 'Andrea Gómez', '5510101010', 29], ['p2', 'Ricardo Pérez', '5520202020', 47], ['p3', 'Elena Vázquez', '5530303030', 58],
      ['p4', 'Tomás Ruiz', '5540404040', 35], ['p5', 'Gabriela Núñez', '5550505050', 22], ['p6', 'Héctor Salas', '5560606060', 63], ['p7', 'Mónica Lara', '5570707070', 41],
    ].map(([id, n, tel, edad]) => ({ id, n, tel, nac: dia(-edad * 365 - 50) })),
    grads: [], ordenes: [], citas: [], apartados: [], pagos: [], sig: 2041, avisos: {},
  };
  const g = (pac, hace, od, oi, add = 0, dip = 62, opto = 'Lic. Opt. Carla Ibarra') => { const x = { id: uid(), pac, f: dia(-hace), od: { esf: od[0], cil: od[1], eje: od[2], add }, oi: { esf: oi[0], cil: oi[1], eje: oi[2], add }, dip, opto }; db.grads.push(x); return x; };
  g('p1', 760, [-1.25, -0.5, 180], [-1.0, -0.25, 170]); g('p1', 395, [-1.75, -0.5, 180], [-1.5, -0.5, 175]); const gA = g('p1', 2, [-2.25, -0.75, 180], [-2.0, -0.5, 175]);
  const gR = g('p2', 9, [0.75, -0.5, 90], [1.0, -0.25, 85], 1.75, 64);
  const gE = g('p3', 20, [2.0, -1.0, 95], [2.25, -0.75, 90], 2.5, 63); g('p3', 420, [1.5, -0.75, 95], [1.75, -0.75, 90], 2.25, 63);
  const gT = g('p4', 5, [-3.5, -1.25, 10], [-3.25, -1.0, 170], 0, 65);
  const gG = g('p5', 190, [-0.75, 0, 0], [-0.75, -0.25, 180], 0, 60);
  const gH = g('p6', 400, [1.25, -0.5, 80], [1.5, -0.5, 100], 2.75, 64);
  const gM = g('p7', 1, [-1.0, -1.5, 30], [-1.25, -1.25, 150], 0, 61);
  const o = (pac, gr, arm, mica, trats, hace, estado, pagado, promesaEn, lab = 0) => {
    const ord = nuevaOrden(db, { pac, grad: gr.id, arm, mica, trats, f: haceDias(hace, 12), anticipo: 0, lab: LABS[lab] });
    ord.promesa = habil(-hace + promesaEn);
    ord.hist = ESTADOS.slice(0, ESTADOS.indexOf(estado) + 1).map((e, i) => ({ e, f: haceDias(Math.max(hace - i, 0), 11 + i) }));
    ord.estado = estado;
    if (pagado) cobrar(db, ord, pagado, 'Tarjeta', haceDias(hace, 12));
    if (estado === 'entregada') ord.garantia = dia(-hace + 365);
    return ord;
  };
  o('p1', gA, 'a5', 'mono', ['ar', 'blue'], 2, 'laboratorio', 2000, 4);
  o('p2', gR, 'a8', 'prog', ['ar'], 9, 'laboratorio', 3500, 6, 1); // atrasada
  o('p3', gE, 'a3', 'prog', ['ar', 'alto'], 18, 'lista', 4000, 8); // lista hace días sin recoger
  o('p4', gT, 'a2', 'mono', ['ar', 'alto'], 5, 'montaje', 2000, 5);
  o('p6', gH, 'a7', 'bifo', ['ar', 'foto'], 400, 'entregada', null, 6); db.ordenes.at(-1).hist.push({ e: 'entregada', f: haceDias(394, 13) });
  o('p5', gG, 'propio', 'lc', [], 190, 'entregada', null, 2); // lentes de contacto: toca recompra
  o('p1', db.grads[1], 'a10', 'mono', ['ar'], 395, 'entregada', null, 4);
  for (const x of db.ordenes.filter((y) => y.estado === 'entregada')) cobrar(db, x, x.total - x.pagado, 'Efectivo', x.f);
  const cita = (pac, d, hora, estado, origen = 'tienda', nota = '') => db.citas.push({ id: uid(), pac, fecha: habil(d), hora, estado, origen, nota });
  cita('p7', 0, '11:00', 'completada'); cita('p6', 0, '12:30', 'confirmada', 'portal', 'Ya no veo bien de cerca');
  cita('p5', 0, '17:00', 'pendiente', 'portal', 'Revisión y lentes de contacto'); cita('p2', 1, '10:30', 'confirmada', 'tienda', 'Ajuste de armazón');
  db.apartados.push({ id: uid(), arm: 'a1', n: 'Laura Campos', tel: '5580808080', f: haceDias(1, 18), vence: dia(2), estado: 'activo' });
  for (let i = 3; i < 28; i += 4) db.pagos.push({ id: uid(), orden: '', pac: '', monto: 1800 + i * 40, met: 'Tarjeta', f: haceDias(i, 13), concepto: 'Venta de mostrador' });
  return db;
}

export const abrir = () => base('optica', semilla);
export const arm = (db, id) => db.arms.find((a) => a.id === id);
export const nombreArm = (db, id) => (id === 'propio' || !id ? 'Armazón propio' : `${arm(db, id).marca} ${arm(db, id).modelo}`);
export const precioOrden = (db, { arm: a, mica, trats = [] }) => (a && a !== 'propio' && !db.micas[mica].sinArm ? arm(db, a).precio : 0) + db.micas[mica].p + trats.reduce((s, t) => s + db.trats[t].p, 0);
export const saldo = (o) => o.total - o.pagado;
export const atrasada = (o) => ESTADOS.indexOf(o.estado) < ESTADOS.indexOf('lista') && o.estado !== 'cancelada' && o.promesa < dia();
export const sinRecoger = (o) => o.estado === 'lista' && diasEntre(o.hist.at(-1).f, dia()) >= 3;

// Crea la orden: descuenta el armazón del inventario y calcula la fecha prometida según la mica.
export function nuevaOrden(db, { pac, grad, arm: a, mica, trats = [], f = new Date().toISOString(), anticipo = 0, met = 'Efectivo', lab = LABS[0], notas = '' }) {
  if (!db.micas[mica]) throw new Error('Elige el tipo de mica.');
  const sinArm = db.micas[mica].sinArm;
  if (!sinArm && a !== 'propio') {
    const x = arm(db, a);
    if (!x || x.stock <= 0) throw new Error('Ese armazón ya no tiene piezas.');
    x.stock--; x.ultVenta = f.slice(0, 10);
  }
  const total = precioOrden(db, { arm: sinArm ? '' : a, mica, trats });
  const o = { folio: 'OM-' + db.sig++, pac, grad, arm: sinArm ? '' : a, mica, trats, f, total, pagado: 0, pagos: [], estado: 'recibida', hist: [{ e: 'recibida', f }], promesa: habil(diasEntre(dia(), f) + db.micas[mica].dias), lab, notas, garantia: '' };
  db.ordenes.push(o);
  if (anticipo > 0) cobrar(db, o, anticipo, met, f);
  return o;
}

export function cobrar(db, o, monto, met, f = new Date().toISOString()) {
  const m = Math.min(saldo(o), Math.round(monto));
  if (!(m > 0)) throw new Error('Monto no válido');
  o.pagado += m; o.pagos.push({ monto: m, met, f });
  db.pagos.push({ id: uid(), orden: o.folio, pac: o.pac, monto: m, met, f, concepto: `Orden ${o.folio}` });
  return m;
}

export function avanzar(db, o) {
  const i = ESTADOS.indexOf(o.estado);
  if (i < 0 || i >= ESTADOS.length - 1) return;
  o.estado = ESTADOS[i + 1]; o.hist.push({ e: o.estado, f: new Date().toISOString() });
  if (o.estado === 'entregada') o.garantia = dia(db.conf.garantia * 30.4);
}

export const ultGrad = (db, pacId) => db.grads.filter((g) => g.pac === pacId).sort((a, b) => b.f.localeCompare(a.f))[0];
export const examenToca = (db, pacId) => { const g = ultGrad(db, pacId); return !g || diasEntre(g.f, dia()) > db.conf.recall * 30.4; };
export const lcToca = (db, pacId) => db.ordenes.some((o) => o.pac === pacId && o.mica === 'lc' && o.estado === 'entregada' && diasEntre(o.f, dia()) > 165) && !db.ordenes.some((o) => o.pac === pacId && o.mica === 'lc' && diasEntre(o.f, dia()) <= 165);
export const fmtG = (v, signo = true) => (v === 0 ? '0.00' : (signo && v > 0 ? '+' : '') + v.toFixed(2));

export function horasLibres(db, fecha) {
  const ahora = new Date().toTimeString().slice(0, 5);
  return HORAS.filter((h) => !db.citas.some((c) => c.fecha === fecha && c.hora === h && c.estado !== 'cancelada') && (fecha !== dia() || h > ahora));
}

// Autochequeo.
{
  const db = semilla();
  const s0 = arm(db, 'a4').stock;
  const o = nuevaOrden(db, { pac: 'p4', grad: '', arm: 'a4', mica: 'prog', trats: ['ar'], anticipo: 100 });
  console.assert(o.total === 1690 + 3800 + 450 && arm(db, 'a4').stock === s0 - 1 && o.pagado === 100, 'orden: precio, stock, anticipo');
  console.assert(o.promesa === habil(8), 'promesa según mica');
  console.assert(cobrar(db, o, 99999, 'Efectivo') === o.total - 100 && saldo(o) === 0, 'no cobra de más');
  const lc = nuevaOrden(db, { pac: 'p5', arm: 'a4', mica: 'lc' });
  console.assert(lc.total === 1100 && lc.arm === '', 'lentes de contacto sin armazón');
  let err = false; try { nuevaOrden(db, { pac: 'p1', arm: 'a11', mica: 'mono' }); } catch { err = true; }
  console.assert(err, 'no vende armazón agotado');
  console.assert(db.ordenes.some(atrasada) && db.ordenes.some(sinRecoger), 'detecta atrasos y sin recoger');
  console.assert(examenToca(db, 'p6') && !examenToca(db, 'p1'), 'examen anual');
  for (const e of ESTADOS.slice(1)) avanzar(db, o);
  console.assert(o.estado === 'entregada' && o.garantia > dia(300), 'garantía al entregar');
}
