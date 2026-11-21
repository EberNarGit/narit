// Panel del taller: tablero de órdenes, recepción, cotización y autorización, refacciones, bitácora con fotos, cobro y entrega.
import { $, $$, esc, pesos, fecha, fechaHora, wa, toast, puerta, barras, uid, foto, comprimir } from '../_base/sis.js';
import { abrir, dia, fDia, loc, diasEntre, auto, cli, mec, nombreAuto, autorizados, pendientes, total, pagado, saldo, refsFaltan, atrasada, agregarItem, pedirAutorizacion, llegoRef, avanzar, cobrar, entregar, proxServicio, horasLibres, comisiones, EST_TXT, GAS } from './datos.js';

const B = abrir();
const db = () => B.db;
const dlg = $('#dlg');
const guardar = (msg) => { if (B.guardar()) { if (msg) toast(msg); pintar(); return true; } return false; };
const ventana = (html, ancho = false) => { dlg.className = ancho ? 'ancho' : ''; dlg.innerHTML = html; if (!dlg.open) dlg.showModal(); };
const cab = (t, sub, acc = '') => `<div class="top"><div><h1>${t}</h1>${sub ? `<p>${sub}</p>` : ''}</div><div class="acc">${acc}</div></div>`;
const dlgH = (t) => `<div class="dlg-h"><h2>${t}</h2><button class="x" type="button" data-cerrar aria-label="Cerrar">×</button></div>`;
const waC = (c, m) => wa('52' + c.tel, m);
const portal = () => new URL('index.html#portal', location.href).href;
const hola = (c) => `Hola ${c.n.split(' ')[0]}, te escribimos de ${db().conf.nombre}.`;
const activas = () => db().ordenes.filter((o) => !['entregado', 'cancelado'].includes(o.estado));
const orden = (folio) => db().ordenes.find((o) => o.folio === folio);
const pagosDe = (d1, d2) => db().ordenes.flatMap((o) => o.pagos.map((p) => ({ ...p, o }))).filter((p) => loc(p.f) >= d1 && loc(p.f) <= d2);
const sinResp = () => activas().filter((o) => o.estado === 'autorizacion');
const listosSinRecoger = () => activas().filter((o) => o.estado === 'listo' && diasEntre(o.hist.at(-1).f, dia()) >= 1);
const tocaServicio = () => db().autos.filter((a) => !activas().some((o) => o.auto === a.id) && proxServicio(db(), a)?.toca);
const refsPend = () => activas().flatMap((o) => refsFaltan(o).map((it) => ({ o, it })));

// ---------- Tablero
const COLS = [['recibido', 'diagnostico'], ['autorizacion'], ['refaccion'], ['reparacion'], ['pruebas'], ['listo']];
const COL_TXT = ['Recibido / diagnóstico', 'Espera al cliente', 'Espera refacción', 'En reparación', 'Pruebas y lavado', 'Listo para entregar'];
function inicio() {
  const pHoy = pagosDe(dia(), dia());
  return cab('Tablero del taller', `${activas().length} autos en el taller. Cada cambio lo ve el cliente en «Mi auto».`, '<a class="btn" href="#recepcion">+ Recibir auto</a>') + `
  <div class="kpis">
    <div class="kpi"><span>Autos en taller</span><b>${activas().length}</b><small>${activas().filter(atrasada).length} con retraso</small></div>
    <div class="kpi ${sinResp().length ? 'alerta' : ''}"><span>Esperan al cliente</span><b>${pesos(sinResp().reduce((s, o) => s + pendientes(o).reduce((t, x) => t + x.precio, 0), 0))}</b><small>${sinResp().length} cotizaciones sin respuesta</small></div>
    <div class="kpi ${refsPend().length ? 'alerta' : ''}"><span>Refacciones por llegar</span><b>${refsPend().length}</b><small>${refsPend().filter((r) => r.it.eta && r.it.eta < dia()).length} con fecha vencida</small></div>
    <div class="kpi"><span>Cobrado hoy</span><b>${pesos(pHoy.reduce((s, p) => s + p.monto, 0))}</b><small>por cobrar en listos: ${pesos(activas().filter((o) => o.estado === 'listo').reduce((s, o) => s + saldo(o), 0))}</small></div>
  </div>
  <div class="tablero">${COLS.map((es, k) => { const l = activas().filter((o) => es.includes(o.estado)).sort((a, b) => a.promesa.localeCompare(b.promesa));
    return `<section class="col ${k === 1 && l.length ? 'alerta' : ''}"><h2>${COL_TXT[k]}<span>${l.length}</span></h2>${l.map(tarjeta).join('')}</section>`; }).join('')}</div>`;
}
function tarjeta(o) {
  const a = auto(db(), o.auto); const c = cli(db(), o.cli);
  return `<button class="ord ${atrasada(o) ? 'tarde' : ''}" data-orden="${o.folio}"><img src="${foto(a.foto, 300)}" alt=""><b>${esc(a.marca)} ${esc(a.modelo)} <span class="placa">${esc(a.placa)}</span></b><small>${o.folio} · ${esc(c.n)}</small><small>🔧 ${esc(mec(db(), o.mec)?.n || 'Sin asignar')} · ${atrasada(o) ? `<b style="color:var(--bad)">prometido ${fDia(o.promesa)}</b>` : `entrega ${fDia(o.promesa)}`}</small>
    ${o.estado === 'autorizacion' ? `<small style="color:var(--bad);font-weight:700">Esperando autorización · ${pesos(pendientes(o).reduce((s, x) => s + x.precio, 0))}</small>` : ''}${refsFaltan(o).length ? `<small>📦 ${refsFaltan(o).length} refacción(es) ${refsFaltan(o)[0].eta ? 'llega ' + fDia(refsFaltan(o)[0].eta) : 'sin fecha'}</small>` : ''}${o.estado === 'listo' && saldo(o) ? `<small>Saldo ${pesos(saldo(o))}</small>` : ''}</button>`;
}

