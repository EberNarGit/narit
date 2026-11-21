// Sitio de la barbería: reservas por barbero y portal "Mi club" (sellos, club, referidos, historial).
import { $, esc, pesos, foto, wa, toast, local, uid } from '../_base/sis.js';
import { abrir, dia, fDia, domingo, diasEntre, fin, serv, barb, cli, enClub, libres, libresTodos, reservar, visitas, EST_TXT } from './datos.js';

const B = abrir();
const db = () => B.db;
const dlg = $('#dlg');
let sesion = local.get('barberia:sesion', null);
const yo = () => db().clis.find((c) => c.id === sesion);
const ventana = (html) => { dlg.innerHTML = `<div class="dlg"><button class="x" data-cerrar aria-label="Cerrar">×</button>${html}</div>`; if (!dlg.open) dlg.showModal(); };
const i18nDia = (d) => (d === dia() ? 'Hoy' : d === dia(1) ? 'Mañana' : fDia(d));
const sellosHtml = (n) => `<div class="sellos">${[...Array(db().conf.sellos)].map((_, i) => `<i class="${i < n ? 'si' : i === db().conf.sellos - 1 ? 'premio' : ''}">${i < n ? '✓' : i === db().conf.sellos - 1 ? '🎁' : i + 1}</i>`).join('')}</div>`;

function sitio() {
  const c = db().conf;
  $('#menu').innerHTML = db().servs.map((s) => `<article class="serv"><img src="${foto(s.foto, 200)}" alt="" loading="lazy"><div><h3>${esc(s.n)}</h3><p>${esc(s.desc)}</p></div>
    <div class="p"><b>${pesos(s.precio)}</b><small>${s.dur} min</small><br><button class="lnk" data-reservar="${s.id}" style="color:var(--cobre);font-weight:700">Reservar →</button></div></article>`).join('');
  $('#barbs').innerHTML = db().barbs.filter((b) => b.activo).map((b) => `<article class="barb"><img src="${foto(b.foto, 600)}" alt="${esc(b.n)}" loading="lazy"><div><h3>${esc(b.n.toUpperCase())}</h3><p>${esc(b.esp)} · ${libres(db(), b.id, domingo(dia()) ? dia(1) : dia(), 30).length} horarios libres ${domingo(dia()) ? 'mañana' : 'hoy'}</p><button class="b b-cobre" data-reservar data-barb="${b.id}">Reservar con ${esc(b.n)}</button></div></article>`).join('');
  $('#caras').innerHTML = db().barbs.map((b) => `<img src="${foto(b.foto, 80)}" alt="">`).join('');
  $('#quedan').textContent = domingo(dia()) ? 'Cerrado' : libresTodos(db(), dia(), 30).length;
  $('#prods').innerHTML = db().prods.map((p) => `<article class="prod"><img src="${foto(p.foto, 400)}" alt="" loading="lazy"><h3>${esc(p.n)}</h3><b>${pesos(p.precio)}</b><small>${p.stock > 0 ? 'Pídelo en tu próxima cita' : 'Agotado por ahora'}</small></article>`).join('');
  $('#nSellos').textContent = c.sellos; $('#precioClub').textContent = pesos(c.club);
  $('#sellosDemo').outerHTML = `<div id="sellosDemo">${sellosHtml(7)}</div>`;
  $('#pieDir').innerHTML = `${esc(c.direccion)}<br>Lun a sáb ${c.abre} a ${c.cierra}`;
  $('#waPie').href = wa(c.whatsapp, `Hola ${c.nombre}, tengo una duda.`);
}

