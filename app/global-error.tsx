'use client';

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <p>Something went wrong.</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
