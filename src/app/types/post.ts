export interface Post {
    id: string;
    title: string;
    content: string;
    comments: string[];
    createdAt: string;
}

export interface PostFormData {
    title: string;
    content: string;
}

export interface PaginationState {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalPosts: number;
}

export interface PostResponse {
    posts: Post[];
    pagination: PaginationState;
}

export interface ActionResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}