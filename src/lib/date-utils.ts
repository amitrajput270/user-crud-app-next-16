// Pre-configured formatters for reuse (better performance)
const dateFormatters = {
    full: new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }),

    short: new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }),

    timeOnly: new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }),

    iso: new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    })
};

// Main format function
export function formatDate(date: string | Date, format: 'full' | 'short' = 'full'): string {
    if (!date) return '--';

    const d = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(d.getTime())) return '--';

    // Use getUTC methods to avoid hydration mismatch
    const day = d.getUTCDate();
    const month = d.getUTCMonth() + 1; // 0-based
    const year = d.getUTCFullYear();
    const hours = d.getUTCHours();
    const minutes = d.getUTCMinutes();
    const seconds = d.getUTCSeconds();

    // Convert to IST (UTC + 5:30)
    const istDate = new Date(d.getTime() + (5.5 * 60 * 60 * 1000));
    const istHours = istDate.getUTCHours();
    const istMinutes = istDate.getUTCMinutes();
    const ampm = istHours >= 12 ? 'PM' : 'AM';
    const hour12 = istHours % 12 || 12;
    const minuteStr = istMinutes.toString().padStart(2, '0');

    // DD/MM/YYYY format (Indian style)
    const dayStr = day.toString().padStart(2, '0');
    const monthStr = month.toString().padStart(2, '0');

    if (format === 'short') {
        return `${dayStr}/${monthStr}/${year}`;
    }

    // Full format: 09/05/2026 4:00 PM
    return `${dayStr}/${monthStr}/${year} ${hour12}:${minuteStr} ${ampm}`;
}

// Alternative with month name
export function formatDateLong(date: string | Date): string {
    if (!date) return '--';

    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '--';

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const day = d.getUTCDate();
    const month = months[d.getUTCMonth()];
    const year = d.getUTCFullYear();

    const istDate = new Date(d.getTime() + (5.5 * 60 * 60 * 1000));
    const istHours = istDate.getUTCHours();
    const istMinutes = istDate.getUTCMinutes();
    const ampm = istHours >= 12 ? 'pm' : 'am';
    const hour12 = istHours % 12 || 12;
    const minuteStr = istMinutes.toString().padStart(2, '0');

    return `${month} ${day}, ${year} ${hour12}:${minuteStr} ${ampm}`;
}

// Additional helper functions
export function timeAgo(date: string | Date): string {
    const now = new Date();
    const past = typeof date === 'string' ? new Date(date) : date;
    const diffMs = now.getTime() - past.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return formatDate(date, 'short');
}

export function isValidDate(date: any): boolean {
    if (!date) return false;
    const d = new Date(date);
    return d instanceof Date && !isNaN(d.getTime());
}