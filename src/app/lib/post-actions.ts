'use server';

import { revalidatePath } from 'next/cache';
import dbConnect from './common/mongodb';
import Post from '@/app/models/Post';
import { PostFormData, PostResponse, ActionResponse, Post as PostType } from '@/app/types/post';
import { handleError } from './common/error-handler';

function formatValidationError(error: any): string {
    // Handle Mongoose ValidationError
    if (error.title === 'ValidationError' && error.errors) {
        const errors = Object.values(error.errors).map((err: any) => err.message);
        return errors.join(', ');
    }

    // Handle MongoDB duplicate key error (code 11000)
    if (error.code === 11000 || error.code === 11001) {
        // Check if keyValue exists and is an object
        if (error.keyValue && typeof error.keyValue === 'object') {
            const field = Object.keys(error.keyValue)[0];
            if (field) {
                return `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
            }
        }
        return 'A duplicate value already exists';
    }

    // Handle Mongoose CastError (invalid ID format, etc.)
    if (error.title === 'CastError') {
        return `Invalid ${error.path || 'value'}: ${error.value || ''}`;
    }

    // Handle general Error objects
    if (error instanceof Error) {
        return error.message;
    }

    // Handle string errors
    if (typeof error === 'string') {
        return error;
    }

    return handleError(error);

    // Default error message
    return 'An unexpected error occurred';
}

export async function getPostsAction(
    search: string = '',
    page: number = 1,
    pageSize: number = 10
): Promise<PostResponse> {
    try {
        await dbConnect();

        let query = {};
        if (search) {
            query = {
                $or: [
                    { title: { $regex: search, $options: 'i' } },
                    { content: { $regex: search, $options: 'i' } }
                ]
            };
        }

        const totalPosts = await Post.countDocuments(query);
        const totalPages = Math.ceil(totalPosts / pageSize);
        const skip = (page - 1) * pageSize;

        const posts = await Post.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pageSize)
            .lean();

        return {
            posts: posts.map((post: any) => ({
                id: post._id.toString(),
                title: post.title,
                content: post.content,
                comments: post.comments,
                createdAt: post.createdAt?.toISOString() || new Date().toISOString(),
            })),
            pagination: {
                currentPage: page,
                totalPages,
                pageSize,
                totalPosts,
            }
        };
    } catch (error: any) {
        console.error('Error fetching posts:', error);
        // Return empty state on error
        return {
            posts: [],
            pagination: {
                currentPage: page,
                totalPages: 0,
                pageSize,
                totalPosts: 0,
            }
        };
    }
}

export async function createPostAction(data: PostFormData): Promise<ActionResponse<PostType>> {
    try {
        await dbConnect();

        // Validate data before creating
        if (!data.title || data.title.trim().length < 5) {
            return {
                success: false,
                error: 'Name must be at least 5 characters'
            };
        }

        if (!data.content) {
            return {
                success: false,
                error: 'Please enter a valid content must be at least 10 characters'
            };
        }

        const post = await Post.create({
            title: data.title.trim(),
            content: data.content.trim().toLowerCase()
        });

        revalidatePath('/');

        return {
            success: true,
            data: {
                id: post._id.toString(),
                title: post.title,
                content: post.content,
                comments: post.comments,
                createdAt: post.createdAt.toISOString(),
            }
        };
    } catch (error: any) {
        console.error('Error creating post:', error);
        return {
            success: false,
            error: formatValidationError(error)
        };
    }
}

export async function updatePostAction(id: string, data: PostFormData): Promise<ActionResponse<PostType>> {
    try {
        await dbConnect();

        // Validate data before updating
        if (!data.title || data.title.trim().length < 5) {
            return {
                success: false,
                error: 'Name must be at least 5 characters'
            };
        }

        if (!data.content) {
            return {
                success: false,
                error: 'Please enter a valid content must be at least 10 characters'
            };
        }

        const post = await Post.findByIdAndUpdate(
            id,
            {
                $set: {
                    title: data.title.trim(),
                    content: data.content.trim().toLowerCase()
                }
            },
            { new: true, runValidators: true }
        );

        if (!post) {
            return {
                success: false,
                error: 'Post not found'
            };
        }

        revalidatePath('/');
        return {
            success: true,
            data: {
                id: post._id.toString(),
                title: post.title,
                content: post.content,
                comments: post.comments,
                createdAt: post.createdAt.toISOString(),
            }
        };
    } catch (error: any) {
        console.error('Error updating post:', error);
        return {
            success: false,
            error: formatValidationError(error)
        };
    }
}

export async function deletePostsAction(ids: string[]): Promise<ActionResponse<{ deletedCount: number }>> {
    try {
        await dbConnect();

        if (!ids || ids.length === 0) {
            return {
                success: false,
                error: 'No posts selected for deletion'
            };
        }

        const result = await Post.deleteMany({ _id: { $in: ids } });
        revalidatePath('/');

        return {
            success: true,
            data: { deletedCount: result.deletedCount }
        };
    } catch (error: any) {
        console.error('Error deleting posts:', error);
        return {
            success: false,
            error: formatValidationError(error)
        };
    }
}

export async function importPostsAction(posts: PostFormData[]): Promise<ActionResponse<{ count: number; partialError?: string }>> {
    try {
        await dbConnect();
        if (!posts || posts.length === 0) {
            return {
                success: false,
                error: 'No posts to import'
            };
        }
        const validPosts = posts
            .filter(post => post.title && post.content)
            .map(post => ({
                title: post.title.trim(),
                content: post.content.trim()
            }));

        if (validPosts.length === 0) {
            return {
                success: false,
                error: 'No valid posts found'
            };
        }
        // Use insertMany with ordered: false to skip duplicates
        const result = await Post.insertMany(validPosts, {
            ordered: false
        });
        revalidatePath('/');
        return {
            success: true,
            data: { count: result.length }
        };
    } catch (error: any) {
        // Handle duplicate key errors
        if (error.title === 'MongoBulkWriteError') {
            const insertedCount = error.insertedDocs?.length || 0;
            const duplicateCount = error.writeErrors?.length || 0;
            if (insertedCount > 0) {
                revalidatePath('/');
                return {
                    success: true,
                    data: {
                        count: insertedCount,
                        partialError: `Imported ${insertedCount} posts. ${duplicateCount} skipped (duplicates).`
                    }
                };
            }
            return {
                success: false,
                error: `All ${duplicateCount} posts already exist in the database.`
            };
        }
        return {
            success: false,
            error: 'Failed to import posts'
        };
    }
}