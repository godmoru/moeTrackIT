import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md text-center">
        <h1 className="text-6xl font-bold text-green-600">404</h1>
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Page Not Found</h2>
        <p className="mt-2 text-gray-600">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