// ---------- Orden
function verOrden(folio) {
  const o = orden(folio); const a = auto(db(), o.auto); const c = cli(db(), o.cli);
  const sig = { recibido: 'Pasar a diagnóstico', diagnostico: pendientes(o).length ? 'Pedir autorización al cliente' : 'Pasar a reparación', reparacion: 'Pasar a pruebas y lavado', pruebas: 'Marcar listo para entregar' }[o.estado];
  const est = (it) => it.est === 'autorizado' ? '<span class="badge b-ok">Autorizado</span>' : it.est === 'pendiente' ? '<span class="badge b-warn">Por autorizar</span>' : '<span class="badge b-mut">Rechazado</span>';
  const msg = o.estado === 'listo' ? `${hola(c)} ¡Tu ${a.marca} ${a.modelo} ya está listo! 🚗 ${saldo(o) > 0 ? `Saldo: ${pesos(saldo(o))}. ` : ''}Horario: ${db().conf.horario}.`
    : o.estado === 'autorizacion' ? `${hola(c)} Ya revisamos tu ${a.marca} ${a.modelo}. Necesitamos tu autorización para continuar (${pesos(pendientes(o).reduce((s, x) => s + x.precio, 0))}). Revisa la cotización con fotos y aprueba aquí, concepto por concepto: ${portal()} — placa ${a.placa}, folio ${o.folio}.`
    : `${hola(c)} Tu ${a.marca} ${a.modelo} está: ${EST_TXT[o.estado]}. Síguelo aquí con placa ${a.placa} y folio ${o.folio}: ${portal()}`;
  ventana(`${dlgH(`${o.folio} · ${esc(nombreAuto(a))} <span class="placa">${esc(a.placa)}</span>`)}<div class="dlg-b">
    <div class="grid2" style="grid-template-columns:1.2fr 1fr"><div>
      <p style="margin:0"><b>${esc(c.n)}</b> · <a target="_blank" rel="noopener" href="${waC(c, msg)}">📱 ${esc(c.tel)}</a></p>
      <p style="margin:4px 0"><span class="badge ${o.estado === 'autorizacion' ? 'b-bad' : o.estado === 'listo' ? 'b-ok' : 'b-info'}">${EST_TXT[o.estado]}</span> ${atrasada(o) ? '<span class="badge b-bad">Con retraso</span>' : ''}</p>
      <p style="margin:0" class="ayuda">${esc(o.motivo)} · ${o.km.toLocaleString('es-MX')} km · gasolina ${esc(o.gas)} · ${esc(o.inv)}${o.danos ? ' · daños: ' + esc(o.danos) : ''}</p></div>
      <form class="form" id="fCab" style="grid-template-columns:1fr 1fr"><label>Mecánico<select name="mec">${db().mecs.map((m) => `<option value="${m.id}" ${m.id === o.mec ? 'selected' : ''}>${esc(m.n)}</option>`).join('')}</select></label><label>Entrega prometida<input type="date" name="promesa" value="${o.promesa}"></label></form></div>
    <h3 style="margin:16px 0 6px">Cotización</h3>
    <table class="t"><thead><tr><th>Concepto</th><th class="ocultar-m">Tipo</th><th class="num">Precio</th><th class="num ocultar-m">Costo</th><th>Estado</th><th>Refacción</th></tr></thead><tbody>
      ${o.items.map((it) => `<tr><td>${esc(it.n)}</td><td class="ocultar-m">${it.tipo === 'mo' ? 'Mano de obra' : 'Refacción'}</td><td class="num">${pesos(it.precio)}</td><td class="num ocultar-m">${it.costo ? pesos(it.costo) : '—'}</td><td>${est(it)}</td>
        <td>${it.tipo === 'ref' && it.est === 'autorizado' ? (it.llego ? '<span class="badge b-ok">En taller</span>' : `<span style="display:flex;gap:4px;align-items:center;flex-wrap:wrap"><input type="date" data-eta="${it.id}" value="${it.eta || ''}" aria-label="Fecha de llegada" style="padding:4px;border:1px solid var(--ln);border-radius:6px"><button class="btn mini" data-llego="${it.id}">Llegó</button></span>`) : ''}</td></tr>`).join('')}
      <tr><td><b>Autorizado</b></td><td class="ocultar-m"></td><td class="num"><b>${pesos(total(o))}</b></td><td class="num ocultar-m">${pesos(autorizados(o).reduce((s, x) => s + x.costo, 0))}</td><td colspan="2">${pendientes(o).length ? `Por autorizar: ${pesos(pendientes(o).reduce((s, x) => s + x.precio, 0))}` : ''}</td></tr></tbody></table>
    ${!['listo', 'entregado', 'cancelado'].includes(o.estado) ? `<form class="form" id="fItem" style="grid-template-columns:1fr 2fr 1fr 1fr auto;align-items:end;margin-top:10px">
      <label>Tipo<select name="tipo"><option value="ref">Refacción</option><option value="mo">Mano de obra</option></select></label><label>Concepto<input name="n" required placeholder="Ej. Bomba de gasolina"></label>
      <label>Precio<input name="precio" type="number" min="1" required></label><label>Costo<input name="costo" type="number" min="0"></label><button class="btn sec">Agregar</button></form>
      ${pendientes(o).length ? `<p style="margin:10px 0 0"><button class="btn" id="pedirAut">Pedir autorización al cliente</button> <span class="ayuda">El cliente aprueba en su celular, concepto por concepto.</span></p>` : ''}` : ''}
    <h3 style="margin:16px 0 6px">Bitácora</h3>
    <form class="form" id="fBit" style="grid-template-columns:2fr auto auto auto;align-items:end"><label>Nota<input name="txt" required placeholder="Lo que encontraste o hiciste"></label>
      <label class="subir2">Foto<input type="file" name="foto" accept="image/*" style="max-width:180px"></label><label class="check"><input type="checkbox" name="pub" checked> La ve el cliente</label><button class="btn sec">Publicar</button></form>
    <div>${[...o.bitacora].reverse().map((b) => `<div class="bitA">${b.foto ? `<img src="${foto(b.foto, 200)}" alt="">` : '<span></span>'}<div>${esc(b.txt)}<br><small class="ayuda">${fechaHora(b.f)} · ${b.pub ? 'visible para el cliente' : '🔒 interna'}</small></div></div>`).join('')}</div>
    <h3 style="margin:16px 0 6px">Pagos</h3>
    <p style="margin:0">Total ${pesos(total(o))} · pagado ${pesos(pagado(o))} · <b style="color:${saldo(o) > 0 ? 'var(--bad)' : 'var(--ok)'}">saldo ${pesos(saldo(o))}</b></p>
    ${saldo(o) > 0 && o.estado !== 'cancelado' ? `<form class="form" id="fPago" style="grid-template-columns:1fr 1fr 1fr auto;align-items:end;margin-top:6px"><label>Monto<input name="monto" type="number" min="1" max="${saldo(o)}" value="${saldo(o)}" required></label><label>Método<select name="met"><option>Efectivo</option><option>Tarjeta</option><option>Transferencia</option></select></label><label>Concepto<select name="con"><option>Pago</option><option>Anticipo para refacciones</option></select></label><button class="btn sec">Registrar</button></form>` : ''}
    <ul class="lista-mini">${o.pagos.map((p) => `<li>${esc(p.concepto)} · ${esc(p.met)}<span class="der">${pesos(p.monto)}<br><small>${fecha(p.f)}</small></span></li>`).join('')}</ul>
  </div><div class="dlg-p">
    ${!['entregado', 'cancelado'].includes(o.estado) ? '<button class="btn peligro" id="cancelar">Cancelar orden</button>' : ''}
    <a class="btn sec" target="_blank" rel="noopener" href="${waC(c, msg)}">📱 Avisar al cliente</a>
    ${sig ? `<button class="btn" id="avanzar">${sig}</button>` : ''}${o.estado === 'listo' ? '<button class="btn" id="entregar">Entregar auto</button>' : ''}</div>`, true);
  const f = $('#fCab'); f.onchange = () => { o.mec = f.mec.value; if (f.promesa.value && f.promesa.value !== o.promesa) { o.promesa = f.promesa.value; o.bitacora.push({ f: new Date().toISOString(), txt: `Nueva fecha de entrega: ${fDia(o.promesa)}.`, foto: '', pub: true }); } guardar('Orden actualizada'); verOrden(folio); };
  dlg.querySelectorAll('[data-eta]').forEach((i) => (i.onchange = () => { const it = o.items.find((x) => x.id === i.dataset.eta); it.eta = i.value; guardar('Fecha de llegada guardada: el cliente la ve'); }));
  $('#fItem') && ($('#fItem').onsubmit = (e) => { e.preventDefault(); const x = e.target; try { agregarItem(db(), o, { tipo: x.tipo.value, n: x.n.value.trim(), precio: +x.precio.value, costo: +x.costo.value || 0 }); } catch (err) { return toast(err.message, 'error'); } if (guardar('Concepto agregado (por autorizar)')) verOrden(folio); });
  $('#pedirAut') && ($('#pedirAut').onclick = () => { try { pedirAutorizacion(o, o.estado === 'reparacion' || o.estado === 'refaccion' ? 'Encontramos algo más mientras trabajábamos. Revisa y decide.' : 'Aprueba la cotización para continuar.'); } catch (err) { return toast(err.message, 'error'); } if (guardar('El cliente ya ve «Requiere tu atención» en su portal')) { verOrden(folio); window.open(waC(c, `${hola(c)} Necesitamos tu autorización (${pesos(pendientes(o).reduce((s, x) => s + x.precio, 0))}). Revisa y aprueba aquí: ${portal()} — placa ${a.placa}, folio ${o.folio}.`), '_blank', 'noopener'); } });
  $('#fBit').onsubmit = async (e) => {
    e.preventDefault(); const x = e.target; let ft = '';
    if (x.foto.files[0]) { try { ft = await comprimir(x.foto.files[0], 900); } catch (err) { return toast(err.message, 'error'); } }
    o.bitacora.push({ f: new Date().toISOString(), txt: x.txt.value.trim(), foto: ft, pub: x.pub.checked });
    if (guardar(x.pub.checked ? 'Publicado: el cliente ya lo ve' : 'Nota interna guardada')) verOrden(folio);
  };
  $('#fPago') && ($('#fPago').onsubmit = (e) => { e.preventDefault(); try { const m = cobrar(o, +e.target.monto.value, e.target.met.value, e.target.con.value); if (guardar(`Pago de ${pesos(m)} registrado`)) verOrden(folio); } catch (err) { toast(err.message, 'error'); } });
  $('#avanzar') && ($('#avanzar').onclick = () => { try { avanzar(db(), o); } catch (err) { return toast(err.message, 'error'); } if (guardar(`${o.folio}: ${EST_TXT[o.estado]}`)) verOrden(folio); });
  $('#entregar') && ($('#entregar').onclick = () => {
    const km = Math.round(+prompt('Kilometraje al entregar:', o.km));
    if (!km) return;
    try { entregar(db(), o, km); } catch (err) { return toast(err.message.replace(/\d+/, (n) => pesos(+n)), 'error'); }
    if (guardar(`Entregado. Garantía hasta ${fDia(o.garantia)}`)) dlg.close();
  });
  $('#cancelar') && ($('#cancelar').onclick = () => { if (!confirm(`¿Cancelar ${o.folio}?`)) return; o.estado = 'cancelado'; o.hist.push({ e: 'cancelado', f: new Date().toISOString() }); if (guardar('Orden cancelada')) dlg.close(); });
  dlg.querySelectorAll('[data-llego]').forEach((b) => (b.onclick = () => { llegoRef(o, b.dataset.llego); if (guardar(o.estado === 'reparacion' ? 'Llegaron todas: el auto pasó a reparación' : 'Refacción recibida')) verOrden(folio); }));
}

