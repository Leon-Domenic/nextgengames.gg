'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FriendsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/browsergames#friends');
  }, [router]);

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '18px',
      fontWeight: 700,
    }}>
      Redirecting to Browser Games Hub...
    </div>
  );
}
