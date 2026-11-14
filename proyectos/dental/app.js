import { montar } from '../../shared/engine.js';
import { fmt } from '../../shared/core.js';

const fdi = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28, 48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
const ini = { 16: 1, 26: 2, 36: 3, 46: 1, 18: 4, 28: 4, 14: 2, 37: 2 };

montar({
  slug: 'dental', lib: 'apex', iconos: 'svg', vistas: 'tabs', oscuro: true, logo: '🦷',
  chart: { smooth: true, area: true, r: 8, w: 3, horiz: true },
  titular: 'Tu consultorio en orden, <em>tus pacientes sonriendo.</em>',
  bajada: 'Agenda, expediente clínico con odontograma, presupuestos y cobros a plazos en un solo lugar. Menos papel, menos huecos en la agenda y ningún pago olvidado.',
  art: `<div class="tarjetas"><div class="tj tj1"><small>Próxima cita</small><b>Dra. Fernanda Ruiz</b><span>Hoy · 10:30 · Endodoncia</span><i>Confirmada</i></div><div class="tj tj2"><small>Plan de pagos</small><b>$4,200 <em>a 6 meses</em></b><div class="barra"><i></i></div><span>4 de 6 pagos cubiertos</span></div><div class="tj tj3">🦷</div></div>`,
  problema: 'Los expedientes están en carpetas, la agenda en una libreta y los pagos a plazos en la memoria de la recepcionista. Los pacientes faltan sin avisar y nadie da seguimiento a los presupuestos que no aceptaron.',
  antes: ['Huecos en la agenda por inasistencias', 'Expedientes de papel que no aparecen', 'Pagos a plazos sin control', 'Presupuestos entregados y olvidados'],
  feats: [
    ['Agenda por doctor y sillón', 'Citas por duración de tratamiento, sin empalmes.'],
    ['Expediente clínico digital', 'Historia clínica, alergias, radiografías y consentimientos firmados.'],
    ['Odontograma interactivo', 'Marca caries, resinas, coronas y ausencias pieza por pieza.'],
    ['Presupuestos y planes', 'Arma el tratamiento, envíalo por WhatsApp y dale seguimiento.'],
    ['Cobros a plazos', 'Mensualidades con recordatorio y recibo automático.'],
    ['Recordatorios de cita', 'Confirmación por WhatsApp 24 horas antes.'],
    ['Inventario de materiales', 'Resinas, anestesia y guantes con alerta de mínimo y caducidad.'],
    ['Recibos y facturas', 'CFDI 4.0 de honorarios con un clic.'],
    ['Reactivación de pacientes', 'Aviso a quien ya le toca su limpieza semestral.'],
  ],
  errores: [
    ['Citas no confirmadas', 'El paciente confirma con un botón; si no, se ofrece el espacio.'],
    ['Cobros olvidados', 'El sistema avisa qué mensualidades vencen esta semana.'],
    ['Expedientes incompletos', 'No se cierra la consulta sin nota clínica y odontograma.'],
    ['Material caducado', 'Alertas por lote y fecha antes de que se eche a perder.'],
    ['Presupuestos sin seguimiento', 'Lista de pendientes para llamar y cerrar tratamientos.'],
  ],
  vs: [['Carpetas y radiografías sueltas', 'Expediente completo en segundos'], ['Llamar uno por uno para confirmar', 'Confirmación automática por WhatsApp'], ['"¿Cuánto debía la señora?"', 'Saldo y pagos de cada paciente'], ['Odontograma en papel', 'Odontograma interactivo con historial']],
  impacto: [['−38%', 'inasistencias'], ['+25%', 'presupuestos aceptados'], ['95%', 'de cobranza al corriente'], ['3 h', 'menos de administración a la semana']],
  modulos: ['Agenda', 'Expediente', 'Odontograma', 'Presupuestos', 'Cobranza', 'Inventario', 'Recordatorios', 'Facturación'],
  tiempo: '3 semanas, incluyendo la migración de tus pacientes actuales.',
  datos: {
    folio: 'DX', porDia: 15, horas: [9, 19], unico: 'staff', semana: [0, 1.1, 1.1, 1, 1.1, 1.2, 0.8],
    cats: [['Limpieza dental', 650, 5], ['Resina', 900, 4], ['Valoración', 350, 3], ['Ortodoncia (mensualidad)', 1200, 3], ['Extracción', 1100, 1.5], ['Endodoncia', 4200, 1], ['Blanqueamiento', 3500, 0.7], ['Corona de zirconia', 7800, 0.5]],
    staff: ['Dra. Fernanda Ruiz', 'Dr. Héctor Salazar', 'Dra. Paola Medina'], sucs: ['Sillón 1', 'Sillón 2'],
    estados: [['Agendada', 'pend', 2], ['Confirmada', 'pend', 2], ['Atendida', 'ok', 12], ['No asistió', 'bad', 1.1], ['Cancelada', 'bad', 0.6]],
    pagos: [['Tarjeta', 4], ['Efectivo', 3], ['Plan a meses', 2], ['SPEI', 1]],
    labels: { reg: 'cita', regs: 'citas', nuevo: 'Nueva cita', cli: 'Paciente', cat: 'Tratamiento', staff: 'Doctor', suc: 'Sillón' },
  },
  kpis: [['ing', {}], ['n', { l: 'Citas' }], ['ticket', { l: 'Ingreso por paciente' }], ['ok', { l: 'Asistencia' }], ['bad', { l: 'Inasistencias' }],
    { l: 'Por cobrar (planes)', f: (s) => s.rows.filter((r) => r.pago === 'Plan a meses').reduce((a, r) => a + r.monto, 0) * 0.6, fmt: 'mxn', inv: 1 },
    ['cli', { l: 'Pacientes atendidos' }], { l: 'Presupuestos aceptados', f: (s) => (s.n ? 48 + s.ok.length / s.n * 22 : 0), fmt: 'pct' }],
  charts: [
    { t: 'line', titulo: 'Ingresos', sub: 'Comparado con el periodo anterior' },
    { t: 'gauge', titulo: 'Asistencia a citas', k: 3 },
    { t: 'bars', titulo: 'Ingresos por tratamiento', by: 'cat' },
    { t: 'donut', titulo: 'Formas de pago', by: 'pago' },
    { t: 'heat', titulo: 'Ocupación de agenda' },
    { t: 'radar', titulo: 'Productividad por doctor', by: 'staff' },
    { t: 'tree', titulo: 'Mezcla de tratamientos', by: 'cat' },
  ],
  alertas: [['bad', 'Mensualidad vencida: Karla Mendoza · Ortodoncia · $1,200'], ['warn', 'Anestesia lidocaína 2%: quedan 6 cartuchos (mínimo 20)'], ['info', '14 pacientes cumplen 6 meses sin limpieza']],
  demo: [
    { t: 'board', id: 'odonto', modo: 'dental', titulo: 'Odontograma · Paciente: Regina Flores', ayuda: 'Toca una pieza para cambiar su diagnóstico (numeración FDI).',
      estados: [['Sano', 'ok'], ['Caries', 'bad'], ['Resina', 'c3'], ['Corona', 'pend'], ['Ausente', 'mut']], items: fdi.map((n) => [String(n), ini[n] || 0]) },
    { t: 'calc', titulo: 'Presupuesto de tratamiento', resultado: 'Presupuesto', guardar: 'Guardar presupuesto', estado: 'Agendada',
      campos: [{ id: 'trat', l: 'Tratamiento', t: 'sel', o: [['Resina', 900], ['Endodoncia', 4200], ['Corona de zirconia', 7800], ['Extracción', 1100]] }, { id: 'pz', l: 'Número de piezas', t: 'num', v: 2, min: 1, max: 12 }, { id: 'limp', l: 'Incluir limpieza ($650)', t: 'chk', v: true }, { id: 'meses', l: 'Plan de pagos', t: 'sel', o: [['Contado (−5%)', 1], ['3 meses sin intereses', 3], ['6 meses sin intereses', 6], ['12 meses', 12]], v: 2 }],
      formula: (v) => { const b = v.trat * v.pz, l = [[`Tratamiento × ${v.pz} pieza(s)`, b]]; if (v.limp) l.push(['Limpieza dental', 650]); if (v.meses === 1) l.push(['Descuento por pago de contado', -(b + (v.limp ? 650 : 0)) * 0.05]); return l; },
      nota: (v, t) => `Servicios dentales exentos de IVA. ${v.meses > 1 ? `Mensualidad: ${fmt.mxn2(t / v.meses)} durante ${v.meses} meses.` : 'Pago único.'}`,
      cat: (v) => ({ 900: 'Resina', 4200: 'Endodoncia', 7800: 'Corona de zirconia', 1100: 'Extracción' }[v.trat]) },
    { t: 'agenda', titulo: 'Agenda del consultorio', ayuda: 'Toca un espacio libre para agendar.' },
  ],
});
