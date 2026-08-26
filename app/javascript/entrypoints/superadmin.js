import '../dashboard/assets/scss/super_admin/index.scss';

const initializeAccountSuspensionForm = () => {
  const form = document.querySelector('[data-account-suspension-form]');
  if (!form) return;

  const status = form.querySelector('[data-account-status-select]');
  const fields = form.querySelector('[data-account-suspension-fields]');
  if (!status || !fields) return;

  const category = fields.querySelector('[data-suspension-category]');
  const reason = fields.querySelector('[data-suspension-reason]');
  const controls = [category, reason];
  const originalStatus = form.dataset.originalStatus;
  const hasHistory = form.dataset.hasSuspensionHistory === 'true';

  const updateFields = () => {
    const isSuspended = status.value === 'suspended';
    const hasEnteredDetails = controls.some(
      control => control.value.trim().length > 0
    );
    const detailsRequired =
      isSuspended &&
      (originalStatus === 'active' || hasHistory || hasEnteredDetails);

    fields.classList.toggle('hidden', !isSuspended);
    controls.forEach(control => {
      control.disabled = !isSuspended;
      control.required = detailsRequired;
    });
  };

  status.addEventListener('change', updateFields);
  controls.forEach(control => control.addEventListener('input', updateFields));
  updateFields();
};

const initializeContactHidingForm = () => {
  const form = document.querySelector('[data-contact-hiding-form]');
  if (!form) return;

  const toggle = form.querySelector('[data-contact-hiding-toggle]');
  const inputsContainer = form.querySelector('[data-contact-hiding-inputs]');
  if (!toggle || !inputsContainer) return;

  const inputs = Array.from(inputsContainer.querySelectorAll('input'));

  // readonly, not disabled: disabled inputs are dropped from the submission, which would
  // send visible/hidden per cycle as 0 and fail the cycle-length validation when turning
  // the feature off.
  const updateInputs = () => {
    inputs.forEach(input => {
      input.readOnly = !toggle.checked;
    });
    inputsContainer.classList.toggle('opacity-50', !toggle.checked);
  };

  toggle.addEventListener('change', updateInputs);
  updateInputs();
};

document.addEventListener('DOMContentLoaded', initializeAccountSuspensionForm);
document.addEventListener('DOMContentLoaded', initializeContactHidingForm);
