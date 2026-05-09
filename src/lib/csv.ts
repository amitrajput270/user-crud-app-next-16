import { User, UserFormData } from '@/types/user';
import Papa from 'papaparse';

export function exportToCSV(users: User[]): void {
    const data = users.map(user => ({
        ID: user.id,
        Name: user.name,
        Email: user.email,
        'Created At': new Date(user.createdAt).toLocaleString()
    }));

    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    // random filename with current date, time and rand number to avoid overwriting existing files
    const filename = `users_${new Date().toISOString()}_${Math.floor(Math.random() * 1000)}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export function parseCSVFile(file: File): Promise<UserFormData[]> {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            complete: (results) => {
                const users: UserFormData[] = results.data
                    .filter((row: any) => row.Name && row.Email)
                    .map((row: any) => ({
                        name: row.Name,
                        email: row.Email
                    }));
                resolve(users);
            },
            error: (error: any) => {
                reject(error);
            }
        });
    });
}