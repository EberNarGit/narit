// Barbería "Filo Barber Club": datos de ejemplo y reglas (agenda por barbero, lealtad, club, comisiones).
import { base, uid } from '../_base/sis.js';
import { CONFIG } from '../../config.js';

export const dia = (n = 0) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toLocaleDateString('en-CA'); };
export const loc = (s) => (s.length > 10 ? new Date(s).toLocaleDateString('en-CA') : s);
export const diasEntre = (a, b) => Math.round((Date.parse(loc(b)) - Date.parse(loc(a))) / 864e5);
export const fDia = (s) => new Date(loc(s) + 'T12:00').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
export const domingo = (s) => new Date(s + 'T12:00').getDay() === 0;
const min = (h) => +h.slice(0, 2) * 60 + +h.slice(3);
const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
export const fin = (c) => hhmm(min(c.hora) + c.dur);

export const ESTADOS = ['reservada', 'llego', 'silla', 'terminada'];
export const EST_TXT = { reservada: 'Reservada', llego: 'Llegó', silla: 'En la silla', terminada: 'Terminada', cancelada: 'Cancelada', falto: 'No llegó' };
export const EST_BADGE = { reservada: 'b-info', llego: 'b-warn', silla: 'b-warn', terminada: 'b-ok', cancelada: 'b-mut', falto: 'b-bad' };

const SERVS = [
  ['corte', 'Corte clásico', 220, 30, 'Tijera y máquina, lavado y peinado.', 'photo-1503951914875-452162b0f3f1', true],
  ['fade', 'Fade / degradado', 260, 30, 'Degradado a piel o bajo, con detalle a navaja.', 'photo-1788328155052-e02abe9ba983', true],
  ['barba', 'Barba', 180, 30, 'Perfilado, toalla caliente y aceite.', 'photo-1599011176306-4a96f1516d4d', false],
  ['combo', 'Corte + barba', 360, 60, 'El completo. Sales listo para la foto.', 'photo-1648221122323-572c13a31663', true],
  ['navaja', 'Afeitado a navaja', 250, 30, 'Afeitado clásico con toallas calientes.', 'photo-1532710093739-9470acff878f', false],
  ['nino', 'Corte niño', 170, 30, 'Menores de 12 años, con paciencia.', 'photo-1705976062088-5433328c2dcd', true],
];
const BARBS = [
  ['b1', 'Toño', 'Fades y diseños', 'photo-1647140655214-e4a2d914971f', 45],
  ['b2', 'Memo', 'Clásicos y barba', 'photo-1605497788044-5a32c7078486', 45],
  ['b3', 'Luis', 'Navaja y afeitado', 'photo-1783908688260-0c47404926f3', 40],
];

