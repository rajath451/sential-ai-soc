import { useNavigate } from "react-router-dom";
import { Bell, Settings, Search, LogOut, Menu } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export function Header({ title, onMenuClick }: { title: string; onMenuClick?: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.info("Operator session terminated.");
  };

  const handleNotificationClick = () => {
    // Navigate to the Threat Sandbox and display summary toast
    navigate("/threats");
    toast.info("Opening Threat Sandbox & Intrusion logs catalog.");
  };

  const handleSettingsClick = () => {
    // Navigate to Settings Control Panel
    navigate("/settings");
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 py-3 md:py-4 transition-colors duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-1.5 -ml-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 cursor-pointer mr-1"
            aria-label="Open sidebar menu"
          >
            <Menu className="w-5.5 h-5.5" />
          </button>
          <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white truncate max-w-[160px] sm:max-w-xs md:max-w-none" title={title}>
            {title}
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <input
              type="text"
              placeholder="Search logs, alerts, nodes..."
              className="bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 rounded-lg pl-10 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 transition-colors"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-650" />
          </div>
          
          {/* Active Navigation Alerts */}
          <button 
            onClick={handleNotificationClick}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg" 
            title="Intrusion Notifications"
          >
            <Bell className="w-5 h-5 text-slate-500 dark:text-slate-450 hover:text-blue-500" />
          </button>
          
          {/* Active Navigation Settings */}
          <button 
            onClick={handleSettingsClick}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg" 
            title="SIEM Control Settings"
          >
            <Settings className="w-5 h-5 text-slate-500 dark:text-slate-450 hover:text-blue-500" />
          </button>

          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800 flex-shrink-0">
              <span className="text-xs font-semibold font-mono text-blue-600 dark:text-blue-400 whitespace-nowrap hidden sm:inline-block" title={`Logged in as ${user.email}`}>
                Agent: {user.username}
              </span>
              <button 
                onClick={handleLogout}
                className="text-slate-400 hover:text-red-500 transition-colors p-1 hover:bg-red-50 dark:hover:bg-red-950/20 rounded cursor-pointer" 
                title="Log Out Session"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

