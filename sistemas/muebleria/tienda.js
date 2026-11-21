// Tienda en línea de la mueblería: lo que ve el cliente final.
import { $, $$, esc, pesos, fechaHora, foto, wa, toast, local } from '../_base/sis.js';
import { abrir, armarPedido, precioFinal, totales, ESTADOS, ESTADO_TXT, PAGOS } from './datos.js';

const B = abrir();
const db = () => B.db;
let filtroCat = '';
let carrito = local.get('muebleria:carrito', []);
let favs = local.get('muebleria:favs', []);
const guardarCar = () => { local.set('muebleria:carrito', carrito); contadores(); };
const visibles = () => db().prods.filter((p) => p.pub);
const prod = (id) => db().prods.find((p) => p.id === id);
const catN = (id) => db().cats.find((c) => c.id === id)?.n ?? '';

function etiqueta(p) {
  if (p.stock <= 0) return '<span class="tag ago">Agotado</span>';
  if (p.oferta > 0 && p.oferta < p.precio) return `<span class="tag">-${Math.round((1 - p.oferta / p.precio) * 100)}%</span>`;
  if (p.stock <= 2) return `<span class="tag ult">Últimas ${p.stock}</span>`;
  return '';
}
const precioHtml = (p) => `<div class="precio"><b>${pesos(precioFinal(p))}</b>${precioFinal(p) < p.precio ? `<s>${pesos(p.precio)}</s>` : ''}</div>`;
const corazon = (p) => `<button class="corazon" data-fav="${p.id}" aria-pressed="${favs.includes(p.id)}" aria-label="Guardar ${esc(p.n)} en favoritos"><svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg></button>`;

function pintarCats() {
  $('#cats').innerHTML = db().cats.map((c) => {
    const n = visibles().filter((p) => p.cat === c.id).length;
    return `<button class="cat" data-cat="${c.id}"><img src="${foto(c.foto, 400)}" alt="" loading="lazy">${esc(c.n)}<small>${n} piezas</small></button>`;
  }).join('');
  $('#chips').innerHTML = [['', 'Todo'], ...db().cats.map((c) => [c.id, c.n])]
    .map(([id, n]) => `<button data-chip="${id}" aria-pressed="${filtroCat === id}">${esc(n)}</button>`).join('');
}

function pintarGrid() {
  const q = $('#busca').value.trim().toLowerCase();
  const orden = $('#orden').value;
  let l = visibles().filter((p) => (!filtroCat || p.cat === filtroCat) && (!q || (p.n + ' ' + p.material + ' ' + catN(p.cat)).toLowerCase().includes(q)));
  if (orden === 'asc') l.sort((a, b) => precioFinal(a) - precioFinal(b));
  else if (orden === 'desc') l.sort((a, b) => precioFinal(b) - precioFinal(a));
  else if (orden === 'nuevo') l.sort((a, b) => b.creado.localeCompare(a.creado));
  else l.sort((a, b) => (b.dest - a.dest) || (b.stock > 0) - (a.stock > 0));
  $('#grid').innerHTML = l.map((p) => `
    <article class="prod">
      <button class="fot" data-ver="${p.id}" aria-label="Ver ${esc(p.n)}"><img src="${foto(p.foto, 600)}" alt="${esc(p.n)}" loading="lazy">${etiqueta(p)}</button>
      ${corazon(p)}
      <div class="inf"><span class="cat-n">${esc(catN(p.cat))}</span><h3 data-ver="${p.id}">${esc(p.n)}</h3><small>${esc(p.medidas)}</small>${precioHtml(p)}
        <button class="b b-osc agregar" data-agregar="${p.id}" ${p.stock <= 0 ? 'disabled' : ''}>${p.stock <= 0 ? 'Agotado' : 'Agregar al carrito'}</button></div>
    </article>`).join('') || '<p class="vacio">No encontramos piezas con esa búsqueda.</p>';
}

