import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/Toast';
import { nanoid } from 'nanoid';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback(id => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  const addToast = useCallback((message, options = {}) => {
    const id = nanoid();
    const toast = {
      id,
      message,
      type: options.type || 'info',
      duration: options.duration || 5000,
      position: options.position || 'top-right',
      onClose: () => removeToast(id),
    };
    
    setToasts(prevToasts => [...prevToasts, toast]);
    return id;
  }, [removeToast]);

  const showSuccess = useCallback((message, options = {}) => {
    return addToast(message, { ...options, type: 'success' });
  }, [addToast]);

  const showError = useCallback((message, options = {}) => {
    return addToast(message, { ...options, type: 'error' });
  }, [addToast]);

  const showWarning = useCallback((message, options = {}) => {
    return addToast(message, { ...options, type: 'warning' });
  }, [addToast]);

  const showInfo = useCallback((message, options = {}) => {
    return addToast(message, { ...options, type: 'info' });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, showSuccess, showError, showWarning, showInfo }}>
      {children}
      <div className="toast-container">
        {toasts.map(toast => (
          <Toast 
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            position={toast.position}
            onClose={toast.onClose}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};
