/* ==========================================================================
   LuxoInbox marketing landing.
   Framework-free port of the standalone React site. Loaded with `defer`, so
   the DOM is already parsed when this runs.

   The integrity secret never reaches the browser: the page asks
   POST /landing/wompi_session for a signed reference and the server decides
   the amount from the plan id.
   ========================================================================== */

(() => {
  const TONE_BY_STATUS = {
    APPROVED: 'approved',
    PENDING: 'pending',
    DECLINED: 'declined',
    ERROR: 'declined',
    VOIDED: 'declined',
  };

  const TITLE_BY_TONE = {
    approved: 'PAGO APROBADO',
    pending: 'PAGO PENDIENTE',
    declined: 'PAGO RECHAZADO',
  };

  const CLOSE_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
    'stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';

  const toastRoot = document.getElementById('toast-root');

  /* ---------------------------------------------------------------- helpers */

  // Wompi omits the amount on some transaction payloads; callers drop the line
  // instead of printing "$ NaN COP".
  const formatCop = amountInCents =>
    Number.isFinite(amountInCents)
      ? `$ ${Math.round(amountInCents / 100)
          .toString()
          .replace(/\B(?=(\d{3})+(?!\d))/g, '.')} COP`
      : null;

  /** Wompi API host, derived from the public key prefix, same as the standalone site. */
  const wompiApiBase = () =>
    (document.body.dataset.wompiPublicKey || '').startsWith('pub_prod_')
      ? 'https://production.wompi.co/v1'
      : 'https://sandbox.wompi.co/v1';

  const showToast = (tone, title, detail) => {
    toastRoot.replaceChildren();

    const toast = document.createElement('div');
    toast.className = `toast liquid-glass toast--${tone}`;
    toast.setAttribute('role', 'status');
    toast.innerHTML = `
      <button type="button" class="toast__dismiss" aria-label="Cerrar notificación">${CLOSE_ICON}</button>
      <p class="toast__title"></p>
      <p class="toast__detail"></p>
    `;
    toast.querySelector('.toast__title').textContent = title;
    toast.querySelector('.toast__detail').textContent = detail;
    toast.querySelector('.toast__dismiss').addEventListener('click', () => toast.remove());

    toastRoot.append(toast);
  };

  /* ------------------------------------------------------- session shortcut */

  // Progressive enhancement: a signed-in visitor gets a shortcut into the product.
  // The cookie is only read, never trusted - the server still gates /app.
  if (/(?:^|;\s*)cw_d_session_info=/.test(document.cookie)) {
    document.querySelectorAll('[data-session-link]').forEach(sessionLink => {
      sessionLink.textContent = 'MI PANEL';
      sessionLink.href = '/app';
    });
  }

  /* ------------------------------------------------------------ mobile menu */

  // The desktop nav only exists from lg up; below that a hamburger toggles a
  // full-screen overlay menu. Guarded: pages without the header skip all of it.
  const menuToggle = document.querySelector('[aria-controls="mobile-menu"]');
  const mobileMenu = document.getElementById('mobile-menu');

  if (menuToggle && mobileMenu) {
    // Re-parent the overlay to <body>: the header renders it inside animated
    // (transformed) ancestors, which would turn position:fixed into a local
    // containing block and clip the menu to the hero.
    document.body.appendChild(mobileMenu);

    const setMenuOpen = open => {
      mobileMenu.classList.toggle('mobile-menu--open', open);
      document.body.classList.toggle('mobile-menu-open', open);
      menuToggle.setAttribute('aria-expanded', String(open));
    };

    const isMenuOpen = () => mobileMenu.classList.contains('mobile-menu--open');

    menuToggle.addEventListener('click', () => setMenuOpen(!isMenuOpen()));
    mobileMenu.querySelector('.mobile-menu__close').addEventListener('click', () => setMenuOpen(false));
    mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenuOpen(false)));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && isMenuOpen()) setMenuOpen(false);
    });

    // Resizing past the lg breakpoint reveals the desktop nav; close the overlay
    // so the body scroll lock never survives the switch.
    const desktopQuery = window.matchMedia('(min-width: 1024px)');
    desktopQuery.addEventListener('change', event => {
      if (event.matches && isMenuOpen()) setMenuOpen(false);
    });
  }

  /* ------------------------------------------------------------- checkout */

  // The button is re-enabled as soon as `checkout.open` hands control to the
  // Wompi widget, so a flag - not `disabled` - is what keeps a second order
  // from being signed while the widget is up.
  let checkoutInFlight = false;

  const openCheckout = async button => {
    if (checkoutInFlight) return;
    checkoutInFlight = true;

    const { planId, planName, planPrice } = button.dataset;

    let payload;
    try {
      const response = await fetch('/landing/wompi_session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ plan_id: planId }),
      });
      payload = await response.json();

      if (!response.ok) {
        checkoutInFlight = false;
        showToast('declined', 'NO SE PUDO INICIAR EL PAGO', payload.error || 'Inténtalo de nuevo en unos minutos.');
        return;
      }
    } catch {
      checkoutInFlight = false;
      showToast('declined', 'NO SE PUDO FIRMAR LA ORDEN', 'El servicio de firma no respondió. Revisa tu conexión e inténtalo de nuevo.');
      return;
    }

    if (!window.WidgetCheckout) {
      checkoutInFlight = false;
      showToast('declined', 'WIDGET DE WOMPI NO DISPONIBLE', 'checkout.wompi.co/widget.js no cargó. Revisa la conexión e inténtalo de nuevo.');
      return;
    }

    const checkout = new window.WidgetCheckout({
      currency: payload.currency,
      amountInCents: payload.amount_in_cents,
      reference: payload.reference,
      publicKey: payload.public_key,
      redirectUrl: payload.redirect_url,
      signature: { integrity: payload.signature },
    });

    checkout.open(result => {
      checkoutInFlight = false;

      const transaction = result && result.transaction;
      if (!transaction) return;

      const tone = TONE_BY_STATUS[transaction.status] || 'pending';
      showToast(tone, TITLE_BY_TONE[tone], `PLAN ${planName} - ${planPrice} - REF ${transaction.reference}`);
    });
  };

  document.querySelectorAll('.plan-card__buy').forEach(button => {
    button.addEventListener('click', async () => {
      button.disabled = true;
      try {
        await openCheckout(button);
      } finally {
        button.disabled = false;
      }
    });
  });

  /* ------------------------------------------------------- redirect result */

  // Wompi redirects back with `?id=<transaction_id>` - resolve it into a toast.
  const resolveRedirect = async transactionId => {
    let transaction;
    try {
      const response = await fetch(`${wompiApiBase()}/transactions/${encodeURIComponent(transactionId)}`);
      transaction = (await response.json()).data;
    } catch {
      showToast('declined', 'NO SE PUDO CONTACTAR A WOMPI', `No se pudo verificar la transacción ${transactionId}. Revisa tu conexión e inténtalo de nuevo.`);
      return;
    }

    if (!transaction) {
      showToast('declined', 'TRANSACCIÓN NO ENCONTRADA', `Wompi no devolvió datos para la transacción ${transactionId}.`);
      return;
    }

    const tone = TONE_BY_STATUS[transaction.status] || 'pending';
    const amount = formatCop(transaction.amount_in_cents);
    const reference = `REF ${transaction.reference}`;
    const detail = amount ? `${amount} - ${reference}` : reference;
    showToast(tone, TITLE_BY_TONE[tone], detail);
  };

  /* ----------------------------------------------------------- payment page */

  // /pago renders a "verifying" panel server side; this block resolves the
  // transaction and swaps in the final state. Pages without the panel keep the
  // toast-based flow above instead, so the result is never announced twice.
  const pagoResult = document.getElementById('pago-result');

  const CTA_BY_TONE = {
    approved: { label: 'ENTRAR A MI PANEL', href: '/app' },
    pending: { label: 'VOLVER AL INICIO', href: '/' },
    declined: { label: 'INTENTAR DE NUEVO', href: '/precios' },
  };

  const EXPLANATION_BY_TONE = {
    approved: 'Tu plan quedó activo. Guarda la referencia para cualquier reclamo.',
    pending: 'Tu pago está en proceso. Algunos medios como PSE pueden tardar unos minutos en confirmarse.',
    declined: 'La entidad no aprobó la transacción. Puedes intentarlo de nuevo con otro medio de pago.',
  };

  const renderPagoState = ({ tone, title, details, cta }) => {
    pagoResult.replaceChildren();

    const heading = document.createElement('h1');
    heading.className = `pago__title${tone ? ` pago__title--${tone}` : ''}`;
    heading.textContent = title;
    pagoResult.append(heading);

    details.forEach(text => {
      const line = document.createElement('p');
      line.className = 'pago__detail';
      line.textContent = text;
      pagoResult.append(line);
    });

    const link = document.createElement('a');
    link.className = 'pago__cta';
    link.href = cta.href;
    link.textContent = cta.label;
    pagoResult.append(link);
  };

  const resolvePagoResult = async transactionId => {
    let transaction;
    try {
      const response = await fetch(`${wompiApiBase()}/transactions/${encodeURIComponent(transactionId)}`);
      transaction = (await response.json()).data;
    } catch {
      renderPagoState({
        tone: 'declined',
        title: 'NO SE PUDO CONTACTAR A WOMPI',
        details: [`No se pudo verificar la transacción ${transactionId}. Revisa tu conexión e inténtalo de nuevo.`],
        cta: { label: 'REINTENTAR', href: window.location.href },
      });
      return;
    }

    if (!transaction) {
      renderPagoState({
        tone: 'declined',
        title: 'TRANSACCIÓN NO ENCONTRADA',
        details: [`Wompi no devolvió datos para la transacción ${transactionId}.`],
        cta: CTA_BY_TONE.declined,
      });
      return;
    }

    const tone = TONE_BY_STATUS[transaction.status] || 'pending';
    const amount = formatCop(transaction.amount_in_cents);
    renderPagoState({
      tone,
      title: TITLE_BY_TONE[tone],
      details: [
        ...(amount ? [`MONTO: ${amount}`] : []),
        `REFERENCIA: ${transaction.reference}`,
        EXPLANATION_BY_TONE[tone],
      ],
      cta: CTA_BY_TONE[tone],
    });
  };

  const url = new URL(window.location.href);
  const transactionId = url.searchParams.get('id');

  if (pagoResult) {
    if (transactionId) {
      resolvePagoResult(transactionId);
    } else {
      renderPagoState({
        tone: null,
        title: 'NO ENCONTRAMOS UNA TRANSACCIÓN',
        details: ['Este enlace no incluye un identificador de pago. Si acabas de pagar, revisa tu correo o vuelve a los planes.'],
        cta: { label: 'VER PLANES', href: '/precios' },
      });
    }
  } else if (transactionId) {
    url.searchParams.delete('id');
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    resolveRedirect(transactionId);
  }
})();
