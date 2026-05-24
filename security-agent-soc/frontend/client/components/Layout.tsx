import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

export function Layout({ children, title }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-white transition-colors duration-300">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col lg:ml-64 overflow-hidden min-w-0 w-full">
        <Header title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
          {children}
        </main>
      </div>
    </div>
  );
}

