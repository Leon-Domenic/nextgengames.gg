import './globals.css';

export const metadata = {
  title: 'NextGenGames ★ Coming Soon | Next-Generation Tactical & Planetary Sandbox',
  description:
    'NextGenGames is forging the future of massive-scale tactical combat and procedural voxel sandboxes. Powered by Unreal Engine 5. Closed Alpha transmission imminent.',
  keywords:
    'NextGenGames, NextGen Games, RTS, Voxel, Unreal Engine 5, Strategy, Planetary Sandbox, Multiplayer, Sci-Fi, PC Gaming, Coming Soon',
  openGraph: {
    title: 'NextGenGames ★ Coming Soon | Next-Generation Tactical & Planetary Sandbox',
    description:
      'NextGenGames is forging the future of massive-scale tactical combat and procedural voxel sandboxes. Closed Alpha clearance opening soon.',
    type: 'website',
    url: 'https://nextgengames.gg',
    siteName: 'NextGenGames',
    images: [
      {
        url: '/combat-scene.png',
        width: 1920,
        height: 1080,
        alt: 'NextGenGames Tactical Sandbox Teaser',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NextGenGames ★ Coming Soon',
    description:
      'Next-generation voxel physics and tactical planetary warfare. Alpha clearance opening soon.',
    images: ['/combat-scene.png'],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#04060a" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
