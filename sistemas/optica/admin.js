// Panel de la óptica: venta con graduación, órdenes de laboratorio, exámenes, clientes, armazones y recordatorios.
import { $, $$, esc, pesos, fecha, fechaHora, foto, wa, toast, comprimir, puerta, barras, uid } from '../_base/sis.js';
import { abrir, dia, fDia, fAno, diasEntre, arm, nombreArm, precioOrden, nuevaOrden, cobrar, avanzar, saldo, atrasada, sinRecoger, ultGrad, examenToca, lcToca, fmtG, horasLibres,
  ESTADOS, EST_TXT, FORMAS, MATERIALES, LABS, CITA_TXT } from './datos.js';

const B = abrir();
const db = () => B.db;
const dlg = $('#dlg');
const pac = (id) => db().pacs.find((p) => p.id === id);
const guardar = (msg) => { if (B.guardar()) { if (msg) toast(msg); pintar(); return true; } return false; };
const ventana = (html, ancho = false) => { dlg.className = ancho ? 'ancho' : ''; dlg.innerHTML = html; if (!dlg.open) dlg.showModal(); };
const cab = (t, sub, acc = '') => `<div class="top"><div><h1>${t}</h1>${sub ? `<p>${sub}</p>` : ''}</div><div class="acc">${acc}</div></div>`;
const dlgH = (t) => `<div class="dlg-h"><h2>${t}</h2><button class="x" type="button" data-cerrar aria-label="Cerrar">×</button></div>`;
const waP = (p, m) => wa('52' + p.tel, m);
const hola = (p) => `Hola ${p.n.split(' ')[0]}, te escribimos de ${db().conf.nombre}.`;
const portal = () => new URL('index.html#portal', location.href).href;
const activas = () => db().ordenes.filter((o) => !['entregada', 'cancelada'].includes(o.estado));
const rotacion = (a) => diasEntre(a.ultVenta, dia());
const hoyISO = () => new Date().toISOString().slice(0, 10);
const gradTabla = (g) => !g ? '<p class="ayuda">Sin graduación registrada.</p>' : `<table class="grad"><thead><tr><th></th><th>Esfera</th><th>Cilindro</th><th>Eje</th><th>Adición</th></tr></thead><tbody>
  ${['od', 'oi'].map((o) => `<tr><th>${o.toUpperCase()}</th><td>${fmtG(g[o].esf)}</td><td>${fmtG(g[o].cil)}</td><td>${g[o].eje}°</td><td>${g[o].add ? fmtG(g[o].add) : '—'}</td></tr>`).join('')}</tbody></table><p class="ayuda">DIP ${g.dip} mm · ${fAno(g.f)} · ${esc(g.opto)}</p>`;

// ---------- Hoy
function inicio() {
  const pagos = db().pagos; const mes = hoyISO().slice(0, 7);
  const dias = [...Array(14)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - 13 + i); const k = d.toISOString().slice(0, 10); return { k: d.getDate() + '', v: pagos.filter((p) => p.f.slice(0, 10) === k).reduce((s, p) => s + p.monto, 0) }; });
  const ex = db().citas.filter((c) => c.fecha === dia() && c.estado !== 'cancelada').sort((a, b) => a.hora.localeCompare(b.hora));
  const tarde = activas().filter(atrasada), sinR = db().ordenes.filter(sinRecoger);
  return cab('Hoy en la óptica', new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }), '<a class="btn" href="#venta">+ Nueva venta</a>') + `
  <div class="kpis">
    <div class="kpi"><span>Órdenes en proceso</span><b>${activas().length}</b><small>${activas().filter((o) => o.estado === 'lista').length} listas para entregar</small></div>
    <div class="kpi ${tarde.length ? 'alerta' : ''}"><span>Atrasadas con el laboratorio</span><b>${tarde.length}</b><small>pasaron su fecha prometida</small></div>
    <div class="kpi ${sinR.length ? 'alerta' : ''}"><span>Listas sin recoger</span><b>${pesos(sinR.reduce((s, o) => s + saldo(o), 0))}</b><small>${sinR.length} clientes por avisar</small></div>
    <div class="kpi"><span>Cobrado este mes</span><b>${pesos(pagos.filter((p) => p.f.startsWith(mes)).reduce((s, p) => s + p.monto, 0))}</b><small>hoy: ${pesos(pagos.filter((p) => p.f.startsWith(hoyISO())).reduce((s, p) => s + p.monto, 0))}</small></div>
  </div>
  <div class="grid2">
    <div>
      <section class="panel"><h2>Atiende primero <a href="#ordenes">Tablero →</a></h2><ul class="lista-mini">
        ${tarde.map((o) => `<li class="click" data-orden="${o.folio}" style="cursor:pointer"><span class="badge b-bad">Atrasada</span><div><b>${o.folio} · ${esc(pac(o.pac).n)}</b><br><small>${EST_TXT[o.estado]} · prometida ${fDia(o.promesa)} · ${esc(o.lab)}</small></div></li>`).join('')}
        ${sinR.map((o) => `<li class="click" data-orden="${o.folio}" style="cursor:pointer"><span class="badge b-warn">Sin recoger</span><div><b>${o.folio} · ${esc(pac(o.pac).n)}</b><br><small>Lista hace ${diasEntre(o.hist.at(-1).f, dia())} días · saldo ${pesos(saldo(o))}</small></div></li>`).join('')}
        ${!tarde.length && !sinR.length ? '<li class="vacio">Todo en orden ✓</li>' : ''}</ul></section>
      <section class="panel"><h2>Exámenes de hoy <a href="#examenes">Agenda →</a></h2><ul class="lista-mini">${ex.map((c) => `<li><b>${c.hora}</b><div>${esc(pac(c.pac).n)}${c.origen === 'portal' ? ' <span class="badge b-info">En línea</span>' : ''}<br><small>${esc(c.nota || 'Examen de la vista')}</small></div><span class="der badge ${c.estado === 'completada' ? 'b-ok' : c.estado === 'pendiente' ? 'b-info' : 'b-mut'}">${CITA_TXT[c.estado]}</span></li>`).join('') || '<li class="vacio">Sin exámenes</li>'}</ul></section>
    </div>
    <section class="panel"><h2>Cobrado, últimos 14 días</h2>${barras(dias)}
      <h2 style="margin-top:18px">Apartados del catálogo</h2><ul class="lista-mini">${db().apartados.filter((a) => a.estado === 'activo').map((a) => `<li><img class="thumb" src="${foto(arm(db(), a.arm).foto, 120)}" alt=""><div><b>${esc(a.n)}</b><br><small>${esc(nombreArm(db(), a.arm))} · vence ${fDia(a.vence)}</small></div><a class="der btn mini sec" href="#armazones">Ver</a></li>`).join('') || '<li class="vacio">Sin apartados</li>'}</ul></section>
  </div>`;
}

