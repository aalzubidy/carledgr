// Toast notification utility
let toastContainer = null;

function createToastContainer() {
  if (toastContainer) return toastContainer;
  
  toastContainer = document.createElement('div');
  toastContainer.id = 'toast-container';
  toastContainer.className = 'toast-container';
  document.body.appendChild(toastContainer);
  
  return toastContainer;
}

function showToast(message, type = 'info', duration = 5000) {
  const container = createToastContainer();
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icon = getToastIcon(type);
  toast.innerHTML = `
    <div class="toast-content">
      <span class="toast-icon">${icon}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
  `;
  
  container.appendChild(toast);
  
  // Animate in
  setTimeout(() => toast.classList.add('toast-show'), 10);
  
  // Auto remove
  if (duration > 0) {
    setTimeout(() => {
      toast.classList.remove('toast-show');
      setTimeout(() => {
        if (toast.parentElement) {
          toast.remove();
        }
      }, 300);
    }, duration);
  }
  
  return toast;
}

function getToastIcon(type) {
  switch (type) {
    case 'success':
      return '✓';
    case 'error':
      return '✕';
    case 'warning':
      return '⚠';
    case 'info':
    default:
      return 'ℹ';
  }
}

function hideAllToasts() {
  const container = document.getElementById('toast-container');
  if (container) {
    container.innerHTML = '';
  }
}

export { showToast, hideAllToasts }; 