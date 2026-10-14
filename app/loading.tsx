export default function Loading() {
  return (
    <main className="container-page py-8 md:py-12">
      <div className="skeleton" style={{ height: '2rem', width: '10rem' }} />
      <div
        className="skeleton"
        style={{ height: '1rem', width: '16rem', marginTop: '0.75rem' }}
      />
      <div className="comic-grid" style={{ marginTop: '2.5rem' }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="comic-card">
            <div className="comic-card-cover skeleton" />
            <div
              className="skeleton"
              style={{ height: '1rem', width: '80%' }}
            />
            <div
              className="skeleton"
              style={{ height: '0.75rem', width: '50%' }}
            />
          </div>
        ))}
      </div>
    </main>
  );
}