// ---------- Nueva venta
function venta() {
  return cab('Nueva venta', 'Cliente, graduación, armazón y micas. Al guardar se crea la orden de laboratorio y el cliente la sigue en su portal.') + `
  <form class="panel form" id="fVenta">
    <label>Cliente<select name="pac"><option value="">+ Cliente nuevo</option>${db().pacs.map((p) => `<option value="${p.id}">${esc(p.n)} · ${p.tel}</option>`).join('')}</select></label>
    <span></span>
    <label class="nuevo">Nombre<input name="n"></label><label class="nuevo">WhatsApp (10 dígitos)<input name="tel" inputmode="tel"></label>
    <div class="full"><b>Graduación</b> <label class="check" style="display:inline-flex;margin-left:12px"><input type="checkbox" name="nuevaG" id="nuevaG"> Capturar nueva</label><div id="gradBox"></div></div>
    <fieldset class="full" style="border:0;padding:0"><legend style="font-weight:700;margin-bottom:6px">Tipo de mica</legend><div class="chips">${Object.entries(db().micas).map(([k, m], i) => `<label class="check" style="border:1px solid var(--ln);border-radius:99px;padding:6px 12px;background:#fff"><input type="radio" name="mica" value="${k}" ${i ? '' : 'checked'}> ${esc(m.n)} · ${pesos(m.p)}</label>`).join('')}</div></fieldset>
    <fieldset class="full" id="boxArm" style="border:0;padding:0"><legend style="font-weight:700;margin-bottom:6px">Armazón</legend><div class="arms">
      <label><input type="radio" name="arm" value="propio"><span style="display:grid;place-items:center;aspect-ratio:4/3;background:var(--bg);border-radius:8px;font-size:1.6rem">🕶️</span>Armazón propio<b>$0</b></label>
      ${db().arms.filter((a) => a.stock > 0).map((a, i) => `<label><input type="radio" name="arm" value="${a.id}" ${i ? '' : 'checked'}><img src="${foto(a.foto, 240)}" alt="">${esc(a.marca + ' ' + a.modelo)}<span><b>${pesos(a.precio)}</b> · ${a.stock} pz</span></label>`).join('')}</div></fieldset>
    <fieldset class="full" id="boxTrat" style="border:0;padding:0"><legend style="font-weight:700;margin-bottom:6px">Tratamientos</legend><div class="chips">${Object.entries(db().trats).map(([k, t]) => `<label class="check" style="border:1px solid var(--ln);border-radius:99px;padding:6px 12px;background:#fff"><input type="checkbox" name="trat" value="${k}" ${k === 'ar' ? 'checked' : ''}> ${esc(t.n)} · +${pesos(t.p)}</label>`).join('')}</div></fieldset>
    <label>Laboratorio<select name="lab">${LABS.map((l) => `<option>${l}</option>`).join('')}</select></label>
    <label>Notas para el laboratorio<input name="notas" placeholder="Altura, bisel, armazón delicado…"></label>
    <label>Anticipo hoy<input name="anticipo" type="number" min="0" step="1"></label>
    <label>Método<select name="met"><option>Tarjeta</option><option>Efectivo</option><option>Transferencia</option></select></label>
    <p class="full aviso tot" id="totVenta"></p>
    <div class="full"><button class="btn">Crear orden</button></div>
  </form>`;
}
function gradForm(g) {
  const v = (o, k) => (g ? g[o][k] : k === 'eje' ? 0 : 0);
  return `<table class="grad" style="margin-top:8px"><thead><tr><th></th><th>Esfera</th><th>Cilindro</th><th>Eje</th><th>Adición</th></tr></thead><tbody>
    ${['od', 'oi'].map((o) => `<tr><th>${o.toUpperCase()}</th>${['esf', 'cil', 'eje', 'add'].map((k) => `<td><input name="${o}_${k}" type="number" step="${k === 'eje' ? 1 : 0.25}" ${k === 'eje' ? 'min="0" max="180"' : 'min="-20" max="20"'} value="${v(o, k)}" aria-label="${o.toUpperCase()} ${k}"></td>`).join('')}</tr>`).join('')}</tbody></table>
    <label style="max-width:200px;margin-top:6px">DIP (mm)<input name="dip" type="number" min="40" max="80" value="${g?.dip || 62}"></label>`;
}
const leerGrad = (f, pid) => ({ id: uid(), pac: pid, f: dia(), od: { esf: +f.od_esf.value, cil: +f.od_cil.value, eje: +f.od_eje.value, add: +f.od_add.value }, oi: { esf: +f.oi_esf.value, cil: +f.oi_cil.value, eje: +f.oi_eje.value, add: +f.oi_add.value }, dip: +f.dip.value, opto: 'Lic. Opt. Carla Ibarra' });