// ---------- Recepción
let desdeCita = null;
function recepcion() {
  const ct = desdeCita && db().citas.find((x) => x.id === desdeCita);
  return cab('Recibir auto', 'Registra cómo llega el auto. El cliente recibe su folio para seguirlo.') + `
  <form class="panel form" id="fRec">
    <label>Cliente<select name="cli"><option value="">+ Cliente nuevo</option>${db().clis.map((c) => `<option value="${c.id}" ${ct?.cli === c.id ? 'selected' : ''}>${esc(c.n)} · ${c.tel}</option>`).join('')}</select></label>
    <label>Auto<select name="auto"></select></label>
    <label class="nc">Nombre<input name="n"></label><label class="nc">WhatsApp (10 dígitos)<input name="tel" inputmode="tel"></label>
    <label class="na">Placa<input name="placa" style="text-transform:uppercase"></label><label class="na">Marca<input name="marca"></label>
    <label class="na">Modelo<input name="modelo"></label><label class="na">Año<input name="anio" type="number" min="1970" max="2030"></label>
    <label class="na">Color<input name="color"></label><label class="na">Foto del auto<input type="file" name="foto" accept="image/*"></label>
    <label>Kilometraje<input name="km" type="number" min="0" required></label><label>Gasolina<select name="gas">${GAS.map((g) => `<option ${g === '1/2' ? 'selected' : ''}>${g}</option>`).join('')}</select></label>
    <fieldset class="full" style="border:1px solid var(--ln);border-radius:12px;padding:10px"><legend class="ayuda">Inventario de entrada</legend><div class="inv">${['Llanta de refacción', 'Gato', 'Herramienta', 'Tapetes', 'Estéreo', 'Tarjeta de circulación'].map((x) => `<label class="check"><input type="checkbox" name="inv" value="${x}" checked> ${x}</label>`).join('')}</div></fieldset>
    <label class="full">Daños visibles<input name="danos" placeholder="Rayones, golpes, cristal estrellado…"></label>
    <label class="full">¿Qué le pasa? (lo que dice el cliente)<textarea name="motivo" required>${esc(ct?.nota || '')}</textarea></label>
    <label>Mecánico<select name="mec">${db().mecs.map((m) => `<option value="${m.id}">${esc(m.n)} · ${esc(m.esp)}</option>`).join('')}</select></label>
    <label>Entrega prometida<input name="promesa" type="date" min="${dia()}" value="${dia(2)}" required></label>
    <div class="full"><button class="btn">Crear orden y dar folio</button></div></form>`;
}
function enlazarRec() {
  const f = $('#fRec');
  const sync = () => {
    const nuevoC = !f.cli.value; $$('.nc', f).forEach((x) => (x.hidden = !nuevoC)); f.n.required = f.tel.required = nuevoC;
    const v = f.auto.value || db().citas.find((x) => x.id === desdeCita)?.auto;
    f.auto.innerHTML = db().autos.filter((a) => a.cli === f.cli.value).map((a) => `<option value="${a.id}" ${a.id === v ? 'selected' : ''}>${esc(nombreAuto(a))} · ${esc(a.placa)}</option>`).join('') + '<option value="">+ Auto nuevo</option>';
    const nuevoA = !f.auto.value; $$('.na', f).forEach((x) => (x.hidden = !nuevoA)); ['placa', 'marca', 'modelo', 'anio'].forEach((k) => (f[k].required = nuevoA));
    if (!nuevoA && !f.km.value) f.km.value = auto(db(), f.auto.value).km;
  };
  f.cli.onchange = () => { f.auto.value = ''; f.km.value = ''; sync(); }; f.auto.onchange = () => { f.km.value = ''; sync(); }; sync();
  f.onsubmit = async (e) => {
    e.preventDefault();
    let cid = f.cli.value;
    if (!cid) { const tel = f.tel.value.replace(/\D/g, '').slice(-10); if (tel.length !== 10) return toast('El WhatsApp debe tener 10 dígitos', 'error'); const ya = db().clis.find((c) => c.tel === tel); cid = ya?.id || uid(); if (!ya) db().clis.push({ id: cid, n: f.n.value.trim(), tel }); }
    let aid = f.auto.value;
    if (!aid) {
      const placa = f.placa.value.trim().toUpperCase();
      if (db().autos.some((a) => a.placa === placa)) return toast('Esa placa ya está registrada: elige el auto en la lista', 'error');
      let ft = 'photo-1663852408695-f57f4d75a536';
      if (f.foto.files[0]) { try { ft = await comprimir(f.foto.files[0], 800); } catch (err) { return toast(err.message, 'error'); } }
      aid = uid(); db().autos.push({ id: aid, cli: cid, placa, marca: f.marca.value.trim(), modelo: f.modelo.value.trim(), anio: +f.anio.value, color: f.color.value.trim(), foto: ft, km: +f.km.value, ult: null });
    }
    const a = auto(db(), aid);
    if (+f.km.value < a.km) return toast(`El kilometraje no puede ser menor al último registrado (${a.km.toLocaleString('es-MX')})`, 'error');
    if (db().ordenes.some((o) => o.auto === aid && !['entregado', 'cancelado'].includes(o.estado))) return toast('Ese auto ya tiene una orden abierta', 'error');
    a.km = +f.km.value;
    const ahora = new Date().toISOString();
    const o = { folio: 'MS-' + db().sig++, auto: aid, cli: cid, f: ahora, motivo: f.motivo.value.trim(), km: a.km, gas: f.gas.value, inv: [...f.querySelectorAll('[name=inv]:checked')].map((x) => x.value).join(', '), danos: f.danos.value.trim(), mec: f.mec.value, estado: 'recibido', hist: [{ e: 'recibido', f: ahora }], items: [], bitacora: [{ f: ahora, txt: `Recibimos tu ${a.marca} ${a.modelo} con ${a.km.toLocaleString('es-MX')} km y ${f.gas.value} de gasolina.`, foto: '', pub: true }], promesa: f.promesa.value, pagos: [], garantia: '' };
    db().ordenes.push(o);
    if (desdeCita) { const ct = db().citas.find((x) => x.id === desdeCita); if (ct) ct.estado = 'recibida'; desdeCita = null; }
    pintar.forzar = true; if (!guardar(`Orden ${o.folio} creada`)) return;
    const c = cli(db(), cid);
    ventana(`${dlgH(`Folio ${o.folio}`)}<div class="dlg-b"><p>Entrégale al cliente su folio. Con su <b>placa ${esc(a.placa)}</b> y el folio <b>${o.folio}</b> ve el avance en su celular.</p></div>
      <div class="dlg-p"><a class="btn sec" target="_blank" rel="noopener" href="${waC(c, `${hola(c)} Recibimos tu ${a.marca} ${a.modelo}. Tu folio es ${o.folio}. Sigue el avance con fotos aquí (placa ${a.placa}): ${portal()}`)}">📱 Mandar folio por WhatsApp</a><button class="btn" data-orden="${o.folio}">Abrir orden</button></div>`);
  };
}

