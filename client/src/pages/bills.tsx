// Bills Management page temporarily disabled
// This page has been removed due to functionality issues
// Transaction data can be viewed through Reports > Sales Reports

export default function Bills() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Bills Management Unavailable</h1>
        <p className="text-gray-600 mb-6">
          This feature is currently under maintenance. Please use the Reports section to view transaction data.
        </p>
        <a 
          href="/reports" 
          className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
        >
          Go to Reports
        </a>
      </div>
    </div>
  );
}