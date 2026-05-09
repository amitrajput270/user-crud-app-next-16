export interface User {
    id: string;
    name: string;
    email: string;
    createdAt: string;
}

export interface UserFormData {
    name: string;
    email: string;
}

export interface PaginationState {
    currentPage: number;
    totalPages: number;
    pageSize: number;
}