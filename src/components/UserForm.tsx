'use client';

import React, { useState, useEffect } from 'react';
import { User, UserFormData } from '@/types/user';
import { createUserAction, updateUserAction } from '@/lib/actions';

interface UserFormProps {
    isOpen: boolean;
    onClose: () => void;
    user?: User | null;
    onSuccess: () => void;
}

export default function UserForm({ isOpen, onClose, user, onSuccess }: UserFormProps) {
    const [formData, setFormData] = useState<UserFormData>({ name: '', email: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({ name: user.name, email: user.email });
        } else {
            setFormData({ name: '', email: '' });
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (user) {
                await updateUserAction(user.id, formData);
            } else {
                await createUserAction(formData);
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving user:', error);
            alert('Failed to save user');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '0.5rem 0.75rem',
        border: '1px solid #d1d5db',
        borderRadius: '0.375rem',
        outline: 'none',
        fontSize: '0.875rem',
        marginTop: '0.5rem'
    };

    const labelStyle: React.CSSProperties = {
        fontSize: '0.875rem',
        fontWeight: 500,
        color: '#374151',
        marginBottom: '0.5rem'
    };

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
                maxWidth: '28rem'
            }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
                    {user ? 'Edit User' : 'Create User'}
                </h2>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={labelStyle}>Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            style={inputStyle}
                            className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                            disabled={isSubmitting}
                        />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={labelStyle}>Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            style={inputStyle}
                            className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                            disabled={isSubmitting}
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
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
                            type="submit"
                            disabled={isSubmitting}
                            style={{
                                padding: '0.5rem 1rem',
                                color: 'white',
                                backgroundColor: '#2563eb',
                                borderRadius: '0.375rem',
                                fontWeight: 500,
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                            className="hover:bg-blue-700"
                        >
                            {isSubmitting && (
                                <svg style={{ width: '1rem', height: '1rem' }} className="animate-spin" viewBox="0 0 24 24">
                                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                            )}
                            {user ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}