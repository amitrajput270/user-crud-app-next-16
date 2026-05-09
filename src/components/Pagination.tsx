'use client';

import React from 'react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('...');
                pages.push(currentPage - 1);
                pages.push(currentPage);
                pages.push(currentPage + 1);
                pages.push('...');
                pages.push(totalPages);
            }
        }

        return pages;
    };

    const buttonStyle = (isActive: boolean, isDisabled: boolean = false): React.CSSProperties => ({
        padding: '0.25rem 0.75rem',
        fontSize: '0.875rem',
        border: '1px solid #d1d5db',
        borderRadius: '0.25rem',
        backgroundColor: isActive ? '#2563eb' : 'transparent',
        color: isActive ? 'white' : '#374151',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.5 : 1
    });

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem' }}>
            <div style={{ fontSize: '0.875rem', color: '#374151' }}>
                Page {currentPage} of {totalPages}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    style={buttonStyle(false, currentPage === 1)}
                    className="hover:bg-gray-100"
                >
                    Previous
                </button>

                {getPageNumbers().map((page, index) => (
                    <button
                        key={index}
                        onClick={() => typeof page === 'number' ? onPageChange(page) : undefined}
                        disabled={page === '...'}
                        style={buttonStyle(page === currentPage, page === '...')}
                        className={page !== '...' && page !== currentPage ? 'hover:bg-gray-100' : ''}
                    >
                        {page}
                    </button>
                ))}

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    style={buttonStyle(false, currentPage === totalPages)}
                    className="hover:bg-gray-100"
                >
                    Next
                </button>
            </div>
        </div>
    );
}