function enlazarVenta() {
  const f = $('#fVenta');
  const sync = () => {
    const nuevo = !f.pac.value;
    $$('.nuevo', f).forEach((x) => (x.hidden = !nuevo)); f.n.required = f.tel.required = nuevo;
    const g = f.pac.value ? ultGrad(db(), f.pac.value) : null;
    if (nuevo) f.nuevaG.checked = true;
    if (!$('#gradBox').dataset.p || $('#gradBox').dataset.p !== f.pac.value + f.nuevaG.checked) {
      $('#gradBox').innerHTML = f.nuevaG.checked ? gradForm(g) : gradTabla(g);
      $('#gradBox').dataset.p = f.pac.value + f.nuevaG.checked;
    }
    const sinArm = db().micas[f.mica.value].sinArm;
    $('#boxArm').hidden = $('#boxTrat').hidden = sinArm;
    const trats = sinArm ? [] : [...f.querySelectorAll('[name=trat]:checked')].map((x) => x.value);
    const t = precioOrden(db(), { arm: f.arm.value, mica: f.mica.value, trats });
    if (!f.anticipo.dataset.tocado) f.anticipo.value = Math.round(t * db().conf.anticipo / 100);
    $('#totVenta').innerHTML = `Total <b>${pesos(t)}</b> · anticipo ${pesos(+f.anticipo.value)} · saldo al entregar ${pesos(t - +f.anticipo.value)} · listo aprox. ${fDia(dia(db().micas[f.mica.value].dias))}`;
  };
  f.pac.addEventListener('change', () => { f.nuevaG.checked = !f.pac.value || !ultGrad(db(), f.pac.value); }); // con graduación guardada, se propone usarla
  f.addEventListener('change', sync); f.addEventListener('input', (e) => { if (e.target === f.anticipo) f.anticipo.dataset.tocado = 1; sync(); }); sync();
  f.onsubmit = (e) => {
    e.preventDefault();
    let pid = f.pac.value;
    if (!pid) {
      const tel = f.tel.value.replace(/\D/g, '').slice(-10);
      if (tel.length !== 10) return toast('El WhatsApp debe tener 10 dígitos', 'error');
      if (db().pacs.some((p) => p.tel === tel)) return toast('Ese teléfono ya existe: elígelo en la lista', 'error');
      pid = uid(); db().pacs.push({ id: pid, n: f.n.value.trim(), tel, nac: '' });
    }
    let g = ultGrad(db(), pid);
    if (f.nuevaG.checked) { g = leerGrad(f, pid); db().grads.push(g); }
    if (!g && f.mica.value !== 'lc') return toast('Captura la graduación', 'error');
    let o;
    try { o = nuevaOrden(db(), { pac: pid, grad: g?.id || '', arm: f.arm.value, mica: f.mica.value, trats: db().micas[f.mica.value].sinArm ? [] : [...f.querySelectorAll('[name=trat]:checked')].map((x) => x.value), anticipo: +f.anticipo.value, met: f.met.value, lab: f.lab.value, notas: f.notas.value.trim() }); }
    catch (err) { return toast(err.message, 'error'); }
    pintar.forzar = true; if (guardar(`Orden ${o.folio} creada`)) verOrden(o.folio);
  };
}

// ---------- Órdenes
function ordenes() {
  const ent = db().ordenes.filter((o) => o.estado === 'entregada').sort((a, b) => b.hist.at(-1).f.localeCompare(a.hist.at(-1).f)).slice(0, 8);
  return cab('Órdenes de laboratorio', 'Cada cambio de columna lo ve el cliente en «Mis lentes». En rojo: las que pasaron su fecha prometida.', '<a class="btn" href="#venta">+ Nueva venta</a>') + `
  <div class="tablero">${ESTADOS.slice(0, 5).map((e) => { const l = activas().filter((o) => o.estado === e).sort((a, b) => a.promesa.localeCompare(b.promesa));
    return `<section class="col"><h2>${EST_TXT[e]}<span>${l.length}</span></h2>${l.map((o) => `<button class="ord ${atrasada(o) ? 'tarde' : ''}" data-orden="${o.folio}"><b>${o.folio} · ${esc(pac(o.pac).n)}</b><small>${esc(nombreArm(db(), o.arm || 'propio'))} · ${esc(db().micas[o.mica].n)}</small><small>${atrasada(o) ? `<span style="color:var(--bad);font-weight:700">Atrasada · prometida ${fDia(o.promesa)}</span>` : `Entrega ${fDia(o.promesa)}`}${saldo(o) > 0 ? ` · saldo ${pesos(saldo(o))}` : ''}</small></button>`).join('')}</section>`; }).join('')}</div>
  <section class="panel" style="margin-top:14px"><h2>Entregadas recientemente</h2><ul class="lista-mini">${ent.map((o) => `<li class="click" data-orden="${o.folio}" style="cursor:pointer"><div><b>${o.folio} · ${esc(pac(o.pac).n)}</b><br><small>${esc(nombreArm(db(), o.arm || 'propio'))} · garantía hasta ${fAno(o.garantia)}</small></div><span class="der">${pesos(o.total)}</span></li>`).join('')}</ul></section>`;
}

