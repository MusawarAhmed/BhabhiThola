import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bhabhi Thola | Multiplayer Royal Casino Card Game',
  description: 'Real-time multiplayer Bhabhi Thola card game built with Next.js, Vercel Serverless WebSockets, and Neon PostgreSQL.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-casino-gold selection:text-black">
        {children}
      </body>
    </html>
  );
}
