'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { Post, PostFormData, PaginationState } from '@/app/types/post';
import SearchBar from '@/app/components/common/SearchBar';
import PostTable from '@/app/components/post/PostTable';
import PostForm from '@/app/components/post/PostForm';
import Pagination from '@/app/components/common/Pagination';
import AlertDialog from '@/app/components/common/AlertDialog';
import Toast from '@/app/components/common/Toast';
import { exportToCSV, parseCSVFile } from '@/app/lib/common/csv';
import { getPostsAction, deletePostsAction, importPostsAction } from '@/app/lib/post-actions';
import { formatDate } from '@/lib/date-utils';

export default function PostManagement() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingPost, setEditingPost] = useState<Post | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; postIds?: string[] }>({
        isOpen: false
    });
    const [pagination, setPagination] = useState<PaginationState>({
        currentPage: 1,
        totalPages: 1,
        pageSize: 10,
        totalPosts: 0
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

    const fetchPosts = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getPostsAction(searchTerm, pagination.currentPage, pagination.pageSize);

            // Now TypeScript knows the exact structure
            setPosts(data.posts);
            setPagination({
                currentPage: data.pagination.currentPage,
                totalPages: data.pagination.totalPages,
                pageSize: data.pagination.pageSize,
                totalPosts: data.pagination.totalPosts,
            });
        } catch (error) {
            console.error('Error fetching posts:', error);
            showNotification('An unexpected error occurred while fetching posts', 'error');
            // Set empty state on error
            setPosts([]);
            setPagination(prev => ({
                ...prev,
                totalPosts: 0,
            }));
        } finally {
            setIsLoading(false);
        }
    }, [searchTerm, pagination.currentPage, pagination.pageSize]);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const handleSearch = (value: string) => {
        setSearchTerm(value);
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const handleFormSuccess = () => {
        setEditingPost(null);
        fetchPosts();
        showNotification('Post saved successfully', 'success');
    };

    const handleDeletePosts = (postIds: string[]) => {
        setDeleteConfirm({ isOpen: true, postIds });
    };

    const confirmDelete = async () => {
        if (deleteConfirm.postIds && deleteConfirm.postIds.length > 0) {
            startTransition(async () => {
                try {
                    const result = await deletePostsAction(deleteConfirm.postIds!);
                    if (result.success) {
                        setSelectedPosts(prev => prev.filter(id => !deleteConfirm.postIds!.includes(id)));
                        const deletedCount = result.data?.deletedCount || deleteConfirm.postIds!.length;
                        showNotification(`Successfully deleted ${deletedCount} post(s)`, 'success');
                        fetchPosts();
                    } else {
                        showNotification(result.error || 'Failed to delete posts', 'error');
                    }
                } catch (error) {
                    console.error('Error deleting posts:', error);
                    showNotification('Failed to delete posts', 'error');
                }
            });
        }
        setDeleteConfirm({ isOpen: false, postIds: undefined });
    };

    const handleDeleteSelected = () => {
        if (selectedPosts.length === 0) {
            showNotification('Please select posts to delete', 'info');
            return;
        }
        handleDeletePosts(selectedPosts);
    };

    const handleSelectPost = (postId: string) => {
        setSelectedPosts(prev =>
            prev.includes(postId)
                ? prev.filter(id => id !== postId)
                : [...prev, postId]
        );
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedPosts(posts.map(post => post.id));
        } else {
            setSelectedPosts([]);
        }
    };

    const handleExportCSV = () => {
        const postsToExport = selectedPosts.length > 0
            ? posts.filter(post => selectedPosts.includes(post.id))
            : posts;

        if (postsToExport.length === 0) {
            showNotification('No posts to export', 'info');
            return;
        }

        postsToExport.forEach(post => {
            post.createdAt = formatDate(new Date(post.createdAt));
        });
        exportToCSV({
            data: postsToExport,
            filename: `posts_${new Date().toISOString()}_${Math.floor(Math.random() * 1000)}.csv`,
            headers: {
                id: 'ID',
                title: 'Title',
                content: 'Content',
                createdAt: 'Created At',
            }
        });
        showNotification(`Exported ${postsToExport.length} post(s) to CSV`, 'success');
    };

    const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const importedPosts = await parseCSVFile<PostFormData>(file, {
                mapping: {
                    'Title': 'title',
                    'Content': 'content',
                },
                transform: (row) => ({
                    title: (row.title || row.Title || '').trim(),
                    content: (row.content || row.Content || '').trim(),
                    comments: [], // Default empty comments
                }),
                validate: (post) => {
                    return !!(post.title.length >= 5 && post.title.length <= 200 && post.content.length > 0)
                }
            });
            if (importedPosts.length === 0) {
                showNotification('No valid posts found in CSV file', 'error');
                event.target.value = '';
                return;
            }

            startTransition(async () => {
                try {
                    const result = await importPostsAction(importedPosts);
                    if (result.success) {
                        const message = result.data?.partialError ||
                            `Successfully imported ${result.data?.count || importedPosts.length} post(s)`;
                        showNotification(message, result.data?.partialError ? 'info' : 'success');
                        fetchPosts();
                    } else {
                        showNotification(result.error || 'Failed to import posts', 'error');
                    }
                } catch (error) {
                    console.error('Error importing posts:', error);
                    showNotification('Failed to import posts', 'error');
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
                        Posts List
                    </h1>
                    <p style={{ color: '#6b7280' }}>
                        Manage your posts with ease
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
                                    setEditingPost(null);
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
                                Create Post
                            </button>

                            <button
                                onClick={handleDeleteSelected}
                                disabled={selectedPosts.length === 0 || isPending}
                                style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: '#dc2626',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    fontWeight: 500,
                                    cursor: selectedPosts.length === 0 ? 'not-allowed' : 'pointer',
                                    opacity: selectedPosts.length === 0 ? 0.5 : 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontSize: '0.875rem',
                                }}
                            >
                                <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete Selected {selectedPosts.length > 0 && `(${selectedPosts.length})`}
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
                        <PostTable
                            posts={posts}
                            selectedPosts={selectedPosts}
                            onSelectPost={handleSelectPost}
                            onSelectAll={handleSelectAll}
                            onEditPost={(post) => {
                                setEditingPost(post);
                                setIsFormOpen(true);
                            }}
                            onDeletePost={(postId) => handleDeletePosts([postId])}
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
                            Total Records: {pagination.totalPosts}
                        </div>
                        <Pagination
                            currentPage={pagination.currentPage}
                            totalPages={pagination.totalPages}
                            onPageChange={handlePageChange}
                        />
                    </div>
                </div>
            </div>

            <PostForm
                isOpen={isFormOpen}
                onClose={() => {
                    setIsFormOpen(false);
                    setEditingPost(null);
                }}
                post={editingPost}
                onSuccess={handleFormSuccess}
            />

            <AlertDialog
                isOpen={deleteConfirm.isOpen}
                message={`Are you sure you want to delete ${deleteConfirm.postIds?.length || 0} post(s)? This action cannot be undone.`}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteConfirm({ isOpen: false, postIds: undefined })}
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