// ---------- Reservar: servicio → barbero → día → hora → datos
function reservarDlg(sId = 'corte', bId = '') {
  const dias = [...Array(10)].map((_, i) => dia(i)).filter((d) => !domingo(d)).slice(0, 7);
  ventana(`<h2>RESERVAR</h2><form id="fRes">
    <div class="paso"><b>1 · Servicio</b><div class="ops">${db().servs.map((s) => `<label><input type="radio" name="serv" value="${s.id}" ${s.id === sId ? 'checked' : ''}><span>${esc(s.n)}<small>${pesos(s.precio)} · ${s.dur} min</small></span></label>`).join('')}</div></div>
    <div class="paso"><b>2 · Barbero</b><div class="ops"><label><input type="radio" name="barb" value="" ${bId ? '' : 'checked'}><span>🎲<small>El primero libre</small></span></label>${db().barbs.filter((b) => b.activo).map((b) => `<label><input type="radio" name="barb" value="${b.id}" ${b.id === bId ? 'checked' : ''}><span><img src="${foto(b.foto, 100)}" alt="">${esc(b.n)}<small>${esc(b.esp)}</small></span></label>`).join('')}</div></div>
    <div class="paso"><b>3 · Día</b><div class="ops">${dias.map((d, i) => `<label><input type="radio" name="fecha" value="${d}" ${i ? '' : 'checked'}><span>${i18nDia(d)}<small>${d.slice(8)}/${d.slice(5, 7)}</small></span></label>`).join('')}</div></div>
    <div class="paso"><b>4 · Hora</b><div class="ops" id="horas"></div></div>
    <div id="datos"></div>
    <div class="resumen" id="resumen"></div>
    <button class="b b-cobre b-full" style="margin-top:14px">Confirmar reserva</button></form>`);
  const f = $('#fRes');
  const pintarHoras = () => {
    const s = serv(db(), f.serv.value);
    const l = f.barb.value ? libres(db(), f.barb.value, f.fecha.value, s.dur).map((h) => [h, f.barb.value]) : libresTodos(db(), f.fecha.value, s.dur);
    $('#horas').innerHTML = l.map(([h, b], i) => `<label><input type="radio" name="hora" value="${h}" data-b="${b}" ${i ? '' : 'checked'}><span>${h}${f.barb.value ? '' : `<small>${esc(barb(db(), b).n)}</small>`}</span></label>`).join('') || '<p class="nota">Sin horarios ese día. Prueba otro día u otro barbero.</p>';
    resumen();
  };
  const resumen = () => { const s = serv(db(), f.serv.value); const h = f.querySelector('[name=hora]:checked'); $('#resumen').innerHTML = h ? `<span><b>${esc(s.n)}</b> con ${esc(barb(db(), h.dataset.b).n)}<br><small class="mut">${i18nDia(f.fecha.value)} · ${h.value} a ${fin({ hora: h.value, dur: s.dur })}</small></span><b style="font-family:var(--fd);font-size:1.6rem;color:var(--cobre)">${yo() && enClub(db(), yo()) && s.club ? 'CLUB' : pesos(s.precio)}</b>` : '<span class="mut">Elige un horario</span>'; };
  $('#datos').innerHTML = yo() ? `<p class="nota" style="margin-top:14px">Reservando como <b>${esc(yo().n)}</b>.</p>` : `<div class="paso"><b>5 · Tus datos</b><div class="form"><label>Nombre<input name="n" required autocomplete="name"></label><label>WhatsApp (10 dígitos)<input name="tel" required inputmode="tel" autocomplete="tel"></label><label>Código de un amigo (opcional)<input name="ref" placeholder="Ej. DIE344"></label></div></div>`;
  f.addEventListener('change', (e) => (e.target.name === 'hora' ? resumen() : pintarHoras())); pintarHoras();
  f.onsubmit = (e) => {
    e.preventDefault(); const h = f.querySelector('[name=hora]:checked'); if (!h) return toast('Elige un horario', 'error');
    B.recargar();
    let c = yo();
    if (!c) {
      const tel = f.tel.value.replace(/\D/g, '').slice(-10); if (tel.length !== 10) return toast('El WhatsApp debe tener 10 dígitos', 'error');
      c = db().clis.find((x) => x.tel === tel);
      if (!c) {
        const ref = f.ref.value.trim().toUpperCase(); const amigo = db().clis.find((x) => x.ref === ref);
        if (ref && !amigo) return toast('Ese código de amigo no existe', 'error');
        c = { id: uid(), n: f.n.value.trim(), tel, cumple: '', pref: '', alta: dia(), sellos: amigo ? 1 : 0, canjes: 0, club: '', ref: f.n.value.trim().slice(0, 3).toUpperCase() + tel.slice(-3), refPor: amigo?.id || '' };
        if (amigo) amigo.sellos++; // los dos ganan un sello
        db().clis.push(c);
      }
    }
    let cita;
    try { cita = reservar(db(), { cli: c.id, barb: h.dataset.b, serv: f.serv.value, fecha: f.fecha.value, hora: h.value }); } catch (err) { toast(err.message, 'error'); return pintarHoras(); }
    if (!B.guardar()) return;
    sesion = c.id; local.set('barberia:sesion', sesion); sitio();
    ventana(`<div class="listo"><span style="font-size:3rem">💈</span><h2>¡LISTO, ${esc(c.n.split(' ')[0].toUpperCase())}!</h2>
      <p><b>${esc(serv(db(), cita.serv).n)}</b> con <b>${esc(barb(db(), cita.barb).n)}</b><br>${i18nDia(cita.fecha)} a las <b>${cita.hora}</b></p>
      <p class="nota">Te mandamos recordatorio. Si no puedes llegar, cancela desde «Mi club» para liberar el lugar.</p>
      <button class="b b-cobre b-full" data-portal>Ver mi club y mis sellos</button></div>`);
  };
}

