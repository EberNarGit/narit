// Sitio de la clínica + portal "Mi mascota" para los dueños.
import { $, $$, esc, pesos, fecha, fechaHora, foto, wa, toast, local, uid, comprimir } from '../_base/sis.js';
import { abrir, dia, fDia, fAno, edad, cartilla, VACUNAS, horasLibres, nuevaCita, CITA_TXT, HOSP_TXT, totalCuenta, saldo } from './datos.js';

const B = abrir();
const db = () => B.db;
const dlg = $('#dlg');
let sesion = local.get('vet:sesion', null); // id del dueño
let mascSel = null, tab = 'ahora';
const yo = () => db().duenos.find((d) => d.id === sesion);
const misMasc = () => db().masc.filter((m) => m.dueno === sesion);
const serv = (id) => db().serv.find((s) => s.id === id);
const hospDe = (mid) => db().hosp.find((h) => h.masc === mid && h.activa);
const citasDe = (mid) => db().citas.filter((c) => c.masc === mid);
const citaHoy = (mid) => citasDe(mid).find((c) => c.fecha === dia() && ['en curso', 'lista'].includes(c.estado));
const ventana = (html) => { dlg.innerHTML = `<div class="dlg"><button class="x" data-cerrar aria-label="Cerrar">×</button>${html}</div>`; if (!dlg.open) dlg.showModal(); };

function sitio() {
  $('#servs').innerHTML = db().serv.map((s) => `<article class="serv"><img src="${foto(s.foto, 600)}" alt="" loading="lazy"><div class="c"><h3>${esc(s.n)}</h3><p>${esc(s.desc)}</p>
    <div class="pie-s"><div><span class="precio">${pesos(s.precio)}</span><br><small>${s.dur} min aprox.</small></div><button class="b b-miel" data-agendar="${s.id}">Agendar</button></div></div></article>`).join('');
  $('#pieDir').innerHTML = `${esc(db().conf.direccion)}<br>${esc(db().conf.horario)}`;
  $('#waPie').href = wa(db().conf.whatsapp, `Hola ${db().conf.nombre}, tengo una urgencia con mi mascota.`);
}

// ---------- Entrar al portal con el WhatsApp
function entrar(despues) {
  const ejemplos = db().duenos.slice(0, 5).map((d) => {
    const ms = db().masc.filter((m) => m.dueno === d.id).map((m) => m.n).join(' y ');
    const extra = d.id === 'd1' ? ' (Max internado)' : d.id === 'd4' ? ' (Toby listo)' : '';
    return `<button type="button" data-tel="${d.tel}"><span>${esc(d.n)} · ${esc(ms)}${extra}</span><b>${d.tel}</b></button>`;
  }).join('');
  ventana(`<h2>Mi mascota</h2><p class="nota">Entra con el WhatsApp que diste en la clínica.</p>
    <form class="form" id="fEntrar"><label>WhatsApp (10 dígitos)<input name="tel" inputmode="tel" required autocomplete="tel" placeholder="55 1234 5678"></label><button class="b b-osc">Entrar</button></form>
    <p class="nota" style="margin-top:14px"><b>Demo:</b> toca un cliente de ejemplo.</p><div class="demo-tels">${ejemplos}</div>
    <p class="nota" style="margin-top:12px">En el sistema real llega un código por WhatsApp para entrar.</p>`);
  const f = $('#fEntrar');
  dlg.querySelectorAll('[data-tel]').forEach((b) => (b.onclick = () => { f.tel.value = b.dataset.tel; f.requestSubmit(); }));
  f.onsubmit = (e) => {
    e.preventDefault();
    const tel = f.tel.value.replace(/\D/g, '').slice(-10);
    const d = db().duenos.find((x) => x.tel === tel);
    if (!d) return registro(tel, despues);
    sesion = d.id; local.set('vet:sesion', sesion); dlg.close();
    despues ? despues() : irPortal();
  };
}