function verOrden(folio) {
  const o = db().ordenes.find((x) => x.folio === folio); const p = pac(o.pac); const g = db().grads.find((x) => x.id === o.grad); const a = o.arm ? arm(db(), o.arm) : null;
  const i = ESTADOS.indexOf(o.estado); const sig = i >= 0 && i < ESTADOS.length - 1 ? ESTADOS[i + 1] : null;
  const msgListo = `${hola(p)} ¡Tus lentes ya están listos! 👓 Pasa por ellos de ${db().conf.horario}.${saldo(o) > 0 ? ` Saldo pendiente: ${pesos(saldo(o))}.` : ''} Puedes ver tu pedido aquí: ${portal()}`;
  ventana(`${dlgH(`Orden ${o.folio} <span class="badge ${o.estado === 'lista' || o.estado === 'entregada' ? 'b-ok' : atrasada(o) ? 'b-bad' : 'b-info'}">${EST_TXT[o.estado]}</span>`)}<div class="dlg-b">
    <div id="imprimir"><h2 style="font-family:var(--fd)">${esc(db().conf.nombre)} · Orden de laboratorio ${o.folio}</h2>
      <p><b>${esc(p.n)}</b> · ${esc(p.tel)} · ${fAno(o.f)} · ${esc(o.lab)}</p>
      <div class="grid2" style="grid-template-columns:1.3fr 1fr"><div>${o.mica === 'lc' ? '<p>Lentes de contacto</p>' : ''}${gradTabla(g)}</div>
        <div>${a ? `<img src="${foto(a.foto, 300)}" alt="" style="width:100%;border-radius:12px;aspect-ratio:4/3;object-fit:cover">` : ''}<p><b>${esc(nombreArm(db(), o.arm || 'propio'))}</b>${a ? ` · ${esc(a.color)}` : ''}<br>${esc(db().micas[o.mica].n)}${o.trats.length ? '<br>' + o.trats.map((t) => esc(db().trats[t].n)).join(', ') : ''}</p>${o.notas ? `<p class="aviso">📝 ${esc(o.notas)}</p>` : ''}</div></div></div>
    <form class="form" id="fProm" style="grid-template-columns:1fr auto;align-items:end;margin-top:10px"><label>Fecha prometida al cliente<input type="date" name="promesa" value="${o.promesa}"></label><button class="btn sec">Cambiar</button></form>
    <table class="t" style="margin-top:10px"><tbody><tr><td>Total</td><td class="num"><b>${pesos(o.total)}</b></td></tr><tr><td>Pagado</td><td class="num">${pesos(o.pagado)}</td></tr><tr><td>Saldo</td><td class="num"><b style="color:${saldo(o) ? 'var(--bad)' : 'var(--ok)'}">${pesos(saldo(o))}</b></td></tr></tbody></table>
    ${saldo(o) > 0 && o.estado !== 'cancelada' ? `<form class="form" id="fCob" style="grid-template-columns:1fr 1fr auto;align-items:end;margin-top:10px"><label>Cobrar<input name="monto" type="number" min="1" max="${saldo(o)}" value="${saldo(o)}" required></label><label>Método<select name="met"><option>Tarjeta</option><option>Efectivo</option><option>Transferencia</option></select></label><button class="btn">Registrar pago</button></form>` : ''}
    <ul class="hist" style="margin-top:14px">${o.hist.map((h) => `<li>${EST_TXT[h.e]}<br><small>${fechaHora(h.f)}</small></li>`).join('')}</ul>
  </div><div class="dlg-p">
    ${!['entregada', 'cancelada'].includes(o.estado) ? '<button class="btn peligro" id="cancelar">Cancelar</button>' : ''}
    <button class="btn sec" onclick="print()">Imprimir orden</button>
    <a class="btn sec" target="_blank" rel="noopener" href="${waP(p, o.estado === 'lista' ? msgListo : `${hola(p)} Tu pedido ${o.folio} está: ${EST_TXT[o.estado]}. Entrega estimada: ${fDia(o.promesa)}. Síguelo aquí: ${portal()}`)}">📱 Avisar</a>
    ${sig ? `<button class="btn" id="avanzar">Pasar a «${EST_TXT[sig]}» →</button>` : ''}</div>`, true);
  $('#avanzar') && ($('#avanzar').onclick = () => {
    if (sig === 'entregada' && saldo(o) > 0 && !confirm(`Tiene saldo de ${pesos(saldo(o))}. ¿Entregar de todos modos?`)) return;
    avanzar(db(), o); if (guardar(`${o.folio}: ${EST_TXT[o.estado]}${o.estado === 'lista' ? ' · avísale al cliente' : ''}`)) verOrden(folio);
  });
  $('#fProm').onsubmit = (e) => { e.preventDefault(); o.promesa = e.target.promesa.value || o.promesa; if (guardar('Fecha prometida actualizada: el cliente ya la ve')) verOrden(folio); };
  $('#fCob') && ($('#fCob').onsubmit = (e) => { e.preventDefault(); try { const m = cobrar(db(), o, +e.target.monto.value, e.target.met.value); if (guardar(`Pago de ${pesos(m)} registrado`)) verOrden(folio); } catch (err) { toast(err.message, 'error'); } });
  $('#cancelar') && ($('#cancelar').onclick = () => {
    if (!confirm(`¿Cancelar ${o.folio}? El armazón regresa al inventario. Los pagos se devuelven aparte.`)) return;
    if (a) a.stock++; o.estado = 'cancelada'; o.hist.push({ e: 'cancelada', f: new Date().toISOString() });
    if (guardar('Orden cancelada')) dlg.close();
  });
}

