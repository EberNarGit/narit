// Sitio del salón: servicios, reservas con cupón y anticipo, tienda con pedido para recoger y portal "Mi espacio".
import { $, esc, pesos, foto, wa, toast, local, uid } from '../_base/sis.js';
import { abrir, dia, fDia, domingo, diasEntre, fin, serv, est, cli, prod, CATS, EST_TXT, PED_TXT, estsPara, libres, libresTodas, reservar, validarCupon, anticipoDe, nivel, visitasTot, esCumple, crearPedido } from './datos.js';

const B = abrir();
const db = () => B.db;
const dlg = $('#dlg');
let sesion = local.get('salon:sesion', null), catSel = '', pcat = '';
let bolsa = local.get('salon:bolsa', []);
const yo = () => db().clis.find((c) => c.id === sesion);
const ventana = (html, lateral) => { dlg.className = lateral ? 'lateral' : ''; dlg.innerHTML = `<div class="dlg"><button class="x" data-cerrar aria-label="Cerrar">×</button>${html}</div>`; if (!dlg.open) dlg.showModal(); };
const i18nDia = (d) => (d === dia() ? 'Hoy' : d === dia(1) ? 'Mañana' : fDia(d));
const guardarBolsa = () => { local.set('salon:bolsa', bolsa); const n = bolsa.reduce((s, x) => s + x.cant, 0); $('#nBolsa').hidden = !n; $('#nBolsa').textContent = n; };
const tarjeta = (n) => `<div class="tarjeta">${[...Array(db().conf.visitas)].map((_, i) => `<i class="${i < n ? 'si' : i === db().conf.visitas - 1 ? 'premio' : ''}">${i < n ? '♥' : i === db().conf.visitas - 1 ? '🎁' : i + 1}</i>`).join('')}</div>`;
const colNivel = { Rosa: ['#F3D3D6', '#8E3B5F'], Plata: ['#E5E5EA', '#5B5B66'], Oro: ['#F1E0BD', '#8A6A2E'] };

