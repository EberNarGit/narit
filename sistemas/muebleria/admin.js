// Panel del dueño de la mueblería: pedidos, productos con foto, inventario, precios, clientes y ajustes.
import { $, $$, esc, pesos, fecha, fechaHora, foto, wa, toast, comprimir, puerta, barras, uid } from '../_base/sis.js';
import { abrir, cancelar, precioFinal, ESTADOS, ESTADO_TXT, ESTADO_BADGE, PAGOS } from './datos.js';

const B = abrir();
const db = () => B.db;
const dlg = $('#dlg');
const prod = (id) => db().prods.find((p) => p.id === id);
const catN = (id) => db().cats.find((c) => c.id === id)?.n ?? '—';
const activos = () => db().pedidos.filter((p) => p.estado !== 'cancelado');
const pendientes = () => db().pedidos.filter((p) => !['entregado', 'cancelado'].includes(p.estado));
const margen = (p) => (precioFinal(p) ? Math.round((1 - p.costo / precioFinal(p)) * 100) : 0);
const stockBadge = (p) => p.stock <= 0 ? '<span class="badge b-bad">Agotado</span>' : p.stock <= p.min ? `<span class="badge b-warn">Bajo · ${p.stock}</span>` : `<span class="badge b-ok">${p.stock}</span>`;
const estadoBadge = (e) => `<span class="badge ${ESTADO_BADGE[e]}">${ESTADO_TXT[e]}</span>`;
const guardar = (msg) => { if (B.guardar()) { if (msg) toast(msg); pintar(); return true; } return false; };
const linkTienda = () => new URL('index.html', location.href).href;
const ventana = (html) => { dlg.innerHTML = html; if (!dlg.open) dlg.showModal(); };
const cab = (t, sub, acc = '') => `<div class="top"><div><h1>${t}</h1>${sub ? `<p>${sub}</p>` : ''}</div><div class="acc">${acc}</div></div>`;
const dlgH = (t) => `<div class="dlg-h"><h2>${t}</h2><button class="x" type="button" data-cerrar aria-label="Cerrar">×</button></div>`;

// ---------- Inicio
function inicio() {
  const hoy = new Date();
  const delMes = activos().filter((p) => { const d = new Date(p.f); return d.getMonth() === hoy.getMonth() && d.getFullYear() === hoy.getFullYear(); });
  const porCobrar = activos().reduce((s, p) => s + p.total - p.pagado, 0);
  const valorCosto = db().prods.reduce((s, p) => s + p.costo * Math.max(p.stock, 0), 0);
  const valorVenta = db().prods.reduce((s, p) => s + precioFinal(p) * Math.max(p.stock, 0), 0);
  const dias = [...Array(14)].map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - 13 + i);
    const k = d.toDateString();
    return { k: d.getDate() + '', v: activos().filter((p) => new Date(p.f).toDateString() === k).reduce((s, p) => s + p.total, 0) };
  });
  const vendidos = {};
  activos().forEach((p) => p.items.forEach((i) => { vendidos[i.id] = (vendidos[i.id] || 0) + i.cant; }));
  const top = Object.entries(vendidos).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const bajos = db().prods.filter((p) => p.stock <= p.min);
  const nuevos = db().pedidos.filter((p) => p.estado === 'nuevo');
  return cab(`Buen día 👋`, `Así va ${esc(db().conf.nombre)} hoy, ${hoy.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}.`,
    `<a class="btn sec" href="index.html" target="_blank" rel="noopener">Ver mi tienda ↗</a><button class="btn" data-nuevo-prod>+ Subir producto</button>`) + `
  <div class="kpis">
    <div class="kpi"><span>Ventas del mes</span><b>${pesos(delMes.reduce((s, p) => s + p.total, 0))}</b><small>${delMes.length} pedidos</small></div>
    <div class="kpi ${pendientes().length ? 'alerta' : ''}"><span>Pedidos por atender</span><b>${pendientes().length}</b><small>${nuevos.length} nuevos sin confirmar</small></div>
    <div class="kpi"><span>Por cobrar (apartados y saldos)</span><b>${pesos(porCobrar)}</b><small>en ${activos().filter((p) => p.total > p.pagado).length} pedidos</small></div>
    <div class="kpi"><span>Dinero en inventario</span><b>${pesos(valorCosto)}</b><small>se vende en ${pesos(valorVenta)}</small></div>
  </div>
  <div class="grid2">
    <section class="panel"><h2>Ventas de los últimos 14 días</h2>${barras(dias)}</section>
    <section class="panel"><h2>Atiende hoy <a href="#pedidos">Ver pedidos →</a></h2><ul class="lista-mini">
      ${nuevos.map((p) => `<li class="click" data-pedido="${p.folio}" style="cursor:pointer"><span class="badge b-info">Nuevo</span><div><b>${p.folio}</b> · ${esc(p.cliente.n)}<br><small>${p.items.length} artículo(s) · ${PAGOS[p.cliente.pago]}</small></div><div class="der"><b>${pesos(p.total)}</b></div></li>`).join('')}
      ${bajos.map((p) => `<li><img class="thumb" src="${foto(p.foto, 120)}" alt=""><div><b>${esc(p.n)}</b><br><small>Quedan ${p.stock}, mínimo ${p.min}</small></div><div class="der"><button class="btn mini sec" data-mov="${p.id}">Resurtir</button></div></li>`).join('')}
      ${!nuevos.length && !bajos.length ? '<li class="vacio">Todo en orden ✓</li>' : ''}</ul></section>
  </div>
  <div class="grid2">
    <section class="panel"><h2>Lo más vendido</h2><ul class="lista-mini">${top.map(([id, n]) => { const p = prod(id); return p ? `<li><img class="thumb" src="${foto(p.foto, 120)}" alt=""><div><b>${esc(p.n)}</b><br><small>Margen ${margen(p)}%</small></div><div class="der"><b>${n}</b> vendidos</div></li>` : ''; }).join('')}</ul></section>
    <section class="panel"><h2>Últimos movimientos de inventario <a href="#inventario">Ver todo →</a></h2><ul class="lista-mini">${db().movs.slice(0, 6).map(movLi).join('')}</ul></section>
  </div>`;
}
const movLi = (m) => `<li><div><b>${esc(prod(m.prod)?.n ?? 'Producto borrado')}</b><br><small>${esc(m.tipo)} · ${esc(m.nota)}</small></div><div class="der"><b style="color:${m.cant > 0 ? 'var(--ok)' : 'var(--bad)'}">${m.cant > 0 ? '+' : ''}${m.cant}</b><br><small>${fecha(m.f)}</small></div></li>`;

