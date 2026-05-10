'use client';

import React from 'react';
import { Post } from '@/app/types/post';
import { formatDate, timeAgo } from '@/lib/date-utils';

interface PostTableProps {
    posts: Post[];
    selectedPosts: string[];
    onSelectPost: (id: string) => void;
    onSelectAll: (checked: boolean) => void;
    onEditPost: (post: Post) => void;
    onDeletePost: (id: string) => void;
}

export default function PostTable({
    posts,
    selectedPosts,
    onSelectPost,
    onSelectAll,
    onEditPost,
    onDeletePost
}: PostTableProps) {
    const thStyle: React.CSSProperties = {
        padding: '0.75rem 1.5rem',
        textAlign: 'left',
        fontSize: '0.75rem',
        fontWeight: 500,
        color: '#f0f2f5',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        borderBottom: '1px solid #e5e7eb'
    };

    const tdStyle: React.CSSProperties = {
        padding: '1rem 1.5rem',
        fontSize: '0.875rem',
        color: '#111827',
        whiteSpace: 'nowrap'
    };

    return (
        <div style={{ overflowX: 'auto', maxHeight: '55vh', overflowY: 'auto' }}>
            <table style={{ width: '100%', backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
                <thead style={{ backgroundColor: '#0d0202de' }}>
                    <tr>
                        <th style={thStyle}>
                            <input
                                type="checkbox"
                                onChange={(e) => onSelectAll(e.target.checked)}
                                checked={posts.length > 0 && selectedPosts.length === posts.length}
                                style={{ borderRadius: '0.25rem', borderColor: '#abc0d8' }}
                            />
                        </th>
                        <th style={thStyle}>S.No</th>
                        <th style={thStyle}>Title</th>
                        <th style={thStyle}>Content</th>
                        <th style={thStyle}>Created At</th>
                        <th style={thStyle}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {posts.length === 0 ? (
                        <tr>
                            <td colSpan={6} style={{ padding: '1rem 1.5rem', textAlign: 'center', color: '#6b7280' }}>
                                No posts found
                            </td>
                        </tr>
                    ) : (
                        posts.map((post) => (
                            <tr key={post.id} style={{ borderBottom: '1px solid #e5e7eb' }} className="hover:bg-gray-50">
                                <td style={tdStyle}>
                                    <input
                                        type="checkbox"
                                        checked={selectedPosts.includes(post.id)}
                                        onChange={() => onSelectPost(post.id)}
                                        style={{ borderRadius: '0.25rem', borderColor: '#d1d5db' }}
                                    />
                                </td>
                                <td style={tdStyle}>{posts.indexOf(post) + 1}</td>
                                <td style={tdStyle}>{post.title}</td>
                                <td style={{ ...tdStyle, color: '#4b5563' }}>{post.content}</td>
                                <td style={{ ...tdStyle, color: '#4b5563' }}>{timeAgo(post.createdAt)}</td>
                                <td style={tdStyle}>
                                    <button
                                        onClick={() => onEditPost(post)}
                                        style={{ color: '#2563eb', marginRight: '0.5rem', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}
                                        className="hover:text-blue-800"
                                    >
                                        <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        {/* Edit */}
                                    </button>
                                    <button
                                        onClick={() => onDeletePost(post.id)}
                                        style={{ color: '#dc2626', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}
                                        className="hover:text-red-800"
                                    >
                                        <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        {/* Delete */}
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}