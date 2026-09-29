import './globals.css';
import NavTop from '@/components/NavTop';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'NextGenGames ★ Epic-Scale Planetary Strategy & Voxel Sandbox',
  description:
    'NextGenGames: Command colossal armies and autonomous robotic Vassals in battles with thousands of simulated units across procedural worlds in real-time. Built with Unreal Engine 5 voxel physics. Play the Alpha now for Windows and Linux!',
  keywords:
    'NextGenGames, Beyond All Reason, RTS, Voxel, Unreal Engine 5, Strategy, Planetary Extraction, Multiplayer, Sci-Fi, PC Gaming',
  openGraph: {
    title: 'NextGenGames ★ Epic-Scale Planetary Strategy & Voxel Sandbox',
    description:
      'Command colossal armies and autonomous robotic Vassals across procedural worlds. Fully simulated projectile ballistics, explosion physics, and terrain deformation.',
    type: 'website',
    url: 'https://nextgengames.gg',
    siteName: 'NextGenGames',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NextGenGames ★ Epic-Scale Planetary Strategy & Voxel Sandbox',
    description:
      'Command colossal armies and autonomous robotic Vassals across procedural worlds in real-time. Play for free now!',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <NavTop />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
