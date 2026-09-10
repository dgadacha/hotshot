import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'HOTSHOT — Fast. Loud. Stupidly dangerous.',
  description:
    'Un FPS arena 1v1. Entrez dans Scrapyard : dix éliminations, huit minutes et aucune seconde à perdre.',
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
