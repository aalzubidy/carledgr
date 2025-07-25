// Simple router utility for React app
let routes = {};
let currentRoute = null;

function addRoute(path, handler) {
  routes[path] = handler;
}

function navigate(path, data = {}) {
  // Update URL without page reload
  window.history.pushState(data, '', path);
  
  // Trigger React router update if available
  if (window.navigate) {
    window.navigate(path);
  } else {
    // Fallback to old routing system if React router not available
    handleRoute(path, data);
  }
}

function handleRoute(path = window.location.pathname, data = {}) {
  currentRoute = path;
  
  // Find exact match first
  let handler = routes[path];
  
  // If no exact match, try pattern matching for dynamic routes
  if (!handler) {
    for (const routePath in routes) {
      if (routePath.includes(':')) {
        const routePattern = routePath.replace(/:[^/]+/g, '([^/]+)');
        const regex = new RegExp(`^${routePattern}$`);
        const match = path.match(regex);
        
        if (match) {
          handler = routes[routePath];
          // Extract parameters
          const paramNames = routePath.match(/:([^/]+)/g) || [];
          const params = {};
          paramNames.forEach((param, index) => {
            const paramName = param.substring(1); // Remove ':'
            params[paramName] = match[index + 1];
          });
          data = { ...data, params };
          break;
        }
      }
    }
  }
  
  // Fallback to wildcard route
  if (!handler) {
    handler = routes['*'];
  }
  
  if (handler) {
    handler(data);
  } else {
    console.error(`No route handler found for: ${path}`);
  }
}

function getCurrentRoute() {
  return currentRoute;
}

function initializeRouter() {
  // Handle browser back/forward buttons
  window.addEventListener('popstate', (event) => {
    if (window.navigate) {
      // Let React handle the routing
      const path = window.location.pathname;
      window.navigate(path);
    } else {
      // Fallback to old routing system
      handleRoute(window.location.pathname, event.state || {});
    }
  });
  
  // Handle initial route
  if (!window.navigate) {
    handleRoute();
  }
}

export { addRoute, navigate, handleRoute, getCurrentRoute, initializeRouter }; 