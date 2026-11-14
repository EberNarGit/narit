// Generador determinista de datos simulados (contexto México) + capa de cambios en localStorage.
import { rng, hash, hoy, diaNum, isoDN, store } from './core.js';

const N = 'Sofía,Valentina,Regina,María José,Ximena,Camila,Renata,Fernanda,Daniela,Mariana,Guadalupe,Alejandra,Santiago,Mateo,Sebastián,Leonardo,Emiliano,Diego,Miguel Ángel,José Luis,Juan Pablo,Luis Fernando,Carlos,Jorge,Ricardo,Eduardo,Alejandro,Francisco,Rodrigo,Héctor,Arturo,Óscar,Itzel,Paola,Karla,Lucía,Andrea,Gabriela,Verónica,Patricia'.split(',');
const A = 'Hernández,García,Martínez,López,González,Pérez,Rodríguez,Sánchez,Ramírez,Cruz,Flores,Gómez,Morales,Vázquez,Jiménez,Reyes,Díaz,Torres,Gutiérrez,Ruiz,Mendoza,Aguilar,Ortiz,Castillo,Moreno,Romero,Álvarez,Chávez,Rivera,Juárez,Domínguez,Herrera,Medina,Castro,Vargas,Guzmán,Velázquez,Rojas,Salazar,Contreras'.split(',');

const wpick = (r, ws) => { let t = 0; for (const w of ws) t += w; let x = r() * t; for (let i = 0; i < ws.length; i++) if ((x -= ws[i]) < 0) return i; return ws.length - 1; };

// d: { folio, porDia, horas:[a,b], cats:[[nombre,precio,peso?]], staff, sucs, estados:[[nombre,'ok'|'pend'|'bad',peso]], pagos, clientes?, unico?, picos?, semana?, vivo? }
export function generar(slug, d) {
  const h0 = hash(slug), T = diaNum(hoy()), out = [], ahora = new Date().getHours();
  const pool = d.clientes, nPool = d.pool || 120;
  const catW = d.cats.map((c, i) => c[2] || 1 / (i + 1.5));
  const pagN = d.pagos.map((p) => (Array.isArray(p) ? p[0] : p)), pagW = d.pagos.map((p) => (Array.isArray(p) ? p[1] : 1));
  const E = d.estados, todos = E.map((e) => e[2] ?? 1), fin = E.map((e) => (e[1] === 'pend' ? 0 : e[2] ?? 1)), pend0 = E.findIndex((e) => e[1] === 'pend');
  const sem = d.semana || [0.7, 0.85, 0.9, 0.95, 1.05, 1.3, 1.25], sucW = d.sucs.map((_, k) => 1 / (k + 1)), [a, b] = d.horas;
  for (let dn = T - 400; dn <= T + 7; dn++) {
    const r = rng(h0 + dn * 7919), f = isoDN(dn), edad = Math.max(0, T - dn);
    let n = Math.round(d.porDia * sem[(dn + 4) % 7] * (1.35 - 0.7 * edad / 400) * ((d.picos || {})[f.slice(5)] || 1) * (0.8 + r() * 0.4));
    if (dn > T) n = Math.round(n * 0.5);
    const usados = new Set();
    for (let i = 0; i < n; i++) {
      const h = Math.min(b - 1, Math.max(a, Math.round(a + (b - a) * (r() < 0.5 ? 0.3 : 0.72) + (r() - 0.5) * (b - a) * 0.45)));
      const staff = d.staff[Math.floor(r() * d.staff.length)], suc = d.sucs[wpick(r, sucW)];
      const c = d.cats[wpick(r, catW)], monto = Math.max(5, Math.round(c[1] * (d.mult ? 1 + Math.floor(r() * d.mult) : 1) * (0.9 + r() * 0.3) / 5) * 5);
      const k = Math.floor(r() * r() * (pool ? pool.length : nPool));
      const cliente = pool ? pool[k] : N[k % 40] + ' ' + A[(k * 7 + Math.floor(k / 40) * 3) % 40];
      let ei;
      if (dn < T) ei = edad < 12 && pend0 >= 0 && r() < (d.rezago ?? 0.04) ? pend0 : wpick(r, fin);
      else if (dn === T) ei = h <= ahora || d.vivo || pend0 < 0 ? wpick(r, todos) : pend0;
      else ei = pend0 >= 0 ? pend0 : 0;
      const min = d.unico ? '00' : ['00', '15', '30', '45'][Math.floor(r() * 4)], pago = pagN[wpick(r, pagW)], tel = '55' + Math.floor(1e7 + r() * 9e7);
      if (d.unico) { const u = (d.unico === 'suc' ? suc : staff) + h; if (usados.has(u)) continue; usados.add(u); }
      out.push({ id: dn + '-' + i, folio: d.folio + '-' + String(dn % 1000).padStart(3, '0') + String(i).padStart(2, '0'), fecha: f, dn, hora: String(h).padStart(2, '0') + ':' + min, cliente, tel, cat: c[0], staff, suc, monto, estado: E[ei][0], pago });
    }
  }
  return out;
}

// Los datos generados nunca se guardan; solo altas (a), ediciones (p) y bajas (x) del usuario.
export function cargar(slug, d) {
  const st = store(slug), o = st.get('cambios', { a: [], p: {}, x: [] }), base = generar(slug, d), guarda = () => st.set('cambios', o);
  return {
    rows() { const X = new Set(o.x); return [...o.a, ...base].filter((r) => !X.has(r.id)).map((r) => (o.p[r.id] ? { ...r, ...o.p[r.id] } : r)); },
    add(r) { o.a.unshift(r); guarda(); },
    upd(id, p) { const m = o.a.find((r) => r.id === id); if (m) Object.assign(m, p); else o.p[id] = { ...o.p[id], ...p }; guarda(); },
    del(id) { o.a = o.a.filter((r) => r.id !== id); o.x.push(id); guarda(); },
  };
}
