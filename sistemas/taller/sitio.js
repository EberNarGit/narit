// Sitio del taller + portal "Mi auto": estado en vivo, cotización que el cliente aprueba, refacciones, bitácora con fotos, historial y garantía.
import { $, esc, pesos, fechaHora, foto, wa, toast, local, uid } from '../_base/sis.js';
import { abrir, dia, fDia, domingo, auto, mec, nombreAuto, autorizados, pendientes, total, pagado, saldo, refsFaltan, autorizar, proxServicio, horasLibres, ESTADOS, EST_TXT, EST_CORTO, EST_DESC } from './datos.js';

const B = abrir();
const db = () => B.db;
const dlg = $('#dlg');
let sesion = local.get('taller:sesion', null), autoSel = null;
const yo = () => db().clis.find((c) => c.id === sesion);
const misAutos = () => db().autos.filter((a) => a.cli === sesion);
const activa = (aId) => db().ordenes.find((o) => o.auto === aId && !['entregado', 'cancelado'].includes(o.estado));
const ventana = (html) => { dlg.innerHTML = `<div class="dlg"><button class="x" data-cerrar aria-label="Cerrar">×</button>${html}</div>`; if (!dlg.open) dlg.showModal(); };
const i18nDia = (d) => (d === dia() ? 'Hoy' : d === dia(1) ? 'Mañana' : fDia(d));

function sitio() {
  const c = db().conf;
  $('#servs').innerHTML = db().servs.map((s) => `<article class="serv"><img src="${foto(s.foto, 600)}" alt="" loading="lazy"><div class="c"><h3>${esc(s.n)}</h3><p>${esc(s.desc)}</p><div class="pie-s"><div><small class="mut">Desde</small><br><span class="precio">${pesos(s.desde)}</span></div><button class="b b-osc" data-agendar="${s.id}">Agendar</button></div></div></article>`).join('');
  $('#garTxt').textContent = `${c.garantiaDias} DÍAS O ${c.garantiaKm.toLocaleString('es-MX')} KM`;
  $('#pieDir').innerHTML = `${esc(c.direccion)}<br>${esc(c.horario)}`;
  $('#waPie').href = wa(c.whatsapp, `Hola ${c.nombre}, tengo una urgencia con mi auto.`);
}

// ---------- Acceso: placa + folio (rápido) o WhatsApp
$('#fRastreo').onsubmit = (e) => {
  e.preventDefault(); const f = e.target;
  const placa = f.placa.value.trim().toUpperCase().replace(/\s/g, ''); const folio = f.folio.value.trim().toUpperCase();
  const o = db().ordenes.find((x) => x.folio === folio && auto(db(), x.auto).placa.replace(/\s/g, '') === placa);
  if (!o) return toast('No encontramos esa placa con ese folio. Revisa tu nota de recepción.', 'error');
  sesion = o.cli; autoSel = o.auto; local.set('taller:sesion', sesion); irPortal();
};
function entrar(despues) {
  const ej = [['c1', 'cotización por aprobar'], ['c2', 'esperando refacción'], ['c4', 'auto listo'], ['c6', 'le toca servicio']].map(([id, x]) => { const c = db().clis.find((y) => y.id === id); return `<button type="button" data-tel="${c.tel}"><span>${esc(c.n)} · ${x}</span><b>${c.tel}</b></button>`; }).join('');
  ventana(`<h2>Mi auto</h2><p class="nota">Entra con tu WhatsApp para ver todos tus autos.</p><form class="form" id="fEntrar"><label>WhatsApp<input name="tel" required inputmode="tel" autocomplete="tel"></label><button class="b b-osc">Entrar</button></form>
    <p class="nota" style="margin-top:14px"><b>Demo:</b> toca un cliente de ejemplo.</p><div class="demo-tels">${ej}</div><p class="nota" style="margin-top:12px">En el sistema real llega un código por WhatsApp para entrar.</p>`);
  const f = $('#fEntrar');
  dlg.querySelectorAll('[data-tel]').forEach((b) => (b.onclick = () => { f.tel.value = b.dataset.tel; f.requestSubmit(); }));
  f.onsubmit = (e) => { e.preventDefault(); const c = db().clis.find((x) => x.tel === f.tel.value.replace(/\D/g, '').slice(-10)); if (!c) return toast('No te encontramos. Agenda tu primer servicio y quedas registrado.', 'error'); sesion = c.id; local.set('taller:sesion', sesion); dlg.close(); despues ? despues() : irPortal(); };
}

