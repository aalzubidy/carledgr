import { useRef, useState } from 'react';

const FileUpload = ({ 
  onFileSelect, 
  accept = '.pdf,.jpg,.jpeg,.png,.webp',
  maxSize = 8 * 1024 * 1024, // 8MB
  disabled = false,
  className = ''
}) => {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');

  const validateFile = (file) => {
    setError('');
    
    // Check file size
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / 1024 / 1024);
      setError(`File size exceeds ${maxSizeMB}MB limit`);
      return false;
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setError('Only PDF, JPEG, PNG, and WebP files are allowed');
      return false;
    }

    return true;
  };

  const handleFiles = (files) => {
    if (files.length === 0) return;
    
    const file = files[0]; // Only handle one file
    
    if (validateFile(file)) {
      onFileSelect(file);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (disabled) return;
    
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const openFileDialog = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  return (
    <div className={`file-upload ${className}`}>
      <div
        className={`upload-area ${dragActive ? 'drag-active' : ''} ${disabled ? 'disabled' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
        style={{
          border: '2px dashed #ccc',
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          backgroundColor: dragActive ? '#f0f8ff' : disabled ? '#f5f5f5' : 'white',
          borderColor: dragActive ? '#007bff' : error ? '#dc3545' : '#ccc',
          opacity: disabled ? 0.6 : 1
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          style={{ display: 'none' }}
          disabled={disabled}
        />
        
        <div className="upload-icon" style={{ fontSize: '24px', marginBottom: '10px' }}>
          📎
        </div>
        
        <div className="upload-text">
          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>
            {disabled ? 'File upload unavailable' : 'Click to upload or drag and drop'}
          </p>
          <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
            PDF, JPEG, PNG, WebP (max 8MB)
          </p>
        </div>
      </div>
      
      {error && (
        <div style={{ 
          color: '#dc3545', 
          fontSize: '12px', 
          marginTop: '5px',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default FileUpload; 