function sitio() {
  const c = db().conf;
  $('#cats').innerHTML = [['', 'Todos'], ...Object.entries(CATS)].map(([k, v]) => `<button data-cat="${k}" aria-pressed="${catSel === k}">${v}</button>`).join('');
  $('#servs').innerHTML = db().servs.filter((s) => !catSel || s.cat === catSel).map((s) => `<article class="serv"><img src="${foto(s.foto, 600)}" alt="" loading="lazy"><div class="c"><small>${CATS[s.cat]}</small><h3>${esc(s.n)}</h3><p>${esc(s.desc)}</p>
    <div class="pie-s"><div><span class="precio">${pesos(s.precio)}</span><br><small>${s.dur >= 60 ? (s.dur / 60).toString().replace('.5', '½') + ' h' : s.dur + ' min'}</small>${anticipoDe(db(), s) ? ' <span class="tagA">anticipo</span>' : ''}</div><button class="b b-osc" data-reservar="${s.id}">Reservar</button></div></div></article>`).join('');
  $('#antNota').textContent = `Servicios desde ${pesos(c.anticipoDesde)} se apartan con ${c.anticipoPct}% de anticipo, que se descuenta al pagar.`;
  $('#nVis').textContent = c.visitas; $('#premio').textContent = c.premio.toLowerCase();
  $('#tarjetaDemo').innerHTML = tarjeta(7);
  $('#niveles').innerHTML = c.niveles.map((n) => `<div class="nivel"><span class="m" style="background:${colNivel[n.n]?.[0] || '#eee'};color:${colNivel[n.n]?.[1] || '#333'}">${n.n[0]}</span><div><h3>${esc(n.n)}</h3><small class="mut">Desde ${n.desde} visitas</small></div><b>${n.desc ? `-${n.desc}%` : 'Bienvenida'}</b></div>`).join('') + '<p class="nota">El descuento aplica en productos de la tienda.</p>';
  $('#promosL').innerHTML = db().cupones.filter((k) => k.activo && k.vence >= dia() && k.usos < k.max).map((k) => `<article class="promo"><small>${k.grupo === 'todas' ? 'Para todas' : k.grupo === 'cumple' ? 'En tu mes de cumpleaños' : k.grupo === 'inactivas' ? 'Si hace mucho no vienes' : 'Nivel Oro'}${k.cat ? ' · ' + CATS[k.cat] : ''}</small><h3>${esc(k.titulo)}</h3><span class="cod">${esc(k.codigo)}</span><small>Vence el ${fDia(k.vence)}</small></article>`).join('') || '<p class="mut">Sin promociones por ahora.</p>';
  $('#pcats').innerHTML = [['', 'Todo'], ...[...new Set(db().prods.map((p) => p.cat))].map((x) => [x, x])].map(([k, v]) => `<button data-pcat="${k}" aria-pressed="${pcat === k}">${v}</button>`).join('');
  const pct = yo() ? nivel(db(), yo().id).desc : 0;
  $('#prods').innerHTML = db().prods.filter((p) => p.pub && (!pcat || p.cat === pcat)).map((p) => `<article class="prod"><img src="${foto(p.foto, 400)}" alt="" loading="lazy"><span class="tagA">${esc(p.cat)}</span><h3>${esc(p.n)}</h3><p>${esc(p.desc)}</p>
    <span class="precio">${pesos(p.precio * (1 - pct / 100))}${pct ? ` <small class="mut" style="font-size:.9rem;text-decoration:line-through">${pesos(p.precio)}</small>` : ''}</span>
    <button class="b ${p.stock > 0 ? 'b-baya' : 'b-lin'}" data-agregar="${p.id}" ${p.stock > 0 ? '' : 'disabled'}>${p.stock > 0 ? (p.stock <= 3 ? `Agregar · quedan ${p.stock}` : 'Agregar a mi bolsa') : 'Agotado'}</button></article>`).join('');
  $('#equipo').innerHTML = db().ests.filter((e) => e.activo).map((e) => `<article><img src="${foto(e.foto, 500)}" alt="${esc(e.n)}" loading="lazy"><h3>${esc(e.n)}</h3><p>${esc(e.esp)}</p><button class="b b-lin" data-reservar="" data-est="${e.id}">Reservar con ${esc(e.n)}</button></article>`).join('');
  $('#pieDir').innerHTML = `${esc(c.direccion)}<br>Lun a sáb ${c.abre} a ${c.cierra}`;
  $('#waPie').href = wa(c.whatsapp, `Hola ${c.nombre}, tengo una duda.`);
  guardarBolsa();
}