// ---------- Portal
function entrar() {
  const ej = [['c1', 'tiene corte gratis'], ['c2', 'socio del club'], ['c3', 'no viene hace 45 días']].map(([id, x]) => { const c = cli(db(), id); return `<button type="button" data-tel="${c.tel}"><span>${esc(c.n)} · ${x}</span><b>${c.tel}</b></button>`; }).join('');
  ventana(`<h2>MI CLUB</h2><p class="nota">Entra con tu WhatsApp.</p><form class="form" id="fEntrar"><label>WhatsApp<input name="tel" required inputmode="tel" autocomplete="tel"></label><button class="b b-cobre">Entrar</button></form>
    <p class="nota" style="margin-top:14px"><b>Demo:</b> toca un cliente de ejemplo.</p><div class="demo-tels">${ej}</div><p class="nota" style="margin-top:12px">En el sistema real llega un código por WhatsApp para entrar.</p>`);
  const f = $('#fEntrar');
  dlg.querySelectorAll('[data-tel]').forEach((b) => (b.onclick = () => { f.tel.value = b.dataset.tel; f.requestSubmit(); }));
  f.onsubmit = (e) => { e.preventDefault(); const c = db().clis.find((x) => x.tel === f.tel.value.replace(/\D/g, '').slice(-10)); if (!c) return toast('No te encontramos. Reserva tu primer corte y quedas registrado.', 'error'); sesion = c.id; local.set('barberia:sesion', sesion); dlg.close(); irPortal(); };
}
function irPortal() { if (!yo()) return entrar(); $('#sitio').hidden = true; $('#portal').hidden = false; portal(); scrollTo(0, 0); }
function irSitio() { $('#sitio').hidden = false; $('#portal').hidden = true; }

