'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';

export interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
  duration?: number;
}

interface ToasterContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const ToasterContext = React.createContext<ToasterContextType | null>(null);

export function ToasterProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(7);
    const newToast: Toast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    // Auto-remove after duration
    const duration = toast.duration || 5000;
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const contextValue = useMemo(() => ({ toasts, addToast, removeToast }), [toasts, addToast, removeToast]);

  return (
    <ToasterContext.Provider value={contextValue}>
      {children}
      <ToasterContainer toasts={toasts} removeToast={removeToast} />
    </ToasterContext.Provider>
  );
}

function ToasterContainer({
  toasts,
  removeToast,
}: {
  toasts: Toast[];
  removeToast: (id: string) => void;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '400px',
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animation d'entrée
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const getStyles = () => {
    const baseStyles: React.CSSProperties = {
      padding: '1rem 1.5rem',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      minWidth: '300px',
      maxWidth: '400px',
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
      transition: 'all 0.3s ease',
      backgroundColor: 'white',
      border: '1px solid #ddd',
    };

    switch (toast.type) {
      case 'success':
        return {
          ...baseStyles,
          borderLeft: '4px solid #28a745',
        };
      case 'error':
        return {
          ...baseStyles,
          borderLeft: '4px solid #dc3545',
        };
      case 'warning':
        return {
          ...baseStyles,
          borderLeft: '4px solid #ffc107',
        };
      case 'info':
      default:
        return {
          ...baseStyles,
          borderLeft: '4px solid #0070f3',
        };
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return '✓';
      case 'error':
        return '✗';
      case 'warning':
        return '⚠';
      case 'info':
      default:
        return 'ℹ';
    }
  };

  return (
    <div style={getStyles()}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
        <span style={{ fontSize: '1.25rem' }}>{getIcon()}</span>
        <span style={{ flex: 1, fontSize: '0.9rem', lineHeight: '1.4' }}>{toast.message}</span>
      </div>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          fontSize: '1.25rem',
          cursor: 'pointer',
          color: '#666',
          padding: '0',
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        ×
      </button>
    </div>
  );
}

// Hook pour utiliser le toaster
export function useToaster() {
  const context = React.useContext(ToasterContext);
  if (!context) {
    throw new Error('useToaster must be used within ToasterProvider');
  }
  return context;
}