// ---------- Reservar
function reservarDlg(sId = '', eId = '') {
  const s0 = sId || (eId ? db().servs.find((s) => est(db(), eId).cats.includes(s.cat)).id : db().servs[0].id);
  const dias = [...Array(10)].map((_, i) => dia(i)).filter((d) => !domingo(d)).slice(0, 7);
  ventana(`<h2>Reservar</h2><form id="fRes">
    <div class="paso"><b>1 · Servicio</b><select name="serv" style="width:100%;padding:12px;border:1.5px solid var(--ln);border-radius:14px;background:#fff">${Object.entries(CATS).map(([k, v]) => `<optgroup label="${v}">${db().servs.filter((s) => s.cat === k).map((s) => `<option value="${s.id}" ${s.id === s0 ? 'selected' : ''}>${esc(s.n)} · ${pesos(s.precio)}</option>`).join('')}</optgroup>`).join('')}</select></div>
    <div class="paso"><b>2 · Con quién</b><div class="ops" id="ests"></div></div>
    <div class="paso"><b>3 · Día</b><div class="ops">${dias.map((d, i) => `<label><input type="radio" name="fecha" value="${d}" ${i ? '' : 'checked'}><span>${i18nDia(d)}<small>${d.slice(8)}/${d.slice(5, 7)}</small></span></label>`).join('')}</div></div>
    <div class="paso"><b>4 · Hora</b><div class="ops" id="horas"></div></div>
    <div class="paso"><b>Código de promoción (opcional)</b><div class="form" style="margin:0"><input name="cupon" placeholder="Ej. MANOS100" style="text-transform:uppercase"></div><p class="nota" id="cupMsg"></p></div>
    <div id="datos"></div><div class="resumen" id="resumen"></div>
    <button class="b b-osc b-full" style="margin-top:14px">Confirmar reserva</button></form>`);
  const f = $('#fRes');
  const pintarEsts = () => { const v = f.est?.value ?? eId; $('#ests').innerHTML = `<label><input type="radio" name="est" value="" ${v ? '' : 'checked'}><span>✨<small>La primera libre</small></span></label>` + estsPara(db(), f.serv.value).map((e) => `<label><input type="radio" name="est" value="${e.id}" ${e.id === v ? 'checked' : ''}><span><img src="${foto(e.foto, 100)}" alt="">${esc(e.n)}<small>${esc(e.esp)}</small></span></label>`).join(''); if (!f.querySelector('[name=est]:checked')) f.est[0].checked = true; };
  const pintarHoras = () => {
    const s = serv(db(), f.serv.value); const e = f.querySelector('[name=est]:checked').value;
    const l = e ? libres(db(), e, f.fecha.value, s.dur).map((h) => [h, e]) : libresTodas(db(), s.id, f.fecha.value);
    $('#horas').innerHTML = l.map(([h, x], i) => `<label><input type="radio" name="hora" value="${h}" data-e="${x}" ${i ? '' : 'checked'}><span>${h}${e ? '' : `<small>${esc(est(db(), x).n)}</small>`}</span></label>`).join('') || '<p class="nota">Sin horarios ese día. Prueba otro día o con otra estilista.</p>';
    resumen();
  };
  const resumen = () => {
    const s = serv(db(), f.serv.value); const h = f.querySelector('[name=hora]:checked'); const ant = anticipoDe(db(), s);
    const vc = f.cupon.value.trim() ? validarCupon(db(), f.cupon.value, s.id, sesion) : null;
    $('#cupMsg').textContent = vc ? (vc.ok ? `✓ ${vc.msg}` : vc.msg) : ''; $('#cupMsg').style.color = vc && !vc.ok ? 'var(--mal)' : 'var(--ok)';
    $('#resumen').innerHTML = h ? `<span><b>${esc(s.n)}</b> con ${esc(est(db(), h.dataset.e).n)}<br><small class="mut">${i18nDia(f.fecha.value)} · ${h.value} a ${fin({ hora: h.value, dur: s.dur })}${ant ? ` · anticipo ${pesos(ant.monto)}` : ''}</small></span><b style="font-family:var(--fd);font-size:1.8rem">${pesos(s.precio - (vc?.ok ? vc.desc : 0))}</b>` : '<span class="mut">Elige un horario</span>';
  };
  $('#datos').innerHTML = yo() ? `<p class="nota" style="margin-top:14px">Reservando como <b>${esc(yo().n)}</b>.</p>` : `<div class="paso"><b>5 · Tus datos</b><div class="form" style="margin:0"><label>Nombre<input name="n" required autocomplete="name"></label><label>WhatsApp (10 dígitos)<input name="tel" required inputmode="tel" autocomplete="tel"></label></div></div>`;
  f.addEventListener('change', (e) => { if (e.target.name === 'serv') { pintarEsts(); pintarHoras(); } else if (e.target.name === 'hora') resumen(); else if (e.target.name !== 'cupon') pintarHoras(); });
  f.cupon.addEventListener('input', resumen);
  pintarEsts(); pintarHoras();
  f.onsubmit = (e) => {
    e.preventDefault(); const h = f.querySelector('[name=hora]:checked'); if (!h) return toast('Elige un horario', 'error');
    B.recargar();
    let c = yo();
    if (!c) {
      const tel = f.tel.value.replace(/\D/g, '').slice(-10); if (tel.length !== 10) return toast('El WhatsApp debe tener 10 dígitos', 'error');
      c = db().clis.find((x) => x.tel === tel) || (db().clis.push({ id: uid(), n: f.n.value.trim(), tel, cumple: '', alergias: '', formula: '', notas: '', alta: dia(), visitas: 0, canjes: 0 }), db().clis.at(-1));
    }
    let cita;
    try { cita = reservar(db(), { cli: c.id, est: h.dataset.e, serv: f.serv.value, fecha: f.fecha.value, hora: h.value, cupon: f.cupon.value.trim() }); } catch (err) { toast(err.message, 'error'); return pintarHoras(); }
    if (!B.guardar()) return;
    sesion = c.id; local.set('salon:sesion', sesion); sitio();
    const s = serv(db(), cita.serv);
    ventana(`<div class="listo"><span style="font-size:3rem">🌸</span><h2>¡Te esperamos, ${esc(c.n.split(' ')[0])}!</h2>
      <p><b>${esc(s.n)}</b> con <b>${esc(est(db(), cita.est).n)}</b><br>${i18nDia(cita.fecha)} a las <b>${cita.hora}</b></p>
      ${cita.anticipo ? `<p style="background:#fff;border-radius:14px;padding:10px 14px">Para confirmar tu lugar, envía tu anticipo de <b>${pesos(cita.anticipo.monto)}</b>. Se descuenta del total.</p><a class="b b-baya b-full" target="_blank" rel="noopener" href="${wa(db().conf.whatsapp, `Hola, reservé ${s.n} el ${fDia(cita.fecha)} a las ${cita.hora} (${c.n}). ¿Me pasan los datos para el anticipo de ${pesos(cita.anticipo.monto)}?`)}">Pedir datos para el anticipo</a>` : ''}
      <button class="b b-osc b-full" data-portal>Ir a Mi espacio</button></div>`);
  };
}

