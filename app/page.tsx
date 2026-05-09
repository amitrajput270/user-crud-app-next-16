'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { User, UserFormData, PaginationState } from '@/types/user';
import SearchBar from '@/components/SearchBar';
import UserTable from '@/components/UserTable';
import UserForm from '@/components/UserForm';
import Pagination from '@/components/Pagination';
import AlertDialog from '@/components/AlertDialog';
import Toast from '@/components/Toast';
import { exportToCSV, parseCSVFile } from '@/lib/csv';
import { getUsersAction, deleteUsersAction, importUsersAction } from '@/lib/actions';

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; userIds?: string[] }>({
    isOpen: false
  });
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    pageSize: 10,
    totalUsers: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({ show: false, message: '', type: 'info' });

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ show: true, message, type });
  };

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getUsersAction(searchTerm, pagination.currentPage, pagination.pageSize);

      // Now TypeScript knows the exact structure
      setUsers(data.users);
      setPagination({
        currentPage: data.pagination.currentPage,
        totalPages: data.pagination.totalPages,
        pageSize: data.pagination.pageSize,
        totalUsers: data.pagination.totalUsers,
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      showNotification('An unexpected error occurred while fetching users', 'error');
      // Set empty state on error
      setUsers([]);
      setPagination(prev => ({
        ...prev,
        totalUsers: 0,
      }));
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
    showNotification('User saved successfully', 'success');
  };

  const handleDeleteUsers = (userIds: string[]) => {
    setDeleteConfirm({ isOpen: true, userIds });
  };

  const confirmDelete = async () => {
    if (deleteConfirm.userIds && deleteConfirm.userIds.length > 0) {
      startTransition(async () => {
        try {
          const result = await deleteUsersAction(deleteConfirm.userIds!);
          if (result.success) {
            setSelectedUsers(prev => prev.filter(id => !deleteConfirm.userIds!.includes(id)));
            const deletedCount = result.data?.deletedCount || deleteConfirm.userIds!.length;
            showNotification(`Successfully deleted ${deletedCount} user(s)`, 'success');
            fetchUsers();
          } else {
            showNotification(result.error || 'Failed to delete users', 'error');
          }
        } catch (error) {
          console.error('Error deleting users:', error);
          showNotification('Failed to delete users', 'error');
        }
      });
    }
    setDeleteConfirm({ isOpen: false, userIds: undefined });
  };

  const handleDeleteSelected = () => {
    if (selectedUsers.length === 0) {
      showNotification('Please select users to delete', 'info');
      return;
    }
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

    if (usersToExport.length === 0) {
      showNotification('No users to export', 'info');
      return;
    }

    exportToCSV(usersToExport);
    showNotification(`Exported ${usersToExport.length} user(s) to CSV`, 'success');
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const importedUsers = await parseCSVFile(file);
      if (importedUsers.length === 0) {
        showNotification('No valid users found in CSV file', 'error');
        event.target.value = '';
        return;
      }

      startTransition(async () => {
        try {
          const result = await importUsersAction(importedUsers);
          if (result.success) {
            const message = result.data?.partialError ||
              `Successfully imported ${result.data?.count || importedUsers.length} user(s)`;
            showNotification(message, result.data?.partialError ? 'info' : 'success');
            fetchUsers();
          } else {
            showNotification(result.error || 'Failed to import users', 'error');
          }
        } catch (error) {
          console.error('Error importing users:', error);
          showNotification('Failed to import users', 'error');
        }
      });
    } catch (error) {
      console.error('Error parsing CSV:', error);
      showNotification('Failed to parse CSV file. Please check the format.', 'error');
    }

    event.target.value = '';
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #f9fafb, #f3f4f6)' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>
            Users List
          </h1>
          <p style={{ color: '#6b7280' }}>
            Manage your users with ease
          </p>
        </div>

        <div style={{
          backgroundColor: 'white',
          borderRadius: '0.75rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          padding: '1.5rem'
        }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <SearchBar searchTerm={searchTerm} onSearchChange={handleSearch} />

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <button
                onClick={() => {
                  setEditingUser(null);
                  setIsFormOpen(true);
                }}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                }}
              >
                <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create User
              </button>

              <button
                onClick={handleDeleteSelected}
                disabled={selectedUsers.length === 0 || isPending}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: 500,
                  cursor: selectedUsers.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: selectedUsers.length === 0 ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                }}
              >
                <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Selected {selectedUsers.length > 0 && `(${selectedUsers.length})`}
              </button>

              <button
                onClick={handleExportCSV}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#059669',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                }}
              >
                <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>

              <label style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#7c3aed',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
              }}>
                <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Import CSV
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImportCSV}
                  style={{ display: 'none' }}
                  disabled={isPending}
                />
              </label>
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            {isLoading && (
              <div style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.75)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
              }}>
                <div style={{
                  width: '2rem',
                  height: '2rem',
                  border: '3px solid #e5e7eb',
                  borderTopColor: '#2563eb',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }} />
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

          <div style={{
            marginTop: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
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
        message={`Are you sure you want to delete ${deleteConfirm.userIds?.length || 0} user(s)? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, userIds: undefined })}
        loading={isPending}
      />

      <Toast
        show={notification.show}
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ show: false, message: '', type: 'info' })}
      />

      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}