// Taller mecánico "Motor Sur": datos de ejemplo y reglas (órdenes, cotización con autorización, refacciones, garantías, servicio).
import { base, uid, haceDias } from '../_base/sis.js';
import { CONFIG } from '../../config.js';

export const dia = (n = 0) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toLocaleDateString('en-CA'); };
export const loc = (s) => (s.length > 10 ? new Date(s).toLocaleDateString('en-CA') : s);
export const diasEntre = (a, b) => Math.round((Date.parse(loc(b)) - Date.parse(loc(a))) / 864e5);
export const fDia = (s) => new Date(loc(s) + 'T12:00').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
export const domingo = (s) => new Date(s + 'T12:00').getDay() === 0;
const habil = (n) => (domingo(dia(n)) ? dia(n + 1) : dia(n));

export const ESTADOS = ['recibido', 'diagnostico', 'autorizacion', 'refaccion', 'reparacion', 'pruebas', 'listo', 'entregado'];
export const EST_TXT = { recibido: 'Recibido', diagnostico: 'En diagnóstico', autorizacion: 'Esperando tu autorización', refaccion: 'Esperando refacción', reparacion: 'En reparación', pruebas: 'Pruebas y lavado', listo: 'Listo para entregar', entregado: 'Entregado', cancelado: 'Cancelado' };
export const EST_CORTO = { recibido: 'Recibido', diagnostico: 'Diagnóstico', autorizacion: 'Autorización', refaccion: 'Refacción', reparacion: 'Reparación', pruebas: 'Pruebas', listo: 'Listo', entregado: 'Entregado' };
export const EST_DESC = {
  recibido: 'Recibimos tu auto y revisamos su estado de entrada.', diagnostico: 'El mecánico está revisando qué necesita.',
  autorizacion: 'Necesitamos que apruebes la cotización para continuar.', refaccion: 'Pedimos las refacciones; en cuanto lleguen seguimos.',
  reparacion: 'Tu auto está en reparación.', pruebas: 'Hacemos prueba de manejo y lo lavamos.', listo: '¡Ya puedes pasar por tu auto!', entregado: 'Entregado. Tu garantía está activa.',
};
export const GAS = ['Reserva', '1/4', '1/2', '3/4', 'Lleno'];
export const HORAS = ['09:00', '10:00', '11:00', '12:00', '13:00', '15:00', '16:00', '17:00'];
const BAHIAS = 3;

const SERVS = [
  ['diag', 'Diagnóstico por computadora', 450, 'Escaneo, revisión de luces de tablero y reporte por escrito.', 'photo-1615906655593-ad0386982a0f'],
  ['afin', 'Afinación mayor', 2400, 'Bujías, filtros, limpieza de inyectores y cuerpo de aceleración.', 'photo-1771340012378-3c86cb649193'],
  ['aceite', 'Cambio de aceite y filtro', 850, 'Aceite sintético, filtro y revisión de 20 puntos.', 'photo-1771340742493-52fbd5476ccb'],
  ['frenos', 'Frenos', 1600, 'Balatas, rectificado de discos y líquido de frenos.', 'photo-1760317890314-e964ffd7e6a6'],
  ['susp', 'Suspensión y llantas', 1900, 'Amortiguadores, alineación y balanceo.', 'photo-1645445522156-9ac06bc7a767'],
  ['motor', 'Reparación de motor', 6500, 'Fugas, empaques, distribución y sobrecalentamiento.', 'photo-1619642751034-765dfdf7c58e'],
];

