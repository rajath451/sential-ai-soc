import { Link } from "react-router-dom";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
      <div className="text-center space-y-6">
        <div className="text-6xl font-bold text-blue-500">404</div>
        <h1 className="text-3xl font-bold">Page Not Found</h1>
        <p className="text-slate-400 max-w-md">
          This page doesn't exist. Would you like to return to the dashboard to
          continue monitoring threats?
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          <Home className="w-5 h-5" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