// ---------- Exámenes
let fEx = dia();
function examenes() {
  const l = db().citas.filter((c) => c.fecha === fEx).sort((a, b) => a.hora.localeCompare(b.hora));
  const pend = db().citas.filter((c) => c.estado === 'pendiente' && c.fecha >= dia());
  const fila = (c) => { const p = pac(c.pac); return `<li><b style="font-family:var(--fd);font-size:1.3rem">${c.hora}</b><div><b>${esc(p.n)}</b> ${c.origen === 'portal' ? '<span class="badge b-info">En línea</span>' : ''}<br><small>${c.fecha !== fEx ? fDia(c.fecha) + ' · ' : ''}${esc(c.nota || 'Examen de la vista')} · ${esc(p.tel)}</small></div>
    <div class="der acc"><span class="badge ${c.estado === 'completada' ? 'b-ok' : c.estado === 'pendiente' ? 'b-info' : c.estado === 'falto' ? 'b-bad' : 'b-mut'}">${CITA_TXT[c.estado]}</span>
    ${c.estado === 'pendiente' ? `<button class="btn mini" data-conf="${c.id}">Confirmar</button>` : ''}${c.estado === 'confirmada' ? `<button class="btn mini" data-graduar="${c.id}">Registrar graduación</button><button class="btn mini sec" data-falto="${c.id}">No llegó</button>` : ''}
    <a class="btn mini sec" target="_blank" rel="noopener" href="${waP(p, `${hola(p)} Te confirmamos tu examen de la vista el ${fDia(c.fecha)} a las ${c.hora}.`)}">📱</a></div></li>`; };
  return cab('Exámenes de la vista', 'Al registrar la graduación queda en el expediente y en el portal del cliente.', '<button class="btn" data-nuevo-ex>+ Agendar examen</button>') + `
  ${pend.length ? `<section class="panel"><h2>Solicitudes en línea (${pend.length})</h2><ul class="lista-mini">${pend.map(fila).join('')}</ul></section>` : ''}
  <div class="filtros"><button class="btn sec" data-diaex="-1" aria-label="Día anterior">←</button><input type="date" id="fEx" value="${fEx}" aria-label="Día"><button class="btn sec" data-diaex="1" aria-label="Día siguiente">→</button></div>
  <section class="panel"><h2>${fDia(fEx)} · ${horasLibres(db(), fEx).length} horarios libres</h2><ul class="lista-mini">${l.map(fila).join('') || '<li class="vacio">Sin exámenes</li>'}</ul></section>`;
}
function graduar(cid) {
  const c = db().citas.find((x) => x.id === cid); const p = pac(c.pac); const g = ultGrad(db(), p.id);
  ventana(`<form id="fGrad">${dlgH(`Graduación · ${esc(p.n)}`)}<div class="dlg-b">${g ? `<p class="ayuda">Anterior (${fAno(g.f)}):</p>${gradTabla(g)}` : ''}<p style="font-weight:700;margin:12px 0 0">Nueva</p>${gradForm(g)}</div>
    <div class="dlg-p"><button type="button" class="btn sec" data-cerrar>Cancelar</button><button class="btn">Guardar y vender lentes →</button></div></form>`, true);
  $('#fGrad').onsubmit = (e) => {
    e.preventDefault(); db().grads.push(leerGrad(e.target, p.id)); c.estado = 'completada';
    if (!guardar('Graduación guardada: el cliente ya la ve en su portal')) return;
    dlg.close(); location.hash = 'venta'; setTimeout(() => { const f = $('#fVenta'); if (f) { f.pac.value = p.id; f.dispatchEvent(new Event('change')); } }, 50);
  };
}
function nuevoEx() {
  ventana(`<form id="fNEx">${dlgH('Agendar examen')}<div class="dlg-b form">
    <label class="full">Cliente<select name="pac">${db().pacs.map((p) => `<option value="${p.id}">${esc(p.n)} · ${p.tel}</option>`).join('')}</select></label>
    <label>Día<input type="date" name="fecha" min="${dia()}" value="${fEx >= dia() ? fEx : dia()}"></label><label>Hora<select name="hora" id="hEx"></select></label>
    <label class="full">Nota<input name="nota"></label></div><div class="dlg-p"><button type="button" class="btn sec" data-cerrar>Cancelar</button><button class="btn">Agendar</button></div></form>`);
  const f = $('#fNEx'); const h = () => { $('#hEx').innerHTML = horasLibres(db(), f.fecha.value).map((x) => `<option>${x}</option>`).join('') || '<option value="">Sin horarios</option>'; };
  f.fecha.onchange = h; h();
  f.onsubmit = (e) => { e.preventDefault(); if (!f.hora.value) return toast('Sin horarios ese día', 'error'); db().citas.push({ id: uid(), pac: f.pac.value, fecha: f.fecha.value, hora: f.hora.value, estado: 'confirmada', origen: 'tienda', nota: f.nota.value.trim() }); fEx = f.fecha.value; if (guardar('Examen agendado')) dlg.close(); };
}

// ---------- Clientes
let qCli = '';
function clientes() {
  const q = qCli.toLowerCase();
  const l = db().pacs.filter((p) => !q || (p.n + p.tel).toLowerCase().includes(q));
  return cab('Clientes', `${db().pacs.length} clientes con graduación e historial`) + `
  <div class="filtros"><input id="qCli" type="search" placeholder="Buscar por nombre o teléfono…" value="${esc(qCli)}" aria-label="Buscar cliente"></div>
  <section class="panel tabla"><table class="t"><thead><tr><th>Cliente</th><th>Último examen</th><th class="ocultar-m">Compras</th><th>Estado</th></tr></thead><tbody>
  ${l.map((p) => { const g = ultGrad(db(), p.id); const os = db().ordenes.filter((o) => o.pac === p.id); const act = os.find((o) => !['entregada', 'cancelada'].includes(o.estado));
    return `<tr class="click" data-cli="${p.id}"><td><b>${esc(p.n)}</b><br><small>${esc(p.tel)}</small></td><td>${g ? fAno(g.f) : '—'}${examenToca(db(), p.id) ? ' <span class="badge b-warn">Toca</span>' : ''}</td><td class="ocultar-m">${os.length} · ${pesos(os.reduce((s, o) => s + o.total, 0))}</td><td>${act ? `<span class="badge ${atrasada(act) ? 'b-bad' : 'b-info'}">${EST_TXT[act.estado]}</span>` : '—'}</td></tr>`; }).join('')}</tbody></table></section>`;
}
function verCli(pid) {
  const p = pac(pid); const gs = db().grads.filter((g) => g.pac === pid).sort((a, b) => b.f.localeCompare(a.f)); const os = db().ordenes.filter((o) => o.pac === pid).sort((a, b) => b.f.localeCompare(a.f));
  ventana(`${dlgH(esc(p.n))}<div class="dlg-b"><p style="margin:0">${esc(p.tel)} · <a target="_blank" rel="noopener" href="${waP(p, hola(p))}">📱 WhatsApp</a></p>
    <h3 style="margin:14px 0 6px">Graduación actual</h3>${gradTabla(gs[0])}
    ${gs.length > 1 ? `<h3 style="margin:14px 0 6px">Historial</h3><ul class="lista-mini">${gs.map((g) => `<li>${fAno(g.f)}<span class="der"><small>OD ${fmtG(g.od.esf)}/${fmtG(g.od.cil)} · OI ${fmtG(g.oi.esf)}/${fmtG(g.oi.cil)}${g.od.add ? ' · ADD ' + fmtG(g.od.add) : ''}</small></span></li>`).join('')}</ul>` : ''}
    <h3 style="margin:14px 0 6px">Órdenes y garantías</h3><ul class="lista-mini">${os.map((o) => `<li class="click" data-orden="${o.folio}" style="cursor:pointer"><div><b>${o.folio}</b> · ${esc(nombreArm(db(), o.arm || 'propio'))}<br><small>${esc(db().micas[o.mica].n)} · ${fAno(o.f)}</small></div><div class="der">${o.estado === 'entregada' ? (o.garantia >= dia() ? `<span class="badge b-ok">Garantía a ${fAno(o.garantia)}</span>` : '<span class="badge b-mut">Garantía vencida</span>') : `<span class="badge b-info">${EST_TXT[o.estado]}</span>`}</div></li>`).join('') || '<li class="vacio">Sin compras</li>'}</ul>
  </div><div class="dlg-p"><a class="btn" href="#venta" data-cerrar data-vender="${pid}">Nueva venta</a></div>`, true);
}