// ---------- Tienda
function agregar(id) {
  const p = prod(db(), id); const ya = bolsa.find((x) => x.id === id);
  if ((ya?.cant || 0) + 1 > p.stock) return toast(`Solo hay ${p.stock}`, 'error');
  ya ? ya.cant++ : bolsa.push({ id, cant: 1 }); guardarBolsa(); toast(`${p.n} en tu bolsa`);
}
function verBolsa() {
  bolsa = bolsa.filter((x) => prod(db(), x.id)?.pub);
  const pct = yo() ? nivel(db(), yo().id).desc : 0;
  const sub = bolsa.reduce((s, x) => s + prod(db(), x.id).precio * x.cant, 0);
  ventana(`<h2>Mi bolsa</h2>${bolsa.map((x) => { const p = prod(db(), x.id); return `<div class="item"><img src="${foto(p.foto, 160)}" alt=""><div><b>${esc(p.n)}</b><br><span class="cant"><button data-mas="${p.id}" data-d="-1" aria-label="Menos">−</button>${x.cant}<button data-mas="${p.id}" data-d="1" aria-label="Más">+</button></span></div><b>${pesos(p.precio * x.cant)}</b></div>`; }).join('') || '<p class="vacio">Tu bolsa está vacía.</p>'}
    ${bolsa.length ? `<div class="suma"><span>Subtotal</span><b>${pesos(sub)}</b></div>${pct ? `<div class="suma"><span>Tu nivel ${esc(nivel(db(), yo().id).n)} (-${pct}%)</span><b>-${pesos(sub * pct / 100)}</b></div>` : yo() ? '' : '<p class="nota" style="margin-top:8px">Si ya eres clienta, entra a «Mi espacio» para ver tu descuento.</p>'}
      <div class="suma" style="font-size:1.3rem"><span>Total</span><b>${pesos(sub * (1 - pct / 100))}</b></div>
      ${yo() ? '' : '<div class="form"><label>Nombre<input id="bN" autocomplete="name"></label><label>WhatsApp<input id="bT" inputmode="tel" autocomplete="tel"></label></div>'}
      <button class="b b-osc b-full" id="pedir" style="margin-top:14px">Apartar para recoger en el salón</button><p class="nota" style="margin-top:8px">Pagas al recoger o en tu próxima cita. Te avisamos cuando esté listo.</p>` : ''}`, true);
  $('#pedir') && ($('#pedir').onclick = () => {
    B.recargar(); let c = yo();
    if (!c) {
      const tel = $('#bT').value.replace(/\D/g, '').slice(-10); if (tel.length !== 10 || !$('#bN').value.trim()) return toast('Escribe tu nombre y WhatsApp', 'error');
      c = db().clis.find((x) => x.tel === tel) || (db().clis.push({ id: uid(), n: $('#bN').value.trim(), tel, cumple: '', alergias: '', formula: '', notas: '', alta: dia(), visitas: 0, canjes: 0 }), db().clis.at(-1));
    }
    let p; try { p = crearPedido(db(), c.id, bolsa); } catch (err) { return toast(err.message, 'error'); }
    if (!B.guardar()) return;
    sesion = c.id; local.set('salon:sesion', sesion); bolsa = []; guardarBolsa(); sitio();
    ventana(`<div class="listo"><span style="font-size:3rem">🛍️</span><h2>Pedido ${p.folio}</h2><p>Total <b>${pesos(p.total)}</b>${p.pct ? ` con tu ${p.pct}% de nivel` : ''}.</p><p class="nota">Te avisamos por WhatsApp cuando esté listo. Míralo en «Mi espacio».</p><button class="b b-osc b-full" data-portal>Ir a Mi espacio</button></div>`);
  });
}