function pintarPromo() {
  const pr = db().conf.promo;
  const c = db().cats.find((x) => x.id === pr.cat);
  $('#promo').hidden = !pr.activa;
  $('#promo').innerHTML = `<div class="promo"><div class="t"><p class="eti">Oferta de temporada</p><h2>${esc(pr.titulo)}</h2><p>${esc(pr.texto)}</p>
    <button class="b b-osc" data-chip="${c ? c.id : ''}" data-ir="catalogo">Ver ${esc(c ? c.n.toLowerCase() : 'catálogo')} →</button></div>
    <img src="${foto(c?.foto || 'photo-1713810958247-01dbd76b4a61', 900)}" alt="" loading="lazy"></div>`;
}

function textos() {
  const c = db().conf;
  $('#txtEnvio').textContent = `Gratis desde ${pesos(c.envioGratis)}`;
  $('#txtAnticipo').textContent = `Con el ${c.anticipo}% y paga al recibir`;
  $('#waPie').href = wa(c.whatsapp, `Hola ${c.nombre}, tengo una duda sobre un mueble.`);
  document.title = `${c.nombre} · ${c.lema}`;
}

function contadores() {
  const n = carrito.reduce((s, x) => s + x.cant, 0);
  $('#nCar').hidden = !n; $('#nCar').textContent = n;
  $('#nFav').hidden = !favs.length; $('#nFav').textContent = favs.length;
}

function todo() { textos(); pintarCats(); pintarGrid(); pintarPromo(); contadores(); }

// --- Ficha de producto
function verProducto(id) {
  const p = prod(id); if (!p) return;
  let cant = 1;
  const stockTxt = p.stock <= 0 ? '<span class="stock no">Agotado · pregúntanos por la próxima llegada</span>'
    : p.stock <= 2 ? `<span class="stock poco">¡Solo quedan ${p.stock}!</span>` : '<span class="stock ok">● Disponible para entrega</span>';
  $('#dlgProd').innerHTML = `<button class="x" data-cerrar aria-label="Cerrar">×</button><div class="ficha">
    <img src="${foto(p.foto, 1000)}" alt="${esc(p.n)}">
    <div class="d"><span class="eti">${esc(catN(p.cat))}</span><h2>${esc(p.n)}</h2>${precioHtml(p)}${stockTxt}
      <p>${esc(p.desc)}</p>
      <dl><dt>Medidas</dt><dd>${esc(p.medidas)}</dd><dt>Material</dt><dd>${esc(p.material)}</dd><dt>Color</dt><dd>${esc((p.colores || []).join(', '))}</dd><dt>Garantía</dt><dd>1 año</dd></dl>
      ${p.stock > 0 ? `<div class="fila"><div class="cant"><button data-c="-1" aria-label="Menos">−</button><span id="cantN">1</span><button data-c="1" aria-label="Más">+</button></div>
        <button class="b b-osc" id="agrFicha">Agregar al carrito</button></div>` : ''}
      <a class="b b-lin" target="_blank" rel="noopener" href="${wa(db().conf.whatsapp, `Hola, me interesa «${p.n}» (${pesos(precioFinal(p))}). ¿Me dan más información?`)}">Preguntar por WhatsApp</a>
      <p class="nota">Aparta con el ${db().conf.anticipo}% y liquida al recibir.</p></div></div>`;
  $('#dlgProd').onclick = (e) => {
    const c = e.target.closest('[data-c]');
    if (c) { cant = Math.max(1, Math.min(p.stock, cant + Number(c.dataset.c))); $('#cantN').textContent = cant; }
    if (e.target.id === 'agrFicha') { agregar(p.id, cant); $('#dlgProd').close(); }
  };
  $('#dlgProd').showModal();
}

function agregar(id, cant = 1) {
  const p = prod(id);
  const ya = carrito.find((x) => x.id === id);
  const total = (ya?.cant || 0) + cant;
  if (total > p.stock) return toast(`Solo hay ${p.stock} disponibles de ${p.n}`, 'error');
  ya ? (ya.cant = total) : carrito.push({ id, cant });
  guardarCar();
  toast(`${p.n} agregado al carrito`);
}

// --- Carrito → datos → confirmación
function itemsCarrito() {
  carrito = carrito.filter((x) => prod(x.id)?.pub);
  return carrito.map((x) => ({ ...x, p: prod(x.id), precio: precioFinal(prod(x.id)) }));
}

