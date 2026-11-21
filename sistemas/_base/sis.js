// Motor compartido de los sistemas completos (panel del negocio + vista del cliente).
// shortcut: los datos viven en localStorage del navegador; en producción se cambian por una base en la nube (ver guía).
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const pesos = (n) => '$' + Math.round(Number(n) || 0).toLocaleString('es-MX');
export const fecha = (iso) => new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
export const fechaHora = (iso) => new Date(iso).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
export const uid = () => Math.random().toString(36).slice(2, 9);
export const haceDias = (n, h = 12) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(h, 0, 0, 0); return d.toISOString(); };
// Fotos de ejemplo: id de Unsplash (licencia libre) o la foto que sube el negocio (data URL).
export const foto = (src, w = 800) => !src ? '' : src.startsWith('photo-') ? `https://images.unsplash.com/${src}?w=${w}&q=70&auto=format&fit=crop` : src;
export const wa = (tel, msg) => `https://wa.me/${String(tel).replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;

export function toast(msg, tipo = 'ok') {
  let box = $('#toasts');
  if (!box) { box = document.createElement('div'); box.id = 'toasts'; box.setAttribute('role', 'status'); document.body.append(box); }
  const t = document.createElement('div');
  t.className = 'toast ' + tipo; t.textContent = msg; box.append(t);
  setTimeout(() => t.remove(), 3500);
}

// Base de datos del demo. Se guarda al primer uso para que la tienda y el panel (otra pestaña) compartan los mismos datos.
export function base(clave, semilla) {
  const K = 'narit-sis:' + clave;
  const V = semilla().v;
  const leer = () => { try { const d = JSON.parse(localStorage.getItem(K)); if (d && d.v === V) return d; } catch {} return null; };
  const api = {
    db: null,
    guardar() {
      try { localStorage.setItem(K, JSON.stringify(api.db)); return true; }
      catch { toast('No se pudo guardar: el espacio del demo está lleno. Borra algunas fotos o reinicia el demo.', 'error'); return false; }
    },
    recargar() { api.db = leer() || api.db; return api.db; },
    reiniciar() { api.db = semilla(); api.guardar(); },
    // Otra pestaña guardó cambios: se recargan y se vuelve a pintar (así se ve en vivo lo que hace el otro lado).
    alCambiar(fn) { addEventListener('storage', (e) => { if (e.key === K) { api.recargar(); fn(); } }); },
  };
  api.db = leer();
  if (!api.db) { api.db = semilla(); api.guardar(); }
  return api;
}

// Datos solo de este visitante (carrito, favoritos, sesión): no se comparten con el negocio.
export const local = {
  get(k, d) { try { return JSON.parse(localStorage.getItem('narit-sis:' + k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('narit-sis:' + k, JSON.stringify(v)); } catch {} },
};

// Reduce la foto antes de guardarla (una foto de celular pesa 3-5 MB; así queda en ~100 KB).
export function comprimir(file, max = 1000, calidad = 0.78) {
  return new Promise((ok, mal) => {
    if (!file || !file.type.startsWith('image/')) return mal(new Error('El archivo no es una imagen'));
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      ok(c.toDataURL('image/jpeg', calidad));
    };
    img.onerror = () => mal(new Error('No se pudo leer la imagen'));
    img.src = URL.createObjectURL(file);
  });
}

// Acceso al panel. shortcut: PIN visible y validado en el navegador, solo para el demo; en producción va login real en servidor.
export function puerta(clave, pin, alEntrar) {
  if (sessionStorage.getItem('narit-sis:sesion:' + clave) === 'ok') return alEntrar();
  const d = document.createElement('div');
  d.className = 'puerta';
  d.innerHTML = `<form><h1>Panel del negocio</h1><p>Solo el dueño y su equipo entran aquí.</p>
    <label>PIN<input name="pin" inputmode="numeric" autocomplete="off" maxlength="6" required autofocus></label>
    <button class="btn">Entrar</button><small>PIN del demo: <b>${esc(pin)}</b></small></form>`;
  document.body.append(d);
  d.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (e.target.pin.value === String(pin)) { try { sessionStorage.setItem('narit-sis:sesion:' + clave, 'ok'); } catch {} d.remove(); alEntrar(); }
    else { toast('PIN incorrecto', 'error'); e.target.pin.select(); }
  });
}

// Gráfica de barras simple, sin librerías.
export function barras(datos, fmt = pesos) {
  const max = Math.max(1, ...datos.map((d) => d.v));
  return `<div class="barras" role="img" aria-label="${esc(datos.map((d) => d.k + ': ' + fmt(d.v)).join(', '))}">${datos.map((d) => `<div class="barra" title="${esc(d.k)}: ${esc(fmt(d.v))}"><i style="height:${(d.v / max) * 100}%"></i><span>${esc(d.k)}</span></div>`).join('')}</div>`;
}
