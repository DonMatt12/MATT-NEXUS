/* MATT NEXUS — interactions */

// === Reveal on scroll ===
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// === Case study expansion ===
document.addEventListener('click', (e) => {
  const head = e.target.closest('[data-case-toggle]');
  if (!head) return;
  const card = head.closest('.case-card');
  card.classList.toggle('open');
});

// === FAQ accordion ===
document.addEventListener('click', (e) => {
  const head = e.target.closest('.faq-item__head');
  if (!head) return;
  const item = head.closest('.faq-item');
  const open = item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
  if (!open) item.classList.add('open');
});

// === Live clock for hero readout ===
function tickClock() {
  const el = document.querySelector('[data-clock]');
  if (!el) return;
  const d = new Date();
  const z = (n) => String(n).padStart(2, '0');
  el.textContent = `${z(d.getUTCHours())}:${z(d.getUTCMinutes())}:${z(d.getUTCSeconds())} UTC`;
}
setInterval(tickClock, 1000); tickClock();

// === Animated counters ===
function animateCounter(el) {
  const target = parseFloat(el.dataset.count);
  const decimals = parseInt(el.dataset.decimals || '0', 10);
  const dur = 1600;
  const start = performance.now();
  const ease = t => 1 - Math.pow(1 - t, 3);
  function step(now) {
    const p = Math.min(1, (now - start) / dur);
    const v = target * ease(p);
    el.textContent = decimals ? v.toFixed(decimals) : Math.round(v).toString();
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
const counterIO = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { animateCounter(e.target); counterIO.unobserve(e.target); }
  });
}, { threshold: 0.5 });
document.querySelectorAll('[data-count]').forEach(el => counterIO.observe(el));

// === Parallax (lightweight) ===
const parallaxEls = document.querySelectorAll('[data-parallax]');
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  parallaxEls.forEach(el => {
    const speed = parseFloat(el.dataset.parallax) || 0.1;
    el.style.transform = `translate3d(0, ${y * speed}px, 0)`;
  });
}, { passive: true });

// === Playground: Lead qualifier chatbot ===
const PLAYGROUND_FLOW = [
  { q: "Hola. Soy NEXUS-01, el agente diagnóstico de MATT Nexus. ¿En qué área crees que tu operación pierde más tiempo hoy?", options: ["Atención al cliente", "Cobranzas / cartera", "Inventario / pedidos", "Reportes manuales"] },
  { q: "Entendido. ¿Cuántas personas dedican >2h diarias a esa tarea?", options: ["1 persona", "2–5 personas", "6–15 personas", "Todo un equipo"] },
  { q: "¿Tus sistemas hablan entre sí, o trabajan en silos?", options: ["Silos totales", "Algunas integraciones", "Stack moderno", "No estoy seguro"] },
  { q: "Última pregunta: ¿qué buscas resolver primero?", options: ["Recuperar tiempo", "Reducir errores", "Escalar sin contratar", "Visibilidad real"] }
];

class Playground {
  constructor(root) {
    this.root = root;
    this.feed = root.querySelector('[data-feed]');
    this.actions = root.querySelector('[data-actions]');
    this.step = 0;
    this.answers = [];
    this.start();
  }
  type(text, who = 'bot') {
    return new Promise((resolve) => {
      const row = document.createElement('div');
      row.className = `pg-msg pg-msg--${who}`;
      const label = document.createElement('div');
      label.className = 'pg-msg__label';
      label.textContent = who === 'bot' ? 'NEXUS-01' : 'YOU';
      const bubble = document.createElement('div');
      bubble.className = 'pg-msg__bubble';
      row.appendChild(label); row.appendChild(bubble);
      this.feed.appendChild(row);
      this.feed.scrollTop = this.feed.scrollHeight;

      if (who === 'user') { bubble.textContent = text; resolve(); return; }

      let i = 0;
      const tick = () => {
        bubble.textContent = text.slice(0, i++);
        this.feed.scrollTop = this.feed.scrollHeight;
        if (i <= text.length) setTimeout(tick, 14);
        else resolve();
      };
      tick();
    });
  }
  async start() {
    this.feed.innerHTML = '';
    this.actions.innerHTML = '';
    await this.type("Conectando… handshake establecido.", 'bot');
    this.ask();
  }
  async ask() {
    const stepDef = PLAYGROUND_FLOW[this.step];
    if (!stepDef) return this.finish();
    await this.type(stepDef.q, 'bot');
    this.renderOptions(stepDef.options);
  }
  renderOptions(opts) {
    this.actions.innerHTML = '';
    opts.forEach(opt => {
      const b = document.createElement('button');
      b.className = 'pg-opt';
      b.textContent = opt;
      b.addEventListener('click', () => this.answer(opt));
      this.actions.appendChild(b);
    });
  }
  async answer(text) {
    this.actions.innerHTML = '';
    this.answers.push(text);
    await this.type(text, 'user');
    this.step++;
    setTimeout(() => this.ask(), 300);
  }
  async finish() {
    await this.type("Diagnóstico preliminar generado.", 'bot');
    const insight = this.synthesize();
    await this.type(insight, 'bot');
    const b = document.createElement('a');
    b.className = 'pg-opt pg-opt--cta';
    b.textContent = "→ Agendar mi diagnóstico de 20 min";
    b.href = '#diagnostico';
    this.actions.appendChild(b);
    const r = document.createElement('button');
    r.className = 'pg-opt pg-opt--ghost';
    r.textContent = "Reiniciar";
    r.addEventListener('click', () => { this.step = 0; this.answers = []; this.start(); });
    this.actions.appendChild(r);
  }
  synthesize() {
    const [area, people, integration, goal] = this.answers;
    const hoursMap = { '1 persona': 10, '2–5 personas': 35, '6–15 personas': 85, 'Todo un equipo': 160 };
    const h = hoursMap[people] || 30;
    const cost = (h * 4 * 18).toLocaleString('es-ES'); // weekly→monthly @ avg cost
    return `Detecto pérdida estimada de ~${h}h/semana en ${area.toLowerCase()} (≈USD ${cost}/mes). Con foco en "${goal.toLowerCase()}" y nivel de integración "${integration.toLowerCase()}", recomendaría iniciar por una arquitectura de orquestación + capa de observabilidad.`;
  }
}

document.querySelectorAll('[data-playground]').forEach(el => new Playground(el));

// === Tech stack scroll marquee pause on hover ===
document.querySelectorAll('.stack-track').forEach(track => {
  track.addEventListener('mouseenter', () => track.style.animationPlayState = 'paused');
  track.addEventListener('mouseleave', () => track.style.animationPlayState = 'running');
});