function semilla() {
  const db = {
    v: 1,
    conf: { nombre: 'Filo Barber Club', whatsapp: CONFIG.whatsapp, pin: '1234', direccion: 'Calle Ejemplo 55, Ciudad de México', abre: '10:00', cierra: '20:00', sellos: 10, premio: 'Corte gratis', club: 799, comProd: 10, inactivo: 30 },
    servs: SERVS.map(([id, n, precio, dur, desc, foto, club]) => ({ id, n, precio, dur, desc, foto, club })),
    barbs: BARBS.map(([id, n, esp, foto, com]) => ({ id, n, esp, foto, com, activo: true })),
    prods: [
      ['pomada', 'Pomada mate', 280, 120, 14, 'photo-1775126251039-214af64257ff'], ['cera', 'Cera brillo medio', 260, 110, 9, 'photo-1775127741393-2b571811bb01'],
      ['aceite', 'Aceite para barba', 320, 130, 6, 'photo-1775126250989-bd71af7b00b8'], ['shampoo', 'Shampoo de barba', 240, 95, 2, 'photo-1775126250995-8d2364537089'],
    ].map(([id, n, precio, costo, stock, foto]) => ({ id, n, precio, costo, stock: 999, inicial: stock, min: 3, foto })), // el historial vende sin agotar; después se pone el stock real
    clis: [], citas: [], ventas: [], pagos: [], avisos: {}, cierres: [],
  };
  // [id, nombre, tel, barbero, servicio, cada cuántos días viene, días desde la última, cumpleaños MM-DD, preferencia, club]
  const C = [
    ['c1', 'Diego Martínez', '5511223344', 'b1', 'fade', 14, 13, '03-14', 'Fade bajo a 0.5, arriba tijera 2 dedos. Sin línea.', false],
    ['c2', 'Arturo Sánchez', '5522334455', 'b2', 'combo', 21, 4, '11-28', 'Clásico de lado. Barba cuadrada, cuello limpio.', true],
    ['c3', 'Kevin Rojas', '5533445566', 'b1', 'fade', 15, 45, '07-02', 'Mid fade con raya marcada a navaja.', false],
    ['c4', 'Emilio Torres', '5544556677', 'b3', 'navaja', 20, 9, '11-05', 'Afeitado completo, piel sensible: sin alcohol.', false],
    ['c5', 'Santiago Flores', '5555667788', 'b2', 'corte', 30, 38, '01-20', 'Corto con máquina 3, patillas cortas.', false],
    ['c6', 'Mateo Ruiz (niño)', '5566778899', 'b2', 'nino', 30, 18, '09-09', 'Que no le toquen las orejas con la máquina, se asusta.', false],
    ['c7', 'Ricardo Gómez', '5577889900', 'b1', 'combo', 14, 2, '12-01', 'Taper fade, barba degradada.', true],
    ['c8', 'Pablo Herrera', '5588990011', 'b3', 'barba', 10, 70, '05-30', 'Barba larga, solo perfilar.', false],
  ];
  const sv = (id) => db.servs.find((s) => s.id === id);
  for (const [id, n, tel, barb, serv, cada, ult, cumple, pref, club] of C) {
    db.clis.push({ id, n, tel, cumple, pref, alta: dia(-200), sellos: 0, canjes: 0, club: club ? dia(18) : '', ref: n.slice(0, 3).toUpperCase() + tel.slice(-3), refPor: '' });
    for (let d = ult; d <= 120; d += cada) {
      const fecha = domingo(dia(-d)) ? dia(-d - 1) : dia(-d);
      const c = { id: uid(), cli: id, barb, serv, fecha, hora: ['11:00', '13:30', '17:00', '18:30'][d % 4], dur: sv(serv).dur, estado: 'terminada', origen: d % 3 ? 'en línea' : 'mostrador', nota: '' };
      db.citas.push(c);
      terminar(db, c, { productos: d % 5 === 0 ? [{ id: 'pomada', cant: 1 }] : [], propina: [0, 30, 50][d % 3], met: d % 2 ? 'Tarjeta' : 'Efectivo', f: fecha + 'T' + c.hora + ':00' });
    }
  }
  for (const p of db.prods) { p.stock = p.inicial; delete p.inicial; }
  db.clis.find((c) => c.id === 'c1').sellos = 10; // ya tiene su premio para la demo
  // Agenda de hoy y mañana.
  const hoy = domingo(dia()) ? dia(1) : dia();
  const cita = (cli, barb, serv, fecha, hora, estado, origen = 'en línea', nota = '') => db.citas.push({ id: uid(), cli, barb, serv, fecha, hora, dur: sv(serv).dur, estado, origen, nota });
  cita('c4', 'b3', 'navaja', hoy, '10:30', 'terminada', 'mostrador');
  terminar(db, db.citas.at(-1), { productos: [{ id: 'aceite', cant: 1 }], propina: 50, met: 'Tarjeta' });
  cita('c2', 'b2', 'combo', hoy, '12:00', 'silla');
  cita('c1', 'b1', 'fade', hoy, '13:00', 'llego', 'en línea', 'Va por su décimo corte');
  cita('c6', 'b2', 'nino', hoy, '16:30', 'reservada');
  cita('c3', 'b1', 'fade', hoy, '18:00', 'reservada');
  cita('c5', 'b2', 'corte', hoy, '19:00', 'reservada', 'en línea');
  cita('c8', 'b3', 'barba', dia(domingo(dia(1)) ? 2 : 1), '11:00', 'reservada');
  // Mensualidades del club.
  for (const c of db.clis.filter((x) => x.club)) db.pagos.push({ id: uid(), cli: c.id, monto: db.conf.club, met: 'Tarjeta', f: dia(-12) + 'T10:00:00', concepto: 'Club mensual' });
  return db;
}

export const abrir = () => base('barberia', semilla);
export const serv = (db, id) => db.servs.find((s) => s.id === id);
export const barb = (db, id) => db.barbs.find((b) => b.id === id);
export const cli = (db, id) => db.clis.find((c) => c.id === id);
export const enClub = (db, c) => !!c.club && c.club >= dia();

