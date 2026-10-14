'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          margin: 0,
          padding: '2rem',
          background: '#0f0f0f',
          color: '#f0f0f0',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
          Ada yang nggak beres.
        </h1>
        <p style={{ color: '#9ca3af', marginBottom: '2rem', maxWidth: '40ch' }}>
          Coba muat ulang halaman.
        </p>
        <button
          onClick={reset}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '10px',
            border: 'none',
            background: '#3b82f6',
            color: 'white',
            fontSize: '1rem',
            cursor: 'pointer',
          }}
        >
          Coba lagi
        </button>
      </body>
    </html>
  );
}
