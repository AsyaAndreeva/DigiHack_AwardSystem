import type { Metadata } from 'next';
import './globals.css';
import { neon } from '@neondatabase/serverless';

export const metadata: Metadata = {
    title: 'NBU - Digitalen maraton',
    description: 'Official Digitalen maraton Evaluation System',
    icons: {
        icon: '/favicon.png',
        apple: '/favicon.png',
    }
};

export const dynamic = 'force-dynamic';

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    let themeColor = '#DAEA5F';
    try {
        if (process.env.DATABASE_URL) {
            const sql = neon(process.env.DATABASE_URL);
            const res = await sql`SELECT value FROM settings WHERE key = 'theme_color'`;
            if (res.length > 0) themeColor = res[0].value;
        }
    } catch (e) {
        console.error('Error fetching theme color:', e);
    }

    return (
        <html lang="en">
            <head>
                <style dangerouslySetInnerHTML={{ __html: `:root { --color-brand-yellow: ${themeColor} !important; }` }} />
            </head>
            <body className="font-sans antialiased min-h-screen flex flex-col" suppressHydrationWarning>
                <main className="flex-1 mb-20">
                    {children}
                </main>
            </body>
        </html>
    );
}
