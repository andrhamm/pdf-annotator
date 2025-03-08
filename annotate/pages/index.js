import React, { useEffect, useState } from 'react';

import Link from 'next/link';

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  return (
    <div style={{ padding: '40px', textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '30px' }}>PDF Annotation Tool</h1>
      
      <div style={{ background: '#f0f0f0', padding: '20px', borderRadius: '5px', marginBottom: '30px' }}>
        <p>Basic Next.js setup is working successfully!</p>
        <p>Environment: {isClient ? 'Client-side' : 'Server-side'}</p>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
        <Link href="/test" passHref>
          <button style={{ padding: '10px 20px', background: '#0070f3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            Test Page
          </button>
        </Link>
        
        <Link href="/app" passHref>
          <button style={{ padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            Launch App
          </button>
        </Link>
      </div>
    </div>
  );
}
