import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-sans' });
const outfitDisplay = Outfit({ subsets: ['latin'], variable: '--font-display' });

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
            <body className={`${outfit.variable} ${outfitDisplay.variable} antialiased min-h-screen flex flex-col`}>
                <main className="flex-1 container mx-auto px-4 py-8 mb-20 max-w-3xl">
                    {children}
                </main>
            </body>
        </html>
    );
}