// ---------- Armazones
function armazones() {
  const l = [...db().arms].sort((a, b) => rotacion(b) - rotacion(a));
  const parado = db().arms.filter((a) => rotacion(a) > 120 && a.stock > 0);
  return cab('Armazones', 'Inventario con foto. «Días sin venta» te dice qué modelo está parado para ponerlo en promoción.', '<button class="btn" data-arm="">+ Agregar armazón</button>') + `
  <div class="kpis"><div class="kpi"><span>Piezas</span><b>${db().arms.reduce((s, a) => s + a.stock, 0)}</b><small>${db().arms.length} modelos</small></div>
    <div class="kpi"><span>Dinero en armazones</span><b>${pesos(db().arms.reduce((s, a) => s + a.costo * a.stock, 0))}</b></div>
    <div class="kpi ${parado.length ? 'alerta' : ''}"><span>Parados más de 4 meses</span><b>${pesos(parado.reduce((s, a) => s + a.costo * a.stock, 0))}</b><small>${parado.length} modelos</small></div>
    <div class="kpi"><span>Apartados activos</span><b>${db().apartados.filter((a) => a.estado === 'activo').length}</b></div></div>
  ${db().apartados.filter((a) => a.estado === 'activo').length ? `<section class="panel"><h2>Apartados desde el catálogo</h2><ul class="lista-mini">${db().apartados.filter((a) => a.estado === 'activo').map((ap) => `<li><img class="thumb" src="${foto(arm(db(), ap.arm).foto, 120)}" alt=""><div><b>${esc(ap.n)}</b> · ${esc(ap.tel)}<br><small>${esc(nombreArm(db(), ap.arm))} · ${ap.vence < dia() ? '<b style="color:var(--bad)">vencido</b>' : 'hasta ' + fDia(ap.vence)}</small></div>
    <div class="der acc"><a class="btn mini sec" target="_blank" rel="noopener" href="${wa('52' + ap.tel, `Hola ${ap.n.split(' ')[0]}, te escribimos de ${db().conf.nombre}. Tu armazón ${nombreArm(db(), ap.arm)} te espera hasta el ${fDia(ap.vence)}. ¿Te agendamos examen?`)}">📱</a><button class="btn mini sec" data-ap="${ap.id}" data-e="cancelado">Liberar</button></div></li>`).join('')}</ul></section>` : ''}
  <section class="panel tabla"><table class="t"><thead><tr><th></th><th>Modelo</th><th class="ocultar-m">Forma · material</th><th class="num">Precio</th><th class="num ocultar-m">Margen</th><th>Stock</th><th>Sin venta</th><th>En catálogo</th></tr></thead><tbody>
    ${l.map((a) => `<tr class="click" data-arm="${a.id}"><td><img class="thumb" src="${foto(a.foto, 120)}" alt=""></td><td><b>${esc(a.marca)} ${esc(a.modelo)}</b><br><small>${esc(a.color)}</small></td><td class="ocultar-m">${esc(a.forma)} · ${esc(a.material)}</td><td class="num">${pesos(a.precio)}</td>
      <td class="num ocultar-m">${Math.round((1 - a.costo / a.precio) * 100)}%</td><td>${a.stock <= 0 ? '<span class="badge b-bad">0</span>' : `<span class="badge ${a.stock <= a.min ? 'b-warn' : 'b-ok'}">${a.stock}</span>`}</td>
      <td>${rotacion(a) > 120 ? `<span class="badge b-bad">${rotacion(a)} días</span>` : `${rotacion(a)} días`}</td><td><label class="check" onclick="event.stopPropagation()"><input type="checkbox" data-pub="${a.id}" ${a.pub ? 'checked' : ''} aria-label="Mostrar en catálogo"></label></td></tr>`).join('')}</tbody></table></section>`;
}
function editarArm(id) {
  const a = id ? arm(db(), id) : { marca: '', modelo: '', forma: FORMAS[0], material: MATERIALES[0], genero: 'Unisex', color: '', precio: '', costo: '', stock: 1, min: 1, foto: '', pub: true };
  let ft = a.foto;
  ventana(`<form id="fArm">${dlgH(id ? 'Editar armazón' : 'Agregar armazón')}<div class="dlg-b form">
    <div class="full subir"><img id="prev" src="${foto(a.foto, 300)}" alt="" ${a.foto ? '' : 'style="visibility:hidden"'}><label>Foto<input type="file" id="archivo" accept="image/*"><span class="ayuda">Tómala sobre fondo blanco. Se reduce sola.</span></label></div>
    <label>Marca<input name="marca" required value="${esc(a.marca)}"></label><label>Modelo<input name="modelo" required value="${esc(a.modelo)}"></label>
    <label>Forma<select name="forma">${FORMAS.map((x) => `<option ${a.forma === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label><label>Material<select name="material">${MATERIALES.map((x) => `<option ${a.material === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
    <label>Para<select name="genero">${['Unisex', 'Mujer', 'Hombre'].map((x) => `<option ${a.genero === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label><label>Color<input name="color" value="${esc(a.color)}"></label>
    <label>Costo<input name="costo" type="number" min="0" required value="${a.costo}"></label><label>Precio<input name="precio" type="number" min="1" required value="${a.precio}"></label>
    <label>Piezas<input name="stock" type="number" min="0" required value="${a.stock}"></label><label class="check" style="align-self:end"><input type="checkbox" name="pub" ${a.pub ? 'checked' : ''}> Visible en catálogo</label>
  </div><div class="dlg-p"><button type="button" class="btn sec" data-cerrar>Cancelar</button><button class="btn">Guardar</button></div></form>`);
  $('#archivo').onchange = async (e) => { try { ft = await comprimir(e.target.files[0], 800); $('#prev').src = ft; $('#prev').style.visibility = ''; } catch (err) { toast(err.message, 'error'); } };
  $('#fArm').onsubmit = (e) => {
    e.preventDefault(); if (!ft) return toast('Agrega una foto: es lo primero que ve el cliente', 'error');
    const d = Object.fromEntries(new FormData(e.target));
    const datos = { marca: d.marca.trim(), modelo: d.modelo.trim(), forma: d.forma, material: d.material, genero: d.genero, color: d.color.trim(), costo: +d.costo, precio: +d.precio, stock: Math.max(0, Math.round(+d.stock)), pub: !!d.pub, foto: ft };
    if (id) Object.assign(a, datos); else db().arms.unshift({ ...datos, id: uid(), min: 1, alta: dia(), ultVenta: dia() });
    if (guardar(id ? 'Armazón actualizado' : 'Armazón agregado al catálogo')) dlg.close();
  };
}

// ---------- Recordatorios
function recordatorios() {
  const av = (k) => db().avisos[k];
  const btn = (k, p, msg) => (av(k) ? `<span class="badge b-ok">Avisado ${fecha(av(k))}</span>` : `<a class="btn mini" target="_blank" rel="noopener" data-avisar="${k}" href="${waP(p, msg)}">📱 Avisar</a>`);
  const sinR = db().ordenes.filter(sinRecoger);
  const exa = db().pacs.filter((p) => ultGrad(db(), p.id) && examenToca(db(), p.id));
  const lc = db().pacs.filter((p) => lcToca(db(), p.id));
  const sitio = new URL('index.html', location.href).href;
  return cab('Recordatorios', 'Cada aviso es una venta que regresa: el examen anual, los lentes de contacto y los lentes que nadie ha recogido.') + `
  <section class="panel"><h2>Lentes listos sin recoger (${sinR.length})</h2><ul class="lista-mini">${sinR.map((o) => { const p = pac(o.pac); return `<li><div><b>${esc(p.n)}</b> · ${o.folio}<br><small>Lista hace ${diasEntre(o.hist.at(-1).f, dia())} días · saldo ${pesos(saldo(o))}</small></div><div class="der">${btn('r' + o.folio + diasEntre(o.hist.at(-1).f, dia()), p, `${hola(p)} Tus lentes siguen esperándote 👓. Pasa por ellos de ${db().conf.horario}.${saldo(o) ? ` Saldo: ${pesos(saldo(o))}.` : ''}`)}</div></li>`; }).join('') || '<li class="vacio">Ninguno</li>'}</ul></section>
  <section class="panel"><h2>Les toca examen de la vista (${exa.length})</h2><ul class="lista-mini">${exa.map((p) => { const g = ultGrad(db(), p.id); return `<li><div><b>${esc(p.n)}</b><br><small>Último examen ${fAno(g.f)} (hace ${Math.round(diasEntre(g.f, dia()) / 30.4)} meses)</small></div><div class="der">${btn('e' + p.id, p, `${hola(p)} Ya pasó un año de tu último examen de la vista 👁️. Revisar tu graduación evita dolores de cabeza. Agenda aquí: ${sitio}`)}</div></li>`; }).join('') || '<li class="vacio">Ninguno</li>'}</ul></section>
  <section class="panel"><h2>Lentes de contacto por terminarse (${lc.length})</h2><ul class="lista-mini">${lc.map((p) => `<li><div><b>${esc(p.n)}</b><br><small>Su caja de 6 meses está por acabarse</small></div><div class="der">${btn('c' + p.id, p, `${hola(p)} Tus lentes de contacto están por terminarse. ¿Te apartamos otra caja? Precio: ${pesos(db().micas.lc.p)}.`)}</div></li>`).join('') || '<li class="vacio">Ninguno</li>'}</ul></section>`;
}

// ---------- Ajustes
function ajustes() {
  const c = db().conf;
  return cab('Ajustes', 'Precios de micas y tratamientos (se actualizan en el catálogo y en «Arma tus lentes»).') + `
  <section class="panel"><form class="form" id="fConf">
    <label>Nombre<input name="nombre" required value="${esc(c.nombre)}"></label><label>WhatsApp<input name="whatsapp" required value="${esc(c.whatsapp)}"></label>
    <label>Dirección<input name="direccion" value="${esc(c.direccion)}"></label><label>Horario<input name="horario" value="${esc(c.horario)}"></label>
    <label>Examen de la vista ($)<input name="examen" type="number" min="0" value="${c.examen}"></label><label>Anticipo (%)<input name="anticipo" type="number" min="0" max="100" value="${c.anticipo}"></label>
    <label>Garantía (meses)<input name="garantia" type="number" min="0" value="${c.garantia}"></label><label>PIN del panel<input name="pin" required minlength="4" maxlength="6" value="${esc(c.pin)}"></label>
    ${Object.entries(db().micas).map(([k, m]) => `<label>${esc(m.n)} ($)<input name="m_${k}" type="number" min="0" value="${m.p}"></label>`).join('')}
    ${Object.entries(db().trats).map(([k, t]) => `<label>${esc(t.n)} ($)<input name="t_${k}" type="number" min="0" value="${t.p}"></label>`).join('')}
    <div class="full"><button class="btn">Guardar</button></div></form></section>
  <section class="panel"><h2>Datos del demo</h2><button class="btn peligro" id="reiniciar">Reiniciar demo con datos de ejemplo</button></section>`;
}

// ---------- Navegación
const VISTAS = { inicio, venta, ordenes, examenes, clientes, armazones, recordatorios, ajustes };
function pintar() {
  const r = VISTAS[location.hash.slice(1)] ? location.hash.slice(1) : 'inicio';
  if (r === 'venta' && $('#fVenta') && !pintar.forzar) return; // no borrar una venta a medio capturar
  pintar.forzar = false;
  $('#vista').innerHTML = VISTAS[r]();
  $$('.side a[href^="#"]').forEach((a) => a.setAttribute('aria-current', a.getAttribute('href') === '#' + r ? 'page' : 'false'));
  const rec = db().ordenes.filter(sinRecoger).length + db().pacs.filter((p) => ultGrad(db(), p.id) && examenToca(db(), p.id)).length + db().pacs.filter((p) => lcToca(db(), p.id)).length;
  const n = { nOrd: activas().filter(atrasada).length, nEx: db().citas.filter((c) => c.estado === 'pendiente' && c.fecha >= dia()).length, nArm: db().apartados.filter((a) => a.estado === 'activo').length, nRec: rec };
  for (const [k, v] of Object.entries(n)) { $('#' + k).hidden = !v; $('#' + k).textContent = v; }
  if (r === 'venta') enlazarVenta();
  if (r === 'examenes') $('#fEx').onchange = (e) => { fEx = e.target.value || dia(); pintar(); };
  if (r === 'clientes') $('#qCli').oninput = (e) => { qCli = e.target.value; pintar(); const i = $('#qCli'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); };
  if (r === 'ajustes') {
    $('#fConf').onsubmit = (e) => {
      e.preventDefault(); const d = Object.fromEntries(new FormData(e.target));
      Object.assign(db().conf, { nombre: d.nombre.trim(), whatsapp: d.whatsapp.replace(/\D/g, ''), direccion: d.direccion.trim(), horario: d.horario.trim(), examen: +d.examen, anticipo: +d.anticipo, garantia: +d.garantia, pin: d.pin.trim() });
      for (const k in db().micas) db().micas[k].p = +d['m_' + k];
      for (const k in db().trats) db().trats[k].p = +d['t_' + k];
      guardar('Ajustes guardados');
    };
    $('#reiniciar').onclick = () => { if (confirm('Se borran tus cambios y vuelven los datos de ejemplo. ¿Continuar?')) { B.reiniciar(); pintar.forzar = true; pintar(); toast('Demo reiniciado'); } };
  }
}

document.addEventListener('click', (e) => {
  const t = e.target; const q = (s) => t.closest(s); let el;
  if ((el = q('[data-vender]'))) { dlg.close(); pintar.forzar = true; if (location.hash === '#venta') { e.preventDefault(); pintar(); } setTimeout(() => { const f = $('#fVenta'); if (f) { f.pac.value = el.dataset.vender; f.dispatchEvent(new Event('change')); } }, 60); return; }
  if (q('[data-cerrar]') || t === dlg) return dlg.close();
  if ((el = q('[data-orden]'))) return verOrden(el.dataset.orden);
  if ((el = q('[data-conf]'))) { db().citas.find((c) => c.id === el.dataset.conf).estado = 'confirmada'; return guardar('Examen confirmado'); }
  if ((el = q('[data-falto]'))) { db().citas.find((c) => c.id === el.dataset.falto).estado = 'falto'; return guardar('Marcado como no llegó'); }
  if ((el = q('[data-graduar]'))) return graduar(el.dataset.graduar);
  if (q('[data-nuevo-ex]')) return nuevoEx();
  if ((el = q('[data-diaex]'))) { fEx = new Date(Date.parse(fEx + 'T12:00') + el.dataset.diaex * 864e5).toLocaleDateString('en-CA'); return pintar(); }
  if ((el = q('[data-cli]'))) return verCli(el.dataset.cli);
  if ((el = q('[data-arm]')) && !q('[data-pub]')) return editarArm(el.dataset.arm);
  if ((el = q('[data-ap]'))) { db().apartados.find((a) => a.id === el.dataset.ap).estado = el.dataset.e; return guardar('Apartado liberado'); }
  if ((el = q('[data-avisar]'))) { db().avisos[el.dataset.avisar] = new Date().toISOString(); setTimeout(() => guardar('Marcado como avisado'), 300); }
});
document.addEventListener('change', (e) => { const c = e.target.closest('[data-pub]'); if (c) { const a = arm(db(), c.dataset.pub); a.pub = c.checked; guardar(a.pub ? 'Visible en el catálogo' : 'Oculto del catálogo'); } });
addEventListener('hashchange', () => { pintar.forzar = true; pintar(); });

let antes = { c: db().citas.length, a: db().apartados.length };
B.alCambiar(() => {
  if (db().citas.length > antes.c) { const c = db().citas.at(-1); if (c.origen === 'portal') toast(`👁️ Examen agendado en línea: ${pac(c.pac).n} · ${fDia(c.fecha)} ${c.hora}`); }
  if (db().apartados.length > antes.a) { const a = db().apartados.at(-1); toast(`👓 ${a.n} apartó ${nombreArm(db(), a.arm)}`); }
  antes = { c: db().citas.length, a: db().apartados.length };
  pintar();
});
puerta('optica', db().conf.pin, () => { $('#app').hidden = false; pintar.forzar = true; pintar(); });
