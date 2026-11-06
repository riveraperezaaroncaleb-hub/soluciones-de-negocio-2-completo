'use strict';

const STORAGE_KEY = 'agendo-prototype-v1';
const DEFAULT_SERVICES = [
  { id: 'corte', name: 'Corte', price: 10, duration: 30, selected: true },
  { id: 'barba', name: 'Barba', price: 8, duration: 25, selected: true },
  { id: 'combo', name: 'Corte con Barba', price: 15, duration: 50, selected: true },
];
const DEFAULT_HOURS = [
  { day: 'Lunes', open: true, from: '09:00', to: '18:00' },
  { day: 'Martes', open: true, from: '09:00', to: '18:00' },
  { day: 'Miércoles', open: true, from: '09:00', to: '18:00' },
  { day: 'Jueves', open: true, from: '09:00', to: '18:00' },
  { day: 'Viernes', open: true, from: '09:00', to: '19:00' },
  { day: 'Sábado', open: true, from: '10:00', to: '16:00' },
  { day: 'Domingo', open: false, from: '10:00', to: '16:00' },
];

function initialState() {
  return {
    view: 'onboarding',
    onboardingStep: 1,
    barber: { name: '', phone: '', password: '' },
    services: structuredClone(DEFAULT_SERVICES),
    hours: structuredClone(DEFAULT_HOURS),
    onboarded: false,
    shared: false,
    appointments: [],
    referralApplied: false,
    membership: false,
    membershipId: null,
    membershipMode: 'demo',
    funnel: { registered: 100, services: 74, hours: 68, shared: 53, booked: 39 },
  };
}

let state = loadState();
let remoteBarbershop = null;
let requestedBarberId = '';
let booking = {
  serviceId: '',
  date: '',
  time: '',
  extra: false,
  customerName: '',
  customerPhone: '',
  referralCode: new URLSearchParams(location.search).get('ref') || '',
};
let shareTimer;
let referralAutoApplied = false;

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...initialState(), ...JSON.parse(saved) } : initialState();
  } catch (error) {
    console.error('No se pudo cargar el progreso guardado:', error);
    return initialState();
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('No se pudo guardar el progreso:', error);
    showToast('No se pudo guardar en este dispositivo. Revisa el almacenamiento del navegador.');
  }
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[char]));
}

function currency(amount) {
  return `$${Number(amount).toFixed(2).replace(/\.00$/, '')}`;
}

function toastIcon(icon = '✓') {
  return `<span class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-lime text-ink font-bold">${icon}</span>`;
}

function showToast(message, title = '¡Listo!', icon = '✓') {
  const root = document.getElementById('toast-root');
  root.innerHTML = `<div class="toast card flex max-w-sm items-center gap-3 p-4 shadow-xl">${toastIcon(icon)}<div><div class="font-bold">${escapeHtml(title)}</div><div class="text-sm text-muted">${escapeHtml(message)}</div></div><button class="ml-auto text-muted" onclick="this.parentElement.remove()" aria-label="Cerrar">×</button></div>`;
  window.setTimeout(() => { root.innerHTML = ''; }, 4500);
}

function setView(view) {
  state.view = view;
  saveState();
  render();
}

function activeServices() {
  if (remoteBarbershop?.services) {
    return remoteBarbershop.services.map((service) => ({
      id: String(service.id),
      databaseId: service.id,
      name: service.nombre,
      price: Number(service.precio),
      duration: service.duracionMinutos,
      selected: true,
    }));
  }
  return state.services.filter((service) => service.selected);
}

function barberSlug() {
  const queryName = new URLSearchParams(location.search).get('barber');
  return (queryName || state.barber.name || 'casa-navaja')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function barberName() {
  if (remoteBarbershop?.nombre) return remoteBarbershop.nombre;
  const queryName = new URLSearchParams(location.search).get('barber');
  if (queryName) {
    return queryName.split('-').filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
  }
  if (state.barber.name) return state.barber.name;
  return 'Casa Navaja';
}

function referralCodeFor(name, phone) {
  const namePart = String(name || 'CLIENTE')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 16);
  const phonePart = String(phone || '').replace(/\D/g, '').slice(-4) || String(Date.now()).slice(-4);
  return `${namePart || 'CLIENTE'}-${phonePart}`;
}

function referralLandingLink(code) {
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('vista', 'landing');
  url.searchParams.set('barber', barberSlug());
  const barbershopId = new URLSearchParams(location.search).get('barberId') || state.barbershopId;
  if (barbershopId) url.searchParams.set('barberId', barbershopId);
  url.searchParams.set('ref', code);
  return url.toString();
}