function verCarrito() {
  const items = itemsCarrito();
  const t = totales(db(), items);
  const c = db().conf;
  const falta = c.envioGratis - t.sub;
  $('#dlgCar').innerHTML = `<div class="lat"><button class="x" data-cerrar aria-label="Cerrar">×</button>
    <div class="lat-h"><h2>Tu carrito</h2></div>
    <div class="lat-b">${items.length ? items.map((it) => `<div class="item"><img src="${foto(it.p.foto, 200)}" alt="">
      <div><b>${esc(it.p.n)}</b><small>${pesos(it.precio)} c/u</small><br>
      <div class="cant"><button data-mas="${it.id}" data-d="-1" aria-label="Menos">−</button><span>${it.cant}</span><button data-mas="${it.id}" data-d="1" aria-label="Más">+</button></div></div>
      <div><b>${pesos(it.precio * it.cant)}</b><button class="quitar" data-quitar="${it.id}">Quitar</button></div></div>`).join('') : '<p class="vacio">Tu carrito está vacío.</p>'}</div>
    ${items.length ? `<div class="lat-p">
      ${falta > 0 ? `<p class="nota">Te faltan <b>${pesos(falta)}</b> para envío gratis.</p>` : '<p class="nota">✓ Tienes envío gratis.</p>'}
      <div class="suma"><span>Subtotal</span><b>${pesos(t.sub)}</b></div>
      <div class="suma"><span>Envío</span><b>${t.envio ? pesos(t.envio) : 'Gratis'}</b></div>
      <div class="suma total"><span>Total</span><span>${pesos(t.total)}</span></div>
      <button class="b b-osc b-full" id="aPagar">Continuar</button></div>` : ''}</div>`;
  $('#dlgCar').onclick = (e) => {
    const m = e.target.closest('[data-mas]');
    if (m) {
      const it = carrito.find((x) => x.id === m.dataset.mas);
      const nuevo = it.cant + Number(m.dataset.d);
      if (nuevo > prod(it.id).stock) toast('Ya no hay más piezas disponibles', 'error');
      else if (nuevo <= 0) carrito = carrito.filter((x) => x !== it);
      else it.cant = nuevo;
      guardarCar(); verCarrito();
    }
    const q = e.target.closest('[data-quitar]');
    if (q) { carrito = carrito.filter((x) => x.id !== q.dataset.quitar); guardarCar(); verCarrito(); }
    if (e.target.id === 'aPagar') datosCliente();
  };
  if (!$('#dlgCar').open) $('#dlgCar').showModal();
}

function datosCliente() {
  const c = db().conf;
  const yo = local.get('muebleria:cliente', {});
  $('#dlgCar').innerHTML = `<form class="lat" id="fPago"><button type="button" class="x" data-cerrar aria-label="Cerrar">×</button>
    <div class="lat-h"><h2>Tus datos</h2><p class="nota">Te confirmamos por WhatsApp antes de cobrar.</p></div>
    <div class="lat-b form">
      <label>Nombre completo<input name="n" required autocomplete="name" value="${esc(yo.n || '')}"></label>
      <label>WhatsApp (10 dígitos)<input name="tel" required inputmode="tel" pattern="[0-9 ]{10,14}" autocomplete="tel" value="${esc(yo.tel || '')}"></label>
      <fieldset class="opciones" style="border:0;padding:0;margin:0"><legend class="nota" style="margin-bottom:6px">Entrega</legend>
        <label><input type="radio" name="entrega" value="domicilio" checked><span>A domicilio<small>Llevamos y acomodamos el mueble</small></span></label>
        <label><input type="radio" name="entrega" value="tienda"><span>Recojo en showroom<small>Sin costo de envío</small></span></label></fieldset>
      <label id="lDir">Dirección de entrega<textarea name="dir" rows="2" autocomplete="street-address">${esc(yo.dir || '')}</textarea></label>
      <fieldset class="opciones" style="border:0;padding:0;margin:0"><legend class="nota" style="margin-bottom:6px">Forma de pago</legend>
        ${Object.entries(PAGOS).map(([k, v], i) => `<label><input type="radio" name="pago" value="${k}" ${i === 0 ? 'checked' : ''}><span>${v}${k === 'apartado' ? `<small>Pagas ${c.anticipo}% hoy y el resto al recibir</small>` : ''}</span></label>`).join('')}</fieldset>
      <label>Notas (opcional)<textarea name="notas" rows="2" placeholder="Piso, horario, si hay elevador…"></textarea></label>
    </div>
    <div class="lat-p"><button class="b b-osc b-full">Hacer pedido</button><button type="button" class="b b-lin b-full" id="regresar">Regresar al carrito</button></div></form>`;
  const f = $('#fPago');
  const dir = () => { const dom = f.entrega.value === 'domicilio'; $('#lDir').hidden = !dom; f.dir.required = dom; };
  f.addEventListener('change', dir); dir();
  $('#regresar').onclick = verCarrito;
  f.onsubmit = (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(f));
    d.tel = d.tel.replace(/\D/g, '');
    B.recargar(); // por si el dueño cambió precios o stock en otra pestaña
    let p;
    try { p = armarPedido(db(), { n: d.n.trim(), tel: d.tel, dir: d.entrega === 'tienda' ? '' : d.dir.trim(), entrega: d.entrega, pago: d.pago, notas: d.notas.trim() }, carrito); }
    catch (err) { toast(err.message, 'error'); return verCarrito(); }
    db().pedidos.unshift(p);
    if (!B.guardar()) return;
    local.set('muebleria:cliente', { n: d.n, tel: d.tel, dir: d.dir });
    local.set('muebleria:ultimo', p.folio);
    carrito = []; guardarCar(); todo();
    confirmacion(p);
  };
}