// ---------- Agendar
function agendar(sId = 'diag') {
  const c = yo();
  ventana(`<h2>Agendar servicio</h2><form class="form" id="fCita">
    <label>Servicio<select name="serv">${db().servs.map((s) => `<option value="${s.id}" ${s.id === sId ? 'selected' : ''}>${esc(s.n)} · desde ${pesos(s.desde)}</option>`).join('')}</select></label>
    ${c ? `<label>Auto<select name="auto">${misAutos().map((a) => `<option value="${a.id}" ${a.id === autoSel ? 'selected' : ''}>${esc(nombreAuto(a))} · ${esc(a.placa)}</option>`).join('')}<option value="">Otro auto</option></select></label>` : '<label>Nombre<input name="n" required autocomplete="name"></label><label>WhatsApp<input name="tel" required inputmode="tel"></label>'}
    <label>Día<select name="fecha">${[...Array(12)].map((_, i) => dia(i)).filter((d) => !domingo(d)).slice(0, 8).map((d) => `<option value="${d}">${i18nDia(d)}</option>`).join('')}</select></label>
    <fieldset style="border:0;padding:0;margin:0"><legend style="font-weight:600;font-size:.9rem;margin-bottom:6px">Hora de entrega del auto</legend><div class="horas" id="horas"></div></fieldset>
    <label>¿Qué le pasa? (marca, modelo y síntomas)<textarea name="nota" rows="2" required placeholder="Ej. Ford Focus 2015, se jalonea al acelerar"></textarea></label>
    <button class="b b-osc">Agendar</button><p class="nota">Te confirmamos por WhatsApp.</p></form>`);
  const f = $('#fCita');
  const horas = () => { const l = horasLibres(db(), f.fecha.value); $('#horas').innerHTML = l.map((h, i) => `<label><input type="radio" name="hora" value="${h}" ${i ? '' : 'checked'}><span>${h}</span></label>`).join('') || '<p class="nota">Sin lugares ese día.</p>'; };
  f.fecha.onchange = horas; horas();
  f.onsubmit = (e) => {
    e.preventDefault(); if (!f.hora) return toast('Elige otro día', 'error');
    B.recargar(); let cl = yo();
    if (!cl) {
      const tel = f.tel.value.replace(/\D/g, '').slice(-10); if (tel.length !== 10) return toast('El WhatsApp debe tener 10 dígitos', 'error');
      cl = db().clis.find((x) => x.tel === tel) || (db().clis.push({ id: uid(), n: f.n.value.trim(), tel }), db().clis.at(-1));
    }
    if (!horasLibres(db(), f.fecha.value).includes(f.hora.value)) { toast('Ese horario se llenó', 'error'); return horas(); }
    db().citas.push({ id: uid(), cli: cl.id, auto: f.auto?.value || '', fecha: f.fecha.value, hora: f.hora.value, serv: f.serv.value, estado: 'pendiente', nota: f.nota.value.trim(), origen: 'en línea' });
    if (!B.guardar()) return;
    sesion = cl.id; local.set('taller:sesion', sesion);
    ventana(`<div class="listo"><span style="font-size:3rem">🔧</span><h2>¡Agendado!</h2><p>${i18nDia(f.fecha.value)} a las <b>${f.hora.value}</b>.</p><p class="nota">Llega con tu auto y en recepción te damos tu folio para seguirlo desde aquí.</p><button class="b b-osc b-full" data-portal>Ir a Mi auto</button></div>`);
  };
}

// ---------- Portal
function irPortal() { if (!yo()) return entrar(); if (!misAutos().some((a) => a.id === autoSel)) autoSel = (misAutos().find((a) => activa(a.id)) || misAutos()[0])?.id; $('#sitio').hidden = true; $('#portal').hidden = false; portal(); scrollTo(0, 0); }
function irSitio() { $('#sitio').hidden = false; $('#portal').hidden = true; }

function portal() {
  if ($('#portal').hidden || !yo()) return;
  const c = yo(); const a = auto(db(), autoSel);
  const citas = db().citas.filter((x) => x.cli === c.id && x.fecha >= dia() && x.estado !== 'cancelada');
  $('#portal').innerHTML = `<div class="portal"><div class="p-cab"><div><h1>Hola, ${esc(c.n.split(' ')[0])}</h1><p class="mut">Todo lo de tu auto, sin tener que llamar.</p></div>
    <div class="hero-a" style="display:flex;gap:8px"><button class="b b-osc" data-agendar>Agendar servicio</button><button class="b b-lin" id="salir">Salir</button></div></div>
    ${misAutos().length > 1 ? `<div class="autos">${misAutos().map((x) => `<button class="autoBtn" data-auto="${x.id}" aria-pressed="${x.id === autoSel}"><img src="${foto(x.foto, 160)}" alt=""><span><b>${esc(x.marca)} ${esc(x.modelo)}</b><small>${esc(x.placa)}${activa(x.id) ? ' · en taller' : ''}</small></span></button>`).join('')}</div>` : ''}
    ${citas.length ? `<div class="caja"><b>Cita:</b> ${citas.map((x) => `${i18nDia(x.fecha)} ${x.hora} · ${esc(db().servs.find((s) => s.id === x.serv)?.n || '')} <span class="tag ${x.estado === 'confirmada' ? 'ok' : 'pend'}">${x.estado === 'confirmada' ? 'Confirmada' : 'Por confirmar'}</span>`).join(' · ')}</div>` : ''}
    ${a ? vistaAuto(a) : '<p class="vacio">Aún no tenemos autos registrados a tu nombre.</p>'}</div>`;
}