// ---------- Citas
function citas() {
  const l = db().citas.filter((c) => c.fecha >= dia() && !['cancelada', 'recibida'].includes(c.estado)).sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));
  return cab('Citas', 'Agendadas en línea o por teléfono. Al llegar el auto, «Recibir» abre la recepción con sus datos.', '<button class="btn" data-nueva-cita>+ Nueva cita</button>') + `
  <section class="panel"><ul class="lista-mini">${l.map((x) => { const c = cli(db(), x.cli); const a = x.auto && auto(db(), x.auto); return `<li><div><b>${fDia(x.fecha)} ${x.hora}</b> · ${esc(c.n)}${a ? ` · ${esc(a.marca)} ${esc(a.modelo)} <span class="placa">${esc(a.placa)}</span>` : ''}<br><small>${esc(db().servs.find((s) => s.id === x.serv)?.n || '')} · ${esc(x.nota)}</small></div>
    <div class="der acc"><span class="badge ${x.estado === 'confirmada' ? 'b-ok' : 'b-info'}">${x.estado === 'confirmada' ? 'Confirmada' : 'Por confirmar'}</span>${x.estado === 'pendiente' ? `<button class="btn mini" data-conf="${x.id}">Confirmar</button>` : ''}<button class="btn mini sec" data-recibir="${x.id}">Recibir</button>
    <a class="btn mini sec" target="_blank" rel="noopener" href="${waC(c, `${hola(c)} Te confirmamos tu cita el ${fDia(x.fecha)} a las ${x.hora}.`)}">📱</a></div></li>`; }).join('') || '<li class="vacio">Sin citas próximas</li>'}</ul></section>`;
}
function nuevaCita() {
  ventana(`<form id="fC">${dlgH('Nueva cita')}<div class="dlg-b form">
    <label class="full">Cliente<select name="cli">${db().clis.map((c) => `<option value="${c.id}">${esc(c.n)}</option>`).join('')}</select></label>
    <label>Servicio<select name="serv">${db().servs.map((s) => `<option value="${s.id}">${esc(s.n)}</option>`).join('')}</select></label><label>Día<input type="date" name="fecha" min="${dia()}" value="${dia(1)}"></label>
    <label>Hora<select name="hora"></select></label><label class="full">Nota<input name="nota" required></label></div><div class="dlg-p"><button type="button" class="btn sec" data-cerrar>Cancelar</button><button class="btn">Agendar</button></div></form>`);
  const f = $('#fC'); const h = () => { f.hora.innerHTML = horasLibres(db(), f.fecha.value).map((x) => `<option>${x}</option>`).join('') || '<option value="">Sin lugar</option>'; };
  f.fecha.onchange = h; h();
  f.onsubmit = (e) => { e.preventDefault(); if (!f.hora.value) return toast('Sin lugar ese día', 'error'); db().citas.push({ id: uid(), cli: f.cli.value, auto: db().autos.find((a) => a.cli === f.cli.value)?.id || '', fecha: f.fecha.value, hora: f.hora.value, serv: f.serv.value, estado: 'confirmada', nota: f.nota.value.trim(), origen: 'taller' }); if (guardar('Cita agendada')) dlg.close(); };
}

