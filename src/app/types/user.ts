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
    totalUsers: number;
}

export interface UsersResponse {
    users: User[];
    pagination: PaginationState;
}

export interface ActionResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}