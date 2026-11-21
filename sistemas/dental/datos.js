// Consultorio "Alba Dental": datos de ejemplo y reglas (odontograma, presupuestos, plazos, recall).
import { base, uid, haceDias } from '../_base/sis.js';
import { CONFIG } from '../../config.js';

export const dia = (n = 0) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toLocaleDateString('en-CA'); };
export const diasEntre = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
export const fDia = (s) => new Date(s + 'T12:00').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
export const fAno = (s) => new Date(s.slice(0, 10) + 'T12:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });

// Numeración FDI: arriba 18→11 | 21→28, abajo 48→41 | 31→38.
export const ARRIBA = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
export const ABAJO = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
export const ODO = {
  sano: { n: 'Sano', c: '#FFFFFF' },
  caries: { n: 'Caries', c: '#E5484D', trat: 'resina' },
  endo_i: { n: 'Necesita endodoncia', c: '#F59E0B', trat: 'endodoncia' },
  extraer: { n: 'Extracción indicada', c: '#8B5CF6', trat: 'extraccion' },
  ausente: { n: 'Ausente', c: '#CBD5E1', trat: 'implante' },
  resina: { n: 'Resina', c: '#3B82F6' },
  endo: { n: 'Endodoncia hecha', c: '#06B6D4' },
  corona: { n: 'Corona', c: '#EAB308' },
  implante: { n: 'Implante', c: '#10B981' },
};
// Qué queda en el diente cuando se termina cada tratamiento.
const QUEDA = { resina: 'resina', endodoncia: 'endo', extraccion: 'ausente', implante: 'implante', corona: 'corona' };

export const TRATS = [
  ['valoracion', 'Valoración y diagnóstico', 400, 30, 'Revisión completa, radiografía y plan de tratamiento por escrito.', 'photo-1777331903190-341a3dd0441b', true],
  ['limpieza', 'Limpieza dental', 800, 45, 'Limpieza con ultrasonido y pulido. Recomendada cada 6 meses.', 'photo-1606811971618-4486d14f3f99', true],
  ['blanqueamiento', 'Blanqueamiento', 4500, 60, 'Blanqueamiento en consultorio con resultado el mismo día.', 'photo-1677026010083-78ec7f1b84ed', true],
  ['urgencia', 'Urgencia por dolor', 600, 30, '¿Te duele? Te atendemos el mismo día.', 'photo-1629909613654-28e377c37b09', true],
  ['ortodoncia', 'Ortodoncia (tratamiento)', 28000, 45, 'Brackets o alineadores, con mensualidades sin intereses.', 'photo-1588776814546-1ffcf47267a5', true],
  ['implante', 'Implante dental', 16000, 90, 'Implante de titanio con corona. Recupera la pieza perdida.', 'photo-1771442873035-474765b40ac6', true],
  ['resina', 'Resina (empaste)', 950, 40, 'Restauración del color de tu diente.', '', false],
  ['endodoncia', 'Endodoncia', 3800, 90, 'Tratamiento de conducto para salvar el diente.', '', false],
  ['corona', 'Corona de zirconia', 6500, 60, 'Funda estética y resistente.', '', false],
  ['extraccion', 'Extracción', 900, 40, 'Extracción simple con anestesia local.', '', false],
].map(([id, n, precio, dur, desc, foto, linea]) => ({ id, n, precio, dur, desc, foto, linea }));

export const DOCS = ['Dra. Alba Treviño', 'Dr. Luis Ochoa'];
export const HORAS = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'];
export const CITA_TXT = { pendiente: 'Por confirmar', confirmada: 'Confirmada', 'en sala': 'En sala de espera', 'en curso': 'En sillón', completada: 'Atendida', cancelada: 'Cancelada', falto: 'No llegó' };
export const CITA_BADGE = { pendiente: 'b-info', confirmada: 'b-mut', 'en sala': 'b-warn', 'en curso': 'b-warn', completada: 'b-ok', cancelada: 'b-mut', falto: 'b-bad' };
export const PRES_TXT = { enviado: 'Enviado', aceptado: 'Aceptado', rechazado: 'Rechazado' };
export const PLAZOS = [[1, 'De contado (5% de descuento)'], [3, '3 meses'], [6, '6 meses'], [12, '12 meses']];
const CUPO = 2; // dos sillones

function semilla() {
  const db = {
    v: 1,
    conf: { nombre: 'Alba Dental', whatsapp: CONFIG.whatsapp, pin: '1234', direccion: 'Av. Ejemplo 789, Ciudad de México', horario: 'Lun a vie 9:00 a 19:00 · Sáb 9:00 a 14:00', recall: 6, enganche: 30 },
    trats: TRATS.map((t) => ({ ...t })),
    pacs: [
      ['p1', 'Sofía Ramírez', '5511122233', 34, '', { 16: 'resina', 26: 'caries', 36: 'endo_i', 46: 'corona', 11: 'resina' }, 200],
      ['p2', 'Daniel Herrera', '5522233344', 52, 'Penicilina', { 46: 'ausente', 18: 'extraer', 37: 'resina' }, 400],
      ['p3', 'Valeria Cruz', '5533344455', 19, '', {}, 120],
      ['p4', 'Miguel Ángel Soto', '5544455566', 41, '', { 24: 'resina' }, 245],
      ['p5', 'Fernanda Ortiz', '5555566677', 28, '', {}, 90],
      ['p6', 'Jorge Luna', '5566677788', 63, 'Diabético controlado', { 47: 'extraer', 15: 'ausente', 25: 'corona' }, 500],
      ['p7', 'Paola Méndez', '5577788899', 37, '', { 14: 'resina' }, 215],
    ].map(([id, n, tel, edad, alergias, odo, limpiezaHace]) => ({ id, n, tel, nac: dia(-edad * 365 - 40), alergias, odo, ultLimpieza: dia(-limpiezaHace), alta: haceDias(700) })),
    citas: [], evol: [], pres: [], pagos: [], avisos: {},
  };
  const habil = (d) => (d > 0 && new Date(dia(d) + 'T12:00').getDay() === 0 ? dia(d + 1) : dia(d)); // el consultorio no abre en domingo
  const cita = (pac, d, hora, trat, estado, doc = 0, origen = 'consultorio', nota = '') => db.citas.push({ id: uid(), pac, fecha: habil(d), hora, trat, doc: DOCS[doc], estado, origen, nota, hist: [{ e: estado, f: new Date().toISOString() }] });
  cita('p5', 0, '09:30', 'blanqueamiento', 'completada', 0);
  cita('p1', 0, '11:00', 'resina', 'confirmada', 0, 'consultorio', 'Resina en 26 (plan de tratamiento)');
  cita('p6', 0, '12:30', 'urgencia', 'en curso', 1, 'portal', 'Dolor fuerte abajo a la derecha desde ayer');
  cita('p4', 0, '17:00', 'limpieza', 'pendiente', 0, 'portal');
  cita('p3', 1, '16:00', 'ortodoncia', 'confirmada', 1, 'consultorio', 'Ajuste mensual de brackets');
  cita('p2', 2, '10:00', 'valoracion', 'pendiente', 1, 'portal', 'Quiero saber del implante');
  cita('p1', -14, '11:00', 'resina', 'completada', 0);
  cita('p7', -8, '10:30', 'valoracion', 'falto', 0);

  const ev = (pac, hace, txt, doc = 0) => db.evol.push({ id: uid(), pac, f: haceDias(hace, 12), doc: DOCS[doc], txt });
  ev('p1', 30, 'Valoración: caries en 16 y 26, 36 con lesión profunda que requiere endodoncia. Se entrega presupuesto.');
  ev('p1', 14, 'Resina en 16 sin complicaciones. Próxima cita: resina en 26.');
  ev('p2', 9, 'Valoración: ausencia de 46, se sugiere implante. 18 semi incluido, extracción indicada.', 1);
  ev('p3', 120, 'Colocación de brackets superiores e inferiores.', 1);
  ev('p6', 0, 'Urgencia: dolor en 47 con movilidad grado III. Se indica extracción.', 1);

  // Presupuestos: uno aceptado con avance, uno enviado sin respuesta (seguimiento), uno de ortodoncia con pago vencido.
  const p1 = { id: 'pr1', pac: 'p1', f: haceDias(30, 13), items: [{ trat: 'resina', diente: 16, hecho: dia(-14) }, { trat: 'resina', diente: 26, hecho: '' }, { trat: 'endodoncia', diente: 36, hecho: '' }, { trat: 'corona', diente: 36, hecho: '' }], desc: 0, estado: 'enviado', cuotas: [] };
  db.pres.push(p1); aceptar(db, p1, 6, haceDias(28, 10));
  pagarCuota(db, 'p1', p1.cuotas[0].monto, 'Tarjeta', haceDias(28, 10)); pagarCuota(db, 'p1', p1.cuotas[1].monto, 'Transferencia', haceDias(2, 10));
  db.pres.push({ id: 'pr2', pac: 'p2', f: haceDias(9, 13), items: [{ trat: 'implante', diente: 46, hecho: '' }, { trat: 'extraccion', diente: 18, hecho: '' }], desc: 0, estado: 'enviado', cuotas: [] });
  const p3 = { id: 'pr3', pac: 'p3', f: haceDias(125, 13), items: [{ trat: 'ortodoncia', diente: '', hecho: '' }], desc: 0, estado: 'enviado', cuotas: [] };
  db.pres.push(p3); aceptar(db, p3, 12, haceDias(122, 10));
  for (let k = 0; k < 3; k++) pagarCuota(db, 'p3', p3.cuotas[k].monto, 'Transferencia', haceDias(122 - k * 30, 10));
  db.pres.push({ id: 'pr4', pac: 'p5', f: haceDias(2, 13), items: [{ trat: 'resina', diente: 21, hecho: '' }, { trat: 'resina', diente: 22, hecho: '' }], desc: 10, estado: 'enviado', cuotas: [] });
  // Pagos sueltos de consultas pasadas, para la gráfica.
  for (let i = 1; i < 28; i += 2) db.pagos.push({ id: uid(), pac: 'p' + (1 + (i % 7)), pres: '', monto: [800, 400, 950, 600][i % 4], met: i % 3 ? 'Tarjeta' : 'Efectivo', f: haceDias(i, 12), concepto: ['Limpieza', 'Valoración', 'Resina', 'Urgencia'][i % 4] });
  db.pagos.push({ id: uid(), pac: 'p5', pres: '', monto: 4500, met: 'Tarjeta', f: haceDias(0, 10), concepto: 'Blanqueamiento' });
  return db;
}

export const abrir = () => base('dental', semilla);
export const trat = (db, id) => db.trats.find((t) => t.id === id);
export const bruto = (db, p) => p.items.reduce((s, it) => s + trat(db, it.trat).precio, 0);
export const totalPres = (db, p, plazos = p.plazos) => Math.round(bruto(db, p) * (1 - (p.desc || 0) / 100) * (plazos === 1 ? 0.95 : 1));

// Al aceptar: enganche hoy y mensualidades iguales.
export function aceptar(db, p, plazos, f = new Date().toISOString()) {
  if (p.estado === 'aceptado') throw new Error('Ese presupuesto ya fue aceptado.');
  const total = totalPres(db, p, plazos);
  const base0 = Date.parse(f);
  const venc = (m) => { const d = new Date(base0); d.setMonth(d.getMonth() + m); return d.toLocaleDateString('en-CA'); };
  if (plazos === 1) p.cuotas = [{ n: 'Pago único', monto: total, vence: venc(0), pagado: 0 }];
  else {
    const eng = Math.round(total * db.conf.enganche / 100);
    const men = Math.round((total - eng) / plazos);
    p.cuotas = [{ n: 'Enganche', monto: eng, vence: venc(0), pagado: 0 }, ...[...Array(plazos)].map((_, i) => ({ n: `Mensualidad ${i + 1} de ${plazos}`, monto: i === plazos - 1 ? total - eng - men * (plazos - 1) : men, vence: venc(i + 1), pagado: 0 }))];
  }
  p.estado = 'aceptado'; p.plazos = plazos; p.fResp = f;
  return p;
}

// Un pago se aplica a las cuotas más antiguas pendientes del paciente.
export function pagarCuota(db, pacId, monto, met, f = new Date().toISOString()) {
  let resto = Math.round(monto);
  if (!(resto > 0)) throw new Error('Monto no válido');
  const cuotas = cuotasDe(db, pacId).filter((c) => c.pagado < c.monto);
  const deuda = cuotas.reduce((s, c) => s + c.monto - c.pagado, 0);
  if (resto > deuda) resto = deuda;
  if (!resto) throw new Error('Este paciente no tiene saldo de tratamiento.');
  const aplicado = resto;
  for (const c of cuotas) { const x = Math.min(resto, c.monto - c.pagado); c.pagado += x; resto -= x; if (!resto) break; }
  db.pagos.push({ id: uid(), pac: pacId, pres: 'plan', monto: aplicado, met, f, concepto: 'Abono a tratamiento' });
  return aplicado;
}

export const cuotasDe = (db, pacId) => db.pres.filter((p) => p.pac === pacId && p.estado === 'aceptado').flatMap((p) => p.cuotas).sort((a, b) => a.vence.localeCompare(b.vence));
export const saldoPac = (db, pacId) => cuotasDe(db, pacId).reduce((s, c) => s + c.monto - c.pagado, 0);
export const vencido = (db, pacId) => cuotasDe(db, pacId).filter((c) => c.pagado < c.monto && c.vence < dia()).reduce((s, c) => s + c.monto - c.pagado, 0);
export const proxCuota = (db, pacId) => cuotasDe(db, pacId).find((c) => c.pagado < c.monto);

// Presupuesto desde los hallazgos del odontograma.
export function desdeOdo(pac) {
  return Object.entries(pac.odo).filter(([, s]) => ODO[s]?.trat).map(([d, s]) => ({ trat: ODO[s].trat, diente: +d, hecho: '' }));
}

// Marcar un tratamiento como hecho actualiza el diente.
export function hecho(db, p, i) {
  const it = p.items[i];
  it.hecho = it.hecho ? '' : dia();
  const pac = db.pacs.find((x) => x.id === p.pac);
  if (it.hecho && it.diente && QUEDA[it.trat]) pac.odo[it.diente] = QUEDA[it.trat];
}

export const recallPend = (db) => db.pacs.filter((p) => diasEntre(p.ultLimpieza, dia()) > db.conf.recall * 30.4);

export const ocupados = (db, fecha, hora) => db.citas.filter((c) => c.fecha === fecha && c.hora === hora && !['cancelada'].includes(c.estado)).length;
export function horasLibres(db, fecha) {
  const ahora = new Date().toTimeString().slice(0, 5);
  const sab = new Date(fecha + 'T12:00').getDay() === 6;
  return HORAS.filter((h) => (!sab || h < '14:00') && ocupados(db, fecha, h) < CUPO && (fecha !== dia() || h > ahora));
}
export function nuevaCita(db, { pac, fecha, hora, trat: t, nota = '', origen = 'consultorio', doc = DOCS[0] }) {
  if (ocupados(db, fecha, hora) >= CUPO) throw new Error('Ese horario ya está ocupado, elige otro.');
  const e = origen === 'portal' ? 'pendiente' : 'confirmada';
  const c = { id: uid(), pac, fecha, hora, trat: t, doc, estado: e, origen, nota, hist: [{ e, f: new Date().toISOString() }] };
  db.citas.push(c);
  return c;
}

// Autochequeo.
{
  const db = semilla();
  const p = { id: 'x', pac: 'p4', items: [{ trat: 'resina', diente: 24 }, { trat: 'endodoncia', diente: 36 }], desc: 0, estado: 'enviado', cuotas: [] };
  console.assert(totalPres(db, p, 1) === Math.round(4750 * 0.95) && totalPres(db, p, 6) === 4750, 'descuento de contado');
  db.pres.push(p); aceptar(db, p, 6);
  console.assert(p.cuotas.length === 7 && p.cuotas.reduce((s, c) => s + c.monto, 0) === 4750, 'cuotas suman el total');
  const antes = saldoPac(db, 'p4');
  console.assert(pagarCuota(db, 'p4', 99999, 'Efectivo') === antes && saldoPac(db, 'p4') === 0, 'no cobra de más');
  console.assert(vencido(db, 'p3') > 0 && vencido(db, 'p1') === 0, 'detecta mensualidad vencida');
  const pac = db.pacs.find((x) => x.id === 'p1'); const pr = db.pres.find((x) => x.id === 'pr1');
  hecho(db, pr, 1); console.assert(pac.odo[26] === 'resina', 'resina actualiza el diente');
  console.assert(desdeOdo(db.pacs.find((x) => x.id === 'p2')).length === 2, 'presupuesto desde odontograma');
  console.assert(recallPend(db).some((x) => x.id === 'p4') && !recallPend(db).some((x) => x.id === 'p5'), 'recall a 6 meses');
}
