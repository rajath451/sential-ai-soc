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
  ShieldCheck
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

export function Sidebar() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast.info("Operator session terminated.");
  };

  return (
    <aside className="w-64 bg-white dark:bg-slate-950 text-slate-800 dark:text-white border-r border-slate-200 dark:border-slate-800 flex flex-col h-full fixed left-0 top-0 bottom-0 transition-colors duration-300">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-800">
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
  );
}
