import BackendMigrationTest from "../../components/test/BackendMigrationTest";

export default function BackendTestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-black">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Backend Integration Test
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Test the migration from localStorage to backend API for Honeycomb Protocol integration.
            This page demonstrates how profiles are migrated from local storage to the backend service.
          </p>
        </div>
        
        <BackendMigrationTest />
      </div>
    </div>
  );
}