// ---------- Refacciones
function refacciones() {
  const l = refsPend().sort((a, b) => (a.it.eta || '9').localeCompare(b.it.eta || '9'));
  const mes = dia().slice(0, 7);
  const vend = db().ordenes.filter((o) => o.estado === 'entregado' && loc(o.hist.at(-1).f).startsWith(mes)).flatMap((o) => autorizados(o).filter((x) => x.tipo === 'ref'));
  return cab('Refacciones', 'Lo que falta para terminar autos. Si una fecha se vence, el cliente ve el retraso: llama al proveedor antes.') + `
  <div class="kpis"><div class="kpi ${l.length ? 'alerta' : ''}"><span>Por llegar</span><b>${l.length}</b><small>${l.filter((r) => r.it.eta && r.it.eta < dia()).length} vencidas · ${l.filter((r) => !r.it.eta).length} sin fecha</small></div>
    <div class="kpi"><span>Refacciones vendidas este mes</span><b>${pesos(vend.reduce((s, x) => s + x.precio, 0))}</b><small>margen ${pesos(vend.reduce((s, x) => s + x.precio - x.costo, 0))}</small></div></div>
  <section class="panel tabla"><table class="t"><thead><tr><th>Refacción</th><th>Auto</th><th class="ocultar-m">Proveedor</th><th>Llega</th><th></th></tr></thead><tbody>
    ${l.map(({ o, it }) => { const a = auto(db(), o.auto); return `<tr><td><b>${esc(it.n)}</b><br><small>${pesos(it.costo)} costo</small></td><td>${o.folio}<br><span class="placa">${esc(a.placa)}</span></td><td class="ocultar-m">${esc(it.prov || '—')}</td><td>${!it.eta ? '<span class="badge b-warn">Sin fecha</span>' : it.eta < dia() ? `<span class="badge b-bad">${fDia(it.eta)}</span>` : fDia(it.eta)}</td><td><button class="btn mini" data-llego-r="${o.folio}|${it.id}">Llegó</button> <button class="btn mini sec" data-orden="${o.folio}">Orden</button></td></tr>`; }).join('') || '<tr><td class="vacio" colspan="5">Nada pendiente ✓</td></tr>'}</tbody></table></section>`;
}

