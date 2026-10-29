const projects = [
  { name: 'REI', kind: 'Plataforma inmobiliaria', src: 'assets/rei.jpg', alt: 'Captura real de la plataforma inmobiliaria REI' },
  { name: 'Vistacampo', kind: 'Web institucional', src: 'assets/vistacampo.jpg', alt: 'Captura real del sitio de Vistacampo' },
  { name: 'Soapy', kind: 'Operación de lavandería', src: 'assets/soapy.jpg', alt: 'Captura real del tablero de Soapy' },
  { name: 'Mística', kind: 'Agenda y cobros', src: 'assets/mistica.png', alt: 'Captura real del producto Mística' },
];

const variants = { A: 'A · Open Systems', B: 'B · Proof First', C: 'C · Blue Studio' };
const params = new URLSearchParams(location.search);
let variant = (params.get('variant') || 'A').toUpperCase();
if (!variants[variant]) variant = 'A';

const logo = `<a class="logo" href="#inicio" aria-label="allok, inicio">all<span class="logo-dot" aria-hidden="true"></span>k</a>`;
const nav = `<nav class="main-nav" aria-label="Principal"><a href="#trabajo">Trabajo</a><a href="#servicios">Servicios</a><a href="#estudio">Estudio</a><a class="nav-cta" href="#contacto">Hablemos ↗</a></nav>`;

function card(project, styleIndex, projectIndex = styleIndex) {
  return `<article class="project-card" style="--i:${styleIndex}"><button class="project-open" data-project="${projectIndex}" type="button"><img src="${project.src}" alt="${project.alt}" fetchpriority="${projectIndex < 2 ? 'high' : 'auto'}" /><span class="project-caption"><b>${project.name}</b><small>${project.kind}</small><i>Ver proyecto ↗</i></span></button></article>`;
}

function heroA() {
  return `<section class="hero hero-a" id="inicio"><header>${logo}${nav}</header><div class="hero-a__copy"><p class="eyebrow">Estudio AI-native · Diseño, software e IA</p><h1>Menos fricción.<br />Más negocio.</h1><div class="hero-a__under"><p>Diseñamos productos, conectamos tu operación y ponemos la IA a trabajar.</p><a class="button button-light" href="#contacto">Cuéntanos qué necesitas ↗</a></div></div><div class="stage" aria-label="Sistemas reales de allok"><div class="stage__label">Del estudio · REI, Vistacampo y Mística</div><div class="stage__screens">${card(projects[0], 0)}${card(projects[1], 1)}${card(projects[3], 2, 3)}</div></div></section>`;
}

function heroB() {
  return `<section class="hero hero-b" id="inicio">
    <header>${logo}${nav}</header>
    <div class="hero-b__grid">
      <div class="hero-b__intro"><p class="eyebrow">Diseño + software + IA</p><h1>El siguiente paso<br />de tu negocio.</h1></div>
      <div class="proof-feature">
        <button class="project-open proof-primary" data-project="0" type="button" aria-label="Ver proyecto REI"><img src="assets/rei.jpg" alt="Captura del sitio de REI" fetchpriority="high" /></button>
        <button class="project-open proof-secondary" data-project="1" type="button" aria-label="Ver proyecto Vistacampo"><img src="assets/vistacampo.jpg" alt="Captura del sitio de Vistacampo" /></button>
        <p class="proof-caption">Trabajo seleccionado · REI / Vistacampo</p>
      </div>
      <aside class="service-rail"><h2>Un estudio.<br />Del problema al producto.</h2><p>Diseñamos y construimos sistemas que conectan tu negocio.</p><a href="#servicios">Agentes de IA <span>↗</span></a><a href="#servicios">Software a medida <span>↗</span></a><a href="#servicios">Diseño de producto <span>↗</span></a><a class="button button-dark rail-cta" href="#contacto">Cuéntanos tu proyecto ↗</a></aside>
    </div>
  </section>`;
}

function heroC() {
  return `<section class="hero hero-c" id="inicio">
    <header>${logo}${nav}</header>
    <div class="hero-c__copy"><p class="eyebrow">Estudio independiente · Diseño, software e IA</p><h1>De idea.<br />A sistema.</h1><span class="poster-arrow" aria-hidden="true">↗</span>
      <div class="poster-bottom"><div><p>Productos digitales y agentes de IA.<br />Diseñados para tu operación.</p><a class="text-cta" href="#contacto">Cuéntanos tu proyecto ↗</a></div>
        <figure class="poster-art"><figcaption>Del estudio · Vistacampo ↗</figcaption><button class="project-open" data-project="1" type="button" aria-label="Ver proyecto Vistacampo"><img src="assets/vistacampo.jpg" alt="Captura del sitio de Vistacampo" fetchpriority="high" /></button></figure>
      </div>
      <div class="hero-c__footer"><span>Hecho en Latinoamérica. Para negocios de verdad.</span><span>allok.fun</span></div>
    </div>
  </section>`;
}

