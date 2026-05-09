'use server';

import { revalidatePath } from 'next/cache';
import dbConnect from './mongodb';
import User from '@/models/User';
import { UserFormData, UsersResponse, ActionResponse, User as UserType } from '@/types/user';
import { handleError } from './error-handler';

function formatValidationError(error: any): string {
    // Handle Mongoose ValidationError
    if (error.name === 'ValidationError' && error.errors) {
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
    if (error.name === 'CastError') {
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

export async function getUsersAction(
    search: string = '',
    page: number = 1,
    pageSize: number = 10
): Promise<UsersResponse> {
    try {
        await dbConnect();

        let query = {};
        if (search) {
            query = {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ]
            };
        }

        const totalUsers = await User.countDocuments(query);
        const totalPages = Math.ceil(totalUsers / pageSize);
        const skip = (page - 1) * pageSize;

        const users = await User.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pageSize)
            .lean();

        return {
            users: users.map((user: any) => ({
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
            })),
            pagination: {
                currentPage: page,
                totalPages,
                pageSize,
                totalUsers,
            }
        };
    } catch (error: any) {
        console.error('Error fetching users:', error);
        // Return empty state on error
        return {
            users: [],
            pagination: {
                currentPage: page,
                totalPages: 0,
                pageSize,
                totalUsers: 0,
            }
        };
    }
}

export async function createUserAction(data: UserFormData): Promise<ActionResponse<UserType>> {
    try {
        await dbConnect();

        // Validate data before creating
        if (!data.name || data.name.trim().length < 2) {
            return {
                success: false,
                error: 'Name must be at least 2 characters'
            };
        }

        if (!data.email || !/^\S+@\S+\.\S+$/.test(data.email)) {
            return {
                success: false,
                error: 'Please enter a valid email address'
            };
        }

        const user = await User.create({
            name: data.name.trim(),
            email: data.email.trim().toLowerCase()
        });

        revalidatePath('/');

        return {
            success: true,
            data: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                createdAt: user.createdAt.toISOString(),
            }
        };
    } catch (error: any) {
        console.error('Error creating user:', error);
        return {
            success: false,
            error: formatValidationError(error)
        };
    }
}

export async function updateUserAction(id: string, data: UserFormData): Promise<ActionResponse<UserType>> {
    try {
        await dbConnect();

        // Validate data before updating
        if (!data.name || data.name.trim().length < 2) {
            return {
                success: false,
                error: 'Name must be at least 2 characters'
            };
        }

        if (!data.email || !/^\S+@\S+\.\S+$/.test(data.email)) {
            return {
                success: false,
                error: 'Please enter a valid email address'
            };
        }

        const user = await User.findByIdAndUpdate(
            id,
            {
                $set: {
                    name: data.name.trim(),
                    email: data.email.trim().toLowerCase()
                }
            },
            { new: true, runValidators: true }
        );

        if (!user) {
            return {
                success: false,
                error: 'User not found'
            };
        }

        revalidatePath('/');
        return {
            success: true,
            data: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                createdAt: user.createdAt.toISOString(),
            }
        };
    } catch (error: any) {
        console.error('Error updating user:', error);
        return {
            success: false,
            error: formatValidationError(error)
        };
    }
}

export async function deleteUsersAction(ids: string[]): Promise<ActionResponse<{ deletedCount: number }>> {
    try {
        await dbConnect();

        if (!ids || ids.length === 0) {
            return {
                success: false,
                error: 'No users selected for deletion'
            };
        }

        const result = await User.deleteMany({ _id: { $in: ids } });
        revalidatePath('/');

        return {
            success: true,
            data: { deletedCount: result.deletedCount }
        };
    } catch (error: any) {
        console.error('Error deleting users:', error);
        return {
            success: false,
            error: formatValidationError(error)
        };
    }
}

export async function importUsersAction(users: UserFormData[]): Promise<ActionResponse<{ count: number; partialError?: string }>> {
    try {
        await dbConnect();

        if (!users || users.length === 0) {
            return {
                success: false,
                error: 'No users to import'
            };
        }

        // Filter out invalid users and clean data
        const validUsers = users
            .filter(user => user.name && user.email && /^\S+@\S+\.\S+$/.test(user.email))
            .map(user => ({
                name: user.name.trim(),
                email: user.email.trim().toLowerCase()
            }));

        if (validUsers.length === 0) {
            return {
                success: false,
                error: 'No valid users found. Each user must have a valid name and email.'
            };
        }

        const result = await User.insertMany(validUsers, {
            ordered: false,
            timeout: 30000 // 30 seconds timeout
        });

        revalidatePath('/');

        return {
            success: true,
            data: { count: result.length }
        };
    } catch (error: any) {
        console.error('Error importing users:', error);

        // Handle partial success (some documents inserted before error)
        if (error.insertedDocs && error.insertedDocs.length > 0) {
            revalidatePath('/');
            const failedCount = error.writeErrors?.length || 0;
            return {
                success: true,
                data: {
                    count: error.insertedDocs.length,
                    partialError: `Imported ${error.insertedDocs.length} users successfully. ${failedCount} entries failed (possibly duplicates or invalid data).`
                }
            };
        }

        // If it's a duplicate key error with no successful inserts
        if (error.code === 11000) {
            return {
                success: false,
                error: 'Import failed: Some emails already exist in the database.'
            };
        }

        return {
            success: false,
            error: formatValidationError(error)
        };
    }
}