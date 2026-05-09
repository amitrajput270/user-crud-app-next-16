import { User } from '@/types/user';

// Using global to persist data across hot reloads in development
declare global {
    var userStore: User[] | undefined;
}

// Initialize with sample data
const initialUsers: User[] = [
    {
        id: "1",
        name: "Mitesh Ricky Devan",
        email: "mitesh.ricky.devan7257@gmail.com",
        createdAt: "2026-05-09T10:30:00"
    },
    {
        id: "2",
        name: "Binod Sarraf",
        email: "binod.sarraf3323@gmail.com",
        createdAt: "2026-05-09T10:30:00"
    },
    {
        id: "3",
        name: "Munaf Lal Walia",
        email: "munaf.lal.walia4659@gmail.com",
        createdAt: "2026-05-09T10:30:00"
    },
    {
        id: "4",
        name: "David Ram Wali",
        email: "david.ram.wali7354@gmail.com",
        createdAt: "2026-05-09T10:30:00"
    },
    {
        id: "5",
        name: "Komal Jaswant Som",
        email: "komal.jaswant.som9647@gmail.com",
        createdAt: "2026-05-09T10:30:00"
    },
    {
        id: "6",
        name: "Ananya Rattan",
        email: "ananya.rattan6656@gmail.com",
        createdAt: "2026-05-09T10:30:00"
    },
    {
        id: "7",
        name: "Akshay Rao Mathur",
        email: "akshay.rao.mathur3661@gmail.com",
        createdAt: "2026-05-09T10:30:00"
    },
    {
        id: "8",
        name: "Radha Thakkar",
        email: "radha.thakkar2051@gmail.com",
        createdAt: "2026-05-09T10:30:00"
    },
    {
        id: "9",
        name: "Rashid Chandra Loke",
        email: "rashid.chandra.loke4129@gmail.com",
        createdAt: "2026-05-09T10:24:00"
    },
    {
        id: "10",
        name: "Nitika Vivek Reddy",
        email: "nitika.vivek.reddy5986@gmail.com",
        createdAt: "2026-05-09T10:24:00"
    }
];

// Initialize or get existing store
if (!global.userStore) {
    global.userStore = [...initialUsers];
}

export function getUsers(): User[] {
    return global.userStore!;
}

export function setUsers(users: User[]): void {
    global.userStore = users;
}