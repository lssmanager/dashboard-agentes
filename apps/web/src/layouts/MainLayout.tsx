import { ReactNode, useEffect, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { usePreferences } from '../lib/usePreferences';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { sidebarCollapsed, setSidebarCollapsed } = usePreferences();
  const [sidebarOpen, setSidebarOpen] = useState(!sidebarCollapsed);

  // Sync sidebar state to preferences
  useEffect(() => {
    setSidebarCollapsed(!sidebarOpen);
  }, [sidebarOpen, setSidebarCollapsed]);

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      {sidebarOpen && (
        <aside className="w-64 bg-slate-900 text-white flex flex-col border-r border-slate-800 fixed h-screen left-0 top-0 z-40 md:relative md:z-auto">
          <Sidebar onNavigate={() => setSidebarOpen(false)} />
        </aside>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col ml-0 md:ml-0">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center px-6 sticky top-0 z-30">
          <Header onToggleSidebar={handleToggleSidebar} sidebarOpen={sidebarOpen} />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>

      {/* Mobile overlay when sidebar open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
