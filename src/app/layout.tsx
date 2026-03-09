import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'DigiHack NBU - Hackathon App',
    description: 'Official DigiHack NBU Evaluation System',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className="font-sans antialiased min-h-screen flex flex-col" suppressHydrationWarning>
                <main className="flex-1 container mx-auto px-4 py-8 mb-20">
                    {children}
                </main>
            </body>
        </html>
    );
}
