'use server';

import { User, UserFormData } from '@/types/user';
import { getUsers, setUsers } from './store';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';

export async function getUsersAction(
    search: string = '',
    page: number = 1,
    pageSize: number = 10
) {
    const users = getUsers();

    let filteredUsers = users;
    if (search) {
        const searchLower = search.toLowerCase();
        filteredUsers = users.filter(
            user =>
                user.name.toLowerCase().includes(searchLower) ||
                user.email.toLowerCase().includes(searchLower)
        );
    }

    const totalUsers = filteredUsers.length;
    const totalPages = Math.ceil(totalUsers / pageSize);
    const startIndex = (page - 1) * pageSize;
    const paginatedUsers = filteredUsers.slice(startIndex, startIndex + pageSize);

    return {
        users: paginatedUsers,
        pagination: {
            currentPage: page,
            totalPages,
            pageSize,
            totalUsers
        }
    };
}

export async function createUserAction(data: UserFormData) {
    const users = getUsers();
    const newUser: User = {
        id: uuidv4(),
        name: data.name,
        email: data.email,
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    setUsers(users);
    revalidatePath('/');
    return newUser;
}

export async function updateUserAction(id: string, data: UserFormData) {
    const users = getUsers();
    const index = users.findIndex(u => u.id === id);

    if (index === -1) {
        throw new Error('User not found');
    }

    users[index] = { ...users[index], ...data, id: users[index].id };
    setUsers(users);
    revalidatePath('/');
    return users[index];
}

export async function deleteUsersAction(ids: string[]) {
    const users = getUsers();
    const filteredUsers = users.filter(user => !ids.includes(user.id));
    setUsers(filteredUsers);
    revalidatePath('/');
    return { success: true };
}

export async function importUsersAction(users: UserFormData[]) {
    const currentUsers = getUsers();
    const newUsers = users.map(user => ({
        id: uuidv4(),
        name: user.name,
        email: user.email,
        createdAt: new Date().toISOString()
    }));

    setUsers([...currentUsers, ...newUsers]);
    revalidatePath('/');
    return { success: true, count: newUsers.length };
}