// Veterinaria "Colita Feliz": datos de ejemplo y reglas que usan el portal del cliente y el panel de la clínica.
import { base, uid, haceDias } from '../_base/sis.js';
import { CONFIG } from '../../config.js';

// Fechas como texto AAAA-MM-DD para que el día no cambie por zona horaria.
export const dia = (n = 0) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toLocaleDateString('en-CA'); };
export const diasEntre = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
export const fAno = (s) => new Date(s + 'T12:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
export const fDia = (s) => new Date(s + 'T12:00').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
export function edad(nac) {
  const m = Math.floor(diasEntre(nac, dia()) / 30.44);
  return m < 12 ? `${m} ${m === 1 ? 'mes' : 'meses'}` : `${Math.floor(m / 12)} ${m < 24 ? 'año' : 'años'}`;
}

export const VACUNAS = {
  multiple: { n: 'Múltiple (séxtuple)', esp: 'Perro', dias: 365, prod: 'vac-multiple' },
  parvo: { n: 'Parvovirus cachorro', esp: 'Perro', dias: 21, prod: 'vac-multiple' },
  rabia: { n: 'Rabia', esp: 'Ambos', dias: 365, prod: 'vac-rabia' },
  bordetella: { n: 'Bordetella (tos de las perreras)', esp: 'Perro', dias: 365, prod: '' },
  triple: { n: 'Triple felina', esp: 'Gato', dias: 365, prod: 'vac-triple' },
  leucemia: { n: 'Leucemia felina', esp: 'Gato', dias: 365, prod: '' },
  despara: { n: 'Desparasitación interna', esp: 'Ambos', dias: 90, prod: 'desparasitante' },
};

export const ESTADOS_CITA = ['pendiente', 'confirmada', 'en curso', 'lista', 'completada'];
export const CITA_TXT = { pendiente: 'Por confirmar', confirmada: 'Confirmada', 'en curso': 'En atención', lista: 'Lista para recoger', completada: 'Completada', cancelada: 'Cancelada' };
export const CITA_BADGE = { pendiente: 'b-info', confirmada: 'b-mut', 'en curso': 'b-warn', lista: 'b-ok', completada: 'b-ok', cancelada: 'b-mut' };
export const HOSP_TXT = { estable: 'Estable', observacion: 'En observación', delicado: 'Delicado', mejorando: 'Mejorando', alta: 'Dado de alta' };
export const HOSP_BADGE = { estable: 'b-ok', observacion: 'b-warn', delicado: 'b-bad', mejorando: 'b-ok', alta: 'b-mut' };
export const HORAS = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'];
const CUPO = 2; // citas por horario (dos médicos / estética en paralelo)

const SERV = [
  ['consulta', 'Consulta general', 450, 30, 'Revisión completa, diagnóstico y plan de tratamiento.', 'photo-1770836037793-95bdbf190f71'],
  ['vacuna', 'Vacunación', 380, 20, 'Aplicación con registro en la cartilla digital y aviso del refuerzo.', 'photo-1770836037275-38b44e4b101f'],
  ['despara', 'Desparasitación', 180, 15, 'Interna y externa según peso. Te recordamos la siguiente.', 'photo-1537151608828-ea2b11777ee8'],
  ['estetica', 'Baño y corte', 450, 90, 'Baño, corte de pelo y uñas, limpieza de oídos. Te avisamos cuando esté listo.', 'photo-1772437883387-8076cf660c65'],
  ['dental', 'Limpieza dental', 1800, 60, 'Limpieza con ultrasonido bajo sedación y revisión de encías.', 'photo-1770836037816-4445dbd449fd'],
  ['cirugia', 'Esterilización', 2400, 120, 'Cirugía con anestesia inhalada, monitoreo y seguimiento.', 'photo-1644675272883-0c4d582528d8'],
];

export const VETS = ['Dra. Paula Ríos', 'Dr. Andrés Solís', 'Karla (estética)'];

function semilla() {
  const db = {
    v: 1,
    conf: { nombre: 'Colita Feliz', whatsapp: CONFIG.whatsapp, pin: '1234', diaHosp: 650, direccion: 'Av. Ejemplo 456, Ciudad de México', horario: 'Lun a sáb 9:00 a 19:00 · Urgencias 24 h' },
    serv: SERV.map(([id, n, precio, dur, desc, foto]) => ({ id, n, precio, dur, desc, foto })),
    duenos: [
      ['d1', 'Mariana López', '5512345678'], ['d2', 'Jorge Ramírez', '5523456789'], ['d3', 'Lucía Hernández', '5534567890'],
      ['d4', 'Carlos Mendoza', '5545678901'], ['d5', 'Ana Torres', '5556789012'], ['d6', 'Roberto Díaz', '5567890123'],
    ].map(([id, n, tel]) => ({ id, n, tel, alta: haceDias(400) })),
    // [id, dueño, nombre, especie, raza, sexo, edad en días, peso, foto, alergias, esterilizado]
    masc: [
      ['m1', 'd1', 'Max', 'Perro', 'Golden retriever', 'Macho', 1600, 30.2, 'photo-1558788353-f76d92427f16', '', true],
      ['m2', 'd1', 'Luna', 'Gato', 'Doméstico calicó', 'Hembra', 1100, 4.1, 'photo-1582725461742-8ecd962c260d', '', true],
      ['m3', 'd2', 'Rocky', 'Perro', 'Pastor alemán', 'Macho', 2400, 34.8, 'photo-1610968755695-d7fcb5fd4b92', 'Penicilina', false],
      ['m4', 'd3', 'Michi', 'Gato', 'Doméstico naranja', 'Macho', 2900, 5.6, 'photo-1596854372745-0906a0593bca', '', true],
      ['m5', 'd3', 'Nala', 'Gato', 'Doméstico tuxedo', 'Hembra', 700, 3.4, 'photo-1498100152307-ce63fd6c5424', '', false],
      ['m6', 'd4', 'Toby', 'Perro', 'Corgi', 'Macho', 1300, 12.1, 'photo-1763718170991-baa67106743b', '', true],
      ['m7', 'd5', 'Canela', 'Perro', 'Shih tzu', 'Hembra', 95, 1.9, 'photo-1534361960057-19889db9621e', '', false],
      ['m8', 'd6', 'Negrito', 'Perro', 'Pug', 'Macho', 2100, 9.3, 'photo-1517423440428-a5a00ad493e8', 'Pollo (alimento)', true],
      ['m9', 'd6', 'Bruno', 'Perro', 'Mestizo', 'Macho', 1800, 22.5, 'photo-1518020382113-a7e8fc38eac9', '', true],
    ].map(([id, dueno, n, esp, raza, sexo, dias, peso, foto, alergias, ester]) => ({ id, dueno, n, esp, raza, sexo, nac: dia(-dias), peso, foto, alergias, ester })),
    vacunas: [], consultas: [], citas: [], hosp: [], cuentas: [], movs: [],
    prods: [
      ['vac-multiple', 'Vacuna múltiple (dosis)', 'Vacuna', 0, 160, 14, 6, 'L-2291', 210],
      ['vac-rabia', 'Vacuna antirrábica (dosis)', 'Vacuna', 0, 90, 9, 5, 'R-8812', 150],
      ['vac-triple', 'Vacuna triple felina (dosis)', 'Vacuna', 0, 150, 3, 4, 'F-1173', 95],
      ['desparasitante', 'Desparasitante tabletas', 'Medicamento', 120, 45, 40, 15, 'D-5520', 400],
      ['amoxi', 'Amoxicilina 250 mg (caja)', 'Medicamento', 260, 110, 6, 5, 'A-3301', 25],
      ['melox', 'Meloxicam suspensión', 'Medicamento', 310, 140, 11, 4, 'M-9087', 300],
      ['suero', 'Solución Hartmann 500 ml', 'Medicamento', 95, 38, 22, 10, 'S-1190', 500],
      ['pipeta', 'Pipeta antipulgas perro mediano', 'Antipulgas', 340, 170, 18, 8, 'P-7741', 280],
      ['alimento-gi', 'Alimento gastrointestinal 2 kg', 'Alimento', 690, 410, 7, 3, 'G-4410', 220],
      ['shampoo', 'Shampoo medicado', 'Estética', 280, 120, 9, 3, 'H-2230', -10],
      ['collar-isab', 'Collar isabelino mediano', 'Accesorio', 180, 70, 5, 2, '', 0],
    ].map(([id, n, cat, precio, costo, stock, min, lote, cadDias]) => ({ id, n, cat, precio, costo, stock, min, lote, cad: cadDias ? dia(cadDias) : '' })),
  };
  const V = (masc, vac, hace, vet = VETS[0]) => db.vacunas.push({ id: uid(), masc, vac, f: dia(-hace), prox: dia(-hace + VACUNAS[vac].dias), lote: 'L-' + (1000 + hace), vet });
  V('m1', 'multiple', 335); V('m1', 'rabia', 380); V('m1', 'despara', 70);
  V('m2', 'triple', 360); V('m2', 'rabia', 300);
  V('m3', 'multiple', 200); V('m3', 'rabia', 400); V('m3', 'despara', 120);
  V('m4', 'triple', 100); V('m4', 'rabia', 100); V('m4', 'despara', 30);
  V('m5', 'triple', 345); V('m5', 'despara', 95);
  V('m6', 'multiple', 150); V('m6', 'rabia', 150); V('m6', 'despara', 40);
  V('m7', 'parvo', 21); V('m7', 'despara', 25);
  V('m8', 'multiple', 250); V('m8', 'rabia', 250); V('m8', 'despara', 110);
  V('m9', 'multiple', 60); V('m9', 'rabia', 60); V('m9', 'despara', 20);

  const C = (masc, hace, motivo, peso, diag, trat, vet = VETS[0], temp = 38.6) => db.consultas.push({ id: uid(), masc, f: haceDias(hace, 11), vet, motivo, peso, temp, diag, trat, receta: '' });
  C('m1', 520, 'Revisión anual', 28.5, 'Sano. Sobrepeso leve.', 'Reducir porción 10%. Paseos diarios.');
  C('m1', 335, 'Vacunación y revisión', 29.1, 'Sano.', 'Vacuna múltiple aplicada.');
  C('m1', 1, 'Vómito y diarrea desde ayer, no quiere comer', 30.2, 'Gastroenteritis aguda con deshidratación leve (5%).', 'Hospitalización 48 h: suero, antiemético y dieta blanda.', VETS[0], 39.4);
  C('m3', 60, 'Cojea de la pata trasera derecha', 34.8, 'Inflamación de rodilla, sin fractura en radiografía.', 'Meloxicam 7 días, reposo, revisión en 2 semanas.', VETS[1]);
  C('m4', 100, 'Revisión y vacunas', 5.6, 'Sano. Sarro leve.', 'Programar limpieza dental.');
  C('m8', 30, 'Se rasca mucho las orejas', 9.3, 'Otitis externa por levaduras.', 'Limpieza de oídos y gotas 10 días.');
  C('m7', 21, 'Primera consulta de cachorro', 1.4, 'Cachorro sano.', 'Esquema de vacunación iniciado. Siguiente dosis en 3 semanas.');

  const cita = (masc, d, hora, serv, estado, origen = 'clinica', nota = '') => db.citas.push({ id: uid(), masc, fecha: dia(d), hora, serv, estado, origen, nota, hist: [{ e: estado, f: new Date().toISOString() }] });
  cita('m6', 0, '10:00', 'estetica', 'lista', 'portal', 'Corte corto, que no le dejen moño');
  cita('m2', 0, '11:30', 'vacuna', 'confirmada');
  cita('m3', 0, '12:30', 'consulta', 'en curso', 'clinica', 'Revisión de rodilla');
  cita('m7', 0, '16:00', 'vacuna', 'pendiente', 'portal', 'Segunda dosis');
  cita('m8', 1, '10:00', 'consulta', 'confirmada', 'clinica', 'Revisión de oídos');
  cita('m4', 1, '13:00', 'dental', 'pendiente', 'portal');
  cita('m9', 3, '17:00', 'estetica', 'confirmada', 'portal');
  cita('m1', -1, '09:30', 'consulta', 'completada');

  // Max hospitalizado desde ayer, con notas que su dueña ve en el portal.
  const cuenta = { id: 'c-max', dueno: 'd1', masc: 'm1', f: haceDias(1, 10), conceptos: [{ n: 'Consulta de urgencia', monto: 450 }, { n: 'Hospitalización día 1', monto: db.conf.diaHosp }, { n: 'Solución Hartmann x2', monto: 190 }, { n: 'Antiemético inyectable', monto: 220 }], pagado: 1000, pagos: [{ monto: 1000, met: 'Tarjeta', f: haceDias(1, 10) }], abierta: true };
  db.cuentas.push(cuenta);
  db.hosp.push({ id: 'h1', masc: 'm1', ingreso: haceDias(1, 10), motivo: 'Gastroenteritis con deshidratación', jaula: 'C-2', estado: 'mejorando', activa: true, cuenta: 'c-max', dias: 1,
    notas: [
      { f: haceDias(1, 10), estado: 'observacion', txt: 'Ingresó con vómito y deshidratación leve. Se colocó suero intravenoso.' },
      { f: haceDias(1, 20), estado: 'estable', txt: 'Ya no ha vomitado. Descansa tranquilo.' },
      { f: haceDias(0, 9), estado: 'mejorando', txt: 'Comió un poco de dieta blanda y movió la cola al vernos 🐾. Si sigue así, alta mañana.' },
    ] });
  // Cuentas anteriores pagadas y una con saldo.
  db.cuentas.push({ id: uid(), dueno: 'd2', masc: 'm3', f: haceDias(60, 12), conceptos: [{ n: 'Consulta general', monto: 450 }, { n: 'Radiografía', monto: 650 }, { n: 'Meloxicam suspensión', monto: 310 }], pagado: 1410, pagos: [{ monto: 1410, met: 'Efectivo', f: haceDias(60, 12) }], abierta: false });
  db.cuentas.push({ id: uid(), dueno: 'd6', masc: 'm8', f: haceDias(30, 12), conceptos: [{ n: 'Consulta general', monto: 450 }, { n: 'Limpieza de oídos', monto: 250 }, { n: 'Gotas óticas', monto: 290 }], pagado: 500, pagos: [{ monto: 500, met: 'Efectivo', f: haceDias(30, 12) }], abierta: true });
  for (let i = 2; i < 28; i += 3) db.cuentas.push({ id: uid(), dueno: 'd' + (1 + (i % 6)), masc: 'm' + (1 + (i % 9)), f: haceDias(i, 13), conceptos: [{ n: i % 2 ? 'Consulta general' : 'Baño y corte', monto: 450 }, { n: 'Medicamento', monto: 120 + i * 10 }], pagado: 570 + i * 10, pagos: [{ monto: 570 + i * 10, met: 'Tarjeta', f: haceDias(i, 13) }], abierta: false });
  return db;
}

export const abrir = () => base('veterinaria', semilla);
export const totalCuenta = (c) => c.conceptos.reduce((s, x) => s + x.monto, 0);
export const saldo = (c) => totalCuenta(c) - c.pagado;

// Última aplicación de cada vacuna de la mascota, con su semáforo.
export function cartilla(db, mascId) {
  const ult = {};
  for (const v of db.vacunas.filter((x) => x.masc === mascId)) if (!ult[v.vac] || v.f > ult[v.vac].f) ult[v.vac] = v;
  return Object.values(ult).map((v) => ({ ...v, faltan: diasEntre(dia(), v.prox), estado: estadoVac(v.prox) })).sort((a, b) => a.prox.localeCompare(b.prox));
}
export function estadoVac(prox) {
  const d = diasEntre(dia(), prox);
  return d < 0 ? 'vencida' : d <= 30 ? 'pronto' : 'ok';
}

export function aplicarVacuna(db, mascId, vac, lote, vet) {
  const v = { id: uid(), masc: mascId, vac, f: dia(), prox: dia(VACUNAS[vac].dias), lote, vet };
  db.vacunas.push(v);
  const p = db.prods.find((x) => x.id === VACUNAS[vac].prod);
  if (p && p.stock > 0) { p.stock--; db.movs.unshift({ id: uid(), prod: p.id, cant: -1, nota: `Aplicada a ${db.masc.find((m) => m.id === mascId)?.n}`, f: new Date().toISOString() }); }
  return v;
}

export const ocupados = (db, fecha, hora) => db.citas.filter((c) => c.fecha === fecha && c.hora === hora && c.estado !== 'cancelada').length;
export function horasLibres(db, fecha) {
  const ahora = new Date().toTimeString().slice(0, 5);
  return HORAS.filter((h) => ocupados(db, fecha, h) < CUPO && (fecha !== dia() || h > ahora));
}

export function nuevaCita(db, { masc, fecha, hora, serv, nota = '', origen = 'clinica' }) {
  if (ocupados(db, fecha, hora) >= CUPO) throw new Error('Ese horario ya está lleno, elige otro.');
  const c = { id: uid(), masc, fecha, hora, serv, estado: origen === 'portal' ? 'pendiente' : 'confirmada', origen, nota, hist: [{ e: origen === 'portal' ? 'pendiente' : 'confirmada', f: new Date().toISOString() }] };
  db.citas.push(c);
  return c;
}

// Al completar una cita se abre la cuenta del cliente con el servicio y los extras.
export function completarCita(db, c, extras = []) {
  const s = db.serv.find((x) => x.id === c.serv);
  const m = db.masc.find((x) => x.id === c.masc);
  const cuenta = { id: uid(), dueno: m.dueno, masc: m.id, f: new Date().toISOString(), conceptos: [{ n: s.n, monto: s.precio }, ...extras], pagado: 0, pagos: [], abierta: true };
  db.cuentas.push(cuenta);
  c.estado = 'completada'; c.hist.push({ e: 'completada', f: new Date().toISOString() }); c.cuenta = cuenta.id;
  return cuenta;
}

export function cobrar(c, monto, met) {
  const m = Math.min(saldo(c), Math.round(monto));
  if (!(m > 0)) throw new Error('Monto no válido');
  c.pagado += m; c.pagos.push({ monto: m, met, f: new Date().toISOString() });
  if (saldo(c) <= 0) c.abierta = false;
  return m;
}

// Autochequeo de reglas clave.
{
  const db = semilla();
  console.assert(estadoVac(dia(-1)) === 'vencida' && estadoVac(dia(10)) === 'pronto' && estadoVac(dia(90)) === 'ok', 'semáforo de vacunas');
  const s0 = db.prods.find((p) => p.id === 'vac-rabia').stock;
  const v = aplicarVacuna(db, 'm3', 'rabia', 'X', VETS[0]);
  console.assert(v.prox === dia(365) && db.prods.find((p) => p.id === 'vac-rabia').stock === s0 - 1, 'vacuna: refuerzo y stock');
  console.assert(cartilla(db, 'm3').find((x) => x.vac === 'rabia').estado === 'ok', 'cartilla toma la última');
  nuevaCita(db, { masc: 'm1', fecha: dia(5), hora: '09:00', serv: 'consulta' }); nuevaCita(db, { masc: 'm2', fecha: dia(5), hora: '09:00', serv: 'consulta' });
  let lleno = false; try { nuevaCita(db, { masc: 'm3', fecha: dia(5), hora: '09:00', serv: 'consulta' }); } catch { lleno = true; }
  console.assert(lleno && !horasLibres(db, dia(5)).includes('09:00'), 'cupo por horario');
  const c = completarCita(db, db.citas.at(-1), [{ n: 'Extra', monto: 50 }]);
  console.assert(totalCuenta(c) === 500 && (cobrar(c, 9999, 'Efectivo'), !c.abierta && c.pagado === 500), 'cuenta y cobro');
}
