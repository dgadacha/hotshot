import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'HOTSHOT — Comic Edition',
  description:
    'Un FPS arena 1v1 ultra coloré, en cel-shading et en mode BD. Entrez dans Scrapyard : dix éliminations, huit minutes et un maximum de bruit.',
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