function registro(tel, despues) {
  ventana(`<h2>¡Bienvenido!</h2><p class="nota">No encontramos ese número. Registra a tu mascota en un minuto.</p>
    <form class="form" id="fReg"><label>Tu nombre<input name="n" required autocomplete="name"></label>
      <label>WhatsApp<input name="tel" required inputmode="tel" value="${esc(tel)}"></label>
      <label>Nombre de tu mascota<input name="mn" required></label>
      <label>Especie<select name="esp"><option>Perro</option><option>Gato</option></select></label>
      <label>Raza (opcional)<input name="raza" placeholder="Mestizo"></label>
      <label>Fecha de nacimiento aproximada<input name="nac" type="date" max="${dia()}" required></label>
      <label>Foto (opcional)<input name="foto" type="file" accept="image/*"></label>
      <button class="b b-osc">Registrar</button></form>`);
  $('#fReg').onsubmit = async (e) => {
    e.preventDefault();
    const f = e.target;
    let ft = '';
    if (f.foto.files[0]) { try { ft = await comprimir(f.foto.files[0], 700); } catch {} }
    const d = { id: uid(), n: f.n.value.trim(), tel: f.tel.value.replace(/\D/g, '').slice(-10), alta: new Date().toISOString() };
    if (d.tel.length !== 10) return toast('El WhatsApp debe tener 10 dígitos', 'error');
    B.recargar();
    db().duenos.push(d);
    db().masc.push({ id: uid(), dueno: d.id, n: f.mn.value.trim(), esp: f.esp.value, raza: f.raza.value.trim() || 'Mestizo', sexo: '', nac: f.nac.value, peso: 0, foto: ft || (f.esp.value === 'Gato' ? 'photo-1536589961747-e239b2abbec2' : 'photo-1537151608828-ea2b11777ee8'), alergias: '', ester: false });
    if (!B.guardar()) return;
    sesion = d.id; local.set('vet:sesion', sesion); dlg.close();
    toast('¡Listo! Ya puedes agendar');
    despues ? despues() : irPortal();
  };
}

// ---------- Agendar
function agendar(servId) {
  if (!yo()) return entrar(() => agendar(servId));
  const ms = misMasc();
  ventana(`<h2>Agendar cita</h2><form class="form" id="fCita">
    <label>¿Para quién?<select name="masc">${ms.map((m) => `<option value="${m.id}" ${m.id === mascSel ? 'selected' : ''}>${esc(m.n)}</option>`).join('')}</select></label>
    <label>Servicio<select name="serv">${db().serv.map((s) => `<option value="${s.id}" ${s.id === servId ? 'selected' : ''}>${esc(s.n)} · ${pesos(s.precio)}</option>`).join('')}</select></label>
    <label>Día<select name="fecha">${[...Array(14)].map((_, i) => dia(i)).filter((d) => new Date(d + 'T12:00').getDay() !== 0).map((d) => `<option value="${d}">${i18nDia(d)}</option>`).join('')}</select></label>
    <fieldset style="border:0;padding:0;margin:0"><legend style="font-weight:800;font-size:.9rem;margin-bottom:6px">Hora</legend><div class="horas" id="horas"></div></fieldset>
    <label>¿Algo que debamos saber?<textarea name="nota" rows="2" placeholder="Síntomas, si es su primera vez, etc."></textarea></label>
    <button class="b b-osc">Pedir cita</button><p class="nota">Te confirmamos por WhatsApp. Puedes cancelar desde «Mi mascota».</p></form>`);
  const f = $('#fCita');
  const pintarHoras = () => {
    const l = horasLibres(db(), f.fecha.value);
    $('#horas').innerHTML = l.map((h, i) => `<label><input type="radio" name="hora" value="${h}" ${i === 0 ? 'checked' : ''} required><span>${h}</span></label>`).join('') || '<p class="nota">Ya no hay horarios este día.</p>';
  };
  f.fecha.onchange = pintarHoras; pintarHoras();
  f.onsubmit = (e) => {
    e.preventDefault();
    if (!f.hora) return toast('Elige otro día', 'error');
    B.recargar();
    let c;
    try { c = nuevaCita(db(), { masc: f.masc.value, fecha: f.fecha.value, hora: f.hora.value, serv: f.serv.value, nota: f.nota.value.trim(), origen: 'portal' }); }
    catch (err) { toast(err.message, 'error'); return pintarHoras(); }
    if (!B.guardar()) return;
    const m = db().masc.find((x) => x.id === c.masc);
    mascSel = m.id;
    ventana(`<div class="listo"><span style="font-size:3rem">🐾</span><h2>¡Cita solicitada!</h2>
      <p><b>${esc(m.n)}</b> · ${esc(serv(c.serv).n)}<br>${i18nDia(c.fecha)} a las <b>${c.hora}</b></p>
      <p class="nota">La clínica la confirma en unos minutos. Verás el cambio en «Mi mascota».</p>
      <a class="b b-verde b-full" target="_blank" rel="noopener" href="${wa(db().conf.whatsapp, `Hola, agendé ${serv(c.serv).n} para ${m.n} el ${i18nDia(c.fecha)} a las ${c.hora}.`)}">Avisar por WhatsApp</a>
      <button class="b b-lin b-full" data-portal>Ir a Mi mascota</button></div>`);
  };
}
const i18nDia = (d) => (d === dia() ? 'Hoy, ' : d === dia(1) ? 'Mañana, ' : '') + fDia(d);

