import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export default function NotAuthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full space-y-6 p-8 bg-white rounded-lg shadow-md text-center">
        <div className="flex justify-center">
          <ShieldAlert className="h-16 w-16 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Access Denied</h1>
        <p className="text-gray-600">
          You don't have permission to access this page. Please contact your administrator if you believe this is an error.
        </p>
        
        <div className="pt-6 flex flex-col space-y-3">
          <Link
            href="/admin/dashboard"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-center"
          >
            Return to Dashboard
          </Link>
          <Link
            href="/"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors text-center"
          >
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