function vistaAuto(a) {
  const o = activa(a.id);
  const hist = db().ordenes.filter((x) => x.auto === a.id && x.estado === 'entregado').sort((x, y) => y.f.localeCompare(x.f));
  const ps = proxServicio(db(), a);
  let h = '';
  if (o) {
    const i = ESTADOS.indexOf(o.estado); const m = mec(db(), o.mec);
    h += o.estado === 'autorizacion' && pendientes(o).length ? cotizacion(o) : '';
    h += o.estado === 'listo' ? `<div class="caja listo-c"><h3>🎉 ¡Tu auto está listo!</h3><p style="margin:0 0 10px">Pasa por él en ${esc(db().conf.horario)}. ${saldo(o) > 0 ? `Saldo a pagar: <b>${pesos(saldo(o))}</b>.` : 'Ya está pagado.'}</p><a class="b b-ok" target="_blank" rel="noopener" href="${wa(db().conf.whatsapp, `Hola, voy por mi ${a.marca} ${a.modelo} (${o.folio}).`)}">Avisar que voy en camino</a></div>` : '';
    h += `<div class="caja"><div class="estado"><img src="${foto(a.foto, 300)}" alt=""><div><small class="mut">${o.folio} · ${esc(nombreAuto(a))} · ${esc(a.placa)}</small><div class="grande">${EST_TXT[o.estado]}</div>
      <p style="margin:6px 0 0">${EST_DESC[o.estado]}${m ? ` Te atiende <b>${esc(m.n)}</b>.` : ''}</p>
      ${!['listo'].includes(o.estado) ? `<p class="mut" style="margin:4px 0 0">Entrega estimada: <b>${fDia(o.promesa)}</b>${o.promesa < dia() ? ' · lleva retraso, te avisamos en cuanto esté' : ''}</p>` : ''}</div></div>
      <ol class="linea">${ESTADOS.map((e, k) => `<li class="${k <= i ? 'hecho' : ''} ${k === i ? 'actual' : ''} ${k === i && e === 'autorizacion' ? 'alerta' : ''}">${EST_CORTO[e]}</li>`).join('')}</ol></div>`;
    if (refsFaltan(o).length || autorizados(o).some((x) => x.tipo === 'ref')) h += `<div class="caja"><h3>Refacciones</h3>${autorizados(o).filter((x) => x.tipo === 'ref').map((x) => `<div class="fila"><span>${esc(x.n)}</span><span class="tag ${x.llego ? 'ok' : 'pend'}">${x.llego ? 'Ya está en el taller' : x.eta ? `Llega ${i18nDia(x.eta)}` : 'Pedida'}</span></div>`).join('')}</div>`;
    const bit = o.bitacora.filter((b) => b.pub).slice().reverse();
    h += `<div class="caja"><h3>Avances del mecánico</h3><div class="bit">${bit.map((b) => `<article>${b.foto ? `<img src="${foto(b.foto, 300)}" alt="Foto del avance">` : '<span></span>'}<div><small>${fechaHora(b.f)}</small><p>${esc(b.txt)}</p></div></article>`).join('') || '<p class="vacio">Aún no hay avances.</p>'}</div></div>`;
    h += `<div class="caja"><h3>Tu cuenta</h3>${autorizados(o).map((x) => `<div class="fila"><span>${esc(x.n)} <small class="mut">${x.tipo === 'mo' ? 'mano de obra' : 'refacción'}</small></span><b>${pesos(x.precio)}</b></div>`).join('')}
      ${o.items.filter((x) => x.est === 'rechazado').map((x) => `<div class="fila mut"><s>${esc(x.n)}</s><span class="tag gris">No autorizado</span></div>`).join('')}
      <div class="fila"><b>Total autorizado</b><b>${pesos(total(o))}</b></div><div class="fila"><span>Pagado</span><b>${pesos(pagado(o))}</b></div><div class="fila"><span>Por pagar</span><b>${pesos(saldo(o))}</b></div>
      <p class="nota" style="margin-top:8px">Nunca cobramos nada que no hayas autorizado.</p></div>`;
  } else h += `<div class="caja"><div class="estado"><img src="${foto(a.foto, 300)}" alt=""><div><small class="mut">${esc(a.placa)}</small><div class="grande">${esc(nombreAuto(a))}</div><p class="mut" style="margin:6px 0 0">No está en el taller. ${a.km.toLocaleString('es-MX')} km registrados.</p></div></div></div>`;
  if (ps) h += `<div class="caja ${ps.toca ? 'atencion' : ''}"><h3>${ps.toca ? '¡Ya te toca servicio!' : 'Próximo servicio'}</h3><p style="margin:0 0 10px">El ${fDia(ps.fecha)} o a los ${ps.km.toLocaleString('es-MX')} km, lo que llegue primero.</p>${ps.toca ? '<button class="b b-osc" data-agendar="aceite">Agendar servicio</button>' : ''}</div>`;
  h += `<div class="caja"><h3>Historial por placa</h3>${hist.map((x) => `<div class="fila"><span><b>${esc(x.motivo)}</b><br><small class="mut">${x.folio} · ${fDia(x.f)}${x.km ? ` · ${x.km.toLocaleString('es-MX')} km` : ''}</small><br><small class="mut">${autorizados(x).map((y) => esc(y.n)).join(', ')}</small></span><span style="text-align:right">${pesos(total(x))}<br>${x.garantia >= dia() ? `<span class="tag ok">Garantía hasta ${fDia(x.garantia)}</span>` : '<span class="tag gris">Sin garantía</span>'}</span></div>`).join('') || '<p class="vacio">Sin servicios anteriores.</p>'}</div>`;
  return h;
}