// ---------- Pedidos
let filtroPed = 'activos';
function pedidos() {
  const grupos = { activos: ['Por atender', pendientes()], ...Object.fromEntries([...ESTADOS, 'cancelado'].map((e) => [e, [ESTADO_TXT[e], db().pedidos.filter((p) => p.estado === e)]])), todos: ['Todos', db().pedidos] };
  const l = grupos[filtroPed][1];
  return cab('Pedidos', 'Cada pedido de la tienda llega aquí. Cambia el estado y el cliente lo ve al instante con su folio.') + `
  <div class="chips">${Object.entries(grupos).map(([k, [t, arr]]) => `<button data-fped="${k}" aria-pressed="${filtroPed === k}">${t} · ${arr.length}</button>`).join('')}</div>
  <section class="panel tabla"><table class="t"><thead><tr><th>Folio</th><th>Fecha</th><th>Cliente</th><th class="ocultar-m">Artículos</th><th class="num">Total</th><th class="num">Saldo</th><th>Estado</th></tr></thead><tbody>
  ${l.map((p) => `<tr class="click" data-pedido="${p.folio}"><td><b>${p.folio}</b></td><td>${fecha(p.f)}</td><td>${esc(p.cliente.n)}<br><small>${p.cliente.entrega === 'tienda' ? 'Recoge en tienda' : 'A domicilio'}</small></td>
    <td class="ocultar-m">${p.items.map((i) => `${i.cant} × ${esc(i.n)}`).join('<br>')}</td><td class="num">${pesos(p.total)}</td>
    <td class="num">${p.estado === 'cancelado' ? '—' : p.total - p.pagado > 0 ? `<b style="color:var(--bad)">${pesos(p.total - p.pagado)}</b>` : '<span class="badge b-ok">Pagado</span>'}</td><td>${estadoBadge(p.estado)}</td></tr>`).join('') || '<tr><td colspan="7" class="vacio">No hay pedidos aquí.</td></tr>'}
  </tbody></table></section>`;
}