// ---------- Portal
function entrar() {
  const ej = [['c6', 'tiene peinado gratis'], ['c2', 'le falta 1 visita'], ['c1', 'pedido listo'], ['c7', 'hace 3 meses no viene']].map(([id, x]) => { const c = cli(db(), id); return `<button type="button" data-tel="${c.tel}"><span>${esc(c.n)} · ${x}</span><b>${c.tel}</b></button>`; }).join('');
  ventana(`<h2>Mi espacio</h2><p class="nota">Entra con tu WhatsApp.</p><form class="form" id="fEntrar"><label>WhatsApp<input name="tel" required inputmode="tel" autocomplete="tel"></label><button class="b b-osc">Entrar</button></form>
    <p class="nota" style="margin-top:14px"><b>Demo:</b> toca una clienta de ejemplo.</p><div class="demo-tels">${ej}</div><p class="nota" style="margin-top:12px">En el sistema real llega un código por WhatsApp para entrar.</p>`);
  const f = $('#fEntrar');
  dlg.querySelectorAll('[data-tel]').forEach((b) => (b.onclick = () => { f.tel.value = b.dataset.tel; f.requestSubmit(); }));
  f.onsubmit = (e) => { e.preventDefault(); const c = db().clis.find((x) => x.tel === f.tel.value.replace(/\D/g, '').slice(-10)); if (!c) return toast('No te encontramos. Reserva tu primera cita y quedas registrada.', 'error'); sesion = c.id; local.set('salon:sesion', sesion); dlg.close(); sitio(); irPortal(); };
}
function irPortal() { if (!yo()) return entrar(); $('#sitio').hidden = true; $('#portal').hidden = false; portal(); scrollTo(0, 0); }
function irSitio() { $('#sitio').hidden = false; $('#portal').hidden = true; }

