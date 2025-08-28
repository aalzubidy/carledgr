import { useState } from 'react';
import { api } from '../utils/api';

const AttachmentList = ({ attachments, onDelete, readonly = false }) => {
  const [loadingDownload, setLoadingDownload] = useState({});
  const [loadingView, setLoadingView] = useState({});
  const [loadingDelete, setLoadingDelete] = useState({});

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('image')) return '🖼️';
    return '📎';
  };

  const handleView = async (attachment) => {
    setLoadingView(prev => ({ ...prev, [attachment.id]: true }));
    
    try {
      const type = attachment.expense_id ? 'expense' : 'maintenance';
      const recordId = attachment.expense_id || attachment.maintenance_id;
      
      const data = await api.downloadAttachment(type, recordId, attachment.id);
      
      // Open the signed URL in a new tab for viewing
      window.open(data.downloadUrl, '_blank');
      
    } catch (error) {
      console.error('View failed:', error);
      
      if (error.message.includes('temporarily unavailable')) {
        alert('File viewing is temporarily unavailable. Please contact support.');
      } else {
        alert('Failed to view file. Please try again.');
      }
    } finally {
      setLoadingView(prev => ({ ...prev, [attachment.id]: false }));
    }
  };

  const handleDownload = async (attachment) => {
    setLoadingDownload(prev => ({ ...prev, [attachment.id]: true }));
    
    try {
      const type = attachment.expense_id ? 'expense' : 'maintenance';
      const recordId = attachment.expense_id || attachment.maintenance_id;
      
      const data = await api.downloadAttachment(type, recordId, attachment.id);
      
      // Open the signed URL in a new tab
      window.open(data.downloadUrl, '_blank');
      
    } catch (error) {
      console.error('Download failed:', error);
      
      if (error.message.includes('temporarily unavailable')) {
        alert('File download is temporarily unavailable. Please contact support.');
      } else {
        alert('Failed to download file. Please try again.');
      }
    } finally {
      setLoadingDownload(prev => ({ ...prev, [attachment.id]: false }));
    }
  };

  const handleDelete = async (attachment) => {
    if (!confirm('Are you sure you want to delete this attachment?')) {
      return;
    }
    
    setLoadingDelete(prev => ({ ...prev, [attachment.id]: true }));
    
    try {
      if (attachment.expense_id) {
        await api.deleteExpenseAttachment(attachment.id);
      } else {
        await api.deleteMaintenanceAttachment(attachment.id);
      }
      
      // Only call the callback if deletion was successful
      onDelete(attachment.id);
      
    } catch (error) {
      console.error('Delete failed:', error);
      
      let errorMessage = 'Failed to delete attachment. Please try again.';
      if (error.message.includes('Attachment not found')) {
        errorMessage = 'Attachment has already been deleted or does not exist.';
      } else if (error.message.includes('temporarily unavailable')) {
        errorMessage = 'File deletion is temporarily unavailable. Please contact support.';
      }
      
      alert(errorMessage);
    } finally {
      setLoadingDelete(prev => ({ ...prev, [attachment.id]: false }));
    }
  };

  if (!attachments || attachments.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center', 
        color: '#666', 
        padding: '20px',
        fontSize: '14px'
      }}>
        No attachments
      </div>
    );
  }

  return (
    <div className="attachment-list">
      <h4 style={{ marginTop: 0, marginBottom: '15px', fontSize: '16px' }}>
        Attachments ({attachments.length})
      </h4>
      
      {attachments.map((attachment) => (
        <div 
          key={attachment.id} 
          className="attachment-item"
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '10px',
            border: '1px solid #e0e0e0',
            borderRadius: '6px',
            marginBottom: '8px',
            backgroundColor: '#f9f9f9'
          }}
        >
          <div style={{ fontSize: '20px', marginRight: '10px' }}>
            {getFileIcon(attachment.file_type)}
          </div>
          
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ 
              fontWeight: 'bold', 
              fontSize: '14px',
              marginBottom: '2px',
              wordBreak: 'break-word'
            }}>
              {attachment.file_name}
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: '#666',
              display: 'flex',
              gap: '10px',
              flexWrap: 'wrap'
            }}>
              <span>{formatFileSize(attachment.file_size)}</span>
              <span>•</span>
              <span>Uploaded by {attachment.uploader_name || 'Unknown'}</span>
              <span>•</span>
              <span>{new Date(attachment.uploaded_at).toLocaleDateString()}</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '5px', marginLeft: '10px' }}>
            <button
              onClick={() => handleView(attachment)}
              disabled={loadingView[attachment.id]}
              style={{
                padding: '4px 8px',
                fontSize: '14px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: '#28a745',
                color: 'white',
                cursor: loadingView[attachment.id] ? 'not-allowed' : 'pointer',
                opacity: loadingView[attachment.id] ? 0.6 : 1
              }}
              title="View"
            >
              {loadingView[attachment.id] ? '⏳' : '👁️'}
            </button>
            
            <button
              onClick={() => handleDownload(attachment)}
              disabled={loadingDownload[attachment.id]}
              style={{
                padding: '4px 8px',
                fontSize: '14px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: '#007bff',
                color: 'white',
                cursor: loadingDownload[attachment.id] ? 'not-allowed' : 'pointer',
                opacity: loadingDownload[attachment.id] ? 0.6 : 1
              }}
              title="Download"
            >
              {loadingDownload[attachment.id] ? '⏳' : '⬇️'}
            </button>
            
            {!readonly && (
              <button
                onClick={() => handleDelete(attachment)}
                disabled={loadingDelete[attachment.id]}
                style={{
                  padding: '4px 8px',
                  fontSize: '14px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  cursor: loadingDelete[attachment.id] ? 'not-allowed' : 'pointer',
                  opacity: loadingDelete[attachment.id] ? 0.6 : 1
                }}
                title="Delete"
              >
                {loadingDelete[attachment.id] ? '⏳' : '🗑️'}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AttachmentList; 