function verPedido(folio) {
  const p = db().pedidos.find((x) => x.folio === folio); if (!p) return;
  const i = ESTADOS.indexOf(p.estado);
  const sig = i >= 0 && i < ESTADOS.length - 1 ? ESTADOS[i + 1] : null;
  const saldo = p.total - p.pagado;
  const msgEstado = `Hola ${p.cliente.n.split(' ')[0]}, te escribimos de ${db().conf.nombre}. Tu pedido ${p.folio} está: *${ESTADO_TXT[p.estado]}*.${saldo > 0 && p.estado !== 'cancelado' ? ` Saldo pendiente: ${pesos(saldo)}.` : ''} Puedes ver el avance aquí: ${linkTienda()} (botón «Mi pedido»).`;
  ventana(`${dlgH(`Pedido ${p.folio} ${estadoBadge(p.estado)}`)}<div class="dlg-b">
    <div class="grid2" style="grid-template-columns:1fr 1fr">
      <div><b>${esc(p.cliente.n)}</b><br><a href="${wa('52' + p.cliente.tel, msgEstado)}" target="_blank" rel="noopener">📱 ${esc(p.cliente.tel)} · avisar por WhatsApp</a><br>
        <small>${p.cliente.entrega === 'tienda' ? 'Recoge en showroom' : esc(p.cliente.dir)}</small>${p.cliente.notas ? `<p class="aviso" style="margin-top:8px">📝 ${esc(p.cliente.notas)}</p>` : ''}</div>
      <div><small>Forma de pago</small><br><b>${PAGOS[p.cliente.pago]}</b><br><small>Hecho el ${fechaHora(p.f)}</small></div>
    </div>
    <table class="t" style="margin:14px 0"><tbody>${p.items.map((it) => `<tr><td><img class="thumb" src="${foto(it.foto, 120)}" alt=""></td><td>${it.cant} × ${esc(it.n)}</td><td class="num">${pesos(it.precio * it.cant)}</td></tr>`).join('')}
      <tr><td></td><td>Envío</td><td class="num">${p.envio ? pesos(p.envio) : 'Gratis'}</td></tr><tr><td></td><td><b>Total</b></td><td class="num"><b>${pesos(p.total)}</b></td></tr>
      <tr><td></td><td>Pagado</td><td class="num">${pesos(p.pagado)}</td></tr><tr><td></td><td><b>Saldo</b></td><td class="num"><b style="color:${saldo > 0 ? 'var(--bad)' : 'var(--ok)'}">${pesos(saldo)}</b></td></tr></tbody></table>
    ${saldo > 0 && p.estado !== 'cancelado' ? `<form class="form" id="fPago" style="grid-template-columns:1fr 1fr auto;align-items:end;margin-bottom:14px">
      <label>Registrar pago<input name="monto" type="number" min="1" max="${saldo}" step="1" value="${saldo}" required></label>
      <label>Método<select name="met">${['Efectivo', 'Transferencia', 'Tarjeta'].map((m) => `<option>${m}</option>`).join('')}</select></label><button class="btn">Guardar pago</button></form>` : ''}
    <div class="grid2" style="grid-template-columns:1fr 1fr"><div><b>Historial</b><ul class="hist" style="margin-top:8px">${p.hist.map((h) => `<li>${ESTADO_TXT[h.e]}<br><small>${fechaHora(h.f)}</small></li>`).join('')}</ul></div>
      <div><b>Pagos</b><ul class="lista-mini">${(p.pagos || []).map((x) => `<li>${esc(x.met)}<span class="der">${pesos(x.monto)}<br><small>${fecha(x.f)}</small></span></li>`).join('') || '<li><small>Sin pagos registrados en el sistema</small></li>'}</ul></div></div>
  </div><div class="dlg-p">
    ${p.estado !== 'cancelado' && p.estado !== 'entregado' ? '<button class="btn peligro" id="cancelar">Cancelar pedido</button>' : ''}
    <a class="btn sec" target="_blank" rel="noopener" href="${wa('52' + p.cliente.tel, msgEstado)}">Avisar al cliente</a>
    ${sig ? `<button class="btn" id="avanzar">Pasar a «${ESTADO_TXT[sig]}» →</button>` : ''}</div>`);
  $('#avanzar') && ($('#avanzar').onclick = () => {
    if (sig === 'entregado' && saldo > 0 && !confirm(`Este pedido tiene saldo de ${pesos(saldo)}. ¿Marcar entregado de todos modos?`)) return;
    p.estado = sig; p.hist.push({ e: sig, f: new Date().toISOString() });
    guardar(`${p.folio}: ${ESTADO_TXT[sig]}`); verPedido(folio);
  });
  $('#cancelar') && ($('#cancelar').onclick = () => {
    if (!confirm(`¿Cancelar ${p.folio}? Las piezas regresan al inventario.`)) return;
    cancelar(db(), p); guardar(`${p.folio} cancelado, inventario devuelto`); verPedido(folio);
  });
  $('#fPago') && ($('#fPago').onsubmit = (e) => {
    e.preventDefault();
    const monto = Math.min(saldo, Math.round(Number(e.target.monto.value)));
    if (!(monto > 0)) return toast('Escribe un monto válido', 'error');
    p.pagado += monto; (p.pagos ||= []).push({ monto, met: e.target.met.value, f: new Date().toISOString() });
    guardar(`Pago de ${pesos(monto)} registrado`); verPedido(folio);
  });
}

