import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { t } from '../utils/i18n';
import { showSnackbar } from '../utils/snackbar';

const UserProfileModal = ({ isOpen, onClose, user, onUserUpdate }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: ''
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  // Initialize form data when user changes
  useEffect(() => {
    if (user) {
      setProfileForm({
        first_name: user.firstName || '',
        last_name: user.lastName || ''
      });
    }
  }, [user]);

  // Reset forms when modal closes
  useEffect(() => {
    if (!isOpen) {
      setActiveTab('profile');
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      setShowConfirmDialog(false);
      setPendingAction(null);
    }
  }, [isOpen]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    if (!profileForm.first_name.trim() || !profileForm.last_name.trim()) {
      showSnackbar(t('validation.nameRequired'), 'error');
      return;
    }

    setPendingAction(() => submitProfileUpdate);
    setShowConfirmDialog(true);
  };

  const submitProfileUpdate = async () => {
    setIsLoading(true);
    try {
      const updatedUser = await api.updateProfile(profileForm);
      onUserUpdate(updatedUser);
      showSnackbar(t('profile.updateSuccess'), 'success');
      onClose();
    } catch (error) {
      showSnackbar(error.message || t('common.error'), 'error');
    } finally {
      setIsLoading(false);
      setShowConfirmDialog(false);
      setPendingAction(null);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password) {
      showSnackbar(t('validation.allPasswordFieldsRequired'), 'error');
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      showSnackbar(t('validation.passwordMismatch'), 'error');
      return;
    }

    if (passwordForm.new_password.length < 6) {
      showSnackbar(t('validation.passwordMinLength'), 'error');
      return;
    }

    setPendingAction(() => submitPasswordUpdate);
    setShowConfirmDialog(true);
  };

  const submitPasswordUpdate = async () => {
    setIsLoading(true);
    try {
      await api.updatePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password
      });
      showSnackbar(t('profile.passwordUpdateSuccess'), 'success');
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      onClose();
    } catch (error) {
      showSnackbar(error.message || t('common.error'), 'error');
    } finally {
      setIsLoading(false);
      setShowConfirmDialog(false);
      setPendingAction(null);
    }
  };

  const handleConfirmAction = () => {
    if (pendingAction) {
      pendingAction();
    }
  };

  if (!isOpen) return null;

  // Confirmation Dialog
  if (showConfirmDialog) {
    return (
      <div className="modal-overlay">
        <div className="modal" style={{ maxWidth: '400px' }}>
          <div className="modal-header">
            <h2>{t('common.confirm')}</h2>
          </div>
          <div className="modal-body">
            <p>{activeTab === 'profile' ? t('profile.confirmProfileUpdate') : t('profile.confirmPasswordUpdate')}</p>
          </div>
          <div className="modal-footer">
            <button 
              className="btn btn-secondary" 
              onClick={() => {
                setShowConfirmDialog(false);
                setPendingAction(null);
              }}
              disabled={isLoading}
            >
              {t('common.cancel')}
            </button>
            <button 
              className="btn btn-primary" 
              onClick={handleConfirmAction}
              disabled={isLoading}
            >
              {isLoading ? t('common.saving') : t('common.confirm')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main Modal
  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h2>{t('profile.updateAccount')}</h2>
          <button 
            className="modal-close" 
            onClick={onClose}
            disabled={isLoading}
          >×</button>
        </div>
        
        <div className="modal-body">
          {/* Tabs */}
          <div style={{ marginBottom: '20px', borderBottom: '1px solid #ddd' }}>
            <button 
              style={{
                padding: '10px 20px',
                border: 'none',
                backgroundColor: activeTab === 'profile' ? '#007bff' : 'transparent',
                color: activeTab === 'profile' ? 'white' : '#007bff',
                borderRadius: '4px 4px 0 0',
                marginRight: '5px',
                cursor: 'pointer'
              }}
              onClick={() => setActiveTab('profile')}
              disabled={isLoading}
            >
              {t('profile.profileInfo')}
            </button>
            <button 
              style={{
                padding: '10px 20px',
                border: 'none',
                backgroundColor: activeTab === 'password' ? '#007bff' : 'transparent',
                color: activeTab === 'password' ? 'white' : '#007bff',
                borderRadius: '4px 4px 0 0',
                cursor: 'pointer'
              }}
              onClick={() => setActiveTab('password')}
              disabled={isLoading}
            >
              {t('profile.changePassword')}
            </button>
          </div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>{t('common.firstName')}</label>
                  <input
                    type="text"
                    className="form-control"
                    value={profileForm.first_name}
                    onChange={(e) => setProfileForm({
                      ...profileForm,
                      first_name: e.target.value
                    })}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{t('common.lastName')}</label>
                  <input
                    type="text"
                    className="form-control"
                    value={profileForm.last_name}
                    onChange={(e) => setProfileForm({
                      ...profileForm,
                      last_name: e.target.value
                    })}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>
              
              <div className="form-row single">
                <div className="form-group">
                  <label>{t('common.email')}</label>
                  <input
                    type="email"
                    className="form-control"
                    value={user?.email || ''}
                    disabled
                    style={{ backgroundColor: '#f8f9fa' }}
                  />
                  <small style={{ color: '#666', fontSize: '12px' }}>
                    {t('profile.emailNotEditable')}
                  </small>
                </div>
              </div>
            </form>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <form onSubmit={handlePasswordSubmit}>
              <div className="form-row single">
                <div className="form-group">
                  <label>{t('profile.currentPassword')}</label>
                  <input
                    type="password"
                    className="form-control"
                    value={passwordForm.current_password}
                    onChange={(e) => setPasswordForm({
                      ...passwordForm,
                      current_password: e.target.value
                    })}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div className="form-row single">
                <div className="form-group">
                  <label>{t('profile.newPassword')}</label>
                  <input
                    type="password"
                    className="form-control"
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm({
                      ...passwordForm,
                      new_password: e.target.value
                    })}
                    disabled={isLoading}
                    required
                    minLength="6"
                  />
                  <small style={{ color: '#666', fontSize: '12px' }}>
                    {t('validation.passwordMinLength')}
                  </small>
                </div>
              </div>

              <div className="form-row single">
                <div className="form-group">
                  <label>{t('profile.confirmPassword')}</label>
                  <input
                    type="password"
                    className="form-control"
                    value={passwordForm.confirm_password}
                    onChange={(e) => setPasswordForm({
                      ...passwordForm,
                      confirm_password: e.target.value
                    })}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>
            </form>
          )}
        </div>

        <div className="modal-footer">
          <button 
            className="btn btn-secondary" 
            onClick={onClose}
            disabled={isLoading}
          >
            {t('common.cancel')}
          </button>
          <button 
            className="btn btn-primary"
            onClick={activeTab === 'profile' ? handleProfileSubmit : handlePasswordSubmit}
            disabled={isLoading}
          >
            {isLoading ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal; 