// ---------- Clientes y autos
let qA = '';
function clientes() {
  const q = qA.toLowerCase();
  const l = db().autos.filter((a) => !q || (a.placa + a.marca + a.modelo + cli(db(), a.cli).n).toLowerCase().includes(q));
  return cab('Clientes y autos', `${db().autos.length} autos · historial por placa`) + `
  <div class="filtros"><input id="qA" type="search" placeholder="Buscar por placa, auto o cliente…" value="${esc(qA)}" aria-label="Buscar auto"></div>
  <section class="panel tabla"><table class="t"><thead><tr><th></th><th>Auto</th><th>Cliente</th><th class="num ocultar-m">Km</th><th>Próximo servicio</th><th></th></tr></thead><tbody>
  ${l.map((a) => { const c = cli(db(), a.cli); const ps = proxServicio(db(), a); const ab = activas().find((o) => o.auto === a.id);
    return `<tr class="click" data-hist="${a.id}"><td><img class="thumb" src="${foto(a.foto, 120)}" alt=""></td><td><b>${esc(nombreAuto(a))}</b><br><span class="placa">${esc(a.placa)}</span></td><td>${esc(c.n)}<br><small>${esc(c.tel)}</small></td><td class="num ocultar-m">${a.km.toLocaleString('es-MX')}</td>
      <td>${ps ? `${fDia(ps.fecha)} o ${ps.km.toLocaleString('es-MX')} km${ps.toca ? ' <span class="badge b-warn">Toca</span>' : ''}` : '—'}</td><td>${ab ? `<span class="badge b-info">${EST_TXT[ab.estado]}</span>` : ''}</td></tr>`; }).join('')}</tbody></table></section>`;
}
function historial(aid) {
  const a = auto(db(), aid); const c = cli(db(), a.cli);
  const os = db().ordenes.filter((o) => o.auto === aid).sort((x, y) => y.f.localeCompare(x.f));
  ventana(`${dlgH(`${esc(nombreAuto(a))} <span class="placa">${esc(a.placa)}</span>`)}<div class="dlg-b">
    <p style="margin:0">${esc(c.n)} · <a target="_blank" rel="noopener" href="${waC(c, hola(c))}">📱 ${esc(c.tel)}</a> · ${a.km.toLocaleString('es-MX')} km · ${esc(a.color)}</p>
    <div class="kpis" style="margin-top:12px"><div class="kpi"><span>Visitas</span><b>${os.length}</b></div><div class="kpi"><span>Ha gastado</span><b>${pesos(os.reduce((s, o) => s + total(o), 0))}</b></div></div>
    <ul class="lista-mini">${os.map((o) => `<li class="click" data-orden="${o.folio}" style="cursor:pointer"><div><b>${o.folio}</b> · ${esc(o.motivo)}<br><small>${fDia(o.f)}${o.km ? ` · ${o.km.toLocaleString('es-MX')} km` : ''} · ${autorizados(o).map((x) => esc(x.n)).join(', ')}</small></div><div class="der">${pesos(total(o))}<br>${o.estado === 'entregado' ? (o.garantia >= dia() ? `<span class="badge b-ok">Garantía a ${fDia(o.garantia)}</span>` : '<span class="badge b-mut">Sin garantía</span>') : `<span class="badge b-info">${EST_TXT[o.estado]}</span>`}</div></li>`).join('')}</ul></div>`, true);
}

