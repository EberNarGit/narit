import { montar } from '../../shared/engine.js';

const mascotas = ['Max', 'Luna', 'Rocky', 'Canela', 'Toby', 'Mía', 'Coco', 'Nala', 'Simón', 'Frida', 'Bruno', 'Kiara', 'Milo', 'Chispa', 'Zeus', 'Lola'];
const duenos = ['Sofía Hernández', 'Mateo García', 'Regina Martínez', 'Diego López', 'Ximena Pérez', 'Carlos Ramírez', 'Daniela Flores', 'Jorge Morales'];
const pacientes = mascotas.flatMap((m, i) => duenos.slice(0, 5).map((d, j) => `${mascotas[(i + j * 3) % 16]} (${duenos[(i + j) % 8]})`));

montar({
  slug: 'veterinaria', lib: 'chartjs', iconos: 'emoji', vistas: 'scroll', logo: '🐾',
  chart: { smooth: true, area: true, r: 14, w: 4, cut: '58%' },
  titular: 'Cuidamos a los que <em>no saben decir dónde les duele.</em>',
  bajada: 'Expediente por mascota, cartilla de vacunación con recordatorios, agenda y hospitalización. Sus humanos reciben el aviso; tú, la consulta a tiempo.',
  art: `<div class="clay-pet"><div class="oreja o1"></div><div class="oreja o2"></div><div class="cara"><i></i><i></i><b></b></div><span class="burbuja">¡Me toca vacuna el viernes!</span></div>`,
  problema: 'Las cartillas de vacunación se pierden, los dueños olvidan los refuerzos y el historial de cada mascota está repartido en hojas sueltas. En una urgencia, nadie sabe qué medicamento se le dio la última vez.',
  antes: ['Vacunas y desparasitaciones atrasadas', 'Historial clínico incompleto', 'Hospitalizados sin bitácora clara', 'Medicamento controlado sin registro'],
  feats: [
    ['Expediente por mascota', 'Especie, raza, peso, alergias, cirugías y fotos.'],
    ['Cartilla de vacunación', 'Digital, con próximas dosis calculadas automáticamente.'],
    ['Recordatorios', 'WhatsApp al dueño cuando toca vacuna, baño o revisión.'],
    ['Agenda por médico', 'Consultas, cirugías y estética sin empalmes.'],
    ['Farmacia', 'Inventario por lote y caducidad; recetas ligadas a la consulta.'],
    ['Hospitalización', 'Jaulas, signos vitales y medicación por turno.'],
    ['Estética y baño', 'Citas con notas de corte y fotos de antes y después.'],
    ['Cobro y recibos', 'Cuenta por visita con desglose y factura.'],
  ],
  errores: [
    ['Refuerzos olvidados', 'El sistema avisa al dueño y a la clínica con anticipación.'],
    ['Dosis mal calculadas', 'El peso actualizado sugiere la dosis por kilo.'],
    ['Historial perdido', 'Todo en un expediente, disponible en segundos.'],
    ['Medicamento caducado', 'Alertas por lote antes del vencimiento.'],
    ['Hospitalizados sin seguimiento', 'Bitácora por turno con responsable.'],
  ],
  vs: [['Cartilla de cartón', 'Cartilla digital con recordatorios'], ['Expediente en hojas', 'Historial completo por mascota'], ['"¿Qué le pusimos la vez pasada?"', 'Tratamientos y dosis registrados'], ['Pizarrón de hospitalizados', 'Tablero con estado y medicación']],
  impacto: [['+45%', 'vacunas aplicadas a tiempo'], ['−30%', 'inasistencias'], ['100%', 'de expedientes completos'], ['+20%', 'visitas de seguimiento']],
  modulos: ['Mascotas', 'Cartilla', 'Agenda', 'Consulta', 'Farmacia', 'Hospital', 'Estética', 'Caja'],
  tiempo: '2 a 3 semanas.',
  datos: {
    folio: 'HU', porDia: 20, horas: [9, 20], unico: 'staff', clientes: pacientes,
    cats: [['Consulta general', 450, 6], ['Vacuna múltiple', 520, 4], ['Estética y baño', 380, 4], ['Vacuna antirrábica', 280, 3], ['Desparasitación', 220, 3], ['Hospitalización (día)', 950, 1], ['Limpieza dental', 1600, 0.7], ['Esterilización', 2400, 0.6]],
    staff: ['MVZ Laura Peña', 'MVZ Iván Soto', 'MVZ Renata Gil'], sucs: ['Consultorio', 'Estética', 'Quirófano'],
    estados: [['Agendada', 'pend', 3], ['Atendida', 'ok', 13], ['No asistió', 'bad', 1], ['Cancelada', 'bad', 0.5]],
    pagos: [['Tarjeta', 4], ['Efectivo', 3], ['Transferencia', 2]],
    labels: { reg: 'cita', regs: 'citas', nuevo: 'Nueva cita', cli: 'Paciente (dueño)', cat: 'Servicio', staff: 'Médico', suc: 'Área' },
  },
  kpis: [['ing', {}], ['n', { l: 'Citas' }], ['ticket', {}], ['ok', { l: 'Asistencia' }],
    { l: 'Vacunas aplicadas', f: (s) => s.ok.filter((r) => r.cat.startsWith('Vacuna')).length, fmt: 'num' },
    { l: 'Recordatorios enviados', f: (s) => s.n * 1.7, fmt: 'num' }, ['cli', { l: 'Pacientes atendidos' }], ['bad', { l: 'Inasistencias' }]],
  charts: [
    { t: 'line', titulo: 'Ingresos' },
    { t: 'donut', titulo: 'Ingresos por área', by: 'suc' },
    { t: 'bars', titulo: 'Servicios más solicitados', by: 'cat', m: 'n' },
    { t: 'gauge', titulo: 'Asistencia', k: 3 },
    { t: 'heat', titulo: 'Horas con más citas' },
    { t: 'radar', titulo: 'Médicos', by: 'staff' },
    { t: 'polar', titulo: 'Citas por día', by: 'wd', m: 'n' },
  ],
  alertas: [['warn', 'Luna (Sofía Hernández): refuerzo de vacuna múltiple en 3 días'], ['bad', 'Ketamina lote K-221 caduca en 12 días'], ['info', 'Rocky lleva 2 días hospitalizado: revisar alta']],
  demo: [
    { t: 'agenda', titulo: 'Agenda de la clínica', ayuda: 'Toca un espacio para agendar.' },
    { t: 'checklist', id: 'cartilla', titulo: 'Cartilla de Max · Labrador · 2 años', listo: '¡Cartilla de Max completa! 🐶',
      items: [['Vacunas', ['Parvovirus (cachorro)', 'Múltiple 1.ª dosis', 'Múltiple refuerzo', 'Antirrábica', 'Bordetella', 'Múltiple anual 2026']], ['Desparasitación', ['Interna · marzo', 'Interna · septiembre', 'Externa (pipeta) · noviembre']]],
      hechos: ['Parvovirus (cachorro)', 'Múltiple 1.ª dosis', 'Múltiple refuerzo', 'Antirrábica', 'Interna · marzo'] },
    { t: 'board', id: 'hosp', modo: 'grid', titulo: 'Hospitalización', ayuda: 'Toca una jaula para actualizar el estado.',
      estados: [['Libre', 'ok'], ['Estable', 'c2'], ['En observación', 'pend'], ['Crítico', 'bad']],
      items: [['J1 · Rocky', 1], ['J2', 0], ['J3 · Nala', 2], ['J4', 0], ['J5 · Simón', 1], ['J6 · Frida', 3], ['J7', 0], ['J8', 0]] },
  ],
});
