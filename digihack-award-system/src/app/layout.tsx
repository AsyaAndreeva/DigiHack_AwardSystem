import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-display' });

export const metadata: Metadata = {
    title: 'Hackathon Judging App',
    description: 'Premium Hackathon Evaluation System',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={`${inter.variable} ${outfit.variable} antialiased min-h-screen flex flex-col`}>
                <main className="flex-1 container mx-auto px-4 py-8 mb-20 max-w-3xl">
                    {children}
                </main>
            </body>
        </html>
    );
}
