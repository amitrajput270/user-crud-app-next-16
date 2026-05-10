'use client';

import React, { useState, useEffect } from 'react';
import { Post, PostFormData } from '@/app/types/post';
import { createPostAction, updatePostAction } from '@/app/lib/post-actions';

interface PostFormProps {
    isOpen: boolean;
    onClose: () => void;
    post?: Post | null;
    onSuccess?: () => void;
    onSubmit?: (data: PostFormData) => Promise<void>;
}

export default function PostForm({ isOpen, onClose, post, onSuccess, onSubmit }: PostFormProps) {
    const [formData, setFormData] = useState<PostFormData>({ title: '', content: '' });
    const [errors, setErrors] = useState<{ title?: string; content?: string; general?: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (post) {
            setFormData({ title: post.title, content: post.content });
        } else {
            setFormData({ title: '', content: '' });
        }
        setErrors({});
    }, [post]);

    const validateForm = (): boolean => {
        const newErrors: { title?: string; content?: string } = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Title is required';
        } else if (formData.title.trim().length < 2) {
            newErrors.title = 'Title must be at least 5 characters';
        } else if (formData.title.trim().length > 50) {
            newErrors.title = 'Title must be less than 200 characters';
        }

        if (!formData.content.trim()) {
            newErrors.content = 'Content is required';
        } else if (formData.content.trim().length < 5) {
            newErrors.content = 'Please enter a valid content';
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
                setFormData({ title: '', content: '' });
            } else {
                const result = post
                    ? await updatePostAction(post.id, formData)
                    : await createPostAction(formData);

                if (result.success) {
                    onSuccess?.();
                    onClose();
                    setFormData({ title: '', content: '' });
                } else {
                    setErrors({ general: result.error || 'An error occurred' });
                }
            }
        } catch (error) {
            console.error('Error saving post:', error);
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
                        {post ? 'Edit Post' : 'Create Post'}
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
                            Title <span style={{ color: '#dc2626' }}>*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => {
                                setFormData({ ...formData, title: e.target.value });
                                if (errors.title) setErrors({ ...errors, title: undefined });
                            }}
                            style={{
                                ...inputStyle,
                                borderColor: errors.title ? '#dc2626' : '#d1d5db',
                            }}
                            placeholder="Enter full title"
                            required
                            disabled={isSubmitting}
                            autoFocus
                        />
                        {errors.title && (
                            <p style={errorStyle}>{errors.title}</p>
                        )}
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={labelStyle}>
                            Content <span style={{ color: '#dc2626' }}>*</span>
                        </label>
                        <input
                            type="content"
                            value={formData.content}
                            onChange={(e) => {
                                setFormData({ ...formData, content: e.target.value });
                                if (errors.content) setErrors({ ...errors, content: undefined });
                            }}
                            style={{
                                ...inputStyle,
                                borderColor: errors.content ? '#dc2626' : '#d1d5db',
                            }}
                            placeholder="Enter content"
                            required
                            disabled={isSubmitting}
                        />
                        {errors.content && (
                            <p style={errorStyle}>{errors.content}</p>
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
                                post ? 'Update Post' : 'Create Post'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}