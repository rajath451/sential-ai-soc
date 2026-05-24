import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { ParsedLog, processLogs } from "@/lib/logProcessor";
import { Search, ShieldAlert, CheckCircle, Clock, FileText, Info } from "lucide-react";

const SAMPLE_LOGS = `2026-05-24T08:12:01 IP=198.51.100.42 PORT=4444 USER=admin ACTION=failed_login
2026-05-24T08:12:15 IP=198.51.100.42 PORT=4444 USER=admin ACTION=failed_login
2026-05-24T08:12:31 IP=198.51.100.42 PORT=4444 USER=admin ACTION=failed_login
2026-05-24T08:13:02 IP=198.51.100.42 PORT=4444 USER=admin ACTION=success_login
2026-05-24T14:02:40 IP=10.0.0.50 PORT=80 USER=svc-monitor ACTION=routine_healthcheck
2026-05-24T14:05:12 IP=45.12.88.192 PORT=80 USER=guest ACTION=union_select_sql_injection
2026-05-24T14:10:00 IP=192.168.1.5 PORT=22 USER=sysadmin ACTION=success_login
2026-05-24T14:15:33 IP=203.0.113.111 PORT=3389 USER=unknown ACTION=failed_rdp_bruteforce`;

export default function Logs() {
  const [logs, setLogs] = useState<ParsedLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL");

  useEffect(() => {
    try {
      const savedLogs = localStorage.getItem("sentinel_logs");
      if (savedLogs) {
        setLogs(JSON.parse(savedLogs));
      } else {
        setLogs(processLogs(SAMPLE_LOGS));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.sourceIP.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.eventType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.message.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterSeverity === "ALL") return true;
    if (filterSeverity === "BENIGN") return log.false_positive === true;
    return log.priority === filterSeverity && !log.false_positive;
  });

  return (
    <Layout title="SIEM Logs Manager">
      <div className="p-4 sm:p-6 md:p-8 space-y-6">
        
        {/* Log Filters */}
        <div className="flex flex-col md:flex-row gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md justify-between items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search complete auditing logs archive..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 text-slate-200 placeholder-slate-600 rounded-lg text-xs border border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto justify-start md:justify-end">
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">All Severity levels</option>
              <option value="CRITICAL">Critical Threats Only</option>
              <option value="HIGH">High Severity</option>
              <option value="MEDIUM">Medium Severity</option>
              <option value="LOW">Low Severity</option>
              <option value="BENIGN">Benign / FP Filtered</option>
            </select>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-3 md:px-6 py-3 text-left">TIMESTAMP</th>
                  <th className="px-3 md:px-6 py-3 text-center">SEVERITY</th>
                  <th className="px-3 md:px-6 py-3 text-left">EVENT CATEGORY</th>
                  <th className="px-3 md:px-6 py-3 text-left">SOURCE ENTITY</th>
                  <th className="px-3 md:px-6 py-3 text-left font-semibold">RAW LOG line DESCRIPTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 md:px-6 py-16 text-center text-slate-500 text-xs">
                      No security audit entries found in session. Go to Overview to analyze logs.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-slate-800/60 transition-colors"
                    >
                      <td className="px-3 md:px-6 py-2.5 md:py-4 text-xs font-mono text-slate-500 whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="px-3 md:px-6 py-2.5 md:py-4 text-center">
                        <span
                          className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded ${
                            log.false_positive
                              ? "bg-green-950/40 text-green-400 border border-green-900/30"
                              : log.priority === "CRITICAL"
                                ? "bg-red-900/30 text-red-200 border border-red-900/30"
                                : log.priority === "HIGH"
                                  ? "bg-orange-900/30 text-orange-200"
                                  : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {log.false_positive ? "BENIGN" : log.priority}
                        </span>
                      </td>
                      <td className="px-3 md:px-6 py-2.5 md:py-4 text-xs font-semibold text-slate-200">
                        {log.eventType}
                      </td>
                      <td className="px-3 md:px-6 py-2.5 md:py-4 text-xs font-mono text-slate-300 font-bold whitespace-nowrap">
                        IP: {log.sourceIP} | User: {log.username}
                      </td>
                      <td className="px-3 md:px-6 py-2.5 md:py-4 text-xs text-slate-400 font-mono break-all max-w-sm">
                        {log.message}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>


        {/* Pagination Indicator */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing {filteredLogs.length} of {logs.length} logged assets
          </div>
          <div className="flex gap-2">
            <span className="italic">SIEM Auditing Engine Online</span>
          </div>
        </div>
      </div>
    </Layout>
  );
}