// ---------- Recordatorios
function recordatorios() {
  const av = (k) => db().avisos[k];
  const btn = (k, c, m) => (av(k) ? `<span class="badge b-ok">Avisado ${fecha(av(k))}</span>` : `<a class="btn mini" target="_blank" rel="noopener" data-avisar="${k}" href="${waC(c, m)}">📱 Avisar</a>`);
  const sec = (t, sub, filas) => `<section class="panel"><h2>${t}</h2><p class="ayuda" style="margin:-4px 0 8px">${sub}</p><ul class="lista-mini">${filas || '<li class="vacio">Nada pendiente ✓</li>'}</ul></section>`;
  return cab('Recordatorios', 'Lo que hace volver a un cliente y lo que destraba autos detenidos.') + `
  ${sec(`Cotizaciones sin respuesta (${sinResp().length})`, 'Autos parados esperando al cliente.', sinResp().map((o) => { const c = cli(db(), o.cli); const a = auto(db(), o.auto); const d = diasEntre(o.hist.at(-1).f, dia()); return `<li><div><b>${o.folio}</b> · ${esc(c.n)} · <span class="placa">${esc(a.placa)}</span><br><small>${pesos(pendientes(o).reduce((s, x) => s + x.precio, 0))} · esperando ${d ? d + ' día(s)' : 'desde hoy'}</small></div><div class="der">${btn('aut' + o.folio + dia(), c, `${hola(c)} Tu ${a.marca} ${a.modelo} sigue esperando tu autorización. Revísala aquí: ${portal()} (placa ${a.placa}, folio ${o.folio}).`)}</div></li>`; }).join(''))}
  ${sec(`Listos sin recoger (${listosSinRecoger().length})`, 'Ocupan lugar y el saldo no entra.', listosSinRecoger().map((o) => { const c = cli(db(), o.cli); const a = auto(db(), o.auto); return `<li><div><b>${o.folio}</b> · ${esc(c.n)}<br><small>Listo hace ${diasEntre(o.hist.at(-1).f, dia())} días · saldo ${pesos(saldo(o))}</small></div><div class="der">${btn('rec' + o.folio + dia(), c, `${hola(c)} Tu ${a.marca} ${a.modelo} ya está listo y te espera. ${saldo(o) ? `Saldo: ${pesos(saldo(o))}.` : ''}`)}</div></li>`; }).join(''))}
  ${sec(`Les toca servicio (${tocaServicio().length})`, `Cada ${db().conf.servMeses} meses o ${db().conf.servKm.toLocaleString('es-MX')} km.`, tocaServicio().map((a) => { const c = cli(db(), a.cli); const ps = proxServicio(db(), a); return `<li><div><b>${esc(c.n)}</b> · ${esc(nombreAuto(a))} <span class="placa">${esc(a.placa)}</span><br><small>Último servicio ${fDia(a.ult.f)} · tocaba ${fDia(ps.fecha)} o ${ps.km.toLocaleString('es-MX')} km</small></div><div class="der">${btn('srv' + a.id + dia().slice(0, 7), c, `${hola(c)} Ya le toca servicio a tu ${a.marca} ${a.modelo} 🔧. Agenda en un minuto aquí: ${new URL('index.html', location.href).href}`)}</div></li>`; }).join(''))}`;
}

// ---------- Mecánicos
let semana = 0;
function mecanicos() {
  const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + semana * 7);
  const desde = d.toLocaleDateString('en-CA'); d.setDate(d.getDate() + 6); const hasta = d.toLocaleDateString('en-CA');
  const l = comisiones(db(), desde, hasta);
  return cab('Mecánicos', `Semana del ${fDia(desde)} al ${fDia(hasta)}. Comisión sobre la mano de obra de autos entregados.`, `<button class="btn sec" data-sem="-1">← Anterior</button><button class="btn sec" data-sem="1" ${semana >= 0 ? 'disabled' : ''}>Siguiente →</button>`) + `
  <section class="panel tabla"><table class="t"><thead><tr><th>Mecánico</th><th>En taller ahora</th><th class="num">Entregados</th><th class="num">Mano de obra</th><th class="num">Comisión</th></tr></thead><tbody>
  ${l.map((x) => `<tr><td><b>${esc(x.m.n)}</b><br><small>${esc(x.m.esp)}</small></td><td>${activas().filter((o) => o.mec === x.m.id).map((o) => `<button class="btn mini sec" data-orden="${o.folio}">${o.folio}</button>`).join(' ') || '—'}</td><td class="num">${x.ordenes}</td><td class="num">${pesos(x.mo)}</td><td class="num"><b>${pesos(x.pagar)}</b> <small>(${x.m.com}%)</small></td></tr>`).join('')}</tbody></table></section>`;
}

// ---------- Caja
function caja() {
  const p = pagosDe(dia(), dia()); const por = (m) => p.filter((x) => x.met === m).reduce((s, x) => s + x.monto, 0);
  const dias = [...Array(14)].map((_, i) => { const d = dia(-13 + i); return { k: d.slice(8), v: pagosDe(d, d).reduce((s, x) => s + x.monto, 0) }; });
  return cab('Caja', `Corte del día ${fDia(dia())}.`) + `
  <div class="kpis"><div class="kpi"><span>Efectivo</span><b>${pesos(por('Efectivo'))}</b></div><div class="kpi"><span>Tarjeta</span><b>${pesos(por('Tarjeta'))}</b></div><div class="kpi"><span>Transferencia</span><b>${pesos(por('Transferencia'))}</b></div><div class="kpi"><span>Total</span><b>${pesos(p.reduce((s, x) => s + x.monto, 0))}</b></div></div>
  <div class="grid2"><section class="panel"><h2>Últimos 14 días</h2>${barras(dias)}</section><section class="panel"><h2>Pagos de hoy</h2><ul class="lista-mini">${p.map((x) => `<li><div>${x.o.folio} · ${esc(x.concepto)}<br><small>${esc(x.met)}</small></div><span class="der">${pesos(x.monto)}</span></li>`).join('') || '<li class="vacio">Sin pagos hoy</li>'}</ul></section></div>`;
}

