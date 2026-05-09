'use client';

import React from 'react';

interface AlertDialogProps {
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    loading?: boolean;
}

export default function AlertDialog({ isOpen, message, onConfirm, onCancel, loading }: AlertDialogProps) {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '1rem'
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '0.5rem',
                padding: '1.5rem',
                width: '100%',
                maxWidth: '24rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        backgroundColor: '#fee2e2',
                        borderRadius: '9999px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <svg style={{ width: '1.5rem', height: '1.5rem', color: '#dc2626' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <p style={{ color: '#1f2937' }}>{message}</p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        style={{
                            padding: '0.5rem 1rem',
                            color: '#4b5563',
                            backgroundColor: '#f3f4f6',
                            borderRadius: '0.375rem',
                            fontWeight: 500,
                            border: 'none',
                            cursor: 'pointer'
                        }}
                        className="hover:bg-gray-200"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        style={{
                            padding: '0.5rem 1rem',
                            color: 'white',
                            backgroundColor: '#dc2626',
                            borderRadius: '0.375rem',
                            fontWeight: 500,
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                        className="hover:bg-red-700"
                    >
                        {loading && (
                            <svg style={{ width: '1rem', height: '1rem' }} className="animate-spin" viewBox="0 0 24 24">
                                <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        )}
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}