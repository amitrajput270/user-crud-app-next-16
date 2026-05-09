/**
 * Safely handles and formats different types of errors
 */
export function handleError(error: unknown): string {
    // Handle null/undefined
    if (error == null) {
        return 'An unknown error occurred';
    }

    // Handle Mongoose/MongoDB specific errors
    if (typeof error === 'object' && error !== null) {
        const err = error as any;

        // Mongoose ValidationError
        if (err.name === 'ValidationError') {
            try {
                const messages = Object.values(err.errors || {})
                    .map((e: any) => e?.message || 'Validation failed')
                    .filter(Boolean);
                return messages.length > 0
                    ? messages.join(', ')
                    : 'Validation failed';
            } catch {
                return 'Validation failed';
            }
        }

        // MongoDB duplicate key error
        if (err.code === 11000 || err.code === 11001) {
            try {
                const keyValue = err.keyValue || err.keyPattern || {};
                const field = Object.keys(keyValue)[0];
                if (field) {
                    const formattedField = field
                        .split('_')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ');
                    return `${formattedField} already exists`;
                }
            } catch {
                // Fallback if keyValue is malformed
            }
            return 'A record with this value already exists';
        }

        // Mongoose CastError
        if (err.name === 'CastError') {
            return `Invalid ${err.path || 'ID'}: ${err.value || 'unknown value'}`;
        }

        // General error with message
        if (err.message && typeof err.message === 'string') {
            return err.message;
        }
    }

    // Handle Error instances
    if (error instanceof Error) {
        return error.message;
    }

    // Handle string errors
    if (typeof error === 'string') {
        return error;
    }

    // Last resort - convert to string
    try {
        return String(error);
    } catch {
        return 'An unexpected error occurred';
    }
}