// ---------- Ajustes
function ajustes() {
  const c = db().conf;
  return cab('Ajustes', 'Datos del taller, garantía, recordatorio de servicio y precios de referencia del sitio.') + `
  <section class="panel"><form class="form" id="fConf">
    <label>Nombre<input name="nombre" required value="${esc(c.nombre)}"></label><label>WhatsApp<input name="whatsapp" required value="${esc(c.whatsapp)}"></label>
    <label>Dirección<input name="direccion" value="${esc(c.direccion)}"></label><label>Horario<input name="horario" value="${esc(c.horario)}"></label>
    <label>Garantía (días)<input name="garantiaDias" type="number" min="0" value="${c.garantiaDias}"></label><label>Garantía (km)<input name="garantiaKm" type="number" min="0" value="${c.garantiaKm}"></label>
    <label>Servicio cada (meses)<input name="servMeses" type="number" min="1" value="${c.servMeses}"></label><label>Servicio cada (km)<input name="servKm" type="number" min="1000" step="500" value="${c.servKm}"></label>
    <label>PIN del panel<input name="pin" required minlength="4" maxlength="6" value="${esc(c.pin)}"></label><span></span>
    ${db().servs.map((s) => `<label>${esc(s.n)} (desde $)<input name="s_${s.id}" type="number" min="0" value="${s.desde}"></label>`).join('')}
    ${db().mecs.map((m) => `<label>${esc(m.n)}: comisión sobre mano de obra (%)<input name="m_${m.id}" type="number" min="0" max="100" value="${m.com}"></label>`).join('')}
    <div class="full"><button class="btn">Guardar</button></div></form></section>
  <section class="panel"><h2>Datos del demo</h2><button class="btn peligro" id="reiniciar">Reiniciar demo con datos de ejemplo</button></section>`;
}

// ---------- Navegación
const VISTAS = { inicio, recepcion, citas, refacciones, clientes, recordatorios, mecanicos, caja, ajustes };
function pintar() {
  const r = VISTAS[location.hash.slice(1)] ? location.hash.slice(1) : 'inicio';
  if (r === 'recepcion' && $('#fRec') && !pintar.forzar) return; // no borrar una recepción a medio capturar
  pintar.forzar = false;
  $('#vista').innerHTML = VISTAS[r]();
  $$('.side a[href^="#"]').forEach((a) => a.setAttribute('aria-current', a.getAttribute('href') === '#' + r ? 'page' : 'false'));
  const n = { nTab: sinResp().length, nCit: db().citas.filter((c) => c.estado === 'pendiente' && c.fecha >= dia()).length, nRef: refsPend().filter((x) => !x.it.eta || x.it.eta < dia()).length, nRec: sinResp().length + listosSinRecoger().length + tocaServicio().length };
  for (const [k, v] of Object.entries(n)) { $('#' + k).hidden = !v; $('#' + k).textContent = v; }
  if (r === 'recepcion') enlazarRec();
  if (r === 'clientes') $('#qA').oninput = (e) => { qA = e.target.value; pintar(); const i = $('#qA'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); };
  if (r === 'ajustes') {
    $('#fConf').onsubmit = (e) => {
      e.preventDefault(); const d = Object.fromEntries(new FormData(e.target));
      Object.assign(db().conf, { nombre: d.nombre.trim(), whatsapp: d.whatsapp.replace(/\D/g, ''), direccion: d.direccion.trim(), horario: d.horario.trim(), garantiaDias: +d.garantiaDias, garantiaKm: +d.garantiaKm, servMeses: +d.servMeses, servKm: +d.servKm, pin: d.pin.trim() });
      db().servs.forEach((s) => { s.desde = +d['s_' + s.id]; }); db().mecs.forEach((m) => { m.com = +d['m_' + m.id]; });
      guardar('Ajustes guardados');
    };
    $('#reiniciar').onclick = () => { if (confirm('Se borran tus cambios y vuelven los datos de ejemplo. ¿Continuar?')) { B.reiniciar(); pintar.forzar = true; pintar(); toast('Demo reiniciado'); } };
  }
}

document.addEventListener('click', (e) => {
  const t = e.target; const q = (s) => t.closest(s); let el;
  if (q('[data-cerrar]') || t === dlg) return dlg.close();
  if ((el = q('[data-orden]'))) return verOrden(el.dataset.orden);
  if ((el = q('[data-hist]'))) return historial(el.dataset.hist);
  if ((el = q('[data-conf]'))) { db().citas.find((x) => x.id === el.dataset.conf).estado = 'confirmada'; return guardar('Cita confirmada'); }
  if ((el = q('[data-recibir]'))) { desdeCita = el.dataset.recibir; pintar.forzar = true; location.hash === '#recepcion' ? pintar() : (location.hash = 'recepcion'); return; }
  if (q('[data-nueva-cita]')) return nuevaCita();
  if ((el = q('[data-llego-r]'))) { const [fo, id] = el.dataset.llegoR.split('|'); const o = orden(fo); llegoRef(o, id); return guardar(o.estado === 'reparacion' ? `${fo}: refacciones completas, pasó a reparación` : 'Refacción recibida'); }
  if ((el = q('[data-sem]'))) { semana = Math.min(0, semana + +el.dataset.sem); return pintar(); }
  if ((el = q('[data-avisar]'))) { db().avisos[el.dataset.avisar] = new Date().toISOString(); setTimeout(() => guardar('Marcado como avisado'), 300); }
});
addEventListener('hashchange', () => { pintar.forzar = true; pintar(); });

let antes = JSON.stringify(db().ordenes.map((o) => [o.folio, o.estado]));
let antesC = db().citas.length;
B.alCambiar(() => {
  const ahora = db().ordenes.map((o) => [o.folio, o.estado]);
  const prev = new Map(JSON.parse(antes));
  for (const [f, e] of ahora) if (prev.get(f) === 'autorizacion' && e !== 'autorizacion') { const o = orden(f); toast(`✅ ${cli(db(), o.cli).n} respondió la cotización de ${f}: autorizó ${pesos(total(o))}`); }
  if (db().citas.length > antesC) { const c = db().citas.at(-1); toast(`📅 Cita en línea: ${cli(db(), c.cli)?.n}, ${fDia(c.fecha)} ${c.hora}`); }
  antes = JSON.stringify(ahora); antesC = db().citas.length;
  pintar.forzar = true; pintar();
  if (dlg.open && dlg.querySelector('#fCab')) { const fo = dlg.querySelector('.dlg-h h2').textContent.split(' ')[0]; if (orden(fo)) verOrden(fo); }
});
puerta('taller', db().conf.pin, () => { $('#app').hidden = false; pintar.forzar = true; pintar(); });