// Horarios libres de un barbero para un servicio: sin encimarse con sus citas y antes del cierre.
export function libres(db, barbId, fecha, dur) {
  if (domingo(fecha)) return [];
  const ocup = db.citas.filter((c) => c.barb === barbId && c.fecha === fecha && !['cancelada', 'falto'].includes(c.estado)).map((c) => [min(c.hora), min(c.hora) + c.dur]);
  const ahora = fecha === dia() ? new Date().getHours() * 60 + new Date().getMinutes() : 0;
  const l = [];
  for (let m = min(db.conf.abre); m + dur <= min(db.conf.cierra); m += 30) if (m > ahora && !ocup.some(([a, b]) => m < b && m + dur > a)) l.push(hhmm(m));
  return l;
}
// "Cualquier barbero": la primera hora libre de cualquiera, asignada al que esté libre.
export function libresTodos(db, fecha, dur) {
  const m = new Map();
  for (const b of db.barbs.filter((x) => x.activo)) for (const h of libres(db, b.id, fecha, dur)) if (!m.has(h)) m.set(h, b.id);
  return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

export function reservar(db, { cli: cId, barb: bId, serv: sId, fecha, hora, origen = 'en línea', nota = '' }) {
  const s = serv(db, sId);
  if (!libres(db, bId, fecha, s.dur).includes(hora)) throw new Error('Ese horario ya se ocupó. Elige otro.');
  const c = { id: uid(), cli: cId, barb: bId, serv: sId, fecha, hora, dur: s.dur, estado: 'reservada', origen, nota };
  db.citas.push(c);
  return c;
}

// Cobro: servicio (gratis si canjea premio o si es del club en servicios incluidos) + productos + propina. Suma un sello.
export function cobroDe(db, c, { productos = [], canje = false } = {}) {
  const s = serv(db, c.serv); const cl = cli(db, c.cli);
  const gratisClub = cl && enClub(db, cl) && s.club;
  const servicio = canje || gratisClub ? 0 : s.precio;
  const prods = productos.reduce((t, p) => t + db.prods.find((x) => x.id === p.id).precio * p.cant, 0);
  return { servicio, prods, motivo: canje ? 'premio' : gratisClub ? 'club' : '' };
}
export function terminar(db, c, { productos = [], propina = 0, met = 'Efectivo', canje = false, f = new Date().toISOString() } = {}) {
  const cl = cli(db, c.cli);
  if (canje && (!cl || cl.sellos < db.conf.sellos)) throw new Error('Todavía no junta los sellos para el premio.');
  for (const p of productos) { const x = db.prods.find((y) => y.id === p.id); if (x.stock < p.cant) throw new Error(`Solo hay ${x.stock} de ${x.n}.`); }
  const k = cobroDe(db, c, { productos, canje });
  for (const p of productos) db.prods.find((y) => y.id === p.id).stock -= p.cant;
  c.venta = { servicio: k.servicio, prods: k.prods, productos, propina: Math.max(0, Math.round(propina)), met, motivo: k.motivo, f };
  c.estado = 'terminada';
  if (cl) { if (canje) { cl.sellos -= db.conf.sellos; cl.canjes++; } cl.sellos++; }
  return c.venta;
}

// Comisiones del periodo: % del servicio cobrado + % de productos + 100% de propinas.
export function comisiones(db, desde, hasta) {
  return db.barbs.map((b) => {
    const cs = db.citas.filter((c) => c.barb === b.id && c.venta && loc(c.venta.f) >= desde && loc(c.venta.f) <= hasta);
    const serv_ = cs.reduce((s, c) => s + c.venta.servicio, 0), prods = cs.reduce((s, c) => s + c.venta.prods, 0), prop = cs.reduce((s, c) => s + c.venta.propina, 0);
    return { b, cortes: cs.length, serv: serv_, prods, prop, pagar: Math.round(serv_ * b.com / 100 + prods * db.conf.comProd / 100 + prop) };
  });
}

export const visitas = (db, cId) => db.citas.filter((c) => c.cli === cId && c.estado === 'terminada').sort((a, b) => b.fecha.localeCompare(a.fecha));
export const ultima = (db, cId) => visitas(db, cId)[0]?.fecha;
export function frecuencia(db, cId) {
  const v = visitas(db, cId).map((c) => c.fecha);
  return v.length < 2 ? 0 : Math.round(diasEntre(v.at(-1), v[0]) / (v.length - 1));
}

// Autochequeo.
{
  const db = semilla();
  const f = domingo(dia(3)) ? dia(4) : dia(3);
  const l = libres(db, 'b3', f, 60);
  const c = reservar(db, { cli: 'c5', barb: 'b3', serv: 'combo', fecha: f, hora: l[0] });
  console.assert(!libres(db, 'b3', f, 30).includes(c.hora) && !libres(db, 'b3', f, 30).includes(fin({ hora: c.hora, dur: 30 })), 'no se encima una cita de 60 min');
  console.assert(libres(db, 'b3', f, 60).every((h) => h <= '19:00'), 'termina antes del cierre');
  let err = false; try { reservar(db, { cli: 'c5', barb: 'b3', serv: 'corte', fecha: f, hora: c.hora }); } catch { err = true; }
  console.assert(err, 'no permite doble reserva');
  const c1 = cli(db, 'c1');
  const v = terminar(db, c, { canje: false, productos: [{ id: 'pomada', cant: 1 }], propina: 40 });
  console.assert(v.servicio === 360 && v.prods === 280 && cli(db, 'c5').sellos > 0, 'cobro normal y sello');
  const g = { id: 'x', cli: 'c1', barb: 'b1', serv: 'fade', fecha: f, hora: '10:00', dur: 30, estado: 'silla' };
  c1.sellos = 10; terminar(db, g, { canje: true });
  console.assert(g.venta.servicio === 0 && c1.sellos === 1, 'canje: gratis, descuenta 10 y suma el sello de hoy');
  const club = cli(db, 'c2'); console.assert(cobroDe(db, { serv: 'combo', cli: club.id }).servicio === 0 && cobroDe(db, { serv: 'barba', cli: club.id }).servicio === 180, 'club cubre solo lo incluido');
}
