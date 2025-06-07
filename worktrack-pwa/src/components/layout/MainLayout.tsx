// src/components/layout/MainLayout.tsx
import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 bg-gray-50">
          {children}
        </main>
      </div>
      <footer className="bg-gray-700 text-white text-center p-2">
        © {new Date().getFullYear()} WorkTrack PWA
      </footer>
    </div>
  );
};

export default MainLayout;