// ---------- Portal
function irPortal() {
  if (!yo()) return entrar();
  $('#sitio').hidden = true; $('#portal').hidden = false;
  if (!misMasc().some((m) => m.id === mascSel)) mascSel = misMasc()[0]?.id;
  portal(); scrollTo(0, 0);
}
function irSitio() { $('#sitio').hidden = false; $('#portal').hidden = true; }

function portal() {
  if ($('#portal').hidden || !yo()) return;
  const m = db().masc.find((x) => x.id === mascSel);
  const ms = misMasc();
  const pend = (x) => cartilla(db(), x.id).some((v) => v.estado !== 'ok') || hospDe(x.id) || citaHoy(x.id)?.estado === 'lista';
  $('#portal').innerHTML = `<div class="portal">
    <div class="p-cab"><div><h1>Hola, ${esc(yo().n.split(' ')[0])} 👋</h1><p>Aquí ves todo de tus mascotas, en vivo.</p></div>
      <div class="hero-a"><button class="b b-osc" data-agendar>+ Agendar cita</button><button class="b b-lin" id="salir">Salir</button></div></div>
    <div class="mis" role="group" aria-label="Mis mascotas">${ms.map((x) => `<button class="mi" data-masc="${x.id}" aria-pressed="${x.id === mascSel}"><img src="${foto(x.foto, 160)}" alt=""><span><b>${esc(x.n)}${pend(x) ? '<span class="punto" title="Tiene avisos"></span>' : ''}</b><small>${esc(x.raza)}</small></span></button>`).join('')}</div>
    ${m ? fichaMasc(m) : '<p class="vacio">Aún no hay mascotas registradas.</p>'}</div>`;
}

function fichaMasc(m) {
  const tabs = [['ahora', 'Ahora'], ['vacunas', 'Vacunas'], ['historial', 'Historial clínico'], ['citas', 'Citas'], ['cuenta', 'Cuenta']];
  const cont = { ahora, vacunas, historial, citas, cuenta }[tab](m);
  return `<div class="ficha"><aside class="perfil"><img src="${foto(m.foto, 600)}" alt="${esc(m.n)}"><div class="c"><h2>${esc(m.n)}</h2>
    <dl><dt>Especie</dt><dd>${esc(m.esp)} · ${esc(m.raza)}</dd><dt>Edad</dt><dd>${edad(m.nac)}</dd>${m.peso ? `<dt>Peso</dt><dd>${m.peso} kg</dd>` : ''}${m.sexo ? `<dt>Sexo</dt><dd>${esc(m.sexo)}${m.ester ? ' · esterilizado' : ''}</dd>` : ''}</dl>
    ${m.alergias ? `<p class="alerg">⚠ Alergia: ${esc(m.alergias)}</p>` : ''}</div></aside>
    <section><div class="tabs" role="tablist">${tabs.map(([k, t]) => `<button role="tab" data-tab="${k}" aria-selected="${tab === k}">${t}</button>`).join('')}</div>${cont}</section></div>`;
}

