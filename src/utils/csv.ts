import { User } from '@/types/user';

export function exportToCSV(users: User[]) {
    const headers = ['ID', 'Name', 'Email', 'Created At'];
    const csvData = users.map(user => [
        user.id,
        user.name,
        user.email,
        new Date(user.createdAt).toLocaleString()
    ]);

    const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `users_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export function parseCSVFile(file: File): Promise<User[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            const text = event.target?.result as string;
            const lines = text.split('\n');
            const headers = lines[0].split(',');

            const users: User[] = [];

            for (let i = 1; i < lines.length; i++) {
                if (lines[i].trim() === '') continue;

                const values = lines[i].split(',');
                if (values.length >= 4) {
                    users.push({
                        id: values[0],
                        name: values[1],
                        email: values[2],
                        createdAt: values[3]
                    });
                }
            }

            resolve(users);
        };

        reader.onerror = reject;
        reader.readAsText(file);
    });
}