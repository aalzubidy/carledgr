import React, { useState, useEffect } from 'react'
import { t, setLanguage, getCurrentLanguage } from '../utils/i18n.js'
import { api } from '../utils/api.js'
import { showSuccess, showError } from '../utils/snackbar.js'

function LoginPage({ onLogin }) {
  const [currentLanguage, setCurrentLanguage] = useState('en')
  const [credentials, setCredentials] = useState({
    organization: '',
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setCurrentLanguage(getCurrentLanguage())
  }, [])

  const handleLanguageChange = async (e) => {
    const newLanguage = e.target.value
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

  return (
    <div className="login-container">
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
      
      <form className="login-form" onSubmit={handleLogin}>
        <h1>{t('app.title')}</h1>
        
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
      </form>
    </div>
  )
}

export default LoginPage 