// ---------- Productos
let qProd = '', cProd = '';
function productos() {
  const l = db().prods.filter((p) => (!cProd || p.cat === cProd) && (!qProd || p.n.toLowerCase().includes(qProd.toLowerCase())));
  return cab('Productos', `${db().prods.length} productos · ${db().prods.filter((p) => p.pub).length} visibles en la tienda`, '<button class="btn" data-nuevo-prod>+ Subir producto</button>') + `
  <div class="filtros"><input id="qProd" type="search" placeholder="Buscar producto…" value="${esc(qProd)}" aria-label="Buscar producto">
    <select id="cProd" aria-label="Categoría"><option value="">Todas las categorías</option>${db().cats.map((c) => `<option value="${c.id}" ${cProd === c.id ? 'selected' : ''}>${esc(c.n)}</option>`).join('')}</select></div>
  <section class="panel tabla"><table class="t"><thead><tr><th></th><th>Producto</th><th class="ocultar-m">Categoría</th><th class="num">Precio</th><th class="num ocultar-m">Costo</th><th class="num">Margen</th><th>Stock</th><th>En tienda</th></tr></thead><tbody>
  ${l.map((p) => `<tr class="click" data-editar="${p.id}"><td><img class="thumb" src="${foto(p.foto, 120)}" alt=""></td><td><b>${esc(p.n)}</b>${p.dest ? ' ⭐' : ''}<br><small>${esc(p.medidas)}</small></td>
    <td class="ocultar-m">${esc(catN(p.cat))}</td><td class="num">${pesos(precioFinal(p))}${precioFinal(p) < p.precio ? `<br><small><s>${pesos(p.precio)}</s></small>` : ''}</td><td class="num ocultar-m">${pesos(p.costo)}</td>
    <td class="num"><span class="badge ${margen(p) < 25 ? 'b-bad' : margen(p) < 40 ? 'b-warn' : 'b-ok'}">${margen(p)}%</span></td><td>${stockBadge(p)}</td>
    <td><label class="check" onclick="event.stopPropagation()"><input type="checkbox" data-pub="${p.id}" ${p.pub ? 'checked' : ''} aria-label="Mostrar ${esc(p.n)} en la tienda"></label></td></tr>`).join('') || '<tr><td colspan="8" class="vacio">Sin productos.</td></tr>'}
  </tbody></table></section>`;
}

