import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

export function Layout({ children, title }: LayoutProps) {
  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-white transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64 overflow-hidden">
        <Header title={title} />
        <main className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
          {children}
        </main>
      </div>
    </div>
  );
}