function shared() {
  return `<section class="work-section" id="trabajo"><div class="section-head"><p class="eyebrow">Trabajo seleccionado</p><h2>Lo que hacemos<br /><span>queda funcionando.</span></h2><p>Desde la primera pantalla hasta la operación del día a día. Una selección de productos y sitios construidos por allok.</p></div><div class="work-grid">${projects.slice(0, 3).map((project, index) => card(project, index)).join('')}</div></section><section class="services" id="servicios"><div class="services__intro"><p class="eyebrow">Tres puertas de entrada</p><h2>La complejidad<br />la absorbemos nosotros.</h2></div><div class="service-list"><details open><summary>Agentes de IA<span aria-hidden="true">+</span></summary><p>Agentes para WhatsApp y voz que responden con tu información, califican oportunidades y pasan a una persona lo que requiere criterio.</p></details><details><summary>Software a medida<span aria-hidden="true">+</span></summary><p>Herramientas internas, CRM y operaciones conectadas a la forma real en que trabaja tu negocio.</p></details><details><summary>Diseño de producto<span aria-hidden="true">+</span></summary><p>De la arquitectura al último detalle de interfaz: productos digitales que tu equipo puede entender y usar.</p></details></div></section><section class="method" id="estudio"><p class="eyebrow">Cómo trabajamos</p><div class="method-grid"><div><h3>Entender</h3><p>Miramos el negocio antes de proponer una pantalla.</p></div><div><h3>Construir</h3><p>Diseñamos y lanzamos en ciclos cortos que puedes probar.</p></div><div><h3>Dejar andando</h3><p>Documentamos, medimos y dejamos todo a tu nombre.</p></div></div></section><section class="contact" id="contacto"><p class="eyebrow">¿Tienes un cuello de botella?</p><h2>Hagamos que<br /><em>se mueva.</em></h2><a href="mailto:hi@allok.fun">hi@allok.fun <span>↗</span></a><p class="contact__note">Adrián Avila Molina · fundador y operador independiente.<br />Ingeniero industrial, diseñador y constructor de sistemas.</p></section><footer><span class="logo">all<span class="logo-dot" aria-hidden="true"></span>k</span><span>© 2026 · prototipo visual</span><a href="#inicio">Arriba ↑</a></footer>`;
}

function render() {
  document.querySelector('#app').innerHTML = `${variant === 'A' ? heroA() : variant === 'B' ? heroB() : heroC()}${shared()}`;
  document.querySelector('#variant-name').textContent = variants[variant];
  document.title = `allok · ${variants[variant].slice(4)}`;
  document.querySelectorAll('.project-open').forEach((button) => button.addEventListener('click', () => openLightbox(Number(button.dataset.project), button)));
}

function setVariant(next) {
  const keys = Object.keys(variants); const index = keys.indexOf(variant); variant = keys[(index + next + keys.length) % keys.length];
  history.replaceState({}, '', `?variant=${variant}`); render(); window.scrollTo({ top: 0, behavior: 'instant' }); document.querySelector('#app').scrollTo({ top: 0, behavior: 'instant' });
}

let lastFocus;
let lightboxOpen = false;
function openLightbox(index, trigger) {
  lastFocus = trigger; const item = projects[index]; if (!item) return; const box = document.querySelector('#lightbox');
  document.querySelector('#lightbox-image').src = item.src; document.querySelector('#lightbox-image').alt = item.alt;
  document.querySelector('#lightbox-caption').innerHTML = `<b>${item.name}</b><span>${item.kind} · captura real de proyecto</span>`;
  lightboxOpen = true; document.body.classList.add('modal-open'); document.querySelector('#app').setAttribute('inert', ''); document.querySelector('.switcher').setAttribute('inert', ''); document.querySelector('.skip-link').setAttribute('inert', '');
  box.classList.add('is-open'); box.setAttribute('aria-hidden', 'false'); document.querySelector('.lightbox__close').focus();
}
function closeLightbox() { if (!lightboxOpen) return; const box = document.querySelector('#lightbox'); lightboxOpen = false; box.classList.remove('is-open'); box.setAttribute('aria-hidden', 'true'); document.body.classList.remove('modal-open'); document.querySelector('#app').removeAttribute('inert'); document.querySelector('.switcher').removeAttribute('inert'); document.querySelector('.skip-link').removeAttribute('inert'); lastFocus?.focus(); }

document.querySelector('#prev').addEventListener('click', () => setVariant(-1)); document.querySelector('#next').addEventListener('click', () => setVariant(1));
document.querySelector('.lightbox__close').addEventListener('click', closeLightbox); document.querySelector('#lightbox').addEventListener('click', (event) => { if (event.target.id === 'lightbox') closeLightbox(); });
document.addEventListener('keydown', (event) => {
  if (lightboxOpen) {
    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'Tab') { event.preventDefault(); document.querySelector('.lightbox__close').focus(); }
    return;
  }
  if (event.target.matches('input, textarea, [contenteditable]')) return;
  if (event.key === 'ArrowLeft') { event.preventDefault(); setVariant(-1); } if (event.key === 'ArrowRight') { event.preventDefault(); setVariant(1); }
});
render();