function semilla() {
  const db = {
    v: 1,
    conf: { nombre: 'Motor Sur', whatsapp: CONFIG.whatsapp, pin: '1234', direccion: 'Av. Ejemplo 1500, Ciudad de México', horario: 'Lun a vie 8:30 a 18:30 · Sáb 9:00 a 14:00', garantiaDias: 90, garantiaKm: 5000, servKm: 10000, servMeses: 6 },
    servs: SERVS.map(([id, n, desde, desc, foto]) => ({ id, n, desde, desc, foto })),
    mecs: [{ id: 'm1', n: 'Raúl', esp: 'Motor y diagnóstico', com: 30 }, { id: 'm2', n: 'Beto', esp: 'Frenos y suspensión', com: 30 }, { id: 'm3', n: 'Iván', esp: 'Eléctrico y afinación', com: 25 }],
    clis: [], autos: [], ordenes: [], citas: [], avisos: {}, sig: 1201,
  };
  const C = [
    ['c1', 'Laura Jiménez', '5531112233'], ['c2', 'Fernando Ruiz', '5532223344'], ['c3', 'Patricia Morales', '5533334455'],
    ['c4', 'Óscar Delgado', '5534445566'], ['c5', 'Gloria Navarro', '5535556677'], ['c6', 'Manuel Castro', '5536667788'],
  ];
  db.clis = C.map(([id, n, tel]) => ({ id, n, tel }));
  // [id, cliente, placa, marca, modelo, año, color, foto, km]
  db.autos = [
    ['a1', 'c1', 'MXA-123-B', 'Nissan', 'Versa', 2019, 'Rojo', 'photo-1550355291-bbee04a92027', 68400],
    ['a2', 'c2', 'NLR-458-C', 'Volkswagen', 'Jetta', 2017, 'Plata', 'photo-1771962033103-da4ef275b9c0', 112300],
    ['a3', 'c3', 'PQS-902-A', 'Honda', 'CR-V', 2020, 'Blanco', 'photo-1722088354375-3c64b4d994b6', 54100],
    ['a4', 'c4', 'TRV-771-D', 'Chevrolet', 'Aveo', 2018, 'Gris', 'photo-1663852408695-f57f4d75a536', 98700],
    ['a5', 'c5', 'GHJ-330-E', 'Mazda', '3', 2021, 'Rojo', 'photo-1658662160331-62f7e52e63de', 41200],
    ['a6', 'c6', 'KLM-615-F', 'Toyota', 'Corolla', 2016, 'Negro', 'photo-1614160859544-177611d11f6b', 145900],
  ].map(([id, cli, placa, marca, modelo, anio, color, foto, km]) => ({ id, cli, placa, marca, modelo, anio, color, foto, km, ult: null }));

  const mo = (n, precio) => ({ id: uid(), tipo: 'mo', n, precio, costo: 0, est: 'autorizado' });
  const ref = (n, precio, costo, prov = 'Refaccionaria Central', eta = '', llego = true) => ({ id: uid(), tipo: 'ref', n, precio, costo, est: 'autorizado', prov, eta, llego });
  const orden = (auto, hace, estado, mec, motivo, items, bit = [], extra = {}) => {
    const a = db.autos.find((x) => x.id === auto);
    const o = { folio: 'MS-' + db.sig++, auto, cli: a.cli, f: haceDias(hace, 9), motivo, km: a.km, gas: '1/2', inv: 'Llanta de refacción, gato, tapetes', danos: 'Rayón en defensa trasera', mec, estado, hist: [], items, bitacora: bit, promesa: habil(-hace + 3), pagos: [], garantia: '', ...extra };
    const i = ESTADOS.indexOf(estado);
    o.hist = ESTADOS.slice(0, i + 1).filter((e) => e !== 'refaccion' || o.items.some((x) => x.tipo === 'ref')).map((e, k) => ({ e, f: haceDias(Math.max(hace - k * 0.4, 0), 9 + k) }));
    db.ordenes.push(o);
    return o;
  };
  // Laura: esperando autorización de una cotización (el caso de la demo).
  orden('a1', 1, 'autorizacion', 'm2', 'Rechinan los frenos y vibra el volante al frenar', [
    { ...mo('Diagnóstico de frenos', 450) },
    { ...ref('Balatas delanteras cerámicas', 1250, 680, 'Refacciones del Valle', '', false), est: 'pendiente' },
    { ...mo('Rectificado de discos delanteros', 700), est: 'pendiente' },
    { ...ref('Líquido de frenos DOT 4', 280, 120), est: 'pendiente' },
    { ...mo('Mano de obra cambio de balatas', 600), est: 'pendiente' },
  ], [
    { f: haceDias(1, 10), txt: 'Recibimos tu Versa. Revisamos frenos y suspensión delantera.', foto: '', pub: true },
    { f: haceDias(0, 9), txt: 'Las balatas delanteras están al 10% y los discos tienen desgaste irregular. Te mandamos la cotización.', foto: 'photo-1760317890322-364a810cd4da', pub: true },
  ], { atencion: 'Aprueba la cotización de frenos para continuar.' });
  // Fernando: esperando refacción con fecha de llegada.
  orden('a2', 3, 'refaccion', 'm1', 'Se calienta el motor en el tráfico', [
    mo('Diagnóstico de sistema de enfriamiento', 450), ref('Bomba de agua', 1850, 1100, 'Distribuidora Norte', habil(1), false), ref('Termostato y empaque', 620, 310, 'Distribuidora Norte', habil(1), false),
    ref('Anticongelante 4 L', 480, 230), mo('Mano de obra cambio de bomba y termostato', 1400),
  ], [
    { f: haceDias(3, 11), txt: 'Encontramos fuga en la bomba de agua y termostato pegado.', foto: 'photo-1527383418406-f85a3b146499', pub: true },
    { f: haceDias(2, 12), txt: 'Autorizaste la reparación. Pedimos la bomba al distribuidor: llega mañana temprano.', foto: '', pub: true },
  ], { pagos: [{ monto: 2000, met: 'Transferencia', f: haceDias(2, 12), concepto: 'Anticipo para refacciones' }] });
  // Patricia: en reparación.
  orden('a3', 1, 'reparacion', 'm3', 'Servicio de 50,000 km', [mo('Afinación mayor', 1600), ref('Kit de bujías iridio', 1120, 600), ref('Filtros de aire, aceite y gasolina', 690, 330), ref('Aceite sintético 5 L', 950, 520)],
    [{ f: haceDias(0, 10), txt: 'Empezamos la afinación. Todo en orden hasta ahora.', foto: 'photo-1486262715619-67b85e0b08d3', pub: true }, { f: haceDias(0, 11), txt: 'Nota interna: revisar tornillo de cárter, estaba barrido.', foto: '', pub: false }]);
  // Óscar: listo para entregar.
  orden('a4', 2, 'listo', 'm2', 'Ruido en suspensión al pasar topes', [mo('Revisión de suspensión', 350), ref('Par de amortiguadores delanteros', 2400, 1350), mo('Mano de obra amortiguadores', 900), mo('Alineación y balanceo', 550)],
    [{ f: haceDias(1, 15), txt: 'Cambiamos amortiguadores delanteros. Hicimos alineación y prueba de manejo.', foto: 'photo-1696494561430-de087dd0bd69', pub: true }], { pagos: [{ monto: 1500, met: 'Efectivo', f: haceDias(2, 10), concepto: 'Anticipo' }] });
  // Recibido hoy.
  orden('a5', 0, 'diagnostico', 'm1', 'Se prendió el testigo de check engine', [mo('Diagnóstico por computadora', 450)], [{ f: haceDias(0, 9), txt: 'Recibimos tu Mazda. Conectamos el escáner.', foto: '', pub: true }]);
  // Historial entregado (para garantías, ventas y recordatorios).
  const ent = (auto, hace, mec, motivo, items, km) => { const o = orden(auto, hace, 'entregado', mec, motivo, items); const tot = o.items.reduce((s, x) => s + x.precio, 0); o.pagos.push({ monto: tot, met: hace % 2 ? 'Tarjeta' : 'Efectivo', f: haceDias(hace - 1, 17), concepto: 'Pago' }); o.garantia = dia(-hace + db.conf.garantiaDias); o.km = km; const a = db.autos.find((x) => x.id === auto); a.ult = { f: loc(haceDias(hace - 1, 17)), km }; };
  ent('a6', 230, 'm1', 'Servicio de 135,000 km', [mo('Cambio de aceite', 300), ref('Aceite y filtro', 780, 400)], 135200);
  ent('a1', 200, 'm3', 'Cambio de aceite', [mo('Cambio de aceite', 300), ref('Aceite sintético y filtro', 950, 500)], 61000);
  ent('a2', 60, 'm2', 'Cambio de llantas', [ref('4 llantas 205/55 R16', 7200, 5200), mo('Montaje y balanceo', 600)], 109800);
  ent('a3', 20, 'm2', 'Frenos traseros', [ref('Balatas traseras', 890, 450), mo('Mano de obra', 500)], 53900);
  for (let i = 4; i < 28; i += 3) ent(['a1', 'a2', 'a4', 'a5', 'a6'][i % 5], i, ['m1', 'm2', 'm3'][i % 3], 'Servicio', [mo('Mano de obra', 600 + i * 20), ref('Refacciones', 900 + i * 30, 500)], 0);
  db.autos.forEach((a) => { if (a.ult && !a.ult.km) a.ult.km = a.km - 1500; });
  // Citas.
  const cita = (cli, d, hora, serv, estado, nota, auto = '') => db.citas.push({ id: uid(), cli, auto, fecha: habil(d), hora, serv, estado, nota, origen: 'en línea' });
  cita('c6', 0, '11:00', 'aceite', 'confirmada', 'Ya le toca su servicio', 'a6');
  cita('c2', 1, '10:00', 'diag', 'pendiente', 'Cliente nuevo: Ford Focus 2015, se jalonea', '');
  return db;
}