function portal() {
  if ($('#portal').hidden || !yo()) return;
  const c = yo(); const conf = db().conf; const nv = nivel(db(), c.id); const tot = visitasTot(db(), c.id);
  const sig = conf.niveles.find((n) => n.desde > tot);
  const prox = db().citas.filter((x) => x.cli === c.id && x.fecha >= dia() && ['reservada', 'llego', 'atencion'].includes(x.estado)).sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));
  const peds = db().pedidos.filter((p) => p.cli === c.id).sort((a, b) => b.f.localeCompare(a.f));
  const hist = db().citas.filter((x) => x.cli === c.id && x.estado === 'terminada').sort((a, b) => b.fecha.localeCompare(a.fecha));
  const misCupones = db().cupones.filter((k) => k.activo && k.vence >= dia() && k.usos < k.max && db().servs.some((s) => validarCupon(db(), k.codigo, s.id, c.id).ok));
  const faltan = conf.visitas - c.visitas;
  $('#portal').innerHTML = `<div class="portal"><div class="p-cab"><div><h1>Hola, ${esc(c.n.split(' ')[0])} 🌸</h1><p class="mut">${tot} visitas · nivel <b>${esc(nv.n)}</b>${esCumple(c) ? ' · ¡Feliz mes de cumpleaños!' : ''}</p></div>
    <div class="hero-a"><button class="b b-osc" data-reservar>Reservar</button><button class="b b-lin" id="salir">Salir</button></div></div>
    <div class="g2">
      <div class="caja rosa"><p class="eti">Tarjeta de visitas</p><div class="grande">${c.visitas}/${conf.visitas}</div>
        <p style="margin:6px 0 0">${faltan <= 0 ? `🎁 <b>¡Ganaste tu ${esc(conf.premio.toLowerCase())}!</b> Úsalo en tu próxima cita.` : faltan === 1 ? '<b>¡Te falta 1 visita</b> para tu regalo!' : `Te faltan <b>${faltan}</b> visitas para tu ${esc(conf.premio.toLowerCase())}.`}</p>${tarjeta(Math.min(c.visitas, conf.visitas))}</div>
      <div><div class="caja"><p class="eti">Tu nivel</p><h3>${esc(nv.n)}${nv.desc ? ` · ${nv.desc}% en productos` : ''}</h3><p class="mut" style="margin:0">${sig ? `Te faltan ${sig.desde - tot} visitas para ${esc(sig.n)} (${sig.desc}% de descuento).` : 'Estás en el nivel más alto. ¡Gracias por tu preferencia!'}</p></div>
        <div class="caja"><p class="eti">Promociones para ti</p>${misCupones.map((k) => `<div class="fila"><span><b>${esc(k.titulo)}</b><br><small class="mut">Vence ${fDia(k.vence)}</small></span><span class="tag pend">${esc(k.codigo)}</span></div>`).join('') || '<p class="mut" style="margin:0">Por ahora no hay promociones para ti.</p>'}</div></div>
    </div>
    <div class="caja"><h3>Próximas citas</h3>${prox.map((x) => `<div class="fila"><span><b>${esc(serv(db(), x.serv).n)}</b> con ${esc(est(db(), x.est).n)}<br><small class="mut">${i18nDia(x.fecha)} · ${x.hora}${x.cupon ? ' · ' + esc(x.cupon) : ''}</small></span><span style="text-align:right">${x.anticipo ? `<span class="tag ${x.anticipo.pagado ? 'ok' : 'mal'}">${x.anticipo.pagado ? 'Anticipo recibido' : 'Anticipo pendiente ' + pesos(x.anticipo.monto)}</span><br>` : ''}<span class="tag ${x.estado === 'reservada' ? 'pend' : 'ok'}">${EST_TXT[x.estado]}</span>${x.estado === 'reservada' ? `<br><button class="lnk" data-cancelar="${x.id}" style="text-decoration:underline;font-size:.85rem;margin-top:4px">Cancelar</button>` : ''}</span></div>`).join('') || '<p class="vacio">No tienes citas. <button class="lnk" data-reservar style="color:var(--baya);font-weight:600">Reservar ahora</button></p>'}</div>
    <div class="caja"><h3>Mis pedidos</h3>${peds.map((p) => `<div class="fila"><span><b>${p.folio}</b> · ${p.items.map((i) => `${i.cant} × ${esc(prod(db(), i.id).n)}`).join(', ')}<br><small class="mut">${fDia(p.f)}</small></span><span style="text-align:right"><b>${pesos(p.total)}</b><br><span class="tag ${p.estado === 'listo' ? 'ok' : p.estado === 'nuevo' ? 'pend' : 'gris'}">${PED_TXT[p.estado]}</span></span></div>`).join('') || '<p class="vacio">Sin pedidos. <a href="#tienda" data-ir="sitio" style="color:var(--baya)">Ver la tienda</a></p>'}</div>
    <div class="caja"><h3>Mis datos para el salón</h3><p class="mut" style="margin:0 0 8px">Tu estilista lo ve antes de atenderte.</p>
      <form class="form" id="fFicha"><label>Alergias o sensibilidades<input name="alergias" value="${esc(c.alergias)}" placeholder="Ninguna"></label><label>Cómo te gusta<textarea name="notas" rows="2">${esc(c.notas)}</textarea></label><label>Cumpleaños (MM-DD)<input name="cumple" pattern="\\d{2}-\\d{2}" value="${esc(c.cumple)}" placeholder="04-25"></label><button class="b b-lin">Guardar</button></form></div>
    <div class="caja"><h3>Historial</h3>${hist.slice(0, 8).map((x) => `<div class="fila"><span>${esc(serv(db(), x.serv).n)} · ${esc(est(db(), x.est).n)}<br><small class="mut">${fDia(x.fecha)}</small></span><span>${x.venta?.dPremio ? '<span class="tag ok">Regalo</span>' : pesos((x.venta?.servicio || 0) + (x.venta?.prods || 0))}</span></div>`).join('') || '<p class="vacio">Aún sin visitas.</p>'}${hist[0] ? `<p class="nota">Tu última visita fue hace ${diasEntre(hist[0].fecha, dia())} días.</p>` : ''}</div></div>`;
  $('#fFicha').onsubmit = (e) => { e.preventDefault(); B.recargar(); const f = e.target; Object.assign(yo(), { alergias: f.alergias.value.trim(), notas: f.notas.value.trim(), cumple: f.cumple.value.trim() }); if (B.guardar()) toast('Guardado. Tu estilista ya lo ve.'); };
}

