'use client';

import React from 'react';
import { User } from '@/types/user';

interface UserTableProps {
    users: User[];
    selectedUsers: string[];
    onSelectUser: (id: string) => void;
    onSelectAll: (checked: boolean) => void;
    onEditUser: (user: User) => void;
    onDeleteUser: (id: string) => void;
}

export default function UserTable({
    users,
    selectedUsers,
    onSelectUser,
    onSelectAll,
    onEditUser,
    onDeleteUser
}: UserTableProps) {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const thStyle: React.CSSProperties = {
        padding: '0.75rem 1.5rem',
        textAlign: 'left',
        fontSize: '0.75rem',
        fontWeight: 500,
        color: '#6b7280',
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
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
                <thead style={{ backgroundColor: '#f9fafb' }}>
                    <tr>
                        <th style={thStyle}>
                            <input
                                type="checkbox"
                                onChange={(e) => onSelectAll(e.target.checked)}
                                checked={users.length > 0 && selectedUsers.length === users.length}
                                style={{ borderRadius: '0.25rem', borderColor: '#d1d5db' }}
                            />
                        </th>
                        <th style={thStyle}>ID</th>
                        <th style={thStyle}>Name</th>
                        <th style={thStyle}>Email</th>
                        <th style={thStyle}>Created At</th>
                        <th style={thStyle}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.length === 0 ? (
                        <tr>
                            <td colSpan={6} style={{ padding: '1rem 1.5rem', textAlign: 'center', color: '#6b7280' }}>
                                No users found
                            </td>
                        </tr>
                    ) : (
                        users.map((user) => (
                            <tr key={user.id} style={{ borderBottom: '1px solid #e5e7eb' }} className="hover:bg-gray-50">
                                <td style={tdStyle}>
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.includes(user.id)}
                                        onChange={() => onSelectUser(user.id)}
                                        style={{ borderRadius: '0.25rem', borderColor: '#d1d5db' }}
                                    />
                                </td>
                                <td style={tdStyle}>{user.id}</td>
                                <td style={tdStyle}>{user.name}</td>
                                <td style={{ ...tdStyle, color: '#4b5563' }}>{user.email}</td>
                                <td style={{ ...tdStyle, color: '#4b5563' }}>{formatDate(user.createdAt)}</td>
                                <td style={tdStyle}>
                                    <button
                                        onClick={() => onEditUser(user)}
                                        style={{ color: '#2563eb', marginRight: '0.5rem', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}
                                        className="hover:text-blue-800"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => onDeleteUser(user.id)}
                                        style={{ color: '#dc2626', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}
                                        className="hover:text-red-800"
                                    >
                                        Delete
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