export const abrir = () => base('taller', semilla);
export const auto = (db, id) => db.autos.find((a) => a.id === id);
export const cli = (db, id) => db.clis.find((c) => c.id === id);
export const mec = (db, id) => db.mecs.find((m) => m.id === id);
export const nombreAuto = (a) => `${a.marca} ${a.modelo} ${a.anio}`;
export const autorizados = (o) => o.items.filter((x) => x.est === 'autorizado');
export const pendientes = (o) => o.items.filter((x) => x.est === 'pendiente');
export const total = (o) => autorizados(o).reduce((s, x) => s + x.precio, 0);
export const pagado = (o) => o.pagos.reduce((s, p) => s + p.monto, 0);
export const saldo = (o) => total(o) - pagado(o);
export const refsFaltan = (o) => autorizados(o).filter((x) => x.tipo === 'ref' && !x.llego);
export const atrasada = (o) => !['listo', 'entregado', 'cancelado'].includes(o.estado) && o.promesa < dia();
const marca = (o, e) => { o.estado = e; o.hist.push({ e, f: new Date().toISOString() }); };

// Agregar trabajo encontrado: queda pendiente y la orden pasa a esperar al cliente.
export function agregarItem(db, o, { tipo, n, precio, costo = 0, prov = '', eta = '' }) {
  if (!n || !(precio > 0)) throw new Error('Escribe concepto y precio.');
  o.items.push({ id: uid(), tipo, n, precio: Math.round(precio), costo: Math.round(costo), est: 'pendiente', prov, eta, llego: tipo === 'ref' ? false : undefined });
}
export function pedirAutorizacion(o, motivo = 'Aprueba la cotización para continuar.') {
  if (!pendientes(o).length) throw new Error('No hay conceptos pendientes de autorizar.');
  if (o.estado !== 'autorizacion') marca(o, 'autorizacion');
  o.atencion = motivo;
}
// El cliente decide concepto por concepto. Al terminar, la orden sigue sola.
export function autorizar(o, decisiones) {
  for (const it of pendientes(o)) if (decisiones[it.id] === true || decisiones[it.id] === false) it.est = decisiones[it.id] ? 'autorizado' : 'rechazado';
  if (pendientes(o).length) return;
  o.atencion = '';
  marca(o, refsFaltan(o).length ? 'refaccion' : 'reparacion');
  o.bitacora.push({ f: new Date().toISOString(), txt: `El cliente ${autorizados(o).length ? 'autorizó' : 'rechazó'} la cotización. ${refsFaltan(o).length ? 'Pedimos las refacciones.' : 'Seguimos con la reparación.'}`, foto: '', pub: true });
}
export function llegoRef(o, itemId) {
  const it = o.items.find((x) => x.id === itemId); it.llego = true;
  if (o.estado === 'refaccion' && !refsFaltan(o).length) { marca(o, 'reparacion'); o.bitacora.push({ f: new Date().toISOString(), txt: 'Llegaron las refacciones. Tu auto ya está en reparación.', foto: '', pub: true }); }
}
export function avanzar(db, o) {
  const sig = { recibido: 'diagnostico', diagnostico: pendientes(o).length ? 'autorizacion' : 'reparacion', reparacion: 'pruebas', pruebas: 'listo' }[o.estado];
  if (!sig) throw new Error('Este paso se mueve con la autorización o la llegada de refacciones.');
  if (sig === 'autorizacion') return pedirAutorizacion(o);
  marca(o, sig);
}
export function cobrar(o, monto, met, concepto = 'Pago') {
  const m = Math.min(saldo(o), Math.round(monto));
  if (!(m > 0)) throw new Error('Monto no válido');
  o.pagos.push({ monto: m, met, f: new Date().toISOString(), concepto });
  return m;
}
export function entregar(db, o, km) {
  if (o.estado !== 'listo') throw new Error('Solo se entrega un auto listo.');
  if (saldo(o) > 0) throw new Error(`Falta cobrar ${saldo(o)}.`);
  const a = auto(db, o.auto);
  o.km = Math.max(km || a.km, a.km); a.km = o.km; a.ult = { f: dia(), km: o.km };
  o.garantia = dia(db.conf.garantiaDias);
  marca(o, 'entregado');
}
// Próximo servicio por tiempo o kilometraje, lo que llegue primero.
export function proxServicio(db, a) {
  if (!a.ult) return null;
  const d = new Date(a.ult.f + 'T12:00'); d.setMonth(d.getMonth() + db.conf.servMeses);
  return { fecha: d.toLocaleDateString('en-CA'), km: a.ult.km + db.conf.servKm, toca: d.toLocaleDateString('en-CA') <= dia(15) || a.km >= a.ult.km + db.conf.servKm - 500 };
}
export const ocupadas = (db, fecha, hora) => db.citas.filter((c) => c.fecha === fecha && c.hora === hora && c.estado !== 'cancelada').length;
export function horasLibres(db, fecha) {
  if (domingo(fecha)) return [];
  const sab = new Date(fecha + 'T12:00').getDay() === 6; const ahora = new Date().toTimeString().slice(0, 5);
  return HORAS.filter((h) => (!sab || h < '14:00') && ocupadas(db, fecha, h) < BAHIAS && (fecha !== dia() || h > ahora));
}
export function comisiones(db, desde, hasta) {
  return db.mecs.map((m) => {
    const os = db.ordenes.filter((o) => o.mec === m.id && o.estado === 'entregado' && loc(o.hist.at(-1).f) >= desde && loc(o.hist.at(-1).f) <= hasta);
    const moT = os.reduce((s, o) => s + autorizados(o).filter((x) => x.tipo === 'mo').reduce((t, x) => t + x.precio, 0), 0);
    return { m, ordenes: os.length, mo: moT, pagar: Math.round(moT * m.com / 100) };
  });
}

