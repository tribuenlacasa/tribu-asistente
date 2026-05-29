const APPS_SCRIPT_BASE_URL = 'https://script.google.com/macros/s/AKfycbz0RtWBooE83gRtE7n47kyQBX8oQOxuZCfGAeRzSWA8KzZRoiuC5CvvitoHIbjRpquJ/exec';
const DEFAULT_EVENT_ID = '';

let context = { eventId: '', token: '', info: null };

document.addEventListener('DOMContentLoaded', init);

function init() {
  const params = new URLSearchParams(window.location.search);
  context.eventId = params.get('eventId') || DEFAULT_EVENT_ID;
  context.token = params.get('token') || '';

  copyAliasBtn.addEventListener('click', () => copyText(alias.textContent));
  openMpBtn.addEventListener('click', openMercadoPago);
  submitBtn.addEventListener('click', submitPaymentNotice);

  if (!isConfigured(APPS_SCRIPT_BASE_URL)) return setStatus('error', 'Falta configurar APPS_SCRIPT_BASE_URL en app.js.');
  if (!context.eventId || !context.token) return setStatus('error', 'Falta eventId o token en el link.');
  loadPaymentInfo();
}

function loadPaymentInfo() {
  setStatus('ready', 'Cargando datos del evento...');
  jsonp('infoPago', { eventId: context.eventId, token: context.token })
    .then((res) => {
      if (!res.ok) throw new Error(res.error || 'No se pudo cargar la información.');
      context.info = res;
      renderInfo(res);
    })
    .catch((err) => setStatus('error', err.message));
}

function renderInfo(info) {
  eventCard.hidden = false;
  paymentCard.hidden = false;
  guestCard.hidden = false;
  formCard.hidden = false;

  eventName.textContent = info.nombreEvento || 'Evento';
  eventMeta.textContent = [info.fechaEvento, info.lugar].filter(Boolean).join(' · ');
  eventDescription.textContent = info.descripcion || '';
  amount.textContent = info.invitado.montoEsperado || info.precioEntrada || '-';
  alias.textContent = info.aliasMercadoPago || '-';
  holder.textContent = info.titularCuenta || '-';
  cvu.textContent = info.cvuCbu || '-';
  instructions.textContent = info.instruccionesPago || '';
  guestName.textContent = info.invitado.nombre || 'Invitado';
  paymentStatus.textContent = info.invitado.estadoPago || 'pendiente';
  nameInput.value = info.invitado.nombre || '';
  contactInput.value = info.invitado.contacto || '';
  paidAmountInput.value = info.invitado.montoEsperado || info.precioEntrada || '';
  openMpBtn.disabled = !info.linkMercadoPagoOpcional;
  setStatus('ready', 'Datos cargados. Podés informar tu pago.');
}

function submitPaymentNotice() {
  if (!referenceInput.value.trim() && !proofInput.value.trim()) {
    return setStatus('error', 'Agregá una referencia o comprobante para que producción pueda revisar el pago.');
  }

  setStatus('sending', 'Enviando aviso de pago...');
  jsonp('registrarPago', {
    eventId: context.eventId,
    token: context.token,
    nombre: nameInput.value,
    contacto: contactInput.value,
    metodoPago: methodInput.value,
    referenciaPago: referenceInput.value,
    montoPagado: paidAmountInput.value,
    linkComprobante: proofInput.value,
    comentario: commentInput.value
  }).then((res) => {
    if (!res.ok) throw new Error(res.error || 'No se pudo registrar el aviso.');
    setStatus('ready', 'Aviso enviado. Producción revisará tu pago.');
    paymentStatus.textContent = 'avisado';
    submitBtn.disabled = true;
  }).catch((err) => setStatus('error', err.message));
}

function openMercadoPago() {
  if (context.info && context.info.linkMercadoPagoOpcional) {
    window.open(context.info.linkMercadoPagoOpcional, '_blank', 'noopener,noreferrer');
  }
}

function jsonp(action, data) {
  return new Promise((resolve, reject) => {
    const callback = 'tribuCb_' + Date.now() + '_' + Math.round(Math.random() * 100000);
    const script = document.createElement('script');
    const params = new URLSearchParams(Object.assign({}, data, { action, callback }));
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('La solicitud tardó demasiado.'));
    }, 15000);

    window[callback] = (response) => {
      cleanup();
      resolve(response);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error('No se pudo conectar con Apps Script.'));
    };

    script.src = APPS_SCRIPT_BASE_URL.replace(/\/$/, '') + '?' + params.toString();
    document.body.appendChild(script);

    function cleanup() {
      clearTimeout(timeout);
      delete window[callback];
      script.remove();
    }
  });
}

function copyText(text) {
  navigator.clipboard.writeText(text).then(() => setStatus('ready', 'Copiado.')).catch(() => prompt('Copiar:', text));
}

function setStatus(type, message) {
  status.className = 'status ' + type;
  status.textContent = message;
}

function isConfigured(value) {
  return value && !String(value).startsWith('PEGAR_');
}
