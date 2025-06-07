// src/components/layout/Sidebar.tsx
import Link from 'next/link';

const Sidebar = () => {
  return (
    <aside className="w-64 bg-gray-100 p-4 border-r border-gray-200">
      <h2 className="text-lg font-semibold mb-4">Navigation</h2>
      <nav>
        <ul>
          <li className="mb-2">
            <Link href="/(app)/dashboard" className="text-blue-600 hover:text-blue-800">
              Dashboard
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/(app)/attendance" className="text-blue-600 hover:text-blue-800">
              Attendance
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/(app)/leave" className="text-blue-600 hover:text-blue-800"> {/* Assuming leave will also be in (app) group */}
              Leave
            </Link>
          </li>
          {/* More links will be added based on roles and modules */}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
