import React, { useState, useEffect } from 'react'
import { t, setLanguage, getCurrentLanguage } from '../utils/i18n.js'
import { api } from '../utils/api.js'
import { showSuccess } from '../utils/snackbar.js'
import { 
  getCurrentUser, 
  setCurrentUser, 
  removeCurrentUser,
  getVisibleNavigationItems,
  getUserRoleDisplayName,
  getRoleBadgeColor
} from '../utils/permissions.js'
import UserProfileModal from './UserProfileModal.jsx'

function Layout({ children, activeRoute = '' }) {
  const [currentLanguage, setCurrentLanguage] = useState('en')
  const [user, setUser] = useState(null)
  const [visibleNavItems, setVisibleNavItems] = useState([])
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false)
  const [showSupportDropdown, setShowSupportDropdown] = useState(false)
  const [licenseInfo, setLicenseInfo] = useState(null)

  useEffect(() => {
    setCurrentLanguage(getCurrentLanguage())
    setupMobileSidebar()
    loadUserData()
    loadLicenseInfo()
  }, [])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserDropdown && !event.target.closest('.user-dropdown')) {
        setShowUserDropdown(false)
      }
      if (showLanguageDropdown && !event.target.closest('.floating-language-selector')) {
        setShowLanguageDropdown(false)
      }
      if (showSupportDropdown && !event.target.closest('.floating-support-selector')) {
        setShowSupportDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showUserDropdown, showLanguageDropdown, showSupportDropdown])

  const loadUserData = async () => {
    try {
      // First check localStorage
      let userData = getCurrentUser()
      
      // If no user data in localStorage, fetch from API
      if (!userData) {
        userData = await api.getCurrentUser()
        if (userData) {
          setCurrentUser(userData)
        }
      }
      
      setUser(userData)
      setVisibleNavItems(getVisibleNavigationItems())
    } catch (error) {
      console.error('Error loading user data:', error)
      // If API call fails, user might be logged out
      removeCurrentUser()
    }
  }

  const loadLicenseInfo = async () => {
    try {
      const license = await api.getLicenseInfo()
      setLicenseInfo(license)
    } catch (error) {
      console.error('Error loading license info:', error)
    }
  }

  const handleLanguageSelect = async (newLanguage) => {
    setShowLanguageDropdown(false)
    await setLanguage(newLanguage)
    setCurrentLanguage(newLanguage)
    // Reload the current page with new language
    window.location.reload()
  }

  const handleSupportOption = (option) => {
    setShowSupportDropdown(false)
    
    switch (option) {
      case 'documentation':
        window.open('https://carledgr.com/user-documentation.html', '_blank');
        break;
      case 'email':
        window.open('mailto:support@carledgr.com', '_blank');
        break;
      default:
        break;
    }
  }

  const handleNavigation = (route) => {
    if (window.navigate) {
      window.navigate(route)
    }
  }

  const handleLogout = async (e) => {
    e.preventDefault()
    setShowUserDropdown(false)
    
    try {
      await api.logout()
      removeCurrentUser()
      showSuccess(t('auth.logout') + ' ' + t('common.success'))
      if (window.navigate) {
        window.navigate('/login')
      }
    } catch (error) {
      console.error('Logout error:', error)
      // Even if logout fails on server, clear local storage and redirect
      removeCurrentUser()
      if (window.navigate) {
        window.navigate('/login')
      }
    }
  }

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser)
    setCurrentUser(updatedUser)
  }

  const handleProfileClick = () => {
    setShowUserDropdown(false)
    setShowProfileModal(true)
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

  // Check if live chat is available (all tiers except starter)
  const isLiveChatAvailable = licenseInfo && licenseInfo.license_type !== 'starter'

  return (
    <div className="app-container">
      {/* Header */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        width: '100%',
        height: '64px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #2c3e50',
        zIndex: 1001
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '100%',
          width: '100%',
          padding: '0 20px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <img src="/cl-logo.png" alt="CarLedgr Logo" style={{
              height: '40px',
              width: 'auto'
            }} />
            <h1 style={{
              color: '#2563eb',
              fontSize: '24px',
              margin: 0,
              fontWeight: 600
            }}>{t('app.name')}</h1>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center'
          }}>
            {user && (
              <div className="user-dropdown">
                <button 
                  className="user-dropdown-toggle"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                >
                  <div className="user-info">
                    <div className="user-name">{user.firstName} {user.lastName}</div>
                    <span className={`badge badge-${getRoleBadgeColor(user.roleId)}`}>
                      {getUserRoleDisplayName()}
                    </span>
                  </div>
                  <i className="fas fa-chevron-down"></i>
                </button>
                
                {showUserDropdown && (
                  <div className="user-dropdown-menu">
                    <button 
                      className="dropdown-item"
                      onClick={handleProfileClick}
                    >
                      <i className="fas fa-user-edit"></i>
                      {t('profile.updateAccount')}
                    </button>
                    <hr className="dropdown-divider" />
                    <button 
                      className="dropdown-item text-danger"
                      onClick={handleLogout}
                    >
                      <i className="fas fa-sign-out-alt"></i>
                      {t('auth.logout')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <aside className="sidebar" id="sidebar">
        <nav className="sidebar-nav">
          {visibleNavItems.map((item) => (
            <a 
              key={item.key}
              href={item.path} 
              className={`nav-item ${activeRoute === item.key ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault()
                handleNavigation(item.path)
              }}
            >
              {t(`navigation.${item.key}`)}
            </a>
          ))}
        </nav>
      </aside>
      
      <main className="main-content">
        {children}
      </main>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
        onUserUpdate={handleUserUpdate}
      />

      {/* Floating Support Selector */}
      <div className="floating-support-selector">
        <button 
          className="floating-support-toggle"
          onClick={() => setShowSupportDropdown(!showSupportDropdown)}
          title="Help & Support"
        >
          ❓
        </button>
        
        {showSupportDropdown && (
          <div className="floating-support-menu">
            <button 
              className="support-option"
              onClick={() => handleSupportOption('documentation')}
            >
              📚 Documentation
            </button>
            <button 
              className="support-option"
              onClick={() => handleSupportOption('email')}
            >
              📧 Email Support
            </button>
          </div>
        )}
      </div>

      {/* Floating Language Selector */}
      <div className="floating-language-selector">
        <button 
          className="floating-language-toggle"
          onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
        >
          🌐
        </button>
        
        {showLanguageDropdown && (
          <div className="floating-language-menu">
            <button 
              className={`language-option ${currentLanguage === 'en' ? 'active' : ''}`}
              onClick={() => handleLanguageSelect('en')}
            >
              English
            </button>
            <button 
              className={`language-option ${currentLanguage === 'es' ? 'active' : ''}`}
              onClick={() => handleLanguageSelect('es')}
            >
              Español
            </button>
            <button 
              className={`language-option ${currentLanguage === 'fr' ? 'active' : ''}`}
              onClick={() => handleLanguageSelect('fr')}
            >
              Français
            </button>
            <button 
              className={`language-option ${currentLanguage === 'ar' ? 'active' : ''}`}
              onClick={() => handleLanguageSelect('ar')}
            >
              العربية
            </button>
          </div>
        )}
      </div>
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