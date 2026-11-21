// Odontograma visual (FDI). Lo usan el portal (solo ver) y el panel (editar tocando cada diente).
import { ARRIBA, ABAJO, ODO } from './datos.js';

const CSS = `.odo{display:grid;gap:6px;overflow-x:auto;padding:4px 2px}
.odo-f{display:grid;grid-template-columns:repeat(16,minmax(30px,1fr));gap:3px;min-width:520px}
.odo-f.sep{border-top:2px dashed #CBD5E1;padding-top:6px}
.diente{display:flex;flex-direction:column;align-items:center;gap:2px;background:none;border:0;padding:2px;border-radius:8px;font:700 .68rem system-ui;color:#64748B}
button.diente{cursor:pointer}button.diente:hover{background:#0000000a}
.diente svg{width:100%;max-width:34px;height:auto}
.diente:nth-child(8){margin-right:6px}
.odo-ley{display:flex;flex-wrap:wrap;gap:6px 12px;font-size:.8rem;margin-top:6px}
.odo-ley span{display:inline-flex;align-items:center;gap:5px}
.odo-ley i{width:12px;height:12px;border-radius:3px;border:1px solid #94A3B8}
.odo-ley button{display:inline-flex;align-items:center;gap:5px;border:1px solid #E2E8F0;background:#fff;border-radius:99px;padding:4px 10px;cursor:pointer;font-size:.8rem}
.odo-ley button[aria-pressed=true]{border-color:#0F172A;box-shadow:0 0 0 2px #0F172A}`;
if (!document.getElementById('odo-css')) document.head.insertAdjacentHTML('beforeend', `<style id="odo-css">${CSS}</style>`);

function diente(n, estado, abajo, editable) {
  const s = ODO[estado] || ODO.sano;
  const aus = estado === 'ausente';
  const corona = abajo ? 'M6 4h20l-2 14H8z' : 'M8 26h16l2-14H6z';
  const raiz = abajo ? 'M9 18l2 14M23 18l-2 14' : 'M11 12L9 0M21 12l2-12';
  const forma = `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="${raiz}" stroke="#94A3B8" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <path d="${corona}" fill="${aus ? 'none' : s.c}" stroke="${aus ? '#94A3B8' : '#475569'}" stroke-width="1.6" stroke-dasharray="${aus ? '3 2' : ''}" stroke-linejoin="round"/>
    ${estado === 'extraer' ? '<path d="M9 7l14 16M23 7L9 23" stroke="#fff" stroke-width="2.4"/>' : ''}</svg>`;
  const lab = `Diente ${n}: ${s.n}`;
  return editable ? `<button class="diente" data-diente="${n}" title="${lab}" aria-label="${lab}">${abajo ? forma + n : n + forma}</button>`
    : `<span class="diente" title="${lab}" role="img" aria-label="${lab}">${abajo ? forma + n : n + forma}</span>`;
}

export function odontograma(pac, editable = false, pincel = 'caries') {
  const fila = (l, abajo) => `<div class="odo-f ${abajo ? 'sep' : ''}">${l.map((n) => diente(n, pac.odo[n], abajo, editable)).join('')}</div>`;
  const ley = editable
    ? `<div class="odo-ley" role="group" aria-label="Marcar como">${Object.entries(ODO).map(([k, v]) => `<button type="button" data-pincel="${k}" aria-pressed="${pincel === k}"><i style="background:${v.c}"></i>${v.n}</button>`).join('')}</div>`
    : `<div class="odo-ley">${[...new Set(Object.values(pac.odo))].map((k) => `<span><i style="background:${ODO[k].c}"></i>${ODO[k].n}</span>`).join('') || '<span>Todos los dientes sanos ✓</span>'}</div>`;
  return `<div class="odo">${fila(ARRIBA)}${fila(ABAJO, true)}</div>${ley}`;
}