function bookingLink() {
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('vista', 'landing');
  url.searchParams.set('barber', barberSlug());
  if (state.barbershopId) url.searchParams.set('barberId', state.barbershopId);
  return url.toString();
}

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const result = await response.json();
  if (!response.ok) {
    const error = new Error(result.error || `Error del servidor (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return result;
}

async function loadPublicBarbershop(id) {
  try {
    remoteBarbershop = await apiRequest(`/api/public/barbershops/${encodeURIComponent(id)}`);
    render();
  } catch (error) {
    console.error('No se pudo cargar la barbería desde SQL:', error);
    const message = document.getElementById('public-shop-error');
    if (message) {
      message.textContent = 'No se pudo cargar la barbería guardada. Comprueba que SQL esté conectado.';
      message.classList.remove('hidden');
    }
  }
}

function referralApiUrl(code, phone = '') {
  const barberId = new URLSearchParams(location.search).get('barberId') || state.barbershopId;
  if (!barberId) {
    return `/api/demo/referrals/${encodeURIComponent(code)}${phone ? `?phone=${encodeURIComponent(phone)}` : ''}`;
  }
  const query = new URLSearchParams({ barbershopId: barberId });
  if (phone) query.set('phone', phone);
  return `/api/public/referrals/${encodeURIComponent(code)}?${query}`;
}

function navigation() {
  const items = [
    ['onboarding', '✦', 'Mi agenda'],
    ['booking', '▣', 'Vista cliente'],
    ['landing', '⌂', 'Mi barbería'],
    ['dashboard', '▥', 'Panel de control'],
  ];
  return `
    <aside class="sidebar">
      <a href="#" class="mb-12 flex items-center gap-3 text-white no-underline" onclick="navigate('onboarding');return false">
        <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-lime text-xl font-black text-ink">a.</span>
        <span><span class="display block text-xl font-extrabold">agendo</span><span class="text-[10px] tracking-[.2em] text-neutral-500">BARBER EDITION</span></span>
      </a>
      <div class="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.17em] text-neutral-500">Espacio de trabajo</div>
      <nav class="space-y-1">${items.map(([id, icon, label]) => `<button class="nav-btn ${state.view === id ? 'active' : ''}" onclick="navigate('${id}')"><span class="nav-icon">${icon}</span>${label}</button>`).join('')}</nav>
      <div class="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4">
        <div class="mb-2 flex items-center gap-2 text-sm font-bold">${toastIcon('↗')} Comparte y crece</div>
        <p class="mb-3 text-xs leading-5 text-neutral-400">Tu primera reserva está a un link de distancia.</p>
        <button class="w-full rounded-xl bg-lime px-3 py-2.5 text-sm font-bold text-ink" onclick="navigate('landing')">Ver mi barbería →</button>
      </div>
      <div class="mt-5 flex items-center gap-3 border-t border-white/10 pt-5">
        <div class="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-700 font-bold">${escapeHtml((state.barber.name || 'B').slice(0, 1).toUpperCase())}</div>
        <div class="min-w-0"><div class="truncate text-sm font-semibold">${escapeHtml(state.barber.name || 'Tu barbería')}</div><div class="text-xs text-neutral-500">Plan gratuito</div></div>
      </div>
    </aside>
    <nav class="mobile-nav fixed inset-x-0 bottom-0 z-30 justify-around border-t border-neutral-200 bg-white/95 px-2 pt-2 backdrop-blur-md">
      ${items.map(([id, icon, label]) => `<button class="flex min-w-0 flex-col items-center gap-1 px-2 py-1 text-[10px] ${state.view === id ? 'font-bold text-ink' : 'text-muted'}" onclick="navigate('${id}')"><span class="text-lg">${icon}</span>${label}</button>`).join('')}
    </nav>`;
}

function topBar(eyebrow, title, action = '') {
  return `<div class="mb-7 flex flex-wrap items-end justify-between gap-4"><div><div class="mb-2 text-xs font-bold uppercase tracking-[.16em] text-muted">${eyebrow}</div><h1 class="display m-0 text-3xl font-extrabold leading-tight sm:text-4xl">${title}</h1></div>${action}</div>`;
}

function onboardingView() {
  const step = state.onboardingStep;
  const progress = `<div class="mb-7 flex gap-2">${[1, 2, 3].map((number) => `<span class="step-dot ${number <= Math.min(step, 3) ? 'done' : ''}"></span>`).join('')}</div>`;
  let content = '';

  if (step === 1) {
    content = `
      <div class="mb-6"><span class="inline-flex rounded-full bg-lime/40 px-3 py-1.5 text-xs font-bold text-ink">● 2 minutos para empezar</span></div>
      <h2 class="display mb-2 text-3xl font-extrabold leading-tight">Tu talento merece<br>una agenda llena.</h2>
      <p class="mb-7 max-w-md text-sm leading-6 text-muted">Crea tu link de reservas y deja que tus clientes agenden solos. Sin papeleo, sin tarjeta, sin complicaciones.</p>
      ${progress}
      <form class="space-y-4" onsubmit="submitRegistration(event)">
        <label class="block text-sm font-semibold">¿Cómo te llamas?<input required name="name" autocomplete="name" class="input mt-2" placeholder="Ej. Carlos Martínez"></label>
        <label class="block text-sm font-semibold">Tu WhatsApp<input required name="phone" type="tel" inputmode="tel" autocomplete="tel" class="input mt-2" placeholder="+52 55 1234 5678"></label>
        <label class="block text-sm font-semibold">Crea una contraseña<input required name="password" type="password" minlength="6" autocomplete="new-password" class="input mt-2" placeholder="Mínimo 6 caracteres"></label>
        <button class="btn-primary mt-2 flex h-12 w-full items-center justify-center gap-2">Crear mi agenda gratis <span>→</span></button>
      </form>
      <p class="mt-4 text-center text-xs text-muted">Al continuar aceptas nuestros términos. Tus datos fiscales pueden esperar.</p>
      <div class="mt-7 flex items-center justify-center gap-3 border-t border-neutral-100 pt-5 text-xs text-muted"><span class="text-lg">🔒</span> Tus datos están protegidos. Sin tarjeta de crédito.</div>`;
  } else if (step === 2) {
    content = `
      <div class="mb-2 text-sm font-bold text-muted">PASO 2 DE 3 · SERVICIOS</div>
      <h2 class="display mb-2 text-3xl font-extrabold">Tu menú, listo.</h2>
      <p class="mb-6 text-sm leading-6 text-muted">Precargamos los favoritos. Activa los que ofreces; podrás editar precios después.</p>
      ${progress}
      <div class="space-y-3">${state.services.map((service) => `
        <label class="flex cursor-pointer items-center gap-3 rounded-2xl border border-neutral-200 p-4 ${service.selected ? 'bg-[#f8faef]' : 'bg-white'}">
          <input class="service-check h-5 w-5" type="checkbox" ${service.selected ? 'checked' : ''} onchange="toggleService('${service.id}',this.checked)">
          <span class="min-w-0 flex-1"><span class="block font-bold">${escapeHtml(service.name)}</span><span class="text-xs text-muted">${service.duration} min · precio sugerido</span></span>
          <span class="font-bold">${currency(service.price)}</span>
        </label>`).join('')}</div>
      <div class="mt-5 rounded-xl bg-lime/20 p-3 text-sm text-neutral-700">✦ Precios editables cuando quieras, sin compromiso.</div>
      <div class="mt-6 flex gap-3"><button class="btn-outline h-12 flex-1" onclick="setOnboardingStep(1)">Atrás</button><button class="btn-primary h-12 flex-[2]" onclick="continueServices()">Guardar y elegir horario →</button></div>`;
  } else if (step === 3) {
    content = `
      <div class="mb-2 text-sm font-bold text-muted">PASO 3 DE 3 · HORARIOS</div>
      <h2 class="display mb-2 text-3xl font-extrabold">¿Cuándo estás<br>en la silla?</h2>
      <p class="mb-6 text-sm leading-6 text-muted">Usamos un horario típico. Toca cualquier día para ajustarlo o dejarlo cerrado.</p>
      ${progress}
      <div class="overflow-hidden rounded-2xl border border-neutral-200 bg-white">${state.hours.map((hour, index) => `
        <div class="flex items-center justify-between border-b border-neutral-100 px-4 py-3 last:border-0">
          <span class="w-24 text-sm font-semibold">${hour.day}</span>
          <span class="flex-1 text-right text-xs ${hour.open ? 'text-muted' : 'text-neutral-400'}">${hour.open ? `${hour.from} — ${hour.to}` : 'Cerrado'}</span>
          <button class="ml-3 rounded-full px-3 py-1 text-xs font-bold ${hour.open ? 'bg-lime/50 text-ink' : 'bg-neutral-100 text-muted'}" onclick="toggleHours(${index})">${hour.open ? 'Abierto' : 'Cerrado'}</button>
        </div>`).join('')}</div>
      <div class="mt-4 flex items-center gap-2 text-xs text-muted"><span>⏱</span> Reservas cada 30 minutos · Se puede cambiar después</div>
      <div class="mt-6 flex gap-3"><button class="btn-outline h-12 flex-1" onclick="setOnboardingStep(2)">Atrás</button><button class="btn-primary h-12 flex-[2]" onclick="finishSetup()">Terminar configuración →</button></div>`;
  } else {
    const name = escapeHtml(state.barber.name || 'barbero');
    const link = bookingLink();
    const whatsapp = `https://wa.me/?text=${encodeURIComponent(`¡Qué onda! Ya está lista mi agenda. Puedes ver mis servicios y reservar tu próximo corte aquí: ${link}`)}`;
    content = `
      <div class="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-lime text-3xl">✦</div>
      <div class="mb-2 text-sm font-bold uppercase tracking-[.16em] text-muted">¡AGENDA LISTA!</div>
      <h2 class="display mb-3 text-3xl font-extrabold">Ahora viene lo bueno, ${name}.</h2>
      <p class="mb-6 max-w-md text-sm leading-6 text-muted">Tu barbería ya tiene una página con servicios, ofertas y reservas. Compártela para que tus clientes agenden mientras tú trabajas.</p>
      <div class="mb-3 flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-3">
        <div class="min-w-0 flex-1"><div class="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted">TU LINK DE RESERVAS</div><div class="truncate text-sm font-semibold">${escapeHtml(link)}</div></div>
        <button class="btn-outline px-3 py-2 text-sm" onclick="copyBookingLink()">Copiar</button>
      </div>
      <a class="flex min-h-[62px] w-full items-center justify-center gap-3 rounded-2xl bg-[#25D366] px-4 text-center text-lg font-extrabold text-white shadow-lg shadow-green-900/10 transition hover:brightness-95" href="${whatsapp}" target="_blank" rel="noopener" onclick="markShared()"><span class="text-2xl">◉</span> Compartir por WhatsApp</a>
      <p class="mb-7 mt-3 text-center text-xs text-muted">Un mensaje listo para enviar a tus clientes.</p>
      <div class="rounded-2xl bg-ink p-5 text-white">
        <div class="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-lime"><span class="animate-pulse">●</span> Momento Aha!</div>
        <h3 class="display mb-2 text-xl font-bold">¿Listo para tu primera reserva?</h3>
        <p class="mb-4 text-sm leading-5 text-neutral-400">Activa una notificación de prueba y mira cómo se siente.</p>
        <button class="w-full rounded-xl bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/15" onclick="simulateFirstBooking()">🔔 Simular primera reserva</button>
      </div>
      <button class="mt-2 w-full py-2 text-sm font-semibold text-[#8e4d32]" onclick="navigate('landing')">Ver mi landing de barbería ↗</button>
      <button class="mt-2 w-full py-2 text-sm font-semibold text-muted" onclick="navigate('dashboard')">Ir al panel de control →</button>`;
  }

  return `
    <div class="mx-auto max-w-5xl">
      ${topBar('PUESTA EN MARCHA', 'Tu negocio, sin fricción', '<span class="rounded-full bg-white px-3 py-2 text-xs font-bold text-muted">⏱ Menos de 5 min</span>')}
      <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(270px,.9fr)]">
        <section class="card p-5 sm:p-8">${content}</section>
        <aside class="hidden space-y-4 lg:block">
          <div class="overflow-hidden rounded-[24px] bg-ink p-6 text-white">
            <div class="mb-5 flex items-center justify-between"><span class="text-sm font-bold">Tu nueva agenda</span><span class="rounded-full bg-lime/20 px-2.5 py-1 text-[10px] font-bold text-lime">EN VIVO</span></div>
            <div class="mb-4 rounded-2xl bg-white/5 p-4">
              <div class="mb-4 flex justify-between text-xs text-neutral-400"><span>HOY · 12 JUN</span><span>3 citas</span></div>
              <div class="space-y-2">${[['10:00','Corte','Luis M.'],['11:30','Corte con Barba','Diego R.'],['13:00','Barba','Marco S.']].map(([time,service,client])=>`<div class="flex items-center gap-3 rounded-xl bg-white/[.07] p-3"><span class="text-xs font-bold text-lime">${time}</span><span class="min-w-0 flex-1"><span class="block text-xs font-semibold">${service}</span><span class="text-[10px] text-neutral-400">${client}</span></span><span class="h-2 w-2 rounded-full bg-lime"></span></div>`).join('')}</div>
            </div>
            <div class="flex items-center justify-between border-t border-white/10 pt-4"><span class="text-xs text-neutral-400">Ingresos del día</span><span class="text-lg font-extrabold text-lime">$33</span></div>
          </div>
          <div class="card p-5">
            <div class="mb-3 text-sm font-bold">Así de fácil funciona</div>
            <div class="space-y-4">${[['01','Crea tu agenda','Sin datos fiscales ni tarjeta.'],['02','Comparte tu link','Un toque y sale por WhatsApp.'],['03','Recibe tu primera cita','Tu cliente reserva mientras tú cortas.']].map(([n,title,desc])=>`<div class="flex gap-3"><span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-lime/40 text-xs font-extrabold">${n}</span><span><b class="block text-sm">${title}</b><small class="text-xs text-muted">${desc}</small></span></div>`).join('')}</div>
          </div>
        </aside>
      </div>
    </div>`;
}

function dashboardView() {
  const setupPercent = Math.round((state.funnel.hours / Math.max(state.funnel.registered, 1)) * 100);
  const funnel = [
    ['Registro', state.funnel.registered, 'Deja fuera los formularios largos.'],
    ['Servicios', state.funnel.services, 'Plantillas para empezar al instante.'],
    ['Horarios', state.funnel.hours, 'Disponibilidad en pocos toques.'],
    ['Comparte link', state.funnel.shared, 'El momento de activación.'],
    ['Primera reserva', state.funnel.booked, 'El momento Aha!'],
  ];
  const localBookings = state.appointments.length;
  const bookedLabel = localBookings ? `${localBookings} real${localBookings === 1 ? '' : 'es'} + ${state.funnel.booked} demo` : `${state.funnel.booked} de 100`;
  return `
    <div class="mx-auto max-w-6xl">
      ${topBar('VISTA DEL DUEÑO', 'Tu crecimiento, de un vistazo', '<button class="btn-outline rounded-xl px-3 py-2 text-xs" onclick="resetDemo()">Reiniciar demo</button>')}
      <div class="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        ${[['Nuevas barberías',state.funnel.registered,'+18% vs. mes anterior','↗'],['Agendas configuradas',state.funnel.hours,`${setupPercent}% completó setup`,'✦'],['Links compartidos',state.funnel.shared,'El momento de activación','↗'],['Primera reserva',state.funnel.booked,'Aha! activado','⚡']].map(([label,value,detail,icon])=>`<div class="card p-5"><div class="mb-4 flex items-center justify-between text-sm text-muted"><span>${label}</span><span class="text-lg text-ink">${icon}</span></div><div class="display text-3xl font-extrabold">${value}<span class="ml-1 text-base font-semibold text-muted">/ 100</span></div><div class="mt-2 text-xs font-semibold text-[#71902e]">${detail}</div></div>`).join('')}
      </div>
      <div class="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,.8fr)]">
        <section class="card p-5 sm:p-7">
          <div class="mb-1 flex items-center justify-between"><h2 class="display m-0 text-xl font-extrabold">Embudo de activación</h2><button class="rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-bold">Caso B · Agendo</button></div>
          <p class="mb-7 text-sm text-muted">De registrarse a sentir el valor de Agendo con su primera cita.</p>
          <div class="space-y-5">${funnel.map(([label,count,detail],index)=>`<div><div class="funnel-row mb-2"><span class="funnel-label text-sm font-semibold">${index+1}. ${label}</span><span class="funnel-track"><span class="funnel-bar block" style="width:${count}%"></span></span><b class="text-right text-sm">${count}</b></div><div class="pl-[125px] text-[11px] text-muted sm:pl-[158px]">${detail}</div></div>`).join('')}</div>
          <div class="mt-7 rounded-2xl border border-[#e7edda] bg-[#f7faef] p-4">
            <div class="mb-1 flex items-center gap-2 text-sm font-bold">💡 Insight de Growth</div>
            <p class="m-0 text-xs leading-5 text-neutral-600">El 26% se pierde cuando el registro exige datos fiscales. Agendo los pide después, cuando ya existe valor. El mejor predictor de retención es compartir el link y recibir la primera reserva.</p>
          </div>
        </section>
        <aside class="space-y-5">
          <div class="card p-5">
            <div class="mb-4 flex items-center justify-between"><div><div class="text-xs font-bold uppercase tracking-wider text-muted">TU ACTIVACIÓN</div><div class="display mt-1 text-xl font-extrabold">${state.barber.name ? escapeHtml(state.barber.name) : 'Tu barbería'}</div></div><span class="rounded-full ${state.appointments.length?'bg-lime':'bg-neutral-100'} px-3 py-1.5 text-xs font-bold">${state.appointments.length?'● Activa':'○ En progreso'}</span></div>
            <div class="space-y-3">${[['Registro',true],['Servicios listos',state.onboarded],['Horarios configurados',state.onboarded],['Link compartido',state.shared],['Primera reserva',state.appointments.length>0]].map(([label,done])=>`<div class="flex items-center gap-3 text-sm"><span class="flex h-6 w-6 items-center justify-center rounded-full ${done?'bg-lime text-ink':'bg-neutral-100 text-muted'}">${done?'✓':'·'}</span><span class="${done?'font-semibold':'text-muted'}">${label}</span></div>`).join('')}</div>
            <button class="btn-primary mt-5 h-11 w-full" onclick="navigate('${state.onboarded?'booking':'onboarding'}')">${state.onboarded?'Ver mi página de reservas':'Continuar mi configuración'} →</button>
          </div>
          <div class="rounded-[20px] bg-ink p-5 text-white">
            <div class="mb-2 text-xs font-bold uppercase tracking-widest text-lime">TU PRÓXIMO PASO</div>
            <h3 class="display mb-2 text-xl font-extrabold">La primera reserva lo cambia todo.</h3>
            <p class="mb-4 text-sm leading-5 text-neutral-400">Pruébalo como cliente y vive la experiencia Agendo.</p>
            <button class="w-full rounded-xl bg-lime py-3 text-sm font-extrabold text-ink" onclick="navigate('booking')">Probar reserva cliente ↗</button>
          </div>
        </aside>
      </div>
      <div class="mt-5 text-center text-[11px] text-muted">Datos de embudo simulados para el prototipo · ${localBookings} reserva${localBookings===1?'':'s'} creada${localBookings===1?'':'s'} en este dispositivo</div>
    </div>`;
}

function getDateOptions() {
  const days = [];
  for (let i = 0; i < 5; i += 1) {
    const date = new Date();
    date.setDate(date.getDate() + i + 1);
    days.push(date);
  }
  return days;
}

function getOpenHours(date) {
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const hours = remoteBarbershop?.horarios || state.hours;
  const currentDay = dayNames[date.getDay()];
  return Array.isArray(hours) ? hours.find((item) => item.day === currentDay && item.open) : null;
}

function getTimeSlots(hours) {
  if (!hours) return [];
  const [startHour, startMinute] = hours.from.split(':').map(Number);
  const [endHour, endMinute] = hours.to.split(':').map(Number);
  const start = startHour * 60 + startMinute;
  const end = endHour * 60 + endMinute;
  const slots = [];
  for (let minutes = start; minutes + 30 <= end; minutes += 30) {
    slots.push(`${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`);
  }
  return slots;
}

function shopHeader() {
  const name = escapeHtml(barberName());
  return `<header class="shop-header">
    <a class="shop-logo no-underline text-ink" href="#" onclick="navigate('landing');return false"><span class="shop-mark">✦</span><span>${name}<small class="block text-[8px] tracking-[.25em] text-[#927f68]">BARBERÍA DE AUTOR</small></span></a>
    <nav class="shop-nav"><a class="text-inherit no-underline hover:text-[#9c5938]" href="#ofertas">Servicios</a><a class="text-inherit no-underline hover:text-[#9c5938]" href="#referidos">Ofertas & premios</a><button class="shop-primary min-h-[40px] px-4" onclick="navigate('booking')">RESERVAR</button></nav>
  </header>`;
}

function publicLandingView() {
  const name = escapeHtml(barberName());
  const code = new URLSearchParams(location.search).get('ref');
  const services = activeServices();
  const hours = remoteBarbershop?.horarios || state.hours;
  const openHours = Array.isArray(hours) ? hours.filter((item) => item.open) : [];
  const hoursSummary = openHours.length
    ? `${openHours[0].day} — ${openHours[openHours.length - 1].day} · ${openHours[0].from} — ${openHours[0].to}`
    : 'Mar — Sáb · 9:00 — 19:00';
  const offerCards = services.map((service, index) => {
    const isCombo = service.name.toLowerCase().includes('barba') && service.name.toLowerCase().includes('corte');
    return `<article class="offer-card"><span class="offer-tag">${isCombo ? 'AHORRA $3' : index === 0 ? 'EL FAVORITO' : 'DE LA CASA'}</span><div class="offer-num">0${index + 1}</div><h3>${escapeHtml(service.name)}</h3><p>${escapeHtml(service.duration)} min · Un ritual de barbería con atención al detalle.</p><div class="offer-price">${currency(service.price)}${isCombo ? ' <s>$18</s>' : ''}</div></article>`;
  }).join('');
  const referralBanner = code
    ? `<div class="mx-auto max-w-6xl px-5 pt-5"><div class="flex flex-wrap items-center justify-between gap-3 bg-[#e6eadc] px-5 py-3 text-xs"><span>✦ <b>${escapeHtml(code)}</b> te invitó: al reservar, ayudas a tu amigo a ganar un corte gratis.</span><span class="font-bold text-[#8e4d32]">Tu primera visita tiene $2 de descuento</span></div><div id="referral-live-status" class="mt-2 text-right text-[10px] text-[#777065]"></div></div>`
    : '';
  return `
    <div class="shop-page">
      ${shopHeader()}
      <div id="public-shop-error" class="hidden bg-red-50 px-5 py-3 text-center text-xs font-semibold text-red-700"></div>
      ${referralBanner}
      <section class="shop-hero">
        <div class="shop-hero-copy">
          <div class="shop-kicker"><span>✦</span> ${name} · DESDE 2014</div>
          <h1 class="shop-title">El ritual<br>de un buen<br><em>corte.</em></h1>
          <p class="shop-lede">Tradición de barbería, detalle contemporáneo. Tu próximo corte está a unos toques de distancia.</p>
          <div class="shop-actions"><button class="shop-primary" onclick="navigate('booking')">RESERVA TU CITA <span>↗</span></button><a class="shop-text-link" href="#ofertas">Descubre la experiencia</a></div>
          <div class="shop-rating"><span class="shop-stars">★★★★★</span><span>4.9 / 5 · Más de 120 clientes felices</span></div>
        </div>
        <div class="shop-photo" role="img" aria-label="Interior cálido de una barbería"><div class="hero-stamp"><span><b>10+</b>AÑOS DE<br>BUEN CORTE</span></div></div>
      </section>
      <section id="ofertas" class="shop-section">
        <div class="shop-section-head"><div><div class="shop-eyebrow">EL BUEN CORTE, A TU MANERA</div><h2 class="shop-heading">Ofertas de la casa.</h2></div><p class="m-0 max-w-xs text-xs leading-5 text-[#777065]">Precios transparentes, atención sin prisa. Elige tu ritual y reserva en línea.</p></div>
        <div class="offer-grid">
          ${offerCards}
        </div>
        <div class="mt-7 text-center"><button class="shop-primary" onclick="navigate('booking')">ELIGE TU HORARIO · RESERVA EN 30 SEGUNDOS ↗</button></div>
      </section>
      <section id="referidos" class="shop-section pt-0">
        <div class="shop-referral">
          <div><div class="shop-eyebrow">EL ESTILO SE COMPARTE</div><h2 class="referral-title">Invita a tu amigo.<br>El próximo corte<br>va <em>por la casa.</em></h2><p class="referral-copy">Después de tu visita recibirás un link personal. Si un amigo reserva y viene con tu invitación, te regalamos un corte. Tu amigo también recibe $2 de descuento. Sin letras chiquitas: buen corte, buen gesto.</p><button class="shop-primary" onclick="navigate('booking')">AGENDA Y ACTIVA TU RECOMPENSA ↗</button></div>
          <div class="referral-ticket"><div class="referral-ticket-top"><span class="shop-logo"><span class="shop-mark">✦</span><span>${name.toUpperCase()}<small class="block text-[8px] tracking-[.2em] text-[#927f68]">PASE DE AMIGO</small></span></span><span class="text-xl">✂</span></div><div class="referral-code">${code ? escapeHtml(code) : 'TU LINK PERSONAL'}</div><div class="text-xs leading-5 text-[#777065]">Un amigo agenda con tu link.<br>Tu siguiente corte corre por nuestra cuenta.</div><div class="mt-4 border-t border-dashed border-[#c9baa5] pt-3 text-[9px] font-bold tracking-[.12em] text-[#8e4d32]">CÓDIGO PERSONAL · RECOMPENSA AL RESERVAR</div></div>
        </div>
      </section>
      <section class="shop-section pt-0">
        <div class="loyalty-banner flex flex-wrap items-center justify-between gap-5 p-6 sm:p-8"><div class="flex items-start gap-4"><span class="text-3xl">♛</span><div><div class="shop-eyebrow">FRECUENCIA QUE SÍ CONVIENE</div><h2 class="display mt-2 text-2xl font-extrabold">Pase mensual VIP · $29</h2><p class="mt-2 mb-0 max-w-lg text-xs leading-5 text-[#777065]">Cortes ilimitados, prioridad para reservar y tu estilo siempre en forma. Membresía simulada para esta demo.</p></div></div><button class="btn-dark px-5 py-3 text-xs" onclick="navigate('booking');joinMembership()">QUIERO SER VIP ↗</button></div>
      </section>
      <footer class="shop-foot"><span><b>${name}</b> · Una buena barbería se siente.</span><span>${escapeHtml(hoursSummary)} &nbsp; · &nbsp; Hecho con Agendo</span></footer>
    </div>`;
}

function publicBookingView() {
  const services = activeServices().length ? activeServices() : DEFAULT_SERVICES;
  const selected = services.find((item) => item.id === booking.serviceId) || services[0];
  if (!booking.serviceId && selected) booking.serviceId = selected.id;
  const dates = getDateOptions();
  const firstAvailableDate = booking.date ? new Date(`${booking.date}T12:00:00`) : dates[0];
  const selectedHours = getOpenHours(firstAvailableDate);
  const timeSlots = getTimeSlots(selectedHours);
  const discount = state.referralApplied ? 2 : 0;
  const extraCost = booking.extra ? 3 : 0;
  const total = (selected?.price || 0) + extraCost - discount;
  const shop = escapeHtml(barberName());
  return `
    <div class="shop-page booking-shell">
      ${shopHeader()}
      <div class="mx-auto max-w-6xl px-4 pb-14 pt-7 sm:px-7">
      <div class="mb-6 flex items-end justify-between gap-3"><div><div class="shop-eyebrow">TU MOMENTO, A TU HORA</div><h1 class="display mt-2 text-3xl font-extrabold">Reserva tu visita.</h1></div><button class="btn-outline px-3 py-2 text-xs" onclick="navigate('landing')">← Ver barbería</button></div>
      <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <main class="phone-frame w-full">
          <div class="overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-sm">
            <div class="booking-head px-5 pb-5 pt-6 text-white">
              <div class="mb-5 flex items-center gap-3">
                <div class="flex h-12 w-12 items-center justify-center rounded-full bg-[#b96843] text-xl font-black text-white">✦</div>
                <div><div class="display text-lg font-extrabold">${shop}</div><div class="text-xs text-neutral-400">Barbería · ★ 4.9 · 120 reseñas</div></div>
              </div>
              <div class="flex items-center gap-2 text-xs text-lime"><span>●</span> Reservas online · Respuesta inmediata</div>
            </div>
            <div class="p-5">
              <div class="mb-2 text-xs font-bold uppercase tracking-widest text-muted">1 · ELIGE TU SERVICIO</div>
              <div class="space-y-2">${services.map((service)=>`<button class="booking-service flex w-full items-center gap-3 rounded-2xl border border-neutral-200 p-3.5 text-left ${selected.id===service.id?'selected':''}" onclick="selectBookingService('${service.id}')"><span class="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100">✂</span><span class="min-w-0 flex-1"><b class="block text-sm">${escapeHtml(service.name)}</b><small class="text-xs text-muted">${service.duration} min</small></span><b class="text-sm">${currency(service.price)}</b><span class="text-muted">${selected.id===service.id?'●':'○'}</span></button>`).join('')}</div>
              <div class="mb-2 mt-6 text-xs font-bold uppercase tracking-widest text-muted">2 · ELIGE DÍA Y HORA</div>
              <div class="no-scrollbar mb-3 flex gap-2 overflow-x-auto pb-1">${dates.map((date)=>{const key=date.toISOString().slice(0,10);return `<button class="time-chip min-w-[68px] rounded-xl border border-neutral-200 px-3 py-2 text-center ${booking.date===key?'selected':''}" onclick="selectDate('${key}')"><span class="block text-[10px] uppercase">${date.toLocaleDateString('es-MX',{weekday:'short'})}</span><b class="text-sm">${date.getDate()}</b></button>`}).join('')}</div>
              ${timeSlots.length
                ? `<div class="grid grid-cols-3 gap-2">${timeSlots.map((time)=>`<button class="time-chip rounded-xl border border-neutral-200 py-2.5 text-xs font-semibold ${booking.time===time?'selected':''}" onclick="selectTime('${time}')">${time}</button>`).join('')}</div>`
                : '<div class="rounded-xl bg-neutral-100 p-3 text-center text-xs text-muted">Cerrado ese día. Elige otra fecha disponible.</div>'}
              <div class="mb-2 mt-6 text-xs font-bold uppercase tracking-widest text-muted">3 · TUS DATOS</div>
              <div class="space-y-2"><input class="input" placeholder="Tu nombre" autocomplete="name" value="${escapeHtml(booking.customerName)}" oninput="booking.customerName=this.value"><input class="input" placeholder="WhatsApp para confirmar" type="tel" inputmode="tel" value="${escapeHtml(booking.customerPhone)}" oninput="booking.customerPhone=this.value"></div>
              <button class="mt-5 flex w-full items-center gap-3 rounded-2xl border border-dashed border-neutral-300 bg-[#fafbf7] p-3 text-left" onclick="toggleExtra()"><span class="flex h-9 w-9 items-center justify-center rounded-xl bg-lime/45">＋</span><span class="flex-1"><b class="block text-sm">Agrega un lavado premium</b><small class="text-xs text-muted">Precio especial solo hoy: +$3</small></span><span class="text-sm font-bold">${booking.extra?'✓':'+'}</span></button>
              <div class="mt-5 rounded-2xl bg-[#f6f7f1] p-4">
                <div class="mb-2 flex items-center justify-between text-sm font-semibold"><span>Usa código de amigo</span><span class="text-xs text-[#718a39]">-$2 para ambos</span></div>
                <div class="flex gap-2"><input id="referral-code" class="input h-11 uppercase" placeholder="Ej. ANA-4567" value="${escapeHtml(booking.referralCode)}" ${state.referralApplied?'disabled':''}><button class="copper-button btn-dark px-4 text-xs" onclick="applyReferral()">Aplicar</button></div>
                <div id="referral-message" class="mt-2 text-xs ${state.referralApplied?'font-semibold text-[#607d2b]':'text-muted'}">${state.referralApplied?'✓ Código aplicado: ahorras $2':''}</div>
              </div>
              <div class="mt-5 flex items-start gap-3 rounded-2xl border border-neutral-100 p-4">
                <span class="text-xl">👑</span><span class="min-w-0 flex-1"><b class="block text-sm">Pase Mensual VIP</b><small class="text-xs leading-5 text-muted">Cortes ilimitados y prioridad en horarios.</small></span><span class="text-right text-sm font-extrabold">$29<small class="block text-[10px] font-medium text-muted">/mes</small></span>
              </div>
              <button class="mt-2 w-full text-left text-xs font-bold text-[#68842e]" onclick="joinMembership()">${state.membership?'✓ Ya tienes el pase VIP':'＋ Unirme al pase VIP · $29/mes'}</button>
              <p class="mb-0 mt-1 text-[10px] text-muted">El prototipo registra el plan, pero no procesa cobros.</p>
              <div class="mt-5 border-t border-neutral-100 pt-4">
                <div class="mb-4 flex justify-between text-sm"><span class="text-muted">${escapeHtml(selected?.name||'Servicio')}${booking.extra?' + Lavado':''}</span><b>${currency((selected?.price||0)+extraCost)}</b></div>
                ${discount?`<div class="mb-3 flex justify-between text-sm text-[#68842e]"><span>Descuento amigo</span><b>−${currency(discount)}</b></div>`:''}
                <div class="mb-4 flex justify-between text-lg font-extrabold"><span>Total al llegar</span><span>${currency(total)}</span></div>
                <button class="btn-primary copper-button h-12 w-full" onclick="submitBooking()">CONFIRMAR MI CITA · ${currency(total)}</button>
                <p class="mb-0 mt-3 text-center text-[10px] text-muted">Sin pago por adelantado · Cancela cuando quieras</p>
              </div>
            </div>
          </div>
          <div class="mt-4 text-center text-xs text-muted">Reservas seguras con <b>agendo</b> · Menos mensajes, más cortes.</div>
        </main>
        <aside class="space-y-4">
          <div class="card p-5">
            <div class="mb-3 flex items-center justify-between"><h2 class="display m-0 text-lg font-extrabold">Viral loop de referidos</h2><span>↗</span></div>
            <p class="text-sm leading-6 text-muted">Después de tu visita tendrás un link personal. Cuando tu amigo agenda con él, te regalamos un corte y él recibe $2 de descuento.</p>
            <div class="rounded-xl bg-[#f6f7f1] p-3 text-xs"><b>Tu premio:</b> 1 corte gratis por cada amigo que reserva<br><b>Tu amigo:</b> $2 de descuento al visitar</div>
          </div>
          <div class="card p-5">
            <div class="mb-3 text-sm font-bold">Ingresos previsibles, cada mes</div>
            <p class="mb-0 text-sm leading-6 text-muted">El Pase VIP crea recurrencia y premia a tus clientes más fieles. Puedes registrar el plan; los cobros aún no se procesan.</p>
            <div class="mt-4 rounded-xl bg-ink p-4 text-white"><div class="text-xs text-neutral-400">1 miembro VIP podría generar</div><div class="display mt-1 text-2xl font-extrabold text-lime">$29 <span class="text-sm font-semibold text-neutral-400">/ mes</span></div></div>
          </div>
          <div class="rounded-2xl bg-lime/30 p-4 text-sm leading-6"><b>✦ Momento Aha!</b><br>El barbero comparte su link, su cliente reserva en segundos y la agenda se llena mientras él trabaja.</div>
        </aside>
      </div>
      </div>
    </div>`;
}

function confirmationView(appointment) {
  const inviteLink = referralLandingLink(appointment.referralCode);
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`Te invito a mi barbería favorita. Reserva con mi link: ${inviteLink} y obtén $2 de descuento. ¡Si agendas, mi próximo corte va por la casa!`)}`;
  return `
    <div class="shop-page">
      ${shopHeader()}
      <div class="mx-auto max-w-xl px-4 py-8">
      <div class="card p-7 text-center sm:p-10">
        <div class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#d8e0cb] text-3xl text-[#8e4d32]">✓</div>
        <div class="mb-2 text-xs font-bold uppercase tracking-widest text-muted">RESERVA CONFIRMADA</div>
        <h1 class="display mb-3 text-3xl font-extrabold">¡Nos vemos pronto, ${escapeHtml(appointment.customerName)}!</h1>
        <p class="mb-6 text-sm leading-6 text-muted">Tu cita con ${escapeHtml(barberName())} quedó apartada.</p>
        <div class="mb-6 rounded-2xl bg-[#f6f7f1] p-5 text-left">
          <div class="mb-3 flex justify-between text-sm"><span class="text-muted">Servicio</span><b>${escapeHtml(appointment.serviceName)}</b></div>
          <div class="mb-3 flex justify-between text-sm"><span class="text-muted">Fecha</span><b>${new Date(`${appointment.date}T12:00:00`).toLocaleDateString('es-MX',{weekday:'long',day:'numeric',month:'long'})}</b></div>
          <div class="mb-3 flex justify-between text-sm"><span class="text-muted">Hora</span><b>${escapeHtml(appointment.time)}</b></div>
          <div class="flex justify-between border-t border-neutral-200 pt-3 text-sm"><span class="text-muted">Total al llegar</span><b>${currency(appointment.total)}</b></div>
        </div>
        <div class="mb-4 rounded-2xl bg-[#d8e0cb] p-5 text-left">
          <div class="mb-1 text-[10px] font-black uppercase tracking-[.15em] text-[#8e4d32]">REGALO DE LA CASA · TU PRÓXIMO CORTE GRATIS</div>
          <h2 class="display mb-2 text-xl font-extrabold">El buen estilo se comparte.</h2>
          <p class="mb-3 text-xs leading-5 text-[#606354]">Cuando un amigo reserve con tu link y venga a su cita, te regalamos un corte. Él recibe $2 de descuento.</p>
          <div class="mb-3 truncate rounded-lg bg-white/70 px-3 py-2 text-xs font-bold">${escapeHtml(inviteLink)}</div>
          <div class="grid grid-cols-2 gap-2"><button class="shop-primary min-h-[44px] px-2 text-[10px]" onclick="copyReferralLink('${escapeHtml(appointment.referralCode)}')">COPIAR MI LINK</button><a class="flex min-h-[44px] items-center justify-center bg-[#247a50] px-2 text-center text-[10px] font-black text-white no-underline" href="${escapeHtml(whatsapp)}" target="_blank" rel="noopener">INVITAR POR WHATSAPP</a></div>
          <div class="mt-3 text-[10px] text-[#606354]">Código personal: <b>${escapeHtml(appointment.referralCode)}</b></div>
        </div>
        <button class="btn-dark h-12 w-full" onclick="navigate('landing')">Volver a la barbería</button>
      </div>
      </div>
    </div>`;
}

function render() {
  const root = document.getElementById('app');
  const deepView = new URLSearchParams(location.search).get('vista');
  if (deepView === 'reservar') state.view = 'booking';
  if (deepView === 'landing') state.view = 'landing';
  let content;
  if (state.view === 'booking' && booking.confirmation) {
    content = confirmationView(booking.confirmation);
  } else if (state.view === 'booking') {
    content = publicBookingView();
  } else if (state.view === 'landing') {
    content = publicLandingView();
  } else if (state.view === 'dashboard') {
    content = dashboardView();
  } else {
    content = onboardingView();
  }
  const publicView = state.view === 'landing' || state.view === 'booking';
  root.innerHTML = publicView ? content : `${navigation()}<main class="main">${content}</main>`;
  const barbershopId = new URLSearchParams(location.search).get('barberId');
  if (publicView && barbershopId && requestedBarberId !== barbershopId) {
    requestedBarberId = barbershopId;
    loadPublicBarbershop(barbershopId);
  }
  const referralCode = new URLSearchParams(location.search).get('ref');
  if (referralCode && booking.referralCode !== referralCode) {
    booking.referralCode = referralCode;
    state.referralApplied = false;
    referralAutoApplied = false;
  }
  if (state.view === 'landing' && referralCode) refreshReferralStats(referralCode);
  if (state.view === 'booking' && !booking.confirmation && referralCode && !state.referralApplied && !referralAutoApplied) {
    referralAutoApplied = true;
    booking.referralCode = referralCode;
    applyReferral(referralCode);
  }
}

function navigate(view) {
  booking.confirmation = null;
  state.view = view;
  const url = new URL(location.href);
  if (view === 'booking') url.searchParams.set('vista', 'reservar');
  else if (view === 'landing') url.searchParams.set('vista', 'landing');
  else url.searchParams.delete('vista');
  if (view === 'booking' || view === 'landing') {
    const publicBarberId = url.searchParams.get('barberId') || state.barbershopId;
    if (publicBarberId) url.searchParams.set('barberId', publicBarberId);
    url.searchParams.set('barber', barberSlug());
  } else {
    url.searchParams.delete('barberId');
    url.searchParams.delete('barber');
    url.searchParams.delete('ref');
  }
  history.replaceState({}, '', `${url.pathname}${url.search}`);
  render();
}

async function submitRegistration(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  state.barber = {
    name: String(form.get('name')).trim(),
    phone: String(form.get('phone')).trim(),
  };
  try {
    const result = await apiRequest('/api/onboarding/register', {
      method: 'POST',
      body: JSON.stringify({
        nombre: state.barber.name,
        telefono: state.barber.phone,
        password: String(form.get('password')),
      }),
    });
    state.backendUserId = result.user.id;
    state.databaseConnected = true;
  } catch (error) {
    state.databaseConnected = false;
    console.error('Registro SQL no disponible; se continúa en modo demostración:', error);
  }
  state.funnel.registered = Math.min(100, state.funnel.registered + 1);
  state.onboardingStep = 2;
  saveState();
  render();
  if (state.backendUserId) {
    showToast('Cuenta segura guardada en la base de datos.', 'Agenda creada');
  } else {
    showToast('Puedes probar la agenda; conecta MySQL para guardar la cuenta.', 'Modo demostración', '!');
  }
}

function setOnboardingStep(step) {
  state.onboardingStep = step;
  saveState();
  render();
}

function toggleService(id, selected) {
  const service = state.services.find((item) => item.id === id);
  if (service) service.selected = selected;
}

function continueServices() {
  if (!activeServices().length) {
    showToast('Activa al menos un servicio para continuar.', 'Elige un servicio', '!');
    return;
  }
  state.onboardingStep = 3;
  state.funnel.services = Math.min(state.funnel.registered, state.funnel.services + 1);
  saveState();
  render();
}

function toggleHours(index) {
  state.hours[index].open = !state.hours[index].open;
  saveState();
  render();
}

async function finishSetup() {
  if (!state.hours.some((hour) => hour.open)) {
    showToast('Abre al menos un día para recibir reservas.', 'Horario requerido', '!');
    return;
  }
  if (state.backendUserId) {
    try {
      const result = await apiRequest('/api/onboarding/setup', {
        method: 'POST',
        body: JSON.stringify({
          userId: state.backendUserId,
          services: activeServices().map((service) => ({
            nombre: service.name,
            precio: service.price,
            duracionMinutos: service.duration,
          })),
          hours: state.hours,
        }),
      });
      state.barbershopId = result.barbershop.id;
      state.services = result.services.map((service) => ({
        id: String(service.id),
        databaseId: service.id,
        name: service.nombre,
        price: Number(service.precio),
        duration: service.duracionMinutos,
        selected: true,
      }));
      state.databaseConnected = true;
    } catch (error) {
      state.databaseConnected = false;
      console.error('No se pudo guardar la configuración en SQL:', error);
      showToast(error.message, 'Agenda solo en modo demostración', '!');
    }
  }

  state.onboarded = true;
  state.onboardingStep = 4;
  state.funnel.hours = Math.min(state.funnel.services, state.funnel.hours + 1);
  saveState();
  render();
}

function markShared() {
  state.shared = true;
  state.funnel.shared = Math.min(state.funnel.hours, state.funnel.shared + 1);
  saveState();
  if (shareTimer) clearTimeout(shareTimer);
  shareTimer = window.setTimeout(() => {
    if (!state.appointments.length) simulateFirstBooking();
  }, 8000);
}

async function copyBookingLink() {
  try {
    await navigator.clipboard.writeText(bookingLink());
    markShared();
    showToast('Pega tu link en WhatsApp o Instagram.');
  } catch (error) {
    console.error('No se pudo copiar el enlace:', error);
    showToast('Tu navegador no permitió copiar. Usa el botón de WhatsApp.', 'Copia no disponible', '!');
  }
}

function simulateFirstBooking() {
  if (!state.onboarded) {
    state.onboarded = true;
    state.onboardingStep = 4;
  }
  if (!state.shared) {
    state.shared = true;
    state.funnel.shared = Math.min(state.funnel.hours, state.funnel.shared + 1);
  }
  const service = activeServices()[0] || DEFAULT_SERVICES[0];
  const date = new Date();
  date.setDate(date.getDate() + 1);
  const appointment = {
    id: `demo-${Date.now()}`,
    customerName: 'Diego',
    customerPhone: '5551234567',
    serviceName: service.name,
    date: date.toISOString().slice(0, 10),
    time: '10:30',
    total: service.price,
    simulated: true,
  };
  state.appointments.push(appointment);
  state.funnel.booked = Math.min(state.funnel.shared, state.funnel.booked + 1);
  saveState();
  render();
  showToast('Diego reservó un corte para mañana a las 10:30.', '¡Primera reserva recibida! 🎉', '✦');
}

function selectBookingService(id) {
  booking.serviceId = id;
  render();
}

function selectDate(date) {
  booking.date = date;
  if (!getTimeSlots(getOpenHours(new Date(`${date}T12:00:00`))).includes(booking.time)) {
    booking.time = '';
  }
  render();
}

function selectTime(time) {
  booking.time = time;
  render();
}

function toggleExtra() {
  booking.extra = !booking.extra;
  render();
}

async function requestReferral(path, options = {}) {
  return apiRequest(`/api/demo/referrals${path}`, options);
}

async function refreshReferralStats(code) {
  const status = document.getElementById('referral-live-status');
  if (!status) return;
  try {
    const result = await apiRequest(referralApiUrl(code));
    status.textContent = `Este link ya generó ${result.freeHaircuts} corte${result.freeHaircuts === 1 ? '' : 's'} gratis.`;
  } catch (error) {
    status.textContent = 'Reserva para activar el premio de tu amigo.';
  }
}

async function copyReferralLink(code) {
  try {
    await navigator.clipboard.writeText(referralLandingLink(code));
    showToast('Envíalo por WhatsApp; cuando tu amigo reserve ganas un corte gratis.');
  } catch (error) {
    console.error('No se pudo copiar el enlace de referido:', error);
    showToast('Tu navegador no permitió copiar. Usa el botón de WhatsApp.', 'Copia no disponible', '!');
  }
}

async function applyReferral(suggestedCode) {
  const input = document.getElementById('referral-code');
  const code = (suggestedCode || input?.value || '').trim().toUpperCase();
  const phone = document.querySelector('input[placeholder="WhatsApp para confirmar"]')?.value.trim() || '';
  if (phone.replace(/\D/g, '').length < 7) {
    showToast('Escribe tu WhatsApp para validar que el código sea de un amigo.', 'Falta tu WhatsApp', '!');
    return;
  }

  try {
    await apiRequest(referralApiUrl(code, phone));
    booking.referralCode = code;
    state.referralApplied = true;
    saveState();
    render();
    showToast('Tú ahorras $2 y tu amigo gana un corte cuando completes la cita.', 'Código aplicado');
  } catch (error) {
    console.error('No se pudo validar el código de referido:', error);
    const message = document.getElementById('referral-message');
    if (message) {
      message.textContent = error.message;
      message.className = 'mt-2 text-xs font-semibold text-red-600';
    } else {
      showToast(error.message, 'Código no válido', '!');
    }
  }
}

async function joinMembership() {
  if (state.membership) {
    showToast('Ya tienes el Pase VIP activo.', 'Membresía activa');
    return;
  }

  const name = booking.customerName.trim();
  const phone = booking.customerPhone.trim();
  if (!name || phone.replace(/\D/g, '').length < 7) {
    showToast('Escribe tu nombre y WhatsApp antes de unirte al Pase VIP.', 'Completa tus datos', '!');
    document.querySelector('input[placeholder="Tu nombre"]')?.focus();
    return;
  }

  if (state.barbershopId) {
    try {
      const result = await apiRequest('/api/public/subscriptions', {
        method: 'POST',
        body: JSON.stringify({
          barbershopId: Number(state.barbershopId),
          nombre: name,
          telefono: phone,
        }),
      });
      state.membershipId = result.subscription.id;
      state.membershipMode = 'sql';
    } catch (error) {
      console.error('No se pudo guardar la suscripción VIP:', error);
      if (error.status === 409) {
        state.membership = true;
        state.membershipMode = 'sql';
        saveState();
        render();
        showToast(error.message, 'Membresía activa');
        return;
      }
      if (error.status && error.status < 500) {
        showToast(error.message, 'No se pudo activar el Pase', '!');
        return;
      }
      state.membershipMode = 'demo';
      state.membership = true;
      saveState();
      render();
      showToast('No se guardó en SQL; el Pase queda solo en esta demo. Los cobros no se procesan.', 'Modo demo', '!');
      return;
    }
  } else {
    state.membershipMode = 'demo';
  }

  state.membership = true;
  saveState();
  render();
  showToast(
    state.membershipMode === 'sql'
      ? 'Pase VIP registrado por 30 días. No se procesó ningún cobro.'
      : 'Pase VIP activo solo en esta demo. No se procesó ningún cobro.',
    '¡Bienvenido al VIP!',
  );
}

function resetDemo() {
  state = initialState();
  booking = {
    serviceId: '', date: '', time: '', extra: false, customerName: '', customerPhone: '',
    referralCode: new URLSearchParams(location.search).get('ref') || '',
  };
  referralAutoApplied = false;
  saveState();
  render();
  showToast('Puedes volver a recorrer el prototipo desde cero.', 'Demo reiniciada');
}

async function submitBooking() {
  if (!booking.customerName.trim() || !booking.customerPhone.trim()) {
    showToast('Agrega tu nombre y WhatsApp para confirmar.', 'Faltan tus datos', '!');
    return;
  }
  if (!booking.date || !booking.time) {
    showToast('Elige un día y un horario disponible.', 'Selecciona tu cita', '!');
    return;
  }
  const service = activeServices().find((item) => item.id === booking.serviceId) || DEFAULT_SERVICES[0];
  const total = service.price + (booking.extra ? 3 : 0) - (state.referralApplied ? 2 : 0);
  const barbershopId = new URLSearchParams(location.search).get('barberId') || state.barbershopId;
  let appointment;
  let referralError = null;
  if (barbershopId && service.databaseId) {
    try {
      const result = await apiRequest('/api/public/appointments', {
        method: 'POST',
        body: JSON.stringify({
          barbershopId: Number(barbershopId),
          serviceId: Number(service.databaseId),
          nombre: booking.customerName.trim(),
          telefono: booking.customerPhone.trim(),
          fecha: booking.date,
          hora: booking.time,
          referralCode: state.referralApplied ? booking.referralCode : '',
          extra: booking.extra,
        }),
      });
      appointment = {
        ...result.appointment,
        date: booking.date,
        time: booking.time,
        referralCode: result.referralCode,
        referralReward: result.referralRewarded ? 1 : 0,
        persisted: true,
      };
    } catch (error) {
      console.error('No se pudo guardar la cita en SQL; se conservará en modo demostración:', error);
      referralError = error.message;
    }
  }

  if (!appointment) {
    const customerName = booking.customerName.trim();
    const customerPhone = booking.customerPhone.trim();
    const newCode = `${referralCodeFor(customerName, customerPhone)}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
    appointment = {
      id: `local-${Date.now()}`,
      customerName,
      customerPhone,
      serviceName: `${service.name}${booking.extra ? ' + Lavado premium' : ''}`,
      date: booking.date,
      time: booking.time,
      total,
      referralCode: newCode,
      simulated: true,
    };
    try {
      await requestReferral('/register', {
        method: 'POST',
        body: JSON.stringify({ code: appointment.referralCode, phone: appointment.customerPhone }),
      });
      if (state.referralApplied && booking.referralCode) {
        const result = await requestReferral(`/${encodeURIComponent(booking.referralCode)}/convert`, {
          method: 'POST',
          body: JSON.stringify({ phone: appointment.customerPhone }),
        });
        appointment.referralReward = result.freeHaircuts;
      }
    } catch (error) {
      console.error('No se pudo registrar la recompensa del referido:', error);
      referralError = error.message;
    }
  }
  state.appointments.push(appointment);
  state.shared = true;
  state.funnel.booked = Math.min(state.funnel.shared, state.funnel.booked + 1);
  booking.confirmation = appointment;
  booking.customerName = '';
  booking.customerPhone = '';
  booking.referralCode = '';
  state.referralApplied = false;
  referralAutoApplied = false;
  saveState();
  render();
  if (referralError) {
    showToast(`${referralError}. La cita quedó guardada solo en este dispositivo.`, 'SQL no disponible', '!');
  } else if (appointment.referralReward) {
    showToast('¡Tu amigo ganó un corte gratis por venir contigo!', 'Premio de referido activado 🎉');
  } else if (appointment.persisted) {
    showToast('La cita y sus datos quedaron guardados en MySQL.', 'Reserva confirmada');
  }
}

window.navigate = navigate;
window.submitRegistration = submitRegistration;
window.setOnboardingStep = setOnboardingStep;
window.toggleService = toggleService;
window.continueServices = continueServices;
window.toggleHours = toggleHours;
window.finishSetup = finishSetup;
window.markShared = markShared;
window.copyBookingLink = copyBookingLink;
window.simulateFirstBooking = simulateFirstBooking;
window.selectBookingService = selectBookingService;
window.selectDate = selectDate;
window.selectTime = selectTime;
window.toggleExtra = toggleExtra;
window.applyReferral = applyReferral;
window.joinMembership = joinMembership;
window.resetDemo = resetDemo;
window.submitBooking = submitBooking;

if (new URLSearchParams(location.search).get('vista') === 'reservar') {
  state.view = 'booking';
}
render();