function editarProducto(id) {
  const p = id ? prod(id) : { n: '', cat: db().cats[0].id, precio: '', oferta: 0, costo: '', stock: 1, min: 1, foto: '', medidas: '', material: '', colores: [], desc: '', dest: false, pub: true };
  let nuevaFoto = p.foto;
  ventana(`<form id="fProd">${dlgH(id ? 'Editar producto' : 'Subir producto nuevo')}<div class="dlg-b form">
    <div class="full subir"><img id="prev" src="${foto(p.foto, 300)}" alt="" ${p.foto ? '' : 'style="visibility:hidden"'}>
      <label>Foto del producto<input type="file" id="archivo" accept="image/*"><span class="ayuda">Desde el celular puedes tomarla con la cámara. Se reduce sola para que cargue rápido.</span></label></div>
    <label class="full">Nombre<input name="n" required value="${esc(p.n)}" placeholder="Ej. Sofá Lino 3 plazas"></label>
    <label>Categoría<select name="cat">${db().cats.map((c) => `<option value="${c.id}" ${p.cat === c.id ? 'selected' : ''}>${esc(c.n)}</option>`).join('')}</select></label>
    <label>Costo (lo que te cuesta)<input name="costo" type="number" min="0" step="1" required value="${p.costo}"></label>
    <label>Precio de venta<input name="precio" type="number" min="1" step="1" required value="${p.precio}"></label>
    <label>Precio de oferta <span class="ayuda">(opcional, 0 = sin oferta)</span><input name="oferta" type="number" min="0" step="1" value="${p.oferta || 0}"></label>
    <p class="full aviso" id="margenTxt"></p>
    ${id ? `<label>Existencias<input value="${p.stock}" disabled><span class="ayuda">Se cambian en Inventario para que quede registro.</span></label>` : '<label>Piezas iniciales<input name="stock" type="number" min="0" step="1" required value="1"></label>'}
    <label>Mínimo antes de resurtir<input name="min" type="number" min="0" step="1" required value="${p.min}"></label>
    <label>Medidas<input name="medidas" value="${esc(p.medidas)}" placeholder="210 × 90 × 85 cm"></label>
    <label>Material<input name="material" value="${esc(p.material)}"></label>
    <label class="full">Colores <span class="ayuda">(separados por coma)</span><input name="colores" value="${esc((p.colores || []).join(', '))}"></label>
    <label class="full">Descripción<textarea name="desc">${esc(p.desc)}</textarea></label>
    <label class="check"><input type="checkbox" name="pub" ${p.pub ? 'checked' : ''}> Visible en la tienda</label>
    <label class="check"><input type="checkbox" name="dest" ${p.dest ? 'checked' : ''}> Destacado (sale primero)</label>
  </div><div class="dlg-p">${id ? '<button type="button" class="btn peligro" id="borrar">Eliminar</button>' : ''}<button type="button" class="btn sec" data-cerrar>Cancelar</button><button class="btn">Guardar</button></div></form>`);
  const f = $('#fProd');
  const calc = () => {
    const pr = Number(f.oferta.value) > 0 && Number(f.oferta.value) < Number(f.precio.value) ? Number(f.oferta.value) : Number(f.precio.value);
    const m = pr ? Math.round((1 - Number(f.costo.value) / pr) * 100) : 0;
    $('#margenTxt').innerHTML = pr ? `Vendes en <b>${pesos(pr)}</b> y ganas <b>${pesos(pr - Number(f.costo.value))}</b> por pieza (margen <b>${m}%</b>).${m < 25 ? ' ⚠️ Margen bajo.' : ''}` : 'Escribe costo y precio para ver tu ganancia.';
  };
  f.addEventListener('input', calc); calc();
  $('#archivo').onchange = async (e) => {
    try { nuevaFoto = await comprimir(e.target.files[0]); $('#prev').src = nuevaFoto; $('#prev').style.visibility = ''; }
    catch (err) { toast(err.message, 'error'); }
  };
  $('#borrar') && ($('#borrar').onclick = () => {
    if (!confirm(`¿Eliminar «${p.n}»? Desaparece de la tienda. Los pedidos anteriores se conservan.`)) return;
    db().prods = db().prods.filter((x) => x.id !== id); guardar('Producto eliminado'); dlg.close();
  });
  f.onsubmit = (e) => {
    e.preventDefault();
    if (!nuevaFoto) return toast('Agrega una foto: es lo primero que ve el cliente', 'error');
    const d = Object.fromEntries(new FormData(f));
    const datos = { n: d.n.trim(), cat: d.cat, costo: +d.costo, precio: +d.precio, oferta: +d.oferta || 0, min: +d.min, medidas: d.medidas.trim(), material: d.material.trim(),
      colores: d.colores.split(',').map((s) => s.trim()).filter(Boolean), desc: d.desc.trim(), pub: !!d.pub, dest: !!d.dest, foto: nuevaFoto };
    if (datos.oferta >= datos.precio) datos.oferta = 0;
    if (id) Object.assign(p, datos);
    else {
      const nid = datos.n.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').slice(0, 30) + '-' + uid().slice(0, 4);
      db().prods.unshift({ ...datos, id: nid, stock: +d.stock, creado: new Date().toISOString() });
      if (+d.stock > 0) db().movs.unshift({ id: uid(), prod: nid, tipo: 'entrada', cant: +d.stock, nota: 'Alta de producto', f: new Date().toISOString() });
    }
    if (guardar(id ? 'Cambios guardados: ya se ven en la tienda' : 'Producto publicado en la tienda')) dlg.close();
  };
}

// ---------- Inventario
function inventario() {
  const piezas = db().prods.reduce((s, p) => s + Math.max(p.stock, 0), 0);
  const ago = db().prods.filter((p) => p.stock <= 0).length;
  const bajos = db().prods.filter((p) => p.stock > 0 && p.stock <= p.min).length;
  const l = [...db().prods].sort((a, b) => (a.stock - a.min) - (b.stock - b.min));
  return cab('Inventario', 'Cada entrada, salida y venta queda registrada con fecha y motivo.', '<button class="btn" data-mov="">+ Registrar movimiento</button>') + `
  <div class="kpis"><div class="kpi"><span>Piezas en existencia</span><b>${piezas}</b></div>
    <div class="kpi"><span>Dinero en inventario (costo)</span><b>${pesos(db().prods.reduce((s, p) => s + p.costo * Math.max(p.stock, 0), 0))}</b></div>
    <div class="kpi ${bajos ? 'alerta' : ''}"><span>Por resurtir</span><b>${bajos}</b><small>debajo del mínimo</small></div>
    <div class="kpi ${ago ? 'alerta' : ''}"><span>Agotados</span><b>${ago}</b><small>no se pueden vender</small></div></div>
  <div class="grid2">
    <section class="panel tabla"><h2>Existencias</h2><table class="t"><thead><tr><th></th><th>Producto</th><th>Stock</th><th class="num">Mín.</th><th></th></tr></thead><tbody>
      ${l.map((p) => `<tr><td><img class="thumb" src="${foto(p.foto, 120)}" alt=""></td><td>${esc(p.n)}</td><td>${stockBadge(p)}</td><td class="num">${p.min}</td><td><button class="btn mini sec" data-mov="${p.id}">Mover</button></td></tr>`).join('')}</tbody></table></section>
    <section class="panel"><h2>Movimientos</h2><ul class="lista-mini">${db().movs.slice(0, 40).map(movLi).join('') || '<li class="vacio">Sin movimientos</li>'}</ul></section>
  </div>`;
}