// Autochequeo.
{
  const db = semilla();
  const o = db.ordenes.find((x) => x.auto === 'a1');
  const [, bal, rect, liq, mob] = o.items;
  autorizar(o, { [bal.id]: true, [rect.id]: false });
  console.assert(o.estado === 'autorizacion' && pendientes(o).length === 2, 'espera a que decida todo');
  autorizar(o, { [liq.id]: true, [mob.id]: true });
  console.assert(o.estado === 'refaccion' && total(o) === 450 + 1250 + 280 + 600, 'rechazado no suma; con refacción pendiente espera');
  llegoRef(o, bal.id);
  console.assert(o.estado === 'reparacion', 'al llegar la refacción sigue la reparación');
  agregarItem(db, o, { tipo: 'mo', n: 'Hallazgo extra', precio: 300 }); pedirAutorizacion(o);
  console.assert(o.estado === 'autorizacion' && o.atencion, 'trabajo extra pide autorización');
  autorizar(o, { [o.items.at(-1).id]: true }); avanzar(db, o); avanzar(db, o);
  let err = false; try { entregar(db, o, 70000); } catch { err = true; }
  console.assert(o.estado === 'listo' && err, 'no entrega con saldo');
  cobrar(o, 1e6, 'Efectivo'); entregar(db, o, 70000);
  console.assert(o.estado === 'entregado' && saldo(o) === 0 && auto(db, 'a1').km === 70000 && o.garantia === dia(90), 'entrega con garantía y km');
}
