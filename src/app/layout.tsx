import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kagura Insights — Customer Feedback Intelligence Platform',
  description: 'AI-powered customer feedback intelligence platform demonstrated on Groww with Human-in-the-Loop governance.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#f8fafc] text-slate-900 antialiased selection:bg-[#00d09c]/20 selection:text-emerald-900">
        {children}
      </body>
    </html>
  );
}
