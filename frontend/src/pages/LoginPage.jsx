import React, { useState, useEffect } from 'react'
import { t, setLanguage, getCurrentLanguage } from '../utils/i18n.js'
import { api } from '../utils/api.js'
import { showSuccess, showError, showInfo } from '../utils/snackbar.js'
import { setCurrentUser } from '../utils/permissions.js'

function LoginPage({ onLogin }) {
  const [currentLanguage, setCurrentLanguage] = useState('en')
  const [credentials, setCredentials] = useState({
    organization: '',
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetData, setResetData] = useState({
    organization: '',
    email: ''
  })
  const [isResetLoading, setIsResetLoading] = useState(false)

  useEffect(() => {
    setCurrentLanguage(getCurrentLanguage())
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showLanguageDropdown && !event.target.closest('.floating-language-selector')) {
        setShowLanguageDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showLanguageDropdown])

  const handleLanguageSelect = async (newLanguage) => {
    setShowLanguageDropdown(false)
    await setLanguage(newLanguage)
    setCurrentLanguage(newLanguage)
    // Force re-render to update translations
    window.location.reload()
  }

  const handleInputChange = (e) => {
    const { id, value } = e.target
    setCredentials(prev => ({
      ...prev,
      [id]: value
    }))
  }

  const handleResetInputChange = (e) => {
    const { id, value } = e.target
    setResetData(prev => ({
      ...prev,
      [id]: value
    }))
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Basic client-side validation
    if (!credentials.organization.trim()) {
      showError('Organization is required')
      return
    }
    
    if (!credentials.email.trim()) {
      showError('Email is required')
      return
    }
    
    if (!credentials.password) {
      showError('Password is required')
      return
    }

    setIsLoading(true)
    
    try {
      const response = await api.login({
        organization: credentials.organization.trim(),
        email: credentials.email.trim(),
        password: credentials.password
      })
      
      if (response && response.token) {
        // Save user data to localStorage for role-based access
        if (response.user) {
          setCurrentUser(response.user)
        }
        
        showSuccess(t('auth.loginSuccess'))
        // Small delay to show success message before navigation
        setTimeout(() => {
          onLogin()
          if (window.navigate) {
            window.navigate('/dashboard')
          }
        }, 1000)
      } else {
        throw new Error(t('auth.loginError'))
      }
    } catch (error) {
      console.error('Login error:', error)
      const errorMessage = error.message || t('auth.loginError')
      showError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Basic client-side validation
    if (!resetData.organization.trim()) {
      showError('Organization is required')
      return
    }
    
    if (!resetData.email.trim()) {
      showError('Email is required')
      return
    }

    setIsResetLoading(true)
    
    try {
      await api.forgotPassword({
        organization: resetData.organization.trim(),
        email: resetData.email.trim()
      })
      
      showSuccess(t('auth.resetEmailSent'))
      // Clear form and go back to login
      setResetData({ organization: '', email: '' })
      setShowForgotPassword(false)
      
    } catch (error) {
      console.error('Password reset error:', error)
      const errorMessage = error.message || 'Failed to send reset email'
      showError(errorMessage)
    } finally {
      setIsResetLoading(false)
    }
  }

  const handleShowForgotPassword = () => {
    setShowForgotPassword(true)
    // Pre-fill organization if already entered
    if (credentials.organization) {
      setResetData(prev => ({
        ...prev,
        organization: credentials.organization
      }))
    }
  }

  return (
    <div className="login-container">
      
      {!showForgotPassword ? (
        <form className="login-form" onSubmit={handleLogin}>
          <div className="login-header">
            <img src="/cl-logo.png" alt="CarLedgr Logo" className="login-logo" />
            <h1>CarLedgr Smart Dealership Management Platform</h1>
          </div>
          
          <div className="form-group">
            <label htmlFor="organization">{t('auth.organization')}</label>
            <input 
              type="text" 
              id="organization" 
              className="form-control" 
              required
              placeholder={t('auth.organization')}
              value={credentials.organization}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">{t('auth.email')}</label>
            <input 
              type="email" 
              id="email" 
              className="form-control" 
              required
              placeholder={t('auth.email')}
              value={credentials.email}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">{t('auth.password')}</label>
            <input 
              type="password" 
              id="password" 
              className="form-control" 
              required
              placeholder={t('auth.password')}
              value={credentials.password}
              onChange={handleInputChange}
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary btn-block"
            disabled={isLoading}
          >
            {isLoading ? t('common.loading') : t('auth.loginButton')}
          </button>
          
          <div style={{ textAlign: 'center', marginTop: '15px' }}>
            <button 
              type="button" 
              className="btn-link"
              onClick={handleShowForgotPassword}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: '#007bff', 
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {t('auth.forgotPassword')}
            </button>
          </div>
        </form>
      ) : (
        <form className="login-form" onSubmit={handleForgotPassword}>
          <div className="login-header">
            <img src="/cl-logo.png" alt="CarLedgr Logo" className="login-logo" />
            <h1>{t('auth.resetPassword')}</h1>
            <p style={{ color: '#666', fontSize: '14px', margin: '10px 0' }}>
              {t('auth.resetInstructions')}
            </p>
          </div>
          
          <div className="form-group">
            <label htmlFor="organization">{t('auth.organization')}</label>
            <input 
              type="text" 
              id="organization" 
              className="form-control" 
              required
              placeholder={t('auth.organization')}
              value={resetData.organization}
              onChange={handleResetInputChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">{t('auth.email')}</label>
            <input 
              type="email" 
              id="email" 
              className="form-control" 
              required
              placeholder={t('auth.email')}
              value={resetData.email}
              onChange={handleResetInputChange}
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary btn-block"
            disabled={isResetLoading}
          >
            {isResetLoading ? t('common.loading') : t('auth.sendResetEmail')}
          </button>
          
          <div style={{ textAlign: 'center', marginTop: '15px' }}>
            <button 
              type="button" 
              className="btn-link"
              onClick={() => {
                setShowForgotPassword(false)
                setResetData({ organization: '', email: '' })
              }}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: '#007bff', 
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {t('auth.backToLogin')}
            </button>
          </div>
        </form>
      )}

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

export default LoginPage 