import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pulmonary Nodule Risk Calculator',
  description:
    'Mayo · Brock · Herder · BIMC · Fleischner 2017 · BTS VDT — For qualified clinician use only',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