function movimiento(id) {
  ventana(`<form id="fMov">${dlgH('Movimiento de inventario')}<div class="dlg-b form">
    <label class="full">Producto<select name="prod">${db().prods.map((p) => `<option value="${p.id}" ${p.id === id ? 'selected' : ''}>${esc(p.n)} (hay ${p.stock})</option>`).join('')}</select></label>
    <label>Tipo<select name="tipo"><option value="entrada">Entrada (llegó mercancía)</option><option value="salida">Salida (daño, muestra, regalo)</option><option value="ajuste">Ajuste por conteo físico</option></select></label>
    <label id="lCant">Cantidad<input name="cant" type="number" min="0" step="1" required value="1"></label>
    <label class="full">Motivo o proveedor<input name="nota" required placeholder="Ej. Llegó pedido de Tapicería Hidalgo"></label>
  </div><div class="dlg-p"><button type="button" class="btn sec" data-cerrar>Cancelar</button><button class="btn">Guardar movimiento</button></div></form>`);
  const f = $('#fMov');
  f.tipo.onchange = () => { $('#lCant').firstChild.textContent = f.tipo.value === 'ajuste' ? 'Piezas contadas' : 'Cantidad'; };
  f.onsubmit = (e) => {
    e.preventDefault();
    const p = prod(f.prod.value); const n = Math.round(Number(f.cant.value));
    if (!(n >= 0)) return toast('Cantidad no válida', 'error');
    const cant = f.tipo.value === 'entrada' ? n : f.tipo.value === 'salida' ? -n : n - p.stock;
    if (p.stock + cant < 0) return toast(`No puedes sacar ${n}: solo hay ${p.stock}`, 'error');
    if (!cant) return toast('El conteo coincide, no hay nada que ajustar');
    p.stock += cant;
    db().movs.unshift({ id: uid(), prod: p.id, tipo: f.tipo.value, cant, nota: f.nota.value.trim(), f: new Date().toISOString() });
    if (guardar(`${p.n}: ahora hay ${p.stock}`)) dlg.close();
  };
}

// ---------- Precios y ofertas
function precios() {
  const pr = db().conf.promo;
  const riesgo = db().prods.filter((p) => margen(p) < 25);
  return cab('Precios y ofertas', 'Sube precios cuando sube tu proveedor y lanza ofertas sin tocar producto por producto.') + `
  <div class="grid2">
    <section class="panel"><h2>Cambio de precios en bloque</h2>
      <form class="form" id="fMasivo"><label>Categoría<select name="cat"><option value="">Todas</option>${db().cats.map((c) => `<option value="${c.id}">${esc(c.n)}</option>`).join('')}</select></label>
        <label>Acción<select name="acc"><option value="subir">Subir precio</option><option value="bajar">Bajar precio</option><option value="oferta">Poner oferta</option><option value="quitar">Quitar oferta</option></select></label>
        <label>Porcentaje<input name="pct" type="number" min="1" max="90" step="1" value="10"></label>
        <label class="check" style="align-self:end"><input type="checkbox" name="redondear" checked> Redondear a $100</label>
        <div class="full" id="vistaMasivo"></div>
        <div class="full"><button class="btn">Aplicar cambios</button></div></form></section>
    <section class="panel"><h2>Banner de oferta en la tienda</h2>
      <form class="form" id="fPromo"><label class="check full"><input type="checkbox" name="activa" ${pr.activa ? 'checked' : ''}> Mostrar el banner</label>
        <label class="full">Título<input name="titulo" value="${esc(pr.titulo)}" required></label>
        <label class="full">Texto<textarea name="texto">${esc(pr.texto)}</textarea></label>
        <label class="full">Lleva a la categoría<select name="cat">${db().cats.map((c) => `<option value="${c.id}" ${pr.cat === c.id ? 'selected' : ''}>${esc(c.n)}</option>`).join('')}</select></label>
        <div class="full"><button class="btn">Guardar banner</button></div></form></section>
  </div>
  <section class="panel"><h2>Productos con margen bajo (menos de 25%)</h2>${riesgo.length ? `<ul class="lista-mini">${riesgo.map((p) => `<li><img class="thumb" src="${foto(p.foto, 120)}" alt=""><div><b>${esc(p.n)}</b><br><small>Costo ${pesos(p.costo)} · vende en ${pesos(precioFinal(p))}</small></div><div class="der"><span class="badge b-bad">${margen(p)}%</span> <button class="btn mini sec" data-editar="${p.id}">Revisar</button></div></li>`).join('')}</ul>` : '<p class="vacio">Ningún producto por debajo del 25% de margen ✓</p>'}</section>`;
}

