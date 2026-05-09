import { NextRequest, NextResponse } from 'next/server';
import { getUsers, setUsers } from '@/lib/store';
import { User } from '@/types/user';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

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

    return NextResponse.json({
        users: paginatedUsers,
        pagination: {
            currentPage: page,
            totalPages,
            pageSize,
            totalUsers
        }
    });
}

export async function POST(request: NextRequest) {
    const body = await request.json();
    const users = getUsers();
    const newUser: User = {
        id: uuidv4(),
        name: body.name,
        email: body.email,
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    setUsers(users);
    return NextResponse.json(newUser, { status: 201 });
}