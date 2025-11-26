import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Telecom Sales CRM
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Real-time lead management with atomic claiming, Kanban workflows, and analytics
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Admin Card */}
          <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-indigo-100 hover:border-indigo-300 transition-all">
            <div className="flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-6 mx-auto">
              <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 text-center">Admin Portal</h2>
            <p className="text-gray-600 mb-6 text-center">
              Upload leads, manage employees, and view analytics
            </p>
            <Link
              href="/login"
              className="block w-full text-center bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Admin Login
            </Link>
            <p className="text-xs text-gray-500 mt-3 text-center">
              After login, navigate to /admin
            </p>
          </div>

          {/* Employee Card */}
          <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-green-100 hover:border-green-300 transition-all">
            <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6 mx-auto">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 text-center">Employee Portal</h2>
            <p className="text-gray-600 mb-6 text-center">
              Claim leads, manage your pipeline, and track progress
            </p>
            <Link
              href="/login"
              className="block w-full text-center bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Employee Login
            </Link>
            <p className="text-xs text-gray-500 mt-3 text-center">
              Auto-redirects to dashboard
            </p>
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-4">
            <strong>Admin Credentials:</strong> admin@crm.local / admin123456
          </p>
          <p className="text-sm text-gray-500">
            Test the system or create employees from the admin panel
          </p>
        </div>
      </div>
    </div>
  );
}
