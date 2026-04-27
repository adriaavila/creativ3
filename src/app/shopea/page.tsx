
"use client";
import { useEffect } from 'react';
import './shopea.css';

export default function ShopeaPage() {
  useEffect(() => {
    // Horizontal scroll logic
    const hWrap = document.querySelector('.horizontal-wrap') as HTMLElement;
    const hTrack = document.getElementById('hTrack') as HTMLElement;
    function updateHorizontalScroll() {
      if (!hWrap || !hTrack) return;
      if (window.innerWidth <= 900) {
        hTrack.style.transform = 'none';
        return;
      }
      const rect = hWrap.getBoundingClientRect();
      const total = hWrap.offsetHeight - window.innerHeight;
      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / total));
      const maxTranslate = hTrack.scrollWidth - window.innerWidth;
      hTrack.style.transform = `translateX(${-progress * maxTranslate}px)`;
    }
    
    window.addEventListener('scroll', updateHorizontalScroll, { passive: true });
    window.addEventListener('resize', updateHorizontalScroll);
    updateHorizontalScroll();

    // FAQ logic
    const faqItems = document.querySelectorAll('.faq-item');
    const toggleFaq = function(this: HTMLElement) { this.classList.toggle('open'); };
    faqItems.forEach(item => {
      item.addEventListener('click', toggleFaq as EventListener);
    });

    // Marquee logic
    const track = document.querySelector('.marquee-track') as HTMLElement;
    if (track && track.children.length > 0 && !track.dataset.duplicated) {
      track.innerHTML = track.innerHTML + track.innerHTML;
      track.dataset.duplicated = 'true';
    }

    // Currency toggle logic
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    const checkoutItems = document.querySelector('.checkout-items');
    const checkoutTotal = document.querySelector('.checkout-total .val') as HTMLElement;
    
    const handleToggle = (e: Event) => {
      const btn = e.currentTarget as HTMLElement;
      e.stopPropagation();
      toggleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const isUsd = (btn.textContent || '').trim().includes('$');
      if (checkoutItems && checkoutTotal) {
        if (isUsd) {
          checkoutItems.innerHTML = `
            <div class="row"><span>Torta tres leches</span><span>$ 25,00</span></div>
            <div class="row"><span>Cupcakes x12</span><span>$ 18,00</span></div>
            <div class="row"><span>Galletas x10</span><span>$ 15,00</span></div>`;
          checkoutTotal.textContent = '$ 58,00';
          checkoutTotal.style.color = 'var(--moss)';
        } else {
          checkoutItems.innerHTML = `
            <div class="row"><span>Torta tres leches</span><span>Bs 1.081</span></div>
            <div class="row"><span>Cupcakes x12</span><span>Bs 779</span></div>
            <div class="row"><span>Galletas x10</span><span>Bs 650</span></div>`;
          checkoutTotal.textContent = 'Bs 2.510';
          checkoutTotal.style.color = 'var(--terracotta)';
        }
      }
    };
    
    toggleBtns.forEach(btn => btn.addEventListener('click', handleToggle));

    return () => {
      window.removeEventListener('scroll', updateHorizontalScroll);
      window.removeEventListener('resize', updateHorizontalScroll);
      faqItems.forEach(item => item.removeEventListener('click', toggleFaq as EventListener));
      toggleBtns.forEach(btn => btn.removeEventListener('click', handleToggle));
    };
  }, []);

  return (
    <div className="shopea-page-wrapper">
      

<nav>
  <a href="#" className="logo">Shop<em>ea</em><span className="logo-dot"></span></a>
  <ul>
    <li><a href="#como">Cómo funciona</a></li>
    <li><a href="#pagos">Pagos</a></li>
    <li><a href="#precios">Precios</a></li>
    <li><a href="#faq">Preguntas</a></li>
  </ul>
  <a href="#final" className="cta">Empezar gratis</a>
</nav>

<header className="hero">
  <div className="price-card">
    <div className="price-card-head">Así lo ve tu cliente</div>
    <div className="price-card-product">
      <div className="price-card-emoji">🎂</div>
      <div>
        <div className="price-card-name">Torta tres leches</div>
        <div className="price-card-meta">Dulces Mariana · Las Mercedes</div>
      </div>
    </div>
    <div className="price-row usd">
      <span className="tag">Paga en divisa</span>
      <strong>$25,00</strong>
    </div>
    <div className="price-row bs">
      <span className="tag">Paga en bolívares</span>
      <strong>Bs 1.081</strong>
    </div>
  </div>

  <div className="hero-tag">
    <span className="pulse"></span>
    Hecho en Caracas, para Caracas
  </div>

  <h1>
    <span className="word"><span style={{ animationDelay: ".1s" }}>Vende</span></span>
    <span className="word"><span style={{ animationDelay: ".2s" }}>en</span></span>
    <span className="word"><span className="italic" style={{ animationDelay: ".3s" }}>línea</span></span>
    <br />
    <span className="word"><span style={{ animationDelay: ".45s" }}>como</span></span>
    <span className="word"><span style={{ animationDelay: ".55s" }}>si</span></span>
    <span className="word"><span style={{ animationDelay: ".65s" }}>fuera</span></span>
    <span className="word"><span style={{ animationDelay: ".75s" }}>por</span></span>
    <span className="word"><span className="italic underline" style={{ animationDelay: ".85s" }}>
      WhatsApp.
      <svg viewBox="0 0 300 30" fill="none" preserveAspectRatio="none">
        <path d="M2 22 Q 75 8, 150 16 T 298 14" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/>
      </svg>
    </span></span>
    <br />
    <span className="word"><span style={{ animationDelay: "1s" }}>Pero</span></span>
    <span className="word"><span style={{ animationDelay: "1.1s" }}>en</span></span>
    <span className="word"><span className="italic" style={{ animationDelay: "1.2s" }}>serio.</span></span>
  </h1>

  <p className="hero-sub">
    <strong>Shopea</strong> es tu <em>catálogo, checkout y cobro</em> en un solo link. Subes tus productos una vez, tu cliente elige si paga en divisa o bolívares, y te cae el pedido al WhatsApp con el total correcto. Todo lo que hace falta para vender mejor que en <em>Facebook Marketplace</em>.
  </p>

  <div className="hero-bottom">
    <a href="#final" className="hero-cta">
      Crea tu tienda, es gratis
      <span className="arrow">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 11L11 3M11 3H5M11 3V9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
    </a>
    <a href="#como" className="hero-secondary">
      Ver cómo funciona
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M3 1.5L9 6L3 10.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    </a>
    <span className="hero-note">¡en 4 minutos!</span>
  </div>
</header>

<div className="marquee">
  <div className="marquee-track">
    <span>
      Dulces de abuela <span className="flower">✿</span>
      Ropa por pedido <span className="flower">✿</span>
      Barberías del Este <span className="flower">✿</span>
      Electrodomésticos Catia <span className="flower">✿</span>
      Bodegones en Las Mercedes <span className="flower">✿</span>
      Manicuristas de Chacao <span className="flower">✿</span>
      Tenis usados como nuevos <span className="flower">✿</span>
      Tequeños por encargo <span className="flower">✿</span>
      Muebles del abuelo <span className="flower">✿</span>
      Cachapas en Altamira <span className="flower">✿</span>
    </span>
  </div>
</div>

{/*  VS FB MARKETPLACE  */}
<section className="vs-section">
  <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
    <div className="section-label">Te sonará familiar</div>
    <h2 style={{ fontFamily: "var(--serif)", fontSize: "clamp(44px, 6vw, 92px)", fontWeight: "400", lineHeight: "0.95", letterSpacing: "-0.03em", maxWidth: "1100px", marginBottom: "60px" }}>
      Si vendes por <em style={{ fontStyle: "italic", color: "var(--terracotta)" }}>Marketplace</em>, ya sabes lo pesado que es esto.
    </h2>
  </div>
  <div className="vs-grid">
    <div className="vs-box vs-before">
      <span className="vs-label">Antes · por Facebook</span>
      <h3 className="vs-title">La vida <em>complicada.</em></h3>
      <div className="vs-items">
        <div className="vs-item"><span className="mark">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 2L8 8M8 2L2 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
        </span>&quot;¿Cuánto cuesta hoy?&quot; diez veces al día por WhatsApp.</div>
        <div className="vs-item"><span className="mark">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 2L8 8M8 2L2 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
        </span>Recalcular precios cada vez que el dólar se mueve.</div>
        <div className="vs-item"><span className="mark">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 2L8 8M8 2L2 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
        </span>Capturas de Pago Móvil, confirmar, volver a confirmar.</div>
        <div className="vs-item"><span className="mark">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 2L8 8M8 2L2 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
        </span>Perder ventas porque el cliente se aburre de preguntar.</div>
        <div className="vs-item"><span className="mark">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 2L8 8M8 2L2 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
        </span>Tu negocio vive entre grupos de Facebook y mensajes sueltos.</div>
      </div>
    </div>
    <div className="vs-box vs-after">
      <span className="vs-label">Ahora · con Shopea</span>
      <h3 className="vs-title">La vida <em>sencilla.</em></h3>
      <div className="vs-items">
        <div className="vs-item"><span className="mark">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7L8 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </span>Tu link dice el precio. Se acabó la pregunta.</div>
        <div className="vs-item"><span className="mark">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7L8 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </span>Precios en Bs y en divisa actualizados solos.</div>
        <div className="vs-item"><span className="mark">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7L8 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </span>El cliente elige cómo pagar. Tú solo confirmas.</div>
        <div className="vs-item"><span className="mark">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7L8 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </span>Pedidos ordenaditos al WhatsApp, con total y datos.</div>
        <div className="vs-item"><span className="mark">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7L8 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </span>Mismo link, sirve para FB, Insta, status, todos lados.</div>
      </div>
    </div>
  </div>
</section>

{/*  HORIZONTAL SCROLL: cómo funciona  */}
<section className="horizontal-section" id="como">
  <div className="horizontal-wrap">
    <div className="horizontal-sticky">
      <div className="horizontal-track" id="hTrack">

        <div className="h-intro">
          <div className="section-label">Cómo funciona</div>
          <h2>Cuatro pasos. <em>Cero</em> calculadora. Cero dramas.</h2>
          <div className="hint">
            Deslizá para ver
            <svg width="40" height="20" viewBox="0 0 40 20" fill="none">
              <path d="M2 10H36M36 10L28 3M36 10L28 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        <div className="h-card h-card-1">
          <div className="card-meta">
            <div className="card-num">01</div>
            <h3 className="card-title">Subes <em>lo que vendes</em></h3>
            <p className="card-body">
              Foto, nombre, precio en dólares. Nosotros calculamos el precio en bolívares automáticamente con la tasa del día, y tú decides si quieres dar un pequeño descuento a quien pague en divisa.
            </p>
          </div>
          <div className="card-visual">
            <div className="setup-row">
              <div className="setup-emoji">🎂</div>
              <div>
                <div className="setup-name">Torta tres leches</div>
                <div className="setup-sub">repostería</div>
              </div>
              <div className="setup-prices">
                <span className="setup-price-chip chip-usd">$ 25,00</span>
                <span className="setup-price-chip chip-bs">Bs 1.081</span>
              </div>
            </div>
            <div className="setup-row" style={{ marginTop: "10px" }}>
              <div className="setup-emoji">🧁</div>
              <div>
                <div className="setup-name">Cupcakes x12</div>
                <div className="setup-sub">repostería</div>
              </div>
              <div className="setup-prices">
                <span className="setup-price-chip chip-usd">$ 18,00</span>
                <span className="setup-price-chip chip-bs">Bs 779</span>
              </div>
            </div>
            <div className="setup-config">
              <div>
                <div className="setup-config-label">Recargo paga en Bs</div>
                <div className="setup-config-val">+5%</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="setup-config-label">Tasa hoy</div>
                <div className="setup-config-val">Bs 41,18</div>
              </div>
            </div>
            <div className="setup-note">↑ todo se actualiza solito ↑</div>
          </div>
        </div>

        <div className="h-card h-card-2">
          <div className="card-meta">
            <div className="card-num">02</div>
            <h3 className="card-title">Compartes <em>tu link</em></h3>
            <p className="card-body">
              Pega tu link en Facebook Marketplace, en tu bio de Instagram, en el grupo del edificio, en tu status de WhatsApp. El mismo link sirve para todo. Tu vitrina abre 24/7, tus clientes llegan solos.
            </p>
          </div>
          <div className="card-visual link-demo">
            <div className="mini-url">
              <span className="dot"></span>
              shopea.online/dulcesmariana
            </div>
            <div className="mini-phone">
              <div className="mini-phone-title">Dulces <em>Mariana</em></div>
              <div className="mini-phone-sub">Repostería · Las Mercedes</div>
              <div className="mini-product">
                <div className="mini-product-img">🎂</div>
                <div className="mini-product-info">
                  <div className="mini-product-name">Torta tres leches</div>
                  <div className="mini-product-dual">
                    <span className="usd">$25</span>·<span className="bs">Bs 1.081</span>
                  </div>
                </div>
              </div>
              <div className="mini-product">
                <div className="mini-product-img">🧁</div>
                <div className="mini-product-info">
                  <div className="mini-product-name">Cupcakes x12</div>
                  <div className="mini-product-dual">
                    <span className="usd">$18</span>·<span className="bs">Bs 779</span>
                  </div>
                </div>
              </div>
              <div className="mini-product">
                <div className="mini-product-img">🍪</div>
                <div className="mini-product-info">
                  <div className="mini-product-name">Galletas deco</div>
                  <div className="mini-product-dual">
                    <span className="usd">$1,50</span>·<span className="bs">Bs 65</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="h-card h-card-3">
          <div className="card-meta">
            <div className="card-num">03</div>
            <h3 className="card-title">Tu cliente <em>elige cómo pagar</em></h3>
            <p className="card-body">
              Arma su pedido y decide: ¿divisa o bolívares? El total se actualiza al instante. Ve los métodos de pago que tú configuraste: Pago Móvil, Zelle, Binance, efectivo. Cero malentendidos, cero &quot;¿cuánto me sale en Bs?&quot;.
            </p>
          </div>
          <div className="card-visual checkout-demo">
            <div className="checkout-head">Tu pedido</div>
            <div className="checkout-sub">Dulces Mariana · 3 productos</div>

            <div className="currency-toggle">
              <div className="toggle-btn">Paga en $</div>
              <div className="toggle-btn active">Paga en Bs</div>
            </div>

            <div className="checkout-items">
              <div className="row"><span>Torta tres leches</span><span>Bs 1.081</span></div>
              <div className="row"><span>Cupcakes x12</span><span>Bs 779</span></div>
              <div className="row"><span>Galletas x10</span><span>Bs 650</span></div>
            </div>

            <div className="checkout-total">
              <div className="label">Total</div>
              <div className="val">Bs 2.510</div>
            </div>

            <div className="pay-methods">
              <div className="pay-method hl">Pago Móvil</div>
              <div className="pay-method">Transf.</div>
              <div className="pay-method">Zelle</div>
              <div className="pay-method">Binance</div>
            </div>
          </div>
        </div>

        <div className="h-card h-card-4">
          <div className="card-meta">
            <div className="card-num">04</div>
            <h3 className="card-title">Te llega <em>ordenadito</em></h3>
            <p className="card-body">
              Te cae el pedido al WhatsApp con todo claro: qué pidió, cuánto, en qué moneda, con qué método. Respondes tus datos de pago y listo. Tú cobras directo, Shopea no toca tu plata. Es como vender por WhatsApp, pero sin el caos.
            </p>
          </div>
          <div className="card-visual wa-demo">
            <div className="wa-header">
              <div className="wa-avatar">🛍️</div>
              <div className="wa-header-info">
                <div className="wa-name">Shopea · Pedido</div>
                <div className="wa-status">Nuevo · hace 8 seg</div>
              </div>
            </div>
            <div className="wa-messages">
              <div className="wa-msg them">
                <span className="wa-badge">Pedido #104</span>
                👋 Hola! Soy Carla, quiero:
                <br />• 1x Torta tres leches
                <br />• 1 docena cupcakes
                <br />• 10x Galletas
              </div>
              <div className="wa-msg them">
                <strong>Total: Bs 2.510</strong><br />
                💳 Pago Móvil<br />
                📍 Delivery a Los Palos Grandes
                <div className="time">10:42</div>
              </div>
              <div className="wa-msg me">
                Lista! Datos de Pago Móvil:<br />
                Banesco · 0424-xxxx<br />
                Cédula: V-xxx
                <div className="time">10:43 ✓✓</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</section>

{/*  QUOTE  */}
<section className="quote">
  <div className="quote-mark">&rdquo;</div>
  <p>
    Antes vivía pegada a la <em>calculadora</em> del teléfono. Ahora los pedidos me llegan <em>ordenaditos</em>, con el total en Bs o en divisa según elija el cliente. Dejé de perder ventas por no contestar rápido.
  </p>
  <div className="quote-author">
    <div className="quote-avatar">👩🏽</div>
    <div className="quote-author-info">
      <strong>Mariana Pérez</strong>
      <span>Dulces Mariana · Las Mercedes</span>
    </div>
  </div>
</section>

{/*  PAYMENT METHODS RAIL  */}
<section className="rail-section" id="pagos">
  <div className="rail-wrap">
    <div className="rail-top">
      <h3>Cobra como <em>a ti te guste</em>, en la moneda que <em>te convenga.</em></h3>
      <p>Tú decides qué métodos aceptar. Tu cliente elige con cuál pagar. Shopea no se queda con ni un céntimo.</p>
    </div>
    <div className="rail-methods">
      <div className="rail-card">
        <div className="rail-card-icon">📱</div>
        <h4>Pago Móvil</h4>
        <div className="currency">Bolívares</div>
        <p>El de todos los días, el favorito para delivery en Caracas.</p>
      </div>
      <div className="rail-card">
        <div className="rail-card-icon">🏦</div>
        <h4>Transferencia</h4>
        <div className="currency">Bolívares</div>
        <p>Banesco, Mercantil, BDV. Tu número de cuenta, tu plata.</p>
      </div>
      <div className="rail-card">
        <div className="rail-card-icon">💵</div>
        <h4>Zelle</h4>
        <div className="currency">Divisa</div>
        <p>Para clientes con cuenta en USA o que reciben remesas.</p>
      </div>
      <div className="rail-card">
        <div className="rail-card-icon">₿</div>
        <h4>Binance Pay</h4>
        <div className="currency">Divisa · USDT</div>
        <p>Rápido, sin comisiones, cada vez más usado en el país.</p>
      </div>
      <div className="rail-card">
        <div className="rail-card-icon">💶</div>
        <h4>Efectivo</h4>
        <div className="currency">Divisa o Bs</div>
        <p>Contra entrega, contraentrega, como le digas. Clásico.</p>
      </div>
      <div className="rail-card">
        <div className="rail-card-icon">💳</div>
        <h4>Punto de venta</h4>
        <div className="currency">Bolívares</div>
        <p>Si recibes en tu local o en domicilio, también va.</p>
      </div>
      <div className="rail-card">
        <div className="rail-card-icon">🔄</div>
        <h4>PayPal</h4>
        <div className="currency">Divisa</div>
        <p>Para clientes de la diáspora que te mandan desde afuera.</p>
      </div>
      <div className="rail-card">
        <div className="rail-card-icon">✨</div>
        <h4>+ Lo que uses</h4>
        <div className="currency">Libre</div>
        <p>Nequi, Wally, Reserve, lo que sea. Tú agregas, tu cliente ve.</p>
      </div>
    </div>
  </div>
</section>

{/*  PRICING  */}
<section className="pricing-section" id="precios">
  <div className="section-heading">
    <div className="section-label">Cuánto cuesta</div>
    <h2>Empieza <em>gratis.</em> Crece sin techo.</h2>
  </div>
  <div className="pricing-grid">
    <div className="plan">
      <div className="plan-name">Plan Bodega</div>
      <div className="plan-price">$0<span className="per">/ mes</span></div>
      <p className="plan-desc">Para arrancar hoy, probar sin riesgo y vender esta misma semana.</p>
      <ul>
        <li><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8L6.5 11.5L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>Hasta 30 productos</li>
        <li><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8L6.5 11.5L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>Precios duales Bs / divisa automáticos</li>
        <li><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8L6.5 11.5L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>Pedidos ilimitados por WhatsApp</li>
        <li><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8L6.5 11.5L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>Métodos de pago ilimitados</li>
        <li><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8L6.5 11.5L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>Link shopea.online/tutienda</li>
        <li><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8L6.5 11.5L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>Con nuestra marquita (discreta)</li>
      </ul>
      <a href="#" className="plan-cta">Empezar gratis</a>
    </div>

    <div className="plan featured">
      <div className="plan-badge">¡más pedido!</div>
      <div className="plan-name">Plan Bodegón</div>
      <div className="plan-price">$4<sup>.99</sup><span className="per">/ mes</span></div>
      <p className="plan-desc">Para cuando ya cogiste vuelo y quieres verte pro de verdad.</p>
      <ul>
        <li><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8L6.5 11.5L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>Productos ilimitados</li>
        <li><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8L6.5 11.5L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>Tu propio dominio (.com, .shop, .store)</li>
        <li><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8L6.5 11.5L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>Tasa BCV + Paralelo, elige cuál mostrar</li>
        <li><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8L6.5 11.5L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>Precios duales personalizados por producto</li>
        <li><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8L6.5 11.5L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>Sin marca Shopea</li>
        <li><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8L6.5 11.5L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>Analytics: qué productos se ven, qué se pide</li>
        <li><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8L6.5 11.5L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>Cupones y descuentos</li>
        <li><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8L6.5 11.5L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>Soporte prioritario por WhatsApp</li>
      </ul>
      <a href="#" className="plan-cta">Probar 14 días gratis</a>
    </div>
  </div>
</section>

{/*  FAQ  */}
<section className="faq-section" id="faq">
  <div className="section-heading">
    <div className="section-label">Lo de siempre</div>
    <h2>Las <em>preguntas</em> que todos hacen.</h2>
  </div>

  <div className="faq-wrap">
    <div className="faq-item">
      <div className="faq-q">
        <span>¿Puedo <em>seguir usando</em> FB Marketplace?</span>
        <span className="plus"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1V13M1 7H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></span>
      </div>
      <div className="faq-a">Claro que sí, no te queremos hacer mudar de casa. Shopea es el complemento: tú sigues publicando en Facebook Marketplace, Instagram o grupos de WhatsApp, pero en vez de mandar el precio por mensaje, pones tu link de Shopea. El cliente ve todo claro, hace el pedido y a ti te llega ordenado. Es usar lo que ya tienes, pero mejor.</div>
    </div>
    <div className="faq-item">
      <div className="faq-q">
        <span>¿Cómo manejo <em>precios en Bs y en divisa?</em></span>
        <span className="plus"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1V13M1 7H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></span>
      </div>
      <div className="faq-a">Tú pones el precio en dólares y nosotros calculamos el precio en Bs automáticamente con la tasa del día. Puedes configurar un recargo para quien pague en Bs (por ejemplo +5%, porque sabemos que cobrar en bolívares tiene sus riesgos) o dejarlo igual. Y si algún producto tiene un margen distinto, puedes sobreescribir el precio en Bs manualmente. Control total, cero dolor de cabeza.</div>
    </div>
    <div className="faq-item">
      <div className="faq-q">
        <span>¿De dónde sale <em>la tasa del dólar?</em></span>
        <span className="plus"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1V13M1 7H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></span>
      </div>
      <div className="faq-a">Tomamos la tasa oficial del BCV y la paralela de fuentes públicas (Monitor Dólar, EnParaleloVzla). Tú decides cuál usar. En el plan Bodegón puedes incluso mostrar las dos para que tu cliente sepa a qué tasa le estás cobrando. Se actualiza cada hora, sin que hagas nada.</div>
    </div>
    <div className="faq-item">
      <div className="faq-q">
        <span>¿Ustedes se quedan con <em>comisión de mis ventas?</em></span>
        <span className="plus"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1V13M1 7H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></span>
      </div>
      <div className="faq-a">No. Cero. Nada. Tu cliente te paga directo a tu Pago Móvil, tu Zelle, tu Binance. Nosotros no tocamos tu plata nunca, no tenemos pasarela, no somos intermediarios. Cobramos una suscripción fija y ya. Tu plata es tu plata.</div>
    </div>
    <div className="faq-item">
      <div className="faq-q">
        <span>¿Necesito saber <em>de computación?</em></span>
        <span className="plus"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1V13M1 7H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></span>
      </div>
      <div className="faq-a">Cero. Si subes fotos a Instagram, puedes usar Shopea. Abres tu tienda desde el celular, subes una foto, le pones precio y listo. En 4 minutos ya tienes tu link para compartir. Y si te atoras, nos escribes al WhatsApp y te ayudamos en vivo.</div>
    </div>
    <div className="faq-item">
      <div className="faq-q">
        <span>¿Puedo <em>cancelar</em> cuando quiera?</span>
        <span className="plus"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1V13M1 7H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></span>
      </div>
      <div className="faq-a">Cuando quieras, sin letra chica. Cancelas con un botón, tu tienda se queda en el plan gratis con tus productos intactos. No perdemos amigos por plata.</div>
    </div>
    <div className="faq-item">
      <div className="faq-q">
        <span>¿Y si vendo <em>servicios</em>, no productos?</span>
        <span className="plus"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1V13M1 7H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></span>
      </div>
      <div className="faq-a">También te sirve. Manicuristas, barberos, fotógrafos, tatuadores: ponen sus servicios con precio y el cliente pide cita por WhatsApp. En unos meses sacamos AgendaBella, una versión con calendario de citas. Si eres del gremio, anótate y te avisamos primero.</div>
    </div>
  </div>
</section>

{/*  FINAL  */}
<section className="final" id="final">
  <div className="final-inner">
    <div className="scribble">¿listo, listico?</div>
    <h2>Tu próximo cliente <em>ya te está buscando.</em></h2>
    <a href="#" className="final-cta">
      Crear mi tienda gratis
      <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
        <path d="M3 11L11 3M11 3H5M11 3V9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </a>
    <p className="final-meta">Sin tarjeta · Sin compromiso · 4 minutos y estás vendiendo</p>
  </div>
</section>

<footer>
  <div className="footer-wordmark">Shop<em>ea</em>.</div>
  <div className="footer-bottom">
    <div>
      <a href="#">Términos</a>
      <a href="#">Privacidad</a>
      <a href="#">Contacto</a>
    </div>
    <div>© 2026 Servicios Creativos · Caracas · Hecho con cariño y cafecito</div>
  </div>
</footer>


    </div>
  );
}

