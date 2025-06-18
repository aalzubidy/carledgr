import React, { useState, useEffect } from 'react'
import { loadConfig } from './utils/config.js'
import { initializeI18n } from './utils/i18n.js'
import { getAuthToken } from './utils/api.js'
import LoginPage from './pages/LoginPage.jsx'
import Dashboard from './pages/Dashboard.jsx'
import CarsPage from './pages/CarsPage.jsx'
import CarDetails from './pages/CarDetails.jsx'
import MaintenancePage from './pages/MaintenancePage.jsx'
import ReportsPage from './pages/ReportsPage.jsx'
import ExpensesPage from './pages/ExpensesPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'

function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentRoute, setCurrentRoute] = useState('/')
  const [routeParams, setRouteParams] = useState({})
  const [error, setError] = useState(null)

  useEffect(() => {
    initializeApp()
    setupRouter()
    
    // Initialize snackbar system
    import('./utils/snackbar.js')
  }, [])

  const initializeApp = async () => {
    try {
      // Load configuration
      const config = await loadConfig()
      
      // Initialize internationalization
      await initializeI18n(config.app.defaultLanguage)
      
      // Check authentication
      const token = getAuthToken()
      setIsAuthenticated(!!token)
      
      console.log('Application initialized successfully')
    } catch (error) {
      console.error('Failed to initialize application:', error)
      setError('Failed to load the application. Please refresh the page.')
    } finally {
      setIsLoading(false)
    }
  }

  const setupRouter = () => {
    // Handle initial route
    const path = window.location.pathname
    const params = parseRoute(path)
    setCurrentRoute(path)
    setRouteParams(params)

    // Listen for navigation events
    window.addEventListener('popstate', () => {
      const path = window.location.pathname
      const params = parseRoute(path)
      setCurrentRoute(path)
      setRouteParams(params)
    })

    // Custom navigation function for the app
    window.navigate = (path) => {
      window.history.pushState({}, '', path)
      const params = parseRoute(path)
      setCurrentRoute(path)
      setRouteParams(params)
    }
  }

  const parseRoute = (path) => {
    // Handle parameterized routes like /cars/:id
    const carDetailsMatch = path.match(/^\/cars\/(.+)$/)
    if (carDetailsMatch) {
      return { id: carDetailsMatch[1] }
    }
    return {}
  }

  const requireAuth = (component) => {
    if (!isAuthenticated) {
      return <LoginPage onLogin={() => setIsAuthenticated(true)} />
    }
    return component
  }

  const renderCurrentPage = () => {
    if (!isAuthenticated && currentRoute !== '/login') {
      return <LoginPage onLogin={() => setIsAuthenticated(true)} />
    }

    switch (currentRoute) {
      case '/login':
        return <LoginPage onLogin={() => setIsAuthenticated(true)} />
      case '/dashboard':
        return requireAuth(<Dashboard />)
      case '/cars':
        return requireAuth(<CarsPage />)
      case '/maintenance':
        return requireAuth(<MaintenancePage />)
      case '/reports':
        return requireAuth(<ReportsPage />)
      case '/expenses':
        return requireAuth(<ExpensesPage />)
      case '/settings':
        return requireAuth(<SettingsPage />)
      default:
        if (currentRoute.startsWith('/cars/')) {
          const carId = routeParams.id
          return requireAuth(<CarDetails carId={carId} />)
        }
        // Default route
        if (isAuthenticated) {
          return <Dashboard />
        } else {
          return <LoginPage onLogin={() => setIsAuthenticated(true)} />
        }
    }
  }

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#e74c3c' }}>
        <div style={{ textAlign: 'center' }}>
          <h1>Application Error</h1>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return renderCurrentPage()
}

export default App 