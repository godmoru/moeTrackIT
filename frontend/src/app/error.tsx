'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const router = useRouter();
  const statusCode = error.message.match(/\d{3}/)?.[0] || 'Error';
  
  let title = 'Something went wrong!';
  let message = 'An unexpected error occurred. Please try again later.';

  switch(statusCode) {
    case '403':
      title = 'Access Denied';
      message = 'You do not have permission to view this page.';
      break;
    case '404':
      title = 'Page Not Found';
      message = 'The page you are looking for does not exist.';
      break;
    case '500':
      title = 'Server Error';
      message = 'An error occurred on our server. Please try again later.';
      break;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md text-center">
        <h1 className="text-6xl font-bold text-red-500">{statusCode}</h1>
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">{title}</h2>
        <p className="mt-2 text-gray-600">{message}</p>
        <div className="mt-6">
          <button
            onClick={() => {
              reset();
              router.push('/');
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Return Home
          </button>
          <button
            onClick={() => reset()}
            className="ml-3 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
