let toastContainer = null;

const ensureContainer = () => {
  if (toastContainer) return toastContainer;
  toastContainer = document.createElement('div');
  toastContainer.className =
    'fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none';
  toastContainer.id = 'toast-container';
  document.body.appendChild(toastContainer);
  return toastContainer;
};

const TOAST_STYLES = {
  success: 'bg-green-600 text-white',
  error:   'bg-red-600 text-white',
  info:    'bg-blue-600 text-white',
  warning: 'bg-yellow-500 text-white',
};

export const toast = (message, type = 'info', duration = 3500) => {
  const container = ensureContainer();
  const el = document.createElement('div');
  el.className = `pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all duration-300 opacity-0 translate-x-4 ${TOAST_STYLES[type] || TOAST_STYLES.info}`;
  el.textContent = message;
  container.appendChild(el);
  requestAnimationFrame(() => {
    el.classList.remove('opacity-0', 'translate-x-4');
  });
  setTimeout(() => {
    el.classList.add('opacity-0', 'translate-x-4');
    setTimeout(() => el.remove(), 300);
  }, duration);
};

export const toastSuccess = (msg) => toast(msg, 'success');
export const toastError   = (msg) => toast(msg, 'error');
export const toastInfo    = (msg) => toast(msg, 'info');
export const toastWarn    = (msg) => toast(msg, 'warning');