function portal() {
  if ($('#portal').hidden || !yo()) return;
  const c = yo(); const conf = db().conf;
  const prox = db().citas.filter((x) => x.cli === c.id && x.fecha >= dia() && ['reservada', 'llego', 'silla'].includes(x.estado)).sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));
  const hist = visitas(db(), c.id);
  const faltan = conf.sellos - c.sellos;
  const cumpleMes = c.cumple && c.cumple.slice(0, 2) === dia().slice(5, 7);
  $('#portal').innerHTML = `<div class="portal"><div class="p-cab"><div><h1>QUÉ ONDA, ${esc(c.n.split(' ')[0].toUpperCase())}</h1><p class="mut">${hist.length} visitas · cliente desde ${fDia(c.alta)}</p></div>
    <div class="hero-a"><button class="b b-cobre" data-reservar>Reservar</button><button class="b b-lin" id="salir">Salir</button></div></div>
    ${cumpleMes ? '<div class="caja tarjeta"><b>🎂 ¡Es tu mes de cumpleaños!</b> Tu barba va por nuestra cuenta en tu próxima visita este mes.</div>' : ''}
    <div class="g2">
      <div class="caja tarjeta"><p class="eti">Tarjeta de sellos</p><div class="grande">${c.sellos}/${conf.sellos}</div>
        <p style="margin:6px 0 0">${faltan <= 0 ? `🎁 <b>¡Tienes tu premio!</b> ${esc(conf.premio)} en tu próxima visita.` : faltan === 1 ? `<b>¡Te falta 1!</b> Tu siguiente corte y el que sigue es gratis.` : `Te faltan <b>${faltan}</b> para tu ${esc(conf.premio.toLowerCase())}.`}</p>${sellosHtml(Math.min(c.sellos, conf.sellos))}
        ${c.canjes ? `<p class="nota" style="margin-top:10px">Premios canjeados: ${c.canjes}</p>` : ''}</div>
      <div>
        <div class="caja"><p class="eti">Club Filo</p>${enClub(db(), c) ? `<h3 style="color:var(--ok)">SOCIO ACTIVO</h3><p class="mut" style="margin:0">Cortes ilimitados hasta el ${fDia(c.club)}.</p>` : `<h3>${pesos(conf.club)}/MES</h3><p class="mut" style="margin:0 0 10px">Cortes ilimitados. Si vienes cada semana, te ahorras ${pesos(Math.max(0, serv(db(), 'combo').precio * 4.3 - conf.club))} al mes.</p><button class="b b-cobre" data-unirme>Quiero el club</button>`}</div>
        <div class="caja"><p class="eti">Invita a un amigo</p><span class="codigo">${esc(c.ref)}</span><p class="mut" style="margin:10px 0">Cuando tu amigo reserve con tu código, los dos ganan un sello.</p>
          <a class="b b-lin" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(`Reserva en ${conf.nombre} con mi código ${c.ref} y los dos ganamos un sello: ${location.href.split('#')[0]}`)}">Compartir por WhatsApp</a></div>
      </div></div>
    <div class="caja"><h3>PRÓXIMAS CITAS</h3>${prox.map((x) => `<div class="fila"><span><b>${esc(serv(db(), x.serv).n)}</b> con ${esc(barb(db(), x.barb).n)}<br><small class="mut">${i18nDia(x.fecha)} · ${x.hora}</small></span><span style="text-align:right"><span class="tag ${x.estado === 'reservada' ? 'pend' : 'ok'}">${EST_TXT[x.estado]}</span>${x.estado === 'reservada' ? `<br><button class="lnk" data-cancelar="${x.id}" style="text-decoration:underline;font-size:.85rem;margin-top:4px">Cancelar</button>` : ''}</span></div>`).join('') || '<p class="vacio">No tienes citas. <button class="lnk" data-reservar style="color:var(--cobre);font-weight:700">Reservar ahora</button></p>'}</div>
    <div class="caja"><h3>CÓMO TE GUSTA</h3><p class="mut" style="margin:0 0 8px">Tu barbero lo ve antes de que te sientes. Cambia lo que quieras.</p>
      <form class="form" id="fPref"><textarea name="pref" rows="2" placeholder="Ej. Fade bajo, arriba tijera, sin línea">${esc(c.pref)}</textarea><button class="b b-lin">Guardar</button></form></div>
    <div class="caja"><h3>HISTORIAL</h3>${hist.slice(0, 8).map((x) => `<div class="fila"><span>${esc(serv(db(), x.serv).n)} · ${esc(barb(db(), x.barb).n)}<br><small class="mut">${fDia(x.fecha)}</small></span><span>${x.venta?.motivo === 'premio' ? '<span class="tag ok">Premio</span>' : x.venta?.motivo === 'club' ? '<span class="tag ok">Club</span>' : pesos((x.venta?.servicio || 0) + (x.venta?.prods || 0))}</span></div>`).join('') || '<p class="vacio">Aún sin visitas.</p>'}
      ${hist[0] ? `<p class="nota" style="margin-top:8px">Tu último corte fue hace ${diasEntre(hist[0].fecha, dia())} días.</p>` : ''}</div></div>`;
  $('#fPref').onsubmit = (e) => { e.preventDefault(); B.recargar(); yo().pref = e.target.pref.value.trim(); if (B.guardar()) toast('Guardado. Tu barbero ya lo ve.'); };
}

document.addEventListener('click', (e) => {
  const t = e.target; const q = (s) => t.closest(s); let el;
  if (q('[data-cerrar]') || t === dlg) return dlg.close();
  if ((el = q('[data-reservar]'))) return reservarDlg(el.dataset.reservar || 'corte', el.dataset.barb || '');
  if (q('[data-portal]')) { dlg.close(); return irPortal(); }
  if (q('[data-ir="sitio"]')) return irSitio();
  if (t.id === 'salir') { sesion = null; local.set('barberia:sesion', null); return irSitio(); }
  if (q('[data-unirme]')) return window.open(wa(db().conf.whatsapp, `Hola, quiero unirme al Club Filo (${pesos(db().conf.club)}/mes)${yo() ? ` — ${yo().n}` : ''}.`), '_blank', 'noopener');
  if ((el = q('[data-cancelar]')) && confirm('¿Cancelar tu cita? El lugar se libera para alguien más.')) {
    B.recargar(); const c = db().citas.find((x) => x.id === el.dataset.cancelar); c.estado = 'cancelada'; c.porCliente = true;
    if (B.guardar()) { toast('Cita cancelada'); portal(); sitio(); }
  }
});
B.alCambiar(() => { sitio(); portal(); });
sitio();
if (location.hash === '#portal' && yo()) irPortal();
