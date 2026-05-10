'use client';

import React, { useState, useEffect } from 'react';
import { User, UserFormData } from '@/types/user';
import { createUserAction, updateUserAction } from '@/lib/actions';

interface UserFormProps {
    isOpen: boolean;
    onClose: () => void;
    user?: User | null;
    onSuccess?: () => void;
    onSubmit?: (data: UserFormData) => Promise<void>;
}

export default function UserForm({ isOpen, onClose, user, onSuccess, onSubmit }: UserFormProps) {
    const [formData, setFormData] = useState<UserFormData>({ name: '', email: '' });
    const [errors, setErrors] = useState<{ name?: string; email?: string; general?: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({ name: user.name, email: user.email });
        } else {
            setFormData({ name: '', email: '' });
        }
        setErrors({});
    }, [user]);

    const validateForm = (): boolean => {
        const newErrors: { name?: string; email?: string } = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        } else if (formData.name.trim().length < 2) {
            newErrors.name = 'Name must be at least 2 characters';
        } else if (formData.name.trim().length > 50) {
            newErrors.name = 'Name must be less than 100 characters';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSubmitting(true);
        setErrors({});

        try {
            if (onSubmit) {
                await onSubmit(formData);
                onSuccess?.();
                onClose();
                setFormData({ name: '', email: '' });
            } else {
                const result = user
                    ? await updateUserAction(user.id, formData)
                    : await createUserAction(formData);

                if (result.success) {
                    onSuccess?.();
                    onClose();
                    setFormData({ name: '', email: '' });
                } else {
                    setErrors({ general: result.error || 'An error occurred' });
                }
            }
        } catch (error) {
            console.error('Error saving user:', error);
            setErrors({ general: 'An unexpected error occurred. Please try again.' });
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
        marginTop: '0.25rem',
    };

    const labelStyle: React.CSSProperties = {
        fontSize: '0.875rem',
        fontWeight: 500,
        color: '#374151',
        marginBottom: '0.25rem',
    };

    const errorStyle: React.CSSProperties = {
        fontSize: '0.75rem',
        color: '#dc2626',
        marginTop: '0.25rem',
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
            padding: '1rem',
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '0.5rem',
                padding: '1.5rem',
                width: '100%',
                maxWidth: '28rem',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827' }}>
                        {user ? 'Edit User' : 'Create User'}
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '1.5rem',
                            color: '#6b7280',
                            cursor: 'pointer',
                            padding: '0.25rem',
                        }}
                    >
                        ×
                    </button>
                </div>

                {/* General Error Alert */}
                {errors.general && (
                    <div style={{
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '0.375rem',
                        padding: '0.75rem',
                        marginBottom: '1rem',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <svg style={{ width: '1.25rem', height: '1.25rem', color: '#dc2626', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p style={{ fontSize: '0.875rem', color: '#dc2626' }}>{errors.general}</p>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={labelStyle}>
                            Name <span style={{ color: '#dc2626' }}>*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => {
                                setFormData({ ...formData, name: e.target.value });
                                if (errors.name) setErrors({ ...errors, name: undefined });
                            }}
                            style={{
                                ...inputStyle,
                                borderColor: errors.name ? '#dc2626' : '#d1d5db',
                            }}
                            placeholder="Enter full name"
                            required
                            disabled={isSubmitting}
                            autoFocus
                        />
                        {errors.name && (
                            <p style={errorStyle}>{errors.name}</p>
                        )}
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={labelStyle}>
                            Email <span style={{ color: '#dc2626' }}>*</span>
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => {
                                setFormData({ ...formData, email: e.target.value });
                                if (errors.email) setErrors({ ...errors, email: undefined });
                            }}
                            style={{
                                ...inputStyle,
                                borderColor: errors.email ? '#dc2626' : '#d1d5db',
                            }}
                            placeholder="Enter email address"
                            required
                            disabled={isSubmitting}
                        />
                        {errors.email && (
                            <p style={errorStyle}>{errors.email}</p>
                        )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            style={{
                                padding: '0.5rem 1rem',
                                color: '#374151',
                                backgroundColor: '#f3f4f6',
                                borderRadius: '0.375rem',
                                fontWeight: 500,
                                border: '1px solid #d1d5db',
                                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                opacity: isSubmitting ? 0.5 : 1,
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            style={{
                                padding: '0.5rem 1.5rem',
                                color: 'white',
                                backgroundColor: '#2563eb',
                                borderRadius: '0.375rem',
                                fontWeight: 500,
                                border: 'none',
                                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                opacity: isSubmitting ? 0.7 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                            }}
                        >
                            {isSubmitting ? (
                                <>
                                    <svg style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} viewBox="0 0 24 24">
                                        <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Saving...
                                </>
                            ) : (
                                user ? 'Update User' : 'Create User'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}