function ahora(m) {
  const h = hospDe(m.id);
  const c = citaHoy(m.id);
  const prox = citasDe(m.id).filter((x) => x.fecha >= dia() && ['pendiente', 'confirmada'].includes(x.estado)).sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora))[0];
  const vacs = cartilla(db(), m.id).filter((v) => v.estado !== 'ok');
  let html = '';
  if (h) {
    const n = h.notas.at(-1);
    html += `<div class="estado-hero ${h.estado === 'delicado' ? 'alerta' : ''}"><span class="tag info">Hospitalizado · jaula ${esc(h.jaula)}</span>
      <h3 style="margin-top:8px">${esc(m.n)} está</h3><div class="grande" style="color:${h.estado === 'delicado' ? 'var(--rojo)' : 'var(--verde)'}">${HOSP_TXT[h.estado]}</div>
      <p class="nota">Motivo: ${esc(h.motivo)} · ingresó ${fechaHora(h.ingreso)}</p>
      <h3 style="font-size:1.1rem;margin-top:14px">Noticias del equipo</h3><ul class="linea">${[...h.notas].reverse().map((x) => `<li><b>${esc(x.txt)}</b><small>${fechaHora(x.f)} · ${HOSP_TXT[x.estado]}</small></li>`).join('')}</ul>
      <p class="nota">Última actualización ${fechaHora(n.f)}. Esta pantalla se actualiza sola.</p></div>`;
  }
  if (c) {
    html += c.estado === 'lista' ? `<div class="estado-hero listo"><h3>✨ ¡${esc(m.n)} está ${c.serv === 'estetica' ? 'listo' : 'lista'} para recoger!</h3><p>${esc(serv(c.serv).n)} terminado. Te esperamos en la clínica.</p>
      <a class="b b-osc" target="_blank" rel="noopener" href="${wa(db().conf.whatsapp, `Hola, voy en camino por ${m.n}.`)}">Avisar que voy en camino</a></div>`
      : `<div class="estado-hero"><h3>🩺 ${esc(m.n)} está en atención</h3><p>${esc(serv(c.serv).n)} · empezó a las ${c.hora}. Te avisamos al terminar.</p></div>`;
  }
  html += `<div class="caja"><h3>Próxima cita</h3>${prox ? `<div class="fila"><span><b>${esc(serv(prox.serv).n)}</b><br>${i18nDia(prox.fecha)} · ${prox.hora}</span><span class="tag ${prox.estado === 'confirmada' ? 'ok' : 'pronto'}">${CITA_TXT[prox.estado]}</span></div>` : `<p class="nota">No tiene citas próximas.</p><button class="b b-miel" data-agendar style="margin-top:10px">Agendar</button>`}</div>`;
  html += `<div class="caja"><h3>Pendientes de salud</h3>${vacs.length ? `<div class="vacs">${vacs.map(vacHtml).join('')}</div><button class="b b-osc" data-agendar="vacuna" style="margin-top:12px">Agendar vacuna</button>` : '<p class="nota">✓ Todo al día. Te avisaremos antes del próximo refuerzo.</p>'}</div>`;
  return html;
}

const vacHtml = (v) => `<div class="vac"><span class="sem ${v.estado}"></span><div><b>${esc(VACUNAS[v.vac].n)}</b><small>Última: ${fAno(v.f)} · Siguiente: ${fAno(v.prox)}</small></div>
  <span class="tag ${v.estado}">${v.estado === 'vencida' ? `Vencida hace ${-v.faltan} días` : v.estado === 'pronto' ? `En ${v.faltan} días` : 'Al día'}</span></div>`;

function vacunas(m) {
  const c = cartilla(db(), m.id);
  const todas = db().vacunas.filter((v) => v.masc === m.id).sort((a, b) => b.f.localeCompare(a.f));
  return `<div class="caja"><h3>Cartilla de ${esc(m.n)}</h3>${c.length ? `<div class="vacs">${c.map(vacHtml).join('')}</div>` : '<p class="nota">Aún no hay vacunas registradas.</p>'}</div>
    <div class="caja"><h3>Aplicaciones</h3>${todas.map((v) => `<div class="fila"><span>${esc(VACUNAS[v.vac].n)}<br><small class="nota">Lote ${esc(v.lote)} · ${esc(v.vet)}</small></span><span>${fAno(v.f)}</span></div>`).join('') || '<p class="nota">Sin registros.</p>'}</div>`;
}

function historial(m) {
  const cs = db().consultas.filter((c) => c.masc === m.id).sort((a, b) => b.f.localeCompare(a.f));
  const pesos_ = [...cs].reverse().filter((c) => c.peso).slice(-6);
  const max = Math.max(1, ...pesos_.map((c) => c.peso));
  return `${pesos_.length > 1 ? `<div class="caja"><h3>Peso</h3><div class="peso">${pesos_.map((c) => `<div><b>${c.peso}</b><i style="height:${(c.peso / max) * 80}%"></i>${fecha(c.f)}</div>`).join('')}</div></div>` : ''}
    <div class="caja"><h3>Consultas</h3>${cs.map((c) => `<div class="consulta"><b>${esc(c.motivo)}</b><br><small class="nota">${fechaHora(c.f)} · ${esc(c.vet)}${c.peso ? ` · ${c.peso} kg` : ''}${c.temp ? ` · ${c.temp} °C` : ''}</small>
      <p><b>Diagnóstico:</b> ${esc(c.diag)}</p><p><b>Tratamiento:</b> ${esc(c.trat)}</p>${c.receta ? `<p><b>Receta:</b> ${esc(c.receta)}</p>` : ''}</div>`).join('') || '<p class="nota">Aún no hay consultas.</p>'}</div>`;
}

