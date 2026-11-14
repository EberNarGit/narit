# NarIT · Digitalizamos tu negocio · 24 demos interactivas

Sitio estático (HTML + CSS + JavaScript con módulos ES, **sin build ni backend**) pensado para GitHub Pages.
Un hub con 24 proyectos; cada uno tiene ficha de venta, demo interactiva y panel de control, y un diseño propio.
El detalle de estilos, KPIs y gráficas está en [MAPA-DE-DISENO.md](MAPA-DE-DISENO.md).

## Verlo en tu computadora

Los módulos ES no cargan con doble clic (`file://`); necesitas un servidor local:

```bash
python -m http.server 8123
```

Abre <http://localhost:8123>.

## Publicar en GitHub Pages

1. Crea un repositorio en GitHub (por ejemplo `demos`) y sube **todo el contenido de esta carpeta a la raíz** del repositorio.
   ```bash
   git init
   git add .
   git commit -m "Catálogo de demos"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/demos.git
   git push -u origin main
   ```
2. En GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**.
3. Elige la rama `main` y la carpeta `/ (root)`. Guarda.
4. En uno o dos minutos el sitio queda en `https://TU-USUARIO.github.io/demos/`.

Todas las rutas son relativas, así que funciona igual en `usuario.github.io/repo/` o con dominio propio.
El archivo `.nojekyll` evita que GitHub procese el sitio con Jekyll; no lo borres.

## Cambiar el WhatsApp y los datos de contacto

Edita **solo** [config.js](config.js):

```js
export const CONFIG = {
  whatsapp: '525631569317',  // 52 + 10 dígitos, sin "+" ni espacios
  sitio: '',                 // dirección de GitHub Pages; el QR del volante apunta aquí
  marca: 'NarIT',
  nombre: 'Tu Nombre',
  email: 'NarIT@gmail.com',
  ciudad: 'Ciudad de México',
};
```

Con eso cambian los botones de WhatsApp del hub y de los 24 proyectos, el código QR y el pie de contacto.
El mensaje prefabricado de cada demo incluye el nombre del proyecto para que sepas qué vio el cliente.

Para la vista previa al compartir, las etiquetas `og:image` apuntan a `assets/og.png` con ruta relativa.
WhatsApp y Facebook piden URL absoluta: cuando tengas tu dirección final, reemplaza `assets/og.png` por
`https://TU-USUARIO.github.io/demos/assets/og.png` en `index.html`.

## Uso durante una visita

- **Modo presentación:** botón "▶ Modo presentación" en el hub (o tecla `P`). Recorre los 24 demos solo; `Esc` para salir.
- **Atajos:** `←` `→` cambian de proyecto, `H` vuelve al catálogo.
- **Vista en vivo:** en cada tarjeta del hub carga la demo real dentro del marco.
- **Restablecer demo:** enlace al pie de cada proyecto; borra lo que hayas capturado en ese demo.
- Lo que se captura en una demo se guarda en el `localStorage` del navegador de ese dispositivo.

## Agregar un proyecto nuevo

1. Copia una carpeta parecida, por ejemplo `proyectos/barberia` → `proyectos/mi-giro`.
2. Registra el proyecto en [shared/projects.js](shared/projects.js) agregando una línea `p('mi-giro', 'Nombre', 'Giro', sector, estilo, librería, marco, fuente, fuentes, descripción, [3 funciones], {tokens de la tarjeta})`.
   La librería (`echarts`, `apex` o `chartjs`) decide con qué se dibujan las gráficas.
3. En `proyectos/mi-giro/index.html` cambia título, descripción, fuentes de Google y el `<script>` de la librería de gráficas.
4. En `app.js` cambia `slug` y la configuración: textos de la ficha, `datos` (servicios, personal, estados, precios), `kpis`, `charts` y `demo`.
5. En `style.css` define los tokens (`--bg`, `--card`, `--ink`, `--c1`…`--c6`, `--fd`, `--fb`, `--r`…) y sobreescribe lo que quieras.

Widgets de demo disponibles (`shared/demo.js`): `agenda`, `kanban`, `pos`, `board`, `calc`, `scan`, `checklist`.
Tipos de gráfica (`shared/charts.js`): `line`, `bars`, `donut`, `polar`, `gauge`, `heat`, `funnel`, `tree`, `scatter`, `radar`, `water`, `cal`, `map`.

## Cómo está armado

- `shared/engine.js` construye la página de cada proyecto a partir de su configuración; **no** define colores, fuentes ni layout.
- `shared/base.css` trae solo estructura y valores por defecto basados en tokens. La apariencia de cada proyecto vive en su `style.css`.
- `shared/data.js` genera los datos simulados de forma determinista (mismos datos en cada visita, siempre relativos a la fecha de hoy)
  y guarda únicamente las altas, ediciones y bajas del usuario.
- Dependencias externas, todas por CDN con versión fija: ECharts 5.5.0, ApexCharts 3.49.1, Chart.js 4.4.1, GSAP 3.12.5 (solo hub),
  qrcode-generator 1.4.4 (solo hub) y Google Fonts.

## Avisos

- Datos, nombres y marcas son ficticios, con fines demostrativos.
- Los cálculos fiscales y de nómina (ISR, IMSS, RESICO, IVA) son ilustrativos; no sustituyen a un contador.
- La carpeta `.claude/` solo sirve para la vista previa local; puedes borrarla antes de publicar.

## Volante para imprimir

Abre `volante/index.html` (con el servidor local o ya publicado, en `…/volante/`) y usa **Imprimir / guardar PDF**.

- **2 por hoja:** dos volantes media carta en una hoja carta horizontal; se corta por la línea punteada.
- **1 por hoja:** cartel tamaño carta, para pegar en un mostrador o vitrina.
- En el cuadro de impresión elige tamaño **Carta**, márgenes **Ninguno**, escala **100%** y activa **Gráficos de fondo**.
- El código QR y el número salen de `config.js`: `sitio` es la dirección a la que lleva el QR y `whatsapp` el número que se imprime.
  Si `sitio` está vacío, el QR lleva a WhatsApp y la página lo avisa arriba.
