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

  const formatCop = amountInCents =>
    `$ ${Math.round(amountInCents / 100)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.')} COP`;

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
    const sessionLink = document.getElementById('session-link');
    if (sessionLink) {
      sessionLink.textContent = 'MI PANEL';
      sessionLink.href = '/app';
    }
  }

  /* ------------------------------------------------------------- checkout */

  const openCheckout = async button => {
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
        showToast('declined', 'NO SE PUDO INICIAR EL PAGO', payload.error || 'Inténtalo de nuevo en unos minutos.');
        return;
      }
    } catch {
      showToast('declined', 'NO SE PUDO FIRMAR LA ORDEN', 'El servicio de firma no respondió. Revisa tu conexión e inténtalo de nuevo.');
      return;
    }

    if (!window.WidgetCheckout) {
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
    showToast(tone, TITLE_BY_TONE[tone], `${formatCop(transaction.amount_in_cents)} - REF ${transaction.reference}`);
  };

  const url = new URL(window.location.href);
  const transactionId = url.searchParams.get('id');

  if (transactionId) {
    url.searchParams.delete('id');
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    resolveRedirect(transactionId);
  }
})();