function citas(m) {
  const l = citasDe(m.id).sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora));
  const futuras = l.filter((c) => c.fecha >= dia() && !['completada', 'cancelada'].includes(c.estado));
  const pasadas = l.filter((c) => !futuras.includes(c));
  const fila = (c, cancel) => `<div class="fila"><span><b>${esc(serv(c.serv).n)}</b><br><small class="nota">${i18nDia(c.fecha)} · ${c.hora}</small></span>
    <span style="text-align:right"><span class="tag ${c.estado === 'cancelada' ? 'vencida' : c.estado === 'pendiente' ? 'pronto' : 'ok'}">${CITA_TXT[c.estado]}</span>${cancel && ['pendiente', 'confirmada'].includes(c.estado) ? `<br><button class="lnk" data-cancelar="${c.id}" style="font-size:.85rem;text-decoration:underline;margin-top:4px">Cancelar</button>` : ''}</span></div>`;
  return `<div class="caja"><h3>Próximas</h3>${futuras.map((c) => fila(c, true)).join('') || '<p class="nota">Sin citas próximas.</p>'}<button class="b b-miel" data-agendar style="margin-top:12px">+ Agendar</button></div>
    <div class="caja"><h3>Anteriores</h3>${pasadas.map((c) => fila(c)).join('') || '<p class="nota">Sin historial.</p>'}</div>`;
}

function cuenta(m) {
  const cs = db().cuentas.filter((c) => c.masc === m.id).sort((a, b) => b.f.localeCompare(a.f));
  const deb = cs.reduce((s, c) => s + saldo(c), 0);
  return `<div class="estado-hero ${deb > 0 ? 'listo' : ''}"><h3>${deb > 0 ? `Saldo pendiente: ${pesos(deb)}` : '✓ Sin saldo pendiente'}</h3>${deb > 0 ? '<p class="nota">Puedes pagar en la clínica o por transferencia.</p>' : ''}</div>
    ${cs.map((c) => `<div class="caja"><div class="fila" style="border:0"><b>${fecha(c.f)}${c.abierta ? ' · <span class="tag pronto">Abierta</span>' : ''}</b><b>${pesos(totalCuenta(c))}</b></div>
      ${c.conceptos.map((x) => `<div class="fila"><span>${esc(x.n)}</span><span>${pesos(x.monto)}</span></div>`).join('')}
      <div class="fila"><span>Pagado</span><b>${pesos(c.pagado)}</b></div></div>`).join('') || '<p class="vacio">Sin movimientos.</p>'}`;
}

// ---------- Eventos
document.addEventListener('click', (e) => {
  const t = e.target;
  if (t.closest('[data-cerrar]') || t === dlg) return dlg.close();
  const ag = t.closest('[data-agendar]'); if (ag) return agendar(ag.dataset.agendar);
  if (t.closest('[data-portal]')) { dlg.close(); return irPortal(); }
  const ir = t.closest('[data-ir="sitio"]'); if (ir) { irSitio(); return; }
  if (t.id === 'salir') { sesion = null; local.set('vet:sesion', null); irSitio(); return; }
  const mm = t.closest('[data-masc]'); if (mm) { mascSel = mm.dataset.masc; tab = 'ahora'; return portal(); }
  const tb = t.closest('[data-tab]'); if (tb) { tab = tb.dataset.tab; return portal(); }
  const cn = t.closest('[data-cancelar]');
  if (cn && confirm('¿Cancelar esta cita?')) {
    B.recargar();
    const c = db().citas.find((x) => x.id === cn.dataset.cancelar);
    c.estado = 'cancelada'; c.hist.push({ e: 'cancelada', f: new Date().toISOString(), por: 'cliente' });
    B.guardar(); toast('Cita cancelada. La clínica ya lo sabe.'); portal();
  }
});
B.alCambiar(() => { sitio(); portal(); });
sitio();
if (location.hash === '#portal' && yo()) irPortal();
