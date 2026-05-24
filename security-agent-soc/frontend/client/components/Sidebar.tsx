import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  AlertTriangle,
  FileText,
  TrendingUp,
  Settings,
  Moon,
  Sun,
  LogOut,
  ShieldCheck,
  X
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const navItems = [
  { path: "/", label: "Overview", icon: BarChart3 },
  { path: "/threats", label: "Threats", icon: AlertTriangle },
  { path: "/logs", label: "Logs", icon: FileText },
  { path: "/analytics", label: "Analytics", icon: TrendingUp },
  { path: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast.info("Operator session terminated.");
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-350 ease-in-out",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen?.(false)}
      />

      <aside className={cn(
        "w-64 bg-white dark:bg-slate-950 text-slate-800 dark:text-white border-r border-slate-200 dark:border-slate-800 flex flex-col h-full fixed left-0 top-0 bottom-0 transition-transform duration-300 ease-in-out z-50 lg:z-30 lg:translate-x-0",
        isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      )}>
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 relative">
          <button
            onClick={() => setIsOpen?.(false)}
            className="lg:hidden absolute right-4 top-5.5 p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm shadow-blue-500/20">
              S
            </div>
            <h1 className="text-md font-black tracking-wider text-slate-900 dark:text-white">SENTINEL AI</h1>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Vigilance Protocol v4.2</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen?.(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold",
                  isActive
                    ? "bg-slate-100 dark:bg-slate-800/80 text-blue-600 dark:text-white border-l-2 border-blue-500 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/60 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <Icon className={cn("w-4.5 h-4.5", isActive ? "text-blue-500 dark:text-blue-400" : "text-slate-400")} />
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Settings & Auth */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer font-semibold"
          >
            {theme === "dark" ? (
              <>
                <Sun className="w-4.5 h-4.5 text-yellow-500" />
                <span className="text-xs">Light Operations</span>
              </>
            ) : (
              <>
                <Moon className="w-4.5 h-4.5 text-blue-500" />
                <span className="text-xs">Dark Operations</span>
              </>
            )}
          </button>

          {user && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer font-semibold"
            >
              <LogOut className="w-4.5 h-4.5" />
              <span className="text-xs">Log Out</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

