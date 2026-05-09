'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { User, UserFormData, PaginationState } from '@/types/user';
import SearchBar from '@/components/SearchBar';
import UserTable from '@/components/UserTable';
import UserForm from '@/components/UserForm';
import Pagination from '@/components/Pagination';
import AlertDialog from '@/components/AlertDialog';
import { exportToCSV, parseCSVFile } from '@/utils/csv';

export default function Home() {
    const [users, setUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; userId?: string }>({ isOpen: false });
    const [pagination, setPagination] = useState<PaginationState>({
        currentPage: 1,
        totalPages: 1,
        pageSize: 10
    });
    const [refreshKey, setRefreshKey] = useState(0);

    const fetchUsers = useCallback(async () => {
        const params = new URLSearchParams({
            search: searchTerm,
            page: pagination.currentPage.toString(),
            pageSize: pagination.pageSize.toString()
        });

        const response = await fetch(`/api/users?${params}`);
        const data = await response.json();

        setUsers(data.users);
        setPagination(prev => ({
            ...prev,
            totalPages: data.pagination.totalPages,
            currentPage: data.pagination.currentPage
        }));
    }, [searchTerm, pagination.currentPage, pagination.pageSize]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers, refreshKey]);

    const handleSearch = (value: string) => {
        setSearchTerm(value);
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const handleCreateUser = async (data: UserFormData) => {
        await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        setRefreshKey(prev => prev + 1);
    };

    const handleUpdateUser = async (data: UserFormData) => {
        if (!editingUser) return;

        await fetch('/api/users', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, id: editingUser.id })
        });

        setEditingUser(null);
        setRefreshKey(prev => prev + 1);
    };

    const handleDeleteUser = async (userId: string) => {
        setDeleteConfirm({ isOpen: true, userId });
    };

    const confirmDelete = async () => {
        if (deleteConfirm.userId) {
            await fetch(`/api/users?ids=${deleteConfirm.userId}`, {
                method: 'DELETE'
            });
            setSelectedUsers(prev => prev.filter(id => id !== deleteConfirm.userId));
            setRefreshKey(prev => prev + 1);
        }
        setDeleteConfirm({ isOpen: false });
    };

    const handleDeleteSelected = async () => {
        if (selectedUsers.length === 0) return;

        setDeleteConfirm({
            isOpen: true,
            userId: selectedUsers.join(',')
        });
    };

    const confirmDeleteSelected = async () => {
        if (deleteConfirm.userId) {
            await fetch(`/api/users?ids=${deleteConfirm.userId}`, {
                method: 'DELETE'
            });
            setSelectedUsers([]);
            setRefreshKey(prev => prev + 1);
        }
        setDeleteConfirm({ isOpen: false });
    };

    const handleSelectUser = (userId: string) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedUsers(users.map(user => user.id));
        } else {
            setSelectedUsers([]);
        }
    };

    const handleExportCSV = () => {
        const usersToExport = selectedUsers.length > 0
            ? users.filter(user => selectedUsers.includes(user.id))
            : users;

        exportToCSV(usersToExport);
    };

    const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        parseCSVFile(file).then(importedUsers => {
            Promise.all(
                importedUsers.map(user =>
                    fetch('/api/users', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: user.name,
                            email: user.email
                        })
                    })
                )
            ).then(() => {
                setRefreshKey(prev => prev + 1);
            });
        });
    };

    const handlePageChange = (page: number) => {
        setPagination(prev => ({ ...prev, currentPage: page }));
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Users List</h1>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                        <SearchBar searchTerm={searchTerm} onSearchChange={handleSearch} />

                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setEditingUser(null);
                                    setIsFormOpen(true);
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                            >
                                <span>+</span> Create User
                            </button>

                            <button
                                onClick={handleDeleteSelected}
                                disabled={selectedUsers.length === 0}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Delete Selected
                            </button>

                            <button
                                onClick={handleExportCSV}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                                Export CSV
                            </button>

                            <label className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer">
                                Import CSV
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleImportCSV}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    </div>

                    <UserTable
                        users={users}
                        selectedUsers={selectedUsers}
                        onSelectUser={handleSelectUser}
                        onSelectAll={handleSelectAll}
                        onEditUser={(user) => {
                            setEditingUser(user);
                            setIsFormOpen(true);
                        }}
                        onDeleteUser={handleDeleteUser}
                    />

                    <Pagination
                        currentPage={pagination.currentPage}
                        totalPages={pagination.totalPages}
                        onPageChange={handlePageChange}
                    />
                </div>
            </div>

            <UserForm
                isOpen={isFormOpen}
                onClose={() => {
                    setIsFormOpen(false);
                    setEditingUser(null);
                }}
                onSubmit={editingUser ? handleUpdateUser : handleCreateUser}
                user={editingUser}
            />

            <AlertDialog
                isOpen={deleteConfirm.isOpen}
                message="Are you sure you want to delete this user(s)? This action cannot be undone."
                onConfirm={deleteConfirm.userId?.includes(',') ? confirmDeleteSelected : confirmDelete}
                onCancel={() => setDeleteConfirm({ isOpen: false })}
            />
        </div>
    );
}