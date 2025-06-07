// src/app/(app)/(admin)/dashboard/page.tsx
import Link from 'next/link';

export default function AdminDashboardPage() {
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-6">Admin Dashboard</h2>
      <p className="mb-4">Welcome to the admin control panel. From here, you can manage various aspects of the application.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow">
          <h3 className="text-lg font-semibold mb-2">Roles Management</h3>
          <p className="text-sm text-gray-600 mb-3">Define and manage user roles within the application.</p>
          <Link href="/(app)/(admin)/roles" className="text-blue-600 hover:text-blue-800 hover:underline font-medium">
            Manage Roles &rarr;
          </Link>
        </div>
        <div className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow">
          <h3 className="text-lg font-semibold mb-2">Permissions</h3>
          <p className="text-sm text-gray-600 mb-3">Manage permissions and assign them to roles (coming soon).</p>
          <Link href="/(app)/(admin)/permissions" className="text-gray-400 cursor-not-allowed" aria-disabled="true">
            Manage Permissions (TBD)
          </Link>
        </div>
        <div className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow">
          <h3 className="text-lg font-semibold mb-2">User Role Assignment</h3>
          <p className="text-sm text-gray-600 mb-3">Assign roles to users (coming soon).</p>
          <Link href="/(app)/(admin)/users" className="text-gray-400 cursor-not-allowed" aria-disabled="true">
            Manage User Roles (TBD)
          </Link>
        </div>
        <div className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow">
          <h3 className="text-lg font-semibold mb-2">Attendance Overview</h3>
          <p className="text-sm text-gray-600 mb-3">View and manage all employee attendance records.</p>
          <Link href="/(app)/(admin)/attendance" className="text-blue-600 hover:text-blue-800 hover:underline font-medium">
            View All Attendance &rarr;
          </Link>
        </div>
        <div className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow">
          <h3 className="text-lg font-semibold mb-2">Leave Settings</h3>
          <p className="text-sm text-gray-600 mb-3">Configure different types of leave available (e.g., Annual, Sick).</p>
          <Link href="/(app)/(admin)/leave-settings" className="text-blue-600 hover:text-blue-800 hover:underline font-medium">
            Manage Leave Types &rarr;
          </Link>
        </div>
        {/* Add more admin sections as needed */}
      </div>
    </div>
  );
}
