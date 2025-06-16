// Material-UI inspired Snackbar utility for vanilla JavaScript
class SnackbarManager {
  constructor() {
    this.snackbars = [];
    this.container = null;
    this.init();
  }

  init() {
    // Create the snackbar container
    this.container = document.createElement('div');
    this.container.id = 'snackbar-container';
    this.container.className = 'snackbar-container-mui';
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10003;
      max-width: 400px;
      pointer-events: none;
    `;
    document.body.appendChild(this.container);
  }

  show(message, severity = 'info', duration = 6000) {
    const id = Date.now() + Math.random();
    const snackbar = {
      id,
      message,
      severity,
      duration,
      element: this.createSnackbarElement(id, message, severity)
    };

    this.snackbars.push(snackbar);
    this.container.appendChild(snackbar.element);

    // Trigger animation
    requestAnimationFrame(() => {
      snackbar.element.style.transform = 'translateX(0)';
      snackbar.element.style.opacity = '1';
    });

    // Auto-hide after duration
    if (duration > 0) {
      setTimeout(() => {
        this.hide(id);
      }, duration);
    }

    return id;
  }

  hide(id) {
    const snackbarIndex = this.snackbars.findIndex(s => s.id === id);
    if (snackbarIndex === -1) return;

    const snackbar = this.snackbars[snackbarIndex];
    
    // Animate out
    snackbar.element.style.transform = 'translateX(100%)';
    snackbar.element.style.opacity = '0';

    // Remove after animation
    setTimeout(() => {
      if (snackbar.element.parentNode) {
        snackbar.element.remove();
      }
      this.snackbars.splice(snackbarIndex, 1);
    }, 300);
  }

  hideAll() {
    this.snackbars.forEach(snackbar => {
      if (snackbar.element.parentNode) {
        snackbar.element.remove();
      }
    });
    this.snackbars = [];
  }

  createSnackbarElement(id, message, severity) {
    const element = document.createElement('div');
    element.className = `snackbar-mui snackbar-${severity}`;
    element.style.cssText = `
      background: ${this.getBackgroundColor(severity)};
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      justify-content: space-between;
      pointer-events: auto;
      min-width: 300px;
      transform: translateX(100%);
      opacity: 0;
      transition: all 0.3s ease-out;
      cursor: default;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
    `;

    const icon = document.createElement('span');
    icon.style.fontSize = '16px';
    icon.textContent = this.getIcon(severity);

    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;

    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.cssText = `
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      font-size: 18px;
      padding: 0 4px;
      opacity: 0.8;
      margin-left: 8px;
    `;

    closeButton.addEventListener('mouseenter', () => {
      closeButton.style.opacity = '1';
    });

    closeButton.addEventListener('mouseleave', () => {
      closeButton.style.opacity = '0.8';
    });

    closeButton.addEventListener('click', () => {
      this.hide(id);
    });

    content.appendChild(icon);
    content.appendChild(messageSpan);
    element.appendChild(content);
    element.appendChild(closeButton);

    return element;
  }

  getBackgroundColor(severity) {
    switch (severity) {
      case 'success':
        return '#4caf50';
      case 'error':
        return '#f44336';
      case 'warning':
        return '#ff9800';
      case 'info':
      default:
        return '#2196f3';
    }
  }

  getIcon(severity) {
    switch (severity) {
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

  // Convenience methods
  success(message, duration) {
    return this.show(message, 'success', duration);
  }

  error(message, duration) {
    return this.show(message, 'error', duration);
  }

  warning(message, duration) {
    return this.show(message, 'warning', duration);
  }

  info(message, duration) {
    return this.show(message, 'info', duration);
  }
}

// Create a global instance
const snackbar = new SnackbarManager();

// Export the instance and individual methods
export { snackbar };
export const showSnackbar = (message, severity, duration) => snackbar.show(message, severity, duration);
export const hideSnackbar = (id) => snackbar.hide(id);
export const hideAllSnackbars = () => snackbar.hideAll();
export const showSuccess = (message, duration) => snackbar.success(message, duration);
export const showError = (message, duration) => snackbar.error(message, duration);
export const showWarning = (message, duration) => snackbar.warning(message, duration);
export const showInfo = (message, duration) => snackbar.info(message, duration); 