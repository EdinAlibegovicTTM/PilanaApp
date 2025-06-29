'use client';

export default function HomePage() {
  // TEST: Uklanjam sve hookove i logiku da vidim da li se osnovni React renderuje
  return (
    <div className="min-h-screen flex items-center justify-center bg-red-100">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-6xl font-bold text-red-600 mb-4">🔥 TEST 🔥</h1>
        <p className="text-2xl text-gray-800 mb-4">Ako vidiš ovo, React radi!</p>
        <div className="text-sm text-gray-600">
          <p>Vrijeme: {new Date().toLocaleString()}</p>
          <p>User Agent: {typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR'}</p>
        </div>
      </div>
    </div>
  );
} 