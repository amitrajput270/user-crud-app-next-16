'use client';

import React, { useEffect } from 'react';

interface ToastProps {
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
    onClose: () => void;
    duration?: number;
}

export default function Toast({ show, message, type, onClose, duration = 5000 }: ToastProps) {
    useEffect(() => {
        if (show) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [show, duration, onClose]);

    if (!show) return null;

    const bgColor = type === 'success' ? '#059669' : type === 'error' ? '#dc2626' : '#2563eb';
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';

    return (
        <div style={{
            position: 'fixed',
            top: '1rem',
            right: '1rem',
            backgroundColor: bgColor,
            color: 'white',
            padding: '1rem 1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            minWidth: '300px',
            maxWidth: '500px',
            animation: 'slideIn 0.3s ease-out',
        }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{icon}</span>
            <p style={{ margin: 0, fontSize: '0.875rem', flex: 1 }}>{message}</p>
            <button
                onClick={onClose}
                style={{
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '1.25rem',
                    padding: '0.25rem',
                    opacity: 0.8,
                }}
            >
                ×
            </button>
            <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
        </div>
    );
}