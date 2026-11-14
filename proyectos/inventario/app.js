import { montar } from '../../shared/engine.js';

montar({
  slug: 'inventario', lib: 'chartjs', iconos: 'ascii', vistas: 'tabs', logo: '>_',
  chart: { step: true, w: 2, sq: true, dash: false, bw: 0, cut: '55%' },
  titular: 'Existencias reales.<br>Cero inventario fantasma.',
  bajada: 'Entradas, salidas, lotes y caducidades con código de barras. Lo que dice el sistema es lo que hay en el anaquel.',
  art: `<pre class="tty">$ almacen --estado
┌────────────────────────────┐
│ SKU activos ........ 1,284 │
│ Bajo mínimo ........    17 │
│ Por caducar (30 d) .     9 │
│ Exactitud ........ 98.6 % │
└────────────────────────────┘
$ escanear 7501055300075
> ENTRADA OK  +24 pzas  L-0412
$ <span class="cur">█</span></pre>`,
  problema: 'El inventario se cuenta dos veces al año y nunca cuadra. Se compra lo que ya había, se vende lo que no hay y los productos caducan al fondo del anaquel sin que nadie lo note.',
  antes: ['Ventas de producto que no existe', 'Compras duplicadas por no saber qué hay', 'Mercancía caducada en el anaquel', 'Robo hormiga imposible de rastrear'],
  feats: [
    ['Entradas y salidas', 'Cada movimiento con usuario, fecha, motivo y documento.'],
    ['Código de barras', 'Escanea con lector o con la cámara del celular.'],
    ['Mínimos y máximos', 'Alertas de reorden antes de quedarte sin producto.'],
    ['Lotes y caducidades', 'Primeras entradas, primeras salidas; avisos a 30, 15 y 7 días.'],
    ['Ajustes con motivo', 'Merma, daño o robo quedan registrados y autorizados.'],
    ['Valuación', 'Costo promedio y valor total del inventario al día.'],
    ['Análisis ABC', 'Sabe qué 20% de productos mueve 80% de tu dinero.'],
    ['Conteos cíclicos', 'Cuenta un pasillo por día en vez de cerrar dos días al año.'],
    ['Multi-almacén', 'Traspasos entre bodegas con existencias en tránsito.'],
  ],
  errores: [
    ['Inventario fantasma', 'Las existencias cambian solo con movimientos registrados.'],
    ['Quiebres de stock', 'Punto de reorden y compra sugerida por producto.'],
    ['Caducidades', 'Reporte diario de lotes por vencer.'],
    ['Ajustes sin explicación', 'Todo ajuste pide motivo y queda firmado.'],
    ['Errores de captura', 'El escáner elimina el tecleo de claves.'],
  ],
  vs: [['Conteo general cada 6 meses', 'Conteos cíclicos diarios'], ['Kardex en Excel', 'Movimientos en tiempo real'], ['"Creo que sí hay"', 'Existencia exacta por almacén y lote'], ['Comprar por corazonada', 'Reorden por mínimos y rotación']],
  impacto: [['98%+', 'exactitud de inventario'], ['−25%', 'capital detenido'], ['−70%', 'producto caducado'], ['0', 'ventas sin existencia']],
  modulos: ['Catálogo', 'Entradas', 'Salidas', 'Lotes', 'Ajustes', 'Traspasos', 'Conteos', 'Valuación', 'ABC'],
  tiempo: '3 a 5 semanas, incluyendo el inventario inicial.',
  datos: {
    folio: 'MOV', porDia: 26, horas: [7, 19], vivo: true, mult: 6, semana: [0.1, 1.2, 1.1, 1, 1, 1.1, 0.6],
    cats: [['Abarrotes', 2400, 5], ['Bebidas', 3100, 4], ['Limpieza', 1800, 3], ['Lácteos y fríos', 2700, 3], ['Ferretería', 4200, 1.5], ['Papelería', 950, 1.5], ['Electrónica', 8600, 0.6]],
    staff: ['J. Morales', 'K. Rivera', 'O. Castillo'], sucs: ['CEDIS Tlalnepantla', 'Bodega Iztapalapa', 'Tienda Centro'],
    clientes: ['Distribuidora del Bajío', 'Abarrotera La Merced', 'Comercial Treviño', 'Lácteos San Juan', 'Papelera del Centro', 'Ferretodo MX', 'Bebidas del Valle', 'Tienda Centro (traspaso)', 'Venta mostrador', 'Mayoreo Ecatepec', 'Limpieza Total SA', 'Electro Norte'],
    estados: [['En tránsito', 'pend', 1.5], ['Por acomodar', 'pend', 1], ['Aplicado', 'ok', 14], ['Ajuste / merma', 'bad', 0.8]],
    pagos: [['Entrada', 5], ['Salida', 6], ['Traspaso', 1.5]],
    labels: { reg: 'movimiento', regs: 'movimientos', nuevo: 'Nuevo movimiento', cli: 'Origen / destino', cat: 'Familia', staff: 'Almacenista', suc: 'Almacén' },
  },
  kpis: [['ing', { l: 'Valor movido' }], ['n', { l: 'Movimientos' }], { l: 'Valor del inventario', f: (s) => 1842000 + s.ing * 0.012, fmt: 'mxn' },
    { l: 'Exactitud', f: (s) => 100 - (s.n ? s.bad.length / s.n * 28 : 0), fmt: 'pct' }, ['bad', { l: 'Ajustes y merma' }],
    { l: 'Días de inventario', f: (s) => 34 - Math.min(9, s.n / s.dias / 5), fmt: 'dec', inv: 1 }, ['pend', { l: 'Por acomodar / en tránsito' }],
    { l: 'SKU bajo mínimo', f: (s) => 11 + (s.bad.length % 9), fmt: 'num', inv: 1 }],
  charts: [
    { t: 'line', titulo: 'VALOR MOVIDO POR DÍA' },
    { t: 'gauge', titulo: 'EXACTITUD DE INVENTARIO', k: 3 },
    { t: 'bars', titulo: 'MOVIMIENTOS POR FAMILIA', by: 'cat', stack: 'pago', m: 'n' },
    { t: 'donut', titulo: 'VALOR POR ALMACÉN', by: 'suc' },
    { t: 'tree', titulo: 'ANÁLISIS ABC (VALOR POR FAMILIA)', by: 'cat' },
    { t: 'heat', titulo: 'CARGA DE TRABAJO HORA × DÍA' },
    { t: 'radar', titulo: 'DESEMPEÑO POR ALMACENISTA', by: 'staff' },
  ],
  alertas: [['bad', 'STOCK BAJO: Aceite 1-2-3 900 ml · 4 pzas (mín. 24)'], ['warn', 'CADUCA EN 7 DÍAS: Yogurt natural 1 L · lote L-0398 · 36 pzas'], ['info', 'Conteo cíclico de hoy: pasillo 4 (62 SKU)']],
  demo: [
    { t: 'scan', id: 'cb', titulo: 'ESCÁNER DE ALMACÉN', ayuda: 'Elige el movimiento y escanea.', modos: ['Entrada', 'Salida'], campo: 'CÓDIGO DE BARRAS', espera: 'LECTOR LISTO_',
      items: [{ c: '7501055300075', n: 'Refresco cola 600 ml', q: 144, min: 48 }, { c: '7501000111206', n: 'Aceite 1-2-3 900 ml', q: 4, min: 24 }, { c: '7501020540666', n: 'Yogurt natural 1 L (L-0398)', q: 36, min: 12 }, { c: '7501035911208', n: 'Detergente 1 kg', q: 0, min: 20 }, { c: '7506339394412', n: 'Cuaderno profesional 100 h', q: 80, min: 30 }] },
    { t: 'board', id: 'lotes', modo: 'grid', titulo: 'LOTES Y CADUCIDADES', ayuda: 'Toca un lote para reclasificarlo.',
      estados: [['VIGENTE', 'ok'], ['POR CADUCAR', 'pend'], ['CADUCADO', 'bad'], ['CUARENTENA', 'c3']],
      items: [['L-0398', 1], ['L-0401', 0], ['L-0404', 0], ['L-0407', 0], ['L-0388', 2], ['L-0412', 0], ['L-0391', 1], ['L-0415', 0], ['L-0379', 3], ['L-0418', 0], ['L-0420', 0], ['L-0395', 1]] },
    { t: 'checklist', id: 'conteo', titulo: 'CONTEO CÍCLICO · PASILLO 4', listo: 'CONTEO CERRADO. DIFERENCIAS: 0', items: ['Anaquel 4-A · Aceites y vinagres', 'Anaquel 4-B · Enlatados', 'Anaquel 4-C · Pastas y arroz', 'Anaquel 4-D · Harinas y azúcar', 'Tarima 4-01 · Refresco 600 ml', 'Tarima 4-02 · Agua 1.5 L'], hechos: ['Anaquel 4-A · Aceites y vinagres'] },
  ],
});
