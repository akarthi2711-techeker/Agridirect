import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-charcoal px-4">
      <div className="text-center animate-fade-in">
        <div className="text-8xl mb-6">🌱</div>
        <h1 className="text-6xl font-bold text-paddy-green mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Page Not Found</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">This field hasn't been planted yet.</p>
        <Link to="/" className="btn-primary inline-flex items-center gap-2">
          <Leaf className="w-4 h-4" /> Back to Home
        </Link>
      </div>
    </div>
  );
}