function confirmacion(p) {
  const c = db().conf;
  const anticipo = Math.round(p.total * c.anticipo / 100);
  const msg = `Hola ${c.nombre}, acabo de hacer el pedido ${p.folio}:\n${p.items.map((i) => `• ${i.cant} × ${i.n}`).join('\n')}\nTotal: ${pesos(p.total)}\nPago: ${PAGOS[p.cliente.pago]}\nA nombre de ${p.cliente.n}.`;
  $('#dlgCar').innerHTML = `<div class="lat"><button class="x" data-cerrar aria-label="Cerrar">×</button><div class="lat-b listo">
    <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="var(--ol)" stroke-width="1.6"><circle cx="12" cy="12" r="10"/><path d="m7 12 3 3 7-7"/></svg>
    <h2>¡Pedido recibido!</h2><p>Tu número de pedido es</p><div class="folio">${p.folio}</div>
    <p>Total <b>${pesos(p.total)}</b>${p.cliente.pago === 'apartado' ? ` · anticipo de <b>${pesos(anticipo)}</b>` : ''}</p>
    <p class="nota">Guárdalo: con él ves en qué va tu pedido sin tener que llamar.</p>
    <a class="b b-ol b-full" target="_blank" rel="noopener" href="${wa(c.whatsapp, msg)}">Enviar confirmación por WhatsApp</a>
    <button class="b b-lin b-full" data-rastrear="${p.folio}">Ver estado de mi pedido</button>
    <p class="nota">En el demo el mensaje llega a NarIT; en tu sistema llega al WhatsApp de tu tienda.</p></div></div>`;
}

