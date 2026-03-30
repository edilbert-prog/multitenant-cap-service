type Context = Record<string, unknown>;

interface SubProcessRaw {
  BusinessSubProcessName: string;
  BusinessSubProcessId: string;
  SubProcesses?: SubProcessRaw[];
  [key: string]: unknown;
}

type TreeNode<C extends Context> = C &
    SubProcessRaw & {
      title: string;
      id: string;
      children: Array<TreeNode<C>>;
    };

export function convertSubProcess<C extends Context = Context>(
    sub: SubProcessRaw,
    context: C = {} as C
): TreeNode<C> {
  return {
    ...(context as C),
...(sub as SubProcessRaw),
title: sub.BusinessSubProcessName,
    id: sub.BusinessSubProcessId,
    children: (sub.SubProcesses || []).map((child) =>
    convertSubProcess<C>(child, context)
),
};
}
export function truncateString(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength) + '...';
}
// utils/cookies.ts
export function setCookie(name: string, value: string, days?: number, path: string = '/', domain?: string): void {
    try {
        let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

        // Add expiration date if specified
        if (days !== undefined) {
            const date = new Date();
            date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
            cookieString += `; expires=${date.toUTCString()}`;
        }




        // Add domain if provided (optional for localhost)
        if (domain) {
            cookieString += `; domain=${encodeURIComponent(domain)}`;
        }

        // Add SameSite for security (Lax is suitable for localhost)
        cookieString += `; SameSite=Lax`;

        // Set the cookie
        console.log('Setting cookie:', cookieString); // Debug log
        document.cookie = cookieString;

        // Verify cookie was set
        console.log('Current cookies:', document.cookie);
    } catch (error) {
        console.error('Error setting cookie:', error);
    }
}