function calcMasivo(f) {
  const pct = Number(f.pct.value) / 100;
  const r = (n) => (f.redondear.checked ? Math.round(n / 100) * 100 : Math.round(n));
  return db().prods.filter((p) => !f.cat.value || p.cat === f.cat.value).map((p) => {
    const n = { precio: p.precio, oferta: p.oferta };
    if (f.acc.value === 'subir') { n.precio = r(p.precio * (1 + pct)); if (p.oferta) n.oferta = r(p.oferta * (1 + pct)); }
    if (f.acc.value === 'bajar') { n.precio = r(p.precio * (1 - pct)); if (p.oferta) n.oferta = Math.min(n.precio - 1, r(p.oferta * (1 - pct))); }
    if (f.acc.value === 'oferta') n.oferta = r(p.precio * (1 - pct));
    if (f.acc.value === 'quitar') n.oferta = 0;
    return { p, n };
  });
}

// ---------- Clientes
function clientes() {
  const m = new Map();
  for (const p of db().pedidos) {
    const c = m.get(p.cliente.tel) || { n: p.cliente.n, tel: p.cliente.tel, ped: 0, total: 0, saldo: 0, ult: p.f };
    if (p.estado !== 'cancelado') { c.ped++; c.total += p.total; c.saldo += p.total - p.pagado; }
    if (p.f > c.ult) c.ult = p.f;
    m.set(p.cliente.tel, c);
  }
  const l = [...m.values()].sort((a, b) => b.total - a.total);
  const promo = (c) => `Hola ${c.n.split(' ')[0]}, gracias por comprar en ${db().conf.nombre}. Como cliente frecuente te damos acceso anticipado a: ${db().conf.promo.titulo}. Míralo aquí: ${linkTienda()}`;
  return cab('Clientes', 'Se arma sola con cada pedido. Úsala para avisar ofertas a quien ya te compró.') + `
  <div class="kpis"><div class="kpi"><span>Clientes</span><b>${l.length}</b></div><div class="kpi"><span>Compran más de una vez</span><b>${l.filter((c) => c.ped > 1).length}</b></div>
    <div class="kpi"><span>Compra promedio</span><b>${pesos(l.reduce((s, c) => s + c.total, 0) / Math.max(1, l.reduce((s, c) => s + c.ped, 0)))}</b></div></div>
  <section class="panel tabla"><table class="t"><thead><tr><th>Cliente</th><th class="num">Pedidos</th><th class="num">Total comprado</th><th class="num">Saldo</th><th class="ocultar-m">Última compra</th><th></th></tr></thead><tbody>
  ${l.map((c) => `<tr><td><b>${esc(c.n)}</b><br><small>${esc(c.tel)}</small></td><td class="num">${c.ped}</td><td class="num">${pesos(c.total)}</td><td class="num">${c.saldo > 0 ? `<b style="color:var(--bad)">${pesos(c.saldo)}</b>` : '—'}</td>
    <td class="ocultar-m">${fecha(c.ult)}</td><td><a class="btn mini sec" target="_blank" rel="noopener" href="${wa('52' + c.tel, promo(c))}">Enviar oferta</a></td></tr>`).join('')}</tbody></table></section>`;
}

// ---------- Ajustes
function ajustes() {
  const c = db().conf;
  let usado = 0; try { usado = (localStorage.getItem('narit-sis:muebleria') || '').length; } catch {}
  return cab('Ajustes', 'Datos de tu tienda y reglas de venta.') + `
  <section class="panel"><form class="form" id="fConf">
    <label>Nombre de la tienda<input name="nombre" required value="${esc(c.nombre)}"></label>
    <label>Lema<input name="lema" value="${esc(c.lema)}"></label>
    <label>WhatsApp de la tienda<input name="whatsapp" required inputmode="tel" value="${esc(c.whatsapp)}"><span class="ayuda">Con lada de país, ej. 52 55 1234 5678</span></label>
    <label>PIN del panel<input name="pin" required inputmode="numeric" minlength="4" maxlength="6" value="${esc(c.pin)}"></label>
    <label>Costo de envío<input name="envio" type="number" min="0" step="1" value="${c.envio}"></label>
    <label>Envío gratis desde<input name="envioGratis" type="number" min="0" step="1" value="${c.envioGratis}"></label>
    <label>Anticipo para apartar (%)<input name="anticipo" type="number" min="0" max="100" step="1" value="${c.anticipo}"></label>
    <div class="full"><button class="btn">Guardar ajustes</button></div></form></section>
  <section class="panel"><h2>Datos del demo</h2><p>Espacio usado: ${(usado / 1024).toFixed(0)} KB de unos 5,000 KB. Cada foto subida ocupa ~100 KB.</p>
    <button class="btn peligro" id="reiniciar">Reiniciar demo con datos de ejemplo</button></section>`;
}

