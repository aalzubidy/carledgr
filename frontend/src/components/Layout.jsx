import React, { useState, useEffect } from 'react'
import { t, setLanguage, getCurrentLanguage } from '../utils/i18n.js'
import { api } from '../utils/api.js'
import { showSuccess } from '../utils/snackbar.js'

function Layout({ children, activeRoute = '' }) {
  const [currentLanguage, setCurrentLanguage] = useState('en')

  useEffect(() => {
    setCurrentLanguage(getCurrentLanguage())
    setupMobileSidebar()
  }, [])

  const handleLanguageChange = async (e) => {
    const newLanguage = e.target.value
    await setLanguage(newLanguage)
    setCurrentLanguage(newLanguage)
    // Reload the current page with new language
    window.location.reload()
  }

  const handleNavigation = (route) => {
    if (window.navigate) {
      window.navigate(route)
    }
  }

  const handleLogout = async (e) => {
    e.preventDefault()
    
    try {
      await api.logout()
      showSuccess(t('auth.logout') + ' ' + t('common.success'))
      if (window.navigate) {
        window.navigate('/login')
      }
    } catch (error) {
      console.error('Logout error:', error)
      // Even if logout fails on server, clear local storage and redirect
      if (window.navigate) {
        window.navigate('/login')
      }
    }
  }

  const setupMobileSidebar = () => {
    // Add mobile menu toggle if screen is small
    if (window.innerWidth <= 768) {
      const existingToggle = document.querySelector('.mobile-menu-toggle')
      if (!existingToggle) {
        const menuToggle = document.createElement('button')
        menuToggle.innerHTML = '☰'
        menuToggle.className = 'mobile-menu-toggle'
        menuToggle.style.cssText = `
          position: fixed;
          top: 20px;
          left: 20px;
          z-index: 1001;
          background: #3498db;
          color: white;
          border: none;
          padding: 10px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 18px;
        `
        
        menuToggle.addEventListener('click', () => {
          const sidebar = document.getElementById('sidebar')
          if (sidebar) {
            sidebar.classList.toggle('open')
          }
        })
        
        document.body.appendChild(menuToggle)
      }
    }
  }

  return (
    <div className="app-container">
      <aside className="sidebar" id="sidebar">
        <div className="sidebar-header">
          <h1>{t('app.name')}</h1>
          <div className="language-selector">
            <select 
              id="languageSelect" 
              value={currentLanguage} 
              onChange={handleLanguageChange}
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="ar">العربية</option>
            </select>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <a 
            href="/dashboard" 
            className={`nav-item ${activeRoute === 'dashboard' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault()
              handleNavigation('/dashboard')
            }}
          >
            {t('navigation.dashboard')}
          </a>
          <a 
            href="/cars" 
            className={`nav-item ${activeRoute === 'cars' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault()
              handleNavigation('/cars')
            }}
          >
            {t('navigation.cars')}
          </a>
          <a 
            href="/maintenance" 
            className={`nav-item ${activeRoute === 'maintenance' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault()
              handleNavigation('/maintenance')
            }}
          >
            {t('navigation.maintenance')}
          </a>
          <a 
            href="/reports" 
            className={`nav-item ${activeRoute === 'reports' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault()
              handleNavigation('/reports')
            }}
          >
            {t('navigation.reports')}
          </a>
          <a 
            href="#" 
            className="nav-item" 
            onClick={handleLogout}
          >
            {t('auth.logout')}
          </a>
        </nav>
      </aside>
      
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}

export function Loading() {
  return (
    <div className="loading">
      <div className="spinner"></div>
      <p>{t('common.loading')}</p>
    </div>
  )
}

export function EmptyState({ message, icon = '📭' }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h3>{message}</h3>
    </div>
  )
}

export default Layout 