document.addEventListener('click', (e) => {
  const t = e.target; const q = (s) => t.closest(s); let el;
  if (q('[data-cerrar]') || t === dlg) return dlg.close();
  if ((el = q('[data-reservar]'))) return reservarDlg(el.dataset.reservar, el.dataset.est || '');
  if (q('[data-portal]')) { dlg.close(); return irPortal(); }
  if (q('[data-ir="sitio"]')) return irSitio();
  if (t.id === 'salir') { sesion = null; local.set('salon:sesion', null); sitio(); return irSitio(); }
  if ((el = q('[data-cat]'))) { catSel = el.dataset.cat; return sitio(); }
  if ((el = q('[data-pcat]'))) { pcat = el.dataset.pcat; return sitio(); }
  if ((el = q('[data-agregar]'))) return agregar(el.dataset.agregar);
  if (q('[data-bolsa]')) return verBolsa();
  if ((el = q('[data-mas]'))) { const x = bolsa.find((y) => y.id === el.dataset.mas); const n = x.cant + +el.dataset.d; if (n > prod(db(), x.id).stock) return toast('No hay más piezas', 'error'); n <= 0 ? (bolsa = bolsa.filter((y) => y !== x)) : (x.cant = n); guardarBolsa(); return verBolsa(); }
  if ((el = q('[data-cancelar]')) && confirm('¿Cancelar tu cita? El horario se libera para alguien más.')) { B.recargar(); const c = db().citas.find((x) => x.id === el.dataset.cancelar); c.estado = 'cancelada'; if (B.guardar()) { toast('Cita cancelada'); portal(); } }
});
B.alCambiar(() => { sitio(); portal(); });
sitio();
if (location.hash === '#portal' && yo()) irPortal();