// ---------- Navegación y eventos
const VISTAS = { inicio, pedidos, productos, inventario, precios, clientes, ajustes };
function pintar() {
  const v = (location.hash.slice(1) || 'inicio');
  const ruta = VISTAS[v] ? v : 'inicio';
  $('#vista').innerHTML = VISTAS[ruta]();
  $$('.side a[href^="#"]').forEach((a) => a.setAttribute('aria-current', a.getAttribute('href') === '#' + ruta ? 'page' : 'false'));
  const nN = db().pedidos.filter((p) => p.estado === 'nuevo').length;
  const nI = db().prods.filter((p) => p.stock <= p.min).length;
  $('#nPed').hidden = !nN; $('#nPed').textContent = nN;
  $('#nInv').hidden = !nI; $('#nInv').textContent = nI;
  enlazar(ruta);
}

function enlazar(ruta) {
  if (ruta === 'productos') {
    $('#qProd').oninput = (e) => { qProd = e.target.value; pintar(); const i = $('#qProd'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); };
    $('#cProd').onchange = (e) => { cProd = e.target.value; pintar(); };
  }
  if (ruta === 'precios') {
    const f = $('#fMasivo');
    const vista = () => {
      const l = calcMasivo(f);
      $('#vistaMasivo').innerHTML = `<p class="ayuda">Vista previa: ${l.length} productos</p><div class="tabla" style="max-height:220px"><table class="t"><tbody>${l.map(({ p, n }) => {
        const fin = n.oferta > 0 && n.oferta < n.precio ? n.oferta : n.precio; const m = Math.round((1 - p.costo / fin) * 100);
        return `<tr><td>${esc(p.n)}</td><td class="num"><s>${pesos(precioFinal(p))}</s> → <b>${pesos(fin)}</b></td><td class="num"><span class="badge ${m < 25 ? 'b-bad' : 'b-ok'}">${m}%</span></td></tr>`; }).join('')}</tbody></table></div>`;
    };
    f.oninput = vista; vista();
    f.onsubmit = (e) => {
      e.preventDefault();
      const l = calcMasivo(f);
      if (!confirm(`¿Aplicar a ${l.length} productos?`)) return;
      l.forEach(({ p, n }) => { p.precio = n.precio; p.oferta = n.oferta > 0 && n.oferta < n.precio ? n.oferta : 0; });
      guardar(`Precios actualizados en ${l.length} productos`);
    };
    $('#fPromo').onsubmit = (e) => {
      e.preventDefault(); const d = new FormData(e.target);
      db().conf.promo = { activa: !!d.get('activa'), titulo: d.get('titulo').trim(), texto: d.get('texto').trim(), cat: d.get('cat') };
      guardar('Banner actualizado en la tienda');
    };
  }
  if (ruta === 'ajustes') {
    $('#fConf').onsubmit = (e) => {
      e.preventDefault(); const d = Object.fromEntries(new FormData(e.target));
      Object.assign(db().conf, { nombre: d.nombre.trim(), lema: d.lema.trim(), whatsapp: d.whatsapp.replace(/\D/g, ''), pin: d.pin.trim(), envio: +d.envio, envioGratis: +d.envioGratis, anticipo: +d.anticipo });
      guardar('Ajustes guardados');
    };
    $('#reiniciar').onclick = () => { if (confirm('Se borran tus cambios y vuelven los datos de ejemplo. ¿Continuar?')) { B.reiniciar(); pintar(); toast('Demo reiniciado'); } };
  }
}

document.addEventListener('click', (e) => {
  const t = e.target;
  if (t.closest('[data-cerrar]')) return dlg.close();
  if (t === dlg) return dlg.close();
  const ped = t.closest('[data-pedido]'); if (ped) return verPedido(ped.dataset.pedido);
  const ed = t.closest('[data-editar]'); if (ed && !t.closest('[data-pub]')) return editarProducto(ed.dataset.editar);
  if (t.closest('[data-nuevo-prod]')) return editarProducto(null);
  const mv = t.closest('[data-mov]'); if (mv) return movimiento(mv.dataset.mov);
  const fp = t.closest('[data-fped]'); if (fp) { filtroPed = fp.dataset.fped; pintar(); }
});
document.addEventListener('change', (e) => {
  const c = e.target.closest('[data-pub]');
  if (c) { const p = prod(c.dataset.pub); p.pub = c.checked; guardar(p.pub ? `${p.n} visible en la tienda` : `${p.n} oculto de la tienda`); }
});
addEventListener('hashchange', pintar);

let antes = db().pedidos.length;
B.alCambiar(() => {
  if (db().pedidos.length > antes) toast(`🛋️ Nuevo pedido ${db().pedidos[0].folio} de ${db().pedidos[0].cliente.n}`);
  antes = db().pedidos.length;
  pintar();
});

puerta('muebleria', db().conf.pin, () => { $('#app').hidden = false; pintar(); });
