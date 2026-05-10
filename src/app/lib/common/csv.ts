import Papa from 'papaparse';

// Generic type for CSV operations
interface CSVOptions<T> {
    data: T[];
    filename?: string;
    headers?: Partial<Record<keyof T, string>>;
    excludeFields?: (keyof T)[];
}

// Generic export function - works with any data type
export function exportToCSV<T extends Record<string, any>>(options: CSVOptions<T>): void {
    const { data, headers, excludeFields = [] } = options;

    if (!data || data.length === 0) {
        console.warn('No data to export');
        return;
    }

    // Transform data based on options
    const exportData = data.map(item => {
        const row: Record<string, any> = {};

        Object.keys(item).forEach(key => {
            if (!excludeFields.includes(key as keyof T)) {
                // Use custom header if provided, otherwise use the key
                const headerName = headers?.[key as keyof T] || key;
                row[headerName] = item[key];
            }
        });

        return row;
    });

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    // Generate dynamic filename
    const filename = options.filename || generateFilename();

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Generic parse function - works with any data type
export function parseCSVFile<T = Record<string, any>>(
    file: File,
    options?: {
        mapping?: Record<string, keyof T>;
        validate?: (row: T) => boolean;
        transform?: (row: any) => T;
    }
): Promise<T[]> {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                try {
                    let data = results.data as any[];

                    // Filter out empty rows first
                    data = data.filter(row => {
                        return row && Object.values(row).some(value => value && String(value).trim() !== '');
                    });

                    // Apply mapping if provided
                    if (options?.mapping) {
                        data = data.map(row => {
                            const mappedRow: any = {};
                            Object.entries(options.mapping!).forEach(([csvHeader, modelField]) => {
                                const value = row[csvHeader];
                                mappedRow[modelField as string] = value ? String(value).trim() : '';
                            });
                            return mappedRow;
                        });
                    }

                    // Apply transform if provided
                    if (options?.transform) {
                        data = data
                            .map(row => {
                                // Skip rows with missing required data
                                if (!row || Object.keys(row).length === 0) return null;
                                return options.transform!(row);
                            })
                            .filter(row => row !== null);
                    }

                    // Apply validation if provided
                    if (options?.validate) {
                        data = data.filter(row => options.validate!(row));
                    }

                    resolve(data as T[]);
                } catch (error) {
                    reject(error);
                }
            },
            error: (error: any) => {
                reject(error);
            }
        });
    });
}

// Helper to generate filename with timestamp
function generateFilename(prefix: string = 'export'): string {
    const date = new Date();
    const timestamp = date.toISOString().replace(/[:.]/g, '-');
    const random = Math.floor(Math.random() * 1000);
    return `${prefix}_${timestamp}_${random}.csv`;
}