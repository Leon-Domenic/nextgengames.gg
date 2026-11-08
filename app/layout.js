import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { AuthProvider } from '@/components/AuthProvider';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'NextGenGames.gg ★ Multiplayer Party Gaming Hub & Board Brawl',
  description: 'Browser-based multiplayer games to play with friends. Jump into Board Brawl with Business Tour sabotage, live chat, and 1-click party lobbies.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#04060a" />
      </head>
      <body style={{ margin: 0, padding: 0, minHeight: '100vh', fontFamily: 'var(--font-body, sans-serif)' }}>
        <ThemeProvider>
          <AuthProvider>
            <Navbar />
            <main>{children}</main>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
