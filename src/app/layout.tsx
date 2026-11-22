import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kagura — Customer Feedback Intelligence Platform (Groww)',
  description: 'AI-assisted customer feedback intelligence platform converting raw public app reviews into structured product insights with Human-in-the-Loop MCP governance.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0f1115] text-slate-100 antialiased selection:bg-[#00d09c] selection:text-black">
        {children}
      </body>
    </html>
  );
}