// --- Rastreo de pedido por folio + teléfono
function verRastreo(folio = local.get('muebleria:ultimo', ''), tel = local.get('muebleria:cliente', {}).tel || '') {
  $('#dlgRas').innerHTML = `<button class="x" data-cerrar aria-label="Cerrar">×</button><div class="ras"><h2>¿En qué va mi pedido?</h2>
    <p class="nota">Escribe tu folio y tu WhatsApp. Sin llamadas, sin esperar.</p>
    <form class="form" id="fRas" style="margin-top:14px"><label>Folio<input name="folio" required placeholder="CO-1001" value="${esc(folio)}"></label>
    <label>WhatsApp<input name="tel" required inputmode="tel" value="${esc(tel)}"></label><button class="b b-osc">Buscar</button></form><div id="rasRes"></div></div>`;
  const buscar = () => {
    const f = $('#fRas');
    const fo = f.folio.value.trim().toUpperCase(), t = f.tel.value.replace(/\D/g, '');
    const p = db().pedidos.find((x) => x.folio === fo && x.cliente.tel === t);
    if (!p) { $('#rasRes').innerHTML = '<p class="nota" style="margin-top:14px">No encontramos un pedido con esos datos. Revisa el folio y el número.</p>'; return; }
    const idx = ESTADOS.indexOf(p.estado);
    const cuando = (e) => p.hist.find((h) => h.e === e)?.f;
    const saldo = p.total - p.pagado;
    $('#rasRes').innerHTML = p.estado === 'cancelado' ? `<p style="margin-top:16px"><b>${p.folio}</b> fue cancelado. Si es un error, escríbenos.</p>` : `
      <ol class="linea">${ESTADOS.map((e, i) => `<li class="${i <= idx ? 'hecho' : ''} ${i === idx ? 'actual' : ''}"><span></span><div><b>${ESTADO_TXT[e]}</b>${cuando(e) ? `<small>${fechaHora(cuando(e))}</small>` : ''}</div></li>`).join('')}</ol>
      <div class="suma"><span>${p.items.map((i) => `${i.cant} × ${esc(i.n)}`).join(', ')}</span></div>
      <div class="suma" style="margin-top:8px"><span>Total</span><b>${pesos(p.total)}</b></div>
      <div class="suma"><span>Pagado</span><b>${pesos(p.pagado)}</b></div>
      ${saldo > 0 ? `<div class="suma"><span>Por pagar</span><b style="color:var(--te)">${pesos(saldo)}</b></div>` : '<p class="nota">✓ Pagado por completo</p>'}`;
  };
  $('#fRas').onsubmit = (e) => { e.preventDefault(); buscar(); };
  if (folio && tel) buscar();
  if (!$('#dlgRas').open) $('#dlgRas').showModal();
  // Si el dueño cambia el estado en el panel, se ve aquí al momento.
  verRastreo.refrescar = () => $('#dlgRas').open && $('#fRas') && buscar();
}

function verFavs() {
  const l = favs.map(prod).filter((p) => p?.pub);
  $('#dlgFav').innerHTML = `<div class="lat"><button class="x" data-cerrar aria-label="Cerrar">×</button><div class="lat-h"><h2>Favoritos</h2></div>
    <div class="lat-b">${l.length ? l.map((p) => `<div class="item"><img src="${foto(p.foto, 200)}" alt=""><div><b>${esc(p.n)}</b><small>${pesos(precioFinal(p))}</small></div>
      <button class="b b-osc" data-agregar="${p.id}" ${p.stock <= 0 ? 'disabled' : ''} style="padding:8px 14px">${p.stock <= 0 ? 'Agotado' : 'Agregar'}</button></div>`).join('') : '<p class="vacio">Toca el corazón de un mueble para guardarlo aquí.</p>'}</div></div>`;
  if (!$('#dlgFav').open) $('#dlgFav').showModal();
}

// --- Eventos
document.addEventListener('click', (e) => {
  const t = e.target;
  if (t.closest('[data-cerrar]')) return t.closest('dialog').close();
  if (t.tagName === 'DIALOG') return t.close(); // clic fuera de la ventana
  const ver = t.closest('[data-ver]'); if (ver) return verProducto(ver.dataset.ver);
  const ag = t.closest('[data-agregar]'); if (ag) return agregar(ag.dataset.agregar);
  const fv = t.closest('[data-fav]');
  if (fv) {
    const id = fv.dataset.fav;
    favs = favs.includes(id) ? favs.filter((x) => x !== id) : [...favs, id];
    local.set('muebleria:favs', favs); contadores();
    $$(`[data-fav="${id}"]`).forEach((b) => b.setAttribute('aria-pressed', favs.includes(id)));
    return;
  }
  const ch = t.closest('[data-chip],[data-cat]');
  if (ch) { filtroCat = ch.dataset.chip ?? ch.dataset.cat; pintarCats(); pintarGrid(); if (ch.dataset.cat !== undefined || ch.dataset.ir) $('#catalogo').scrollIntoView(); return; }
  const ab = t.closest('[data-abrir]');
  if (ab) { e.preventDefault(); ({ carrito: verCarrito, fav: verFavs, rastreo: () => verRastreo() })[ab.dataset.abrir](); return; }
  const ras = t.closest('[data-rastrear]'); if (ras) { $('#dlgCar').close(); verRastreo(ras.dataset.rastrear); }
});
$('#busca').addEventListener('input', pintarGrid);
$('#orden').addEventListener('change', pintarGrid);
B.alCambiar(() => { todo(); verRastreo.refrescar?.(); });
todo();