function cotizacion(o) {
  const ps = pendientes(o);
  return `<div class="caja atencion"><h3>⚠ Requiere tu atención</h3><p style="margin:0 0 6px">${esc(o.atencion || 'Aprueba la cotización para continuar.')} Elige qué sí y qué no; solo cobramos lo que autorices.</p>
    <form id="fAut">${ps.map((x) => `<div class="item"><span><b>${esc(x.n)}</b><small>${x.tipo === 'mo' ? 'Mano de obra' : 'Refacción'}${x.tipo === 'ref' && x.prov ? ' · se pide al autorizar' : ''}</small></span><b>${pesos(x.precio)}</b>
      <span class="si-no" role="radiogroup" aria-label="${esc(x.n)}"><label><input type="radio" name="${x.id}" value="1" checked><span class="si">Sí</span></label><label><input type="radio" name="${x.id}" value="0"><span class="no">No</span></label></span></div>`).join('')}
      <div class="fila"><b>Total si apruebas</b><b id="totAut"></b></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button class="b b-ok">Enviar mi respuesta</button><a class="b b-lin" target="_blank" rel="noopener" href="${wa(db().conf.whatsapp, `Hola, tengo una duda sobre la cotización de ${o.folio}.`)}">Tengo una duda</a></div></form></div>`;
}
function enlazarCot() {
  const f = $('#fAut'); if (!f) return;
  const o = activa(autoSel);
  const t = () => { $('#totAut').textContent = pesos(total(o) + pendientes(o).filter((x) => f[x.id].value === '1').reduce((s, x) => s + x.precio, 0)); };
  f.onchange = t; t();
  f.onsubmit = (e) => {
    e.preventDefault(); B.recargar(); const oo = activa(autoSel);
    const dec = Object.fromEntries(pendientes(oo).map((x) => [x.id, f[x.id].value === '1']));
    autorizar(oo, dec);
    if (B.guardar()) { toast('¡Gracias! El taller ya recibió tu respuesta.'); portal(); scrollTo(0, 0); }
  };
}

document.addEventListener('click', (e) => {
  const t = e.target; const q = (s) => t.closest(s); let el;
  if (q('[data-cerrar]') || t === dlg) return dlg.close();
  if ((el = q('[data-agendar]'))) return agendar(el.dataset.agendar || 'diag');
  if (q('[data-portal]')) { dlg.close(); return irPortal(); }
  if (q('[data-ir="sitio"]')) return irSitio();
  if (t.id === 'salir') { sesion = null; local.set('taller:sesion', null); return irSitio(); }
  if ((el = q('[data-auto]'))) { autoSel = el.dataset.auto; return portal(); }
});
// Cada vez que se pinta el portal, se conecta el formulario de autorización.
new MutationObserver(() => { if ($('#fAut')) enlazarCot(); }).observe($('#portal'), { childList: true });
B.alCambiar(() => { sitio(); portal(); });
sitio();
if (location.hash === '#portal' && yo()) irPortal();
