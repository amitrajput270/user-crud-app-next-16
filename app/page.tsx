'use client';

import React, { useState, useEffect, useCallback, useTransition, use } from 'react';
import { User, UserFormData, PaginationState } from '@/types/user';
import SearchBar from '@/components/SearchBar';
import UserTable from '@/components/UserTable';
import UserForm from '@/components/UserForm';
import Pagination from '@/components/Pagination';
import AlertDialog from '@/components/AlertDialog';
import { exportToCSV, parseCSVFile } from '@/lib/csv';
import { getUsersAction, deleteUsersAction, importUsersAction } from '@/lib/actions';

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; userIds?: string[] }>({ isOpen: false });
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    pageSize: 10,
    totalUsers: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getUsersAction(searchTerm, pagination.currentPage, pagination.pageSize);
      setUsers(data.users);
      setPagination(prev => ({
        ...prev,
        totalPages: data.pagination.totalPages,
        currentPage: data.pagination.currentPage,
        totalUsers: data.pagination.totalUsers
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, pagination.currentPage, pagination.pageSize]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleFormSuccess = () => {
    setEditingUser(null);
    fetchUsers();
  };

  const handleDeleteUsers = async (userIds: string[]) => {
    setDeleteConfirm({ isOpen: true, userIds });
  };

  const confirmDelete = async () => {
    if (deleteConfirm.userIds) {
      startTransition(async () => {
        try {
          await deleteUsersAction(deleteConfirm.userIds!);
          setSelectedUsers(prev => prev.filter(id => !deleteConfirm.userIds!.includes(id)));
          fetchUsers();
        } catch (error) {
          console.error('Error deleting users:', error);
        }
      });
    }
    setDeleteConfirm({ isOpen: false });
  };

  const handleDeleteSelected = () => {
    if (selectedUsers.length === 0) return;
    handleDeleteUsers(selectedUsers);
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

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const importedUsers = await parseCSVFile(file);
      startTransition(async () => {
        try {
          await importUsersAction(importedUsers);
          fetchUsers();
        } catch (error) {
          console.error('Error importing users:', error);
          alert('Failed to import users');
        }
      });
    } catch (error) {
      console.error('Error parsing CSV:', error);
      alert('Failed to parse CSV file');
    }

    // Reset file input
    event.target.value = '';
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Users List</h1>
          <p className="text-gray-600 mt-2">Manage your users with ease</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <SearchBar searchTerm={searchTerm} onSearchChange={handleSearch} />

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setEditingUser(null);
                  setIsFormOpen(true);
                }}
                className="btn btn-primary flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create User
              </button>

              <button
                onClick={handleDeleteSelected}
                disabled={selectedUsers.length === 0 || isPending}
                className="btn btn-danger flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Selected
              </button>

              <button
                onClick={handleExportCSV}
                className="btn btn-success flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>

              <label className="btn bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-2 cursor-pointer">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Import CSV
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImportCSV}
                  className="hidden"
                  disabled={isPending}
                />
              </label>
            </div>
          </div>

          <div className="relative">
            {isLoading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}
            <UserTable
              users={users}
              selectedUsers={selectedUsers}
              onSelectUser={handleSelectUser}
              onSelectAll={handleSelectAll}
              onEditUser={(user) => {
                setEditingUser(user);
                setIsFormOpen(true);
              }}
              onDeleteUser={(userId) => handleDeleteUsers([userId])}
            />
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {pagination.totalUsers} total users
            </div>
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>

      <UserForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingUser(null);
        }}
        user={editingUser}
        onSuccess={handleFormSuccess}
      />

      <AlertDialog
        isOpen={deleteConfirm.isOpen}
        message="Are you sure you want to delete this user(s)? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false })}
        loading={isPending}
      />
    </div>
  );
}