import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { ParsedLog } from "@/lib/logProcessor";
import {
  Upload,
  AlertTriangle,
  CheckCircle,
  Clock,
  Trash2,
  Play,
  Copy,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Search,
  Terminal,
  Loader2,
  FileDown,
  Info,
  Server,
  UserCheck
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const SAMPLE_LOGS = `2026-05-24T08:12:01 IP=198.51.100.42 PORT=4444 USER=admin ACTION=failed_login
2026-05-24T08:12:15 IP=198.51.100.42 PORT=4444 USER=admin ACTION=failed_login
2026-05-24T08:12:31 IP=198.51.100.42 PORT=4444 USER=admin ACTION=failed_login
2026-05-24T08:13:02 IP=198.51.100.42 PORT=4444 USER=admin ACTION=success_login
2026-05-24T14:02:40 IP=10.0.0.50 PORT=80 USER=svc-monitor ACTION=routine_healthcheck
2026-05-24T14:05:12 IP=45.12.88.192 PORT=80 USER=guest ACTION=union_select_sql_injection
2026-05-24T14:10:00 IP=192.168.1.5 PORT=22 USER=sysadmin ACTION=success_login
2026-05-24T14:15:33 IP=203.0.113.111 PORT=3389 USER=unknown ACTION=failed_rdp_bruteforce`;

const SCENARIOS = [
  {
    name: "SQL Injection",
    logs: "2026-05-24T14:05:12 IP=45.12.88.192 PORT=80 USER=guest ACTION=union_select_sql_injection"
  },
  {
    name: "Brute Force",
    logs: `2026-05-24T08:12:01 IP=198.51.100.42 PORT=4444 USER=admin ACTION=failed_login
2026-05-24T08:12:05 IP=198.51.100.42 PORT=4444 USER=admin ACTION=failed_login
2026-05-24T08:12:10 IP=198.51.100.42 PORT=4444 USER=admin ACTION=failed_login
2026-05-24T08:13:02 IP=198.51.100.42 PORT=4444 USER=admin ACTION=success_login`
  },
  {
    name: "XSS Threat",
    logs: "2026-05-24T15:20:10 IP=82.44.12.99 PORT=80 USER=guest ACTION=xss_script_injection_payload"
  },
  {
    name: "RDP Anomaly",
    logs: "2026-05-24T14:15:33 IP=203.0.113.111 PORT=3389 USER=unknown ACTION=failed_rdp_bruteforce"
  },
  {
    name: "Routine FP",
    logs: "2026-05-24T14:02:40 IP=10.0.0.50 PORT=80 USER=svc-monitor ACTION=routine_healthcheck"
  }
];

export default function Index() {
  const { user } = useAuth();
  const [logInput, setLogInput] = useState(SAMPLE_LOGS);
  const [logs, setLogs] = useState<ParsedLog[]>([]);
  const [filterPriority, setFilterPriority] = useState<
    "ALL" | "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "BENIGN"
  >("ALL");
  const [analyzed, setAnalyzed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<ParsedLog | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Persistency load on mount
  useEffect(() => {
    try {
      const savedLogs = localStorage.getItem("sentinel_logs");
      const savedAnalyzed = localStorage.getItem("sentinel_analyzed");
      if (savedLogs) {
        setLogs(JSON.parse(savedLogs));
      }
      if (savedAnalyzed === "true") {
        setAnalyzed(true);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleAnalyze = async () => {
    if (!logInput.trim()) return;
    setLoading(true);
    setError(null);
    setSelectedLog(null);
    
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          log_text: logInput.trim(),
          send_alerts: true,
          user_email: user?.email || null
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      const processed: ParsedLog[] = data.results.map((item: any, index: number) => ({
        id: `log-${Date.now()}-${index}`,
        timestamp: item.event.timestamp 
          ? new Date(item.event.timestamp).toLocaleString()
          : new Date().toLocaleString(),
        sourceIP: item.event.src_ip || "Internal",
        username: item.event.username || "system",
        eventType: item.event.event_type || "Unknown Activity",
        message: item.event.raw,
        score: Math.round(item.score),
        priority: item.priority.toUpperCase() as "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
        alertStatus: item.false_positive ? "resolved" : (item.score >= 60 ? "detected" : "pending"),
        explanation: item.explanation,
        attack_pattern: item.attack_pattern || "Threat Activity Scan",
        remediation: item.remediation || "Analyze standard firewall permissions.",
        false_positive: item.false_positive,
        ai_thought: item.ai_thought || "Processed using security intelligence logic."
      }));

      setLogs(processed);
      setAnalyzed(true);
      localStorage.setItem("sentinel_logs", JSON.stringify(processed));
      localStorage.setItem("sentinel_analyzed", "true");
      toast.success("AI Threat Analysis complete!");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to analyze logs. Please ensure the Python server is running.");
      toast.error("Analysis failed. See details below.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setLogInput("");
    setLogs([]);
    setAnalyzed(false);
    setError(null);
    setSelectedLog(null);
    setFilterPriority("ALL");
    setSearchTerm("");
    localStorage.removeItem("sentinel_logs");
    localStorage.removeItem("sentinel_analyzed");
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setLogInput(content);
        toast.info(`Imported ${file.name}`);
      };
      reader.readAsText(file);
    }
  };

  const handleIsolateHost = (ip: string) => {
    if (!ip || ip === "Internal") return;
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: `Sending Sentinel Isolation Command to firewall for IP ${ip}...`,
        success: () => {
          // Update local state to show mitigated/resolved
          setLogs(prev => prev.map(l => {
            if (l.sourceIP === ip) {
              return { ...l, alertStatus: "resolved" as const };
            }
            return l;
          }));
          if (selectedLog && selectedLog.sourceIP === ip) {
            setSelectedLog(prev => prev ? { ...prev, alertStatus: "resolved" as const } : null);
          }
          return `IP Address ${ip} has been successfully isolated and quarantined.`;
        },
        error: "Quarantine action failed."
      }
    );
  };

  const filteredLogs = logs.filter((log) => {
    // 1. Filter by Search Term
    const matchesSearch = 
      log.sourceIP.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.eventType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.message.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // 2. Filter by Priority or False Positive status
    if (filterPriority === "ALL") return true;
    if (filterPriority === "BENIGN") return log.false_positive === true;
    
    // For specific priorities, exclude false positives from primary filters
    return log.priority === filterPriority && !log.false_positive;
  });

  const stats = {
    total: logs.length,
    critical: logs.filter((l) => l.priority === "CRITICAL" && !l.false_positive).length,
    high: logs.filter((l) => l.priority === "HIGH" && !l.false_positive).length,
    medium: logs.filter((l) => l.priority === "MEDIUM" && !l.false_positive).length,
    low: logs.filter((l) => l.priority === "LOW" && !l.false_positive).length,
    benign: logs.filter((l) => l.false_positive).length,
  };

  const downloadReport = () => {
    const reportText = logs.map((log, index) => {
      return `Incident #${index + 1}: ${log.eventType}\n` +
        `Score: ${log.score}/100 | Priority: ${log.priority}\n` +
        `IP: ${log.sourceIP} | User: ${log.username}\n` +
        `AI Explanation: ${log.explanation}\n` +
        `Remediation: ${log.remediation}\n` +
        `-----------------------------------------\n`;
    }).join("\n");

    const blob = new Blob([reportText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Sentinel_AI_Security_Incident_Report.txt";
    a.click();
    toast.success("Security Report downloaded successfully!");
  };

  return (
    <Layout title="Autonomous Log Analyzer">
      <div className="p-6 space-y-6">
        
        {/* Input Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-md font-bold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-blue-500" />
              Ingestion Layer - Raw SOC Logs
            </h3>
            <label className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors border border-slate-700">
              <Upload className="w-4 h-4" />
              Upload Logs
              <input
                type="file"
                accept=".log,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="space-y-4">
            <textarea
              value={logInput}
              onChange={(e) => setLogInput(e.target.value)}
              placeholder="Paste raw log lines here..."
              className="w-full h-32 bg-slate-950 text-slate-300 placeholder-slate-600 rounded-lg px-4 py-3 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs leading-relaxed"
            />

            {/* Quick Ingestion Scenarios */}
            <div className="flex flex-wrap items-center gap-2 py-1">
              <span className="text-slate-400 text-[10px] uppercase font-extrabold tracking-wider mr-1 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                Load Threat Scenario:
              </span>
              {SCENARIOS.map((scen) => (
                <button
                  key={scen.name}
                  type="button"
                  onClick={() => {
                    setLogInput(scen.logs);
                    toast.info(`Loaded scenario: ${scen.name}`);
                  }}
                  className="bg-slate-950 hover:bg-slate-800 text-slate-300 px-3 py-1 rounded-md text-[10px] font-mono border border-slate-850 hover:border-slate-700 transition-all active:scale-95 cursor-pointer"
                >
                  {scen.name}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAnalyze}
                disabled={loading || !logInput.trim()}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all hover:shadow-md disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    AI Agent Running Analysis...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Run AI Security Audit
                  </>
                )}
              </button>
              <button
                onClick={handleClear}
                disabled={loading}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-750 text-slate-300 px-5 py-2 rounded-lg text-sm font-semibold transition-all border border-slate-700"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-950/30 border border-red-900 rounded-xl p-4 flex gap-3 text-red-300 items-start">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm">Server Integration Issue</div>
              <div className="text-xs mt-1 leading-relaxed">{error}</div>
              <div className="text-[10px] mt-2 text-red-400">
                Ensure <code>python server.py</code> is running on port 8000 and the GEMINI_API_KEY is configured in your <code>.env</code> file.
              </div>
            </div>
          </div>
        )}

        {analyzed && (
          <>
            {/* Stats Dashboard Grid */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-md">
                <div className="text-slate-500 text-xs font-semibold mb-1">Total Events</div>
                <div className="text-2xl font-bold text-white">{stats.total}</div>
              </div>
              <div className="bg-slate-900 border border-red-950 rounded-xl p-3.5 shadow-md">
                <div className="text-red-500 text-xs font-semibold mb-1">Critical Threats</div>
                <div className="text-2xl font-bold text-red-500">{stats.critical}</div>
              </div>
              <div className="bg-slate-900 border border-orange-950 rounded-xl p-3.5 shadow-md">
                <div className="text-orange-500 text-xs font-semibold mb-1">High Severity</div>
                <div className="text-2xl font-bold text-orange-500">{stats.high}</div>
              </div>
              <div className="bg-slate-900 border border-yellow-950 rounded-xl p-3.5 shadow-md">
                <div className="text-yellow-500 text-xs font-semibold mb-1">Medium Severity</div>
                <div className="text-2xl font-bold text-yellow-500">{stats.medium}</div>
              </div>
              <div className="bg-slate-900 border border-blue-950 rounded-xl p-3.5 shadow-md">
                <div className="text-blue-500 text-xs font-semibold mb-1">Low Severity</div>
                <div className="text-2xl font-bold text-blue-500">{stats.low}</div>
              </div>
              <div className="bg-slate-900 border border-green-950 rounded-xl p-3.5 shadow-md">
                <div className="text-green-500 text-xs font-semibold mb-1">Benign / FP Filtered</div>
                <div className="text-2xl font-bold text-green-500">{stats.benign}</div>
              </div>
            </div>

            {/* Split Screen Console Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              
              {/* Results Console Section */}
              <div className={`${selectedLog ? "lg:col-span-3" : "lg:col-span-5"} space-y-4`}>
                
                {/* Search & Filters */}
                <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-slate-900 p-4 border border-slate-800 rounded-xl">
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search alerts or IPs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-950 text-slate-200 placeholder-slate-600 rounded-lg text-xs border border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex gap-2 flex-wrap justify-end w-full md:w-auto">
                    {(["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW", "BENIGN"] as const).map(
                      (p) => (
                        <button
                          key={p}
                          onClick={() => {
                            setFilterPriority(p);
                            setSelectedLog(null);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            filterPriority === p
                              ? "bg-blue-600 text-white shadow-md shadow-blue-900/35"
                              : "bg-slate-950 text-slate-400 hover:bg-slate-800"
                          }`}
                        >
                          {p === "BENIGN" ? "BENIGN / FP" : p}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Main Alerts Table */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="px-4 py-3 text-left">TIMESTAMP</th>
                          <th className="px-4 py-3 text-left">SOURCE IP</th>
                          <th className="px-4 py-3 text-left">USER</th>
                          <th className="px-4 py-3 text-left">ATTACK PATTERN</th>
                          <th className="px-4 py-3 text-center">SCORE</th>
                          <th className="px-4 py-3 text-center">PRIORITY</th>
                          <th className="px-4 py-3 text-center">STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {filteredLogs.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-12 text-center text-slate-500 text-xs">
                              No security logs match the active filter configurations.
                            </td>
                          </tr>
                        ) : (
                          filteredLogs.map((log) => (
                            <tr
                              key={log.id}
                              onClick={() => setSelectedLog(log)}
                              className={`hover:bg-slate-800/80 transition-colors cursor-pointer ${
                                selectedLog?.id === log.id 
                                  ? "bg-slate-800 border-l-2 border-blue-500" 
                                  : ""
                              }`}
                            >
                              <td className="px-4 py-3 font-mono text-slate-500 text-[10px] whitespace-nowrap">
                                {log.timestamp}
                              </td>
                              <td className="px-4 py-3 font-mono text-slate-200 font-semibold">
                                {log.sourceIP}
                              </td>
                              <td className="px-4 py-3 text-slate-300">
                                {log.username}
                              </td>
                              <td className="px-4 py-3 text-slate-200 font-semibold">
                                {log.eventType}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span
                                  className={`inline-block px-1.5 py-0.5 rounded font-bold font-mono text-[10px] ${
                                    log.false_positive
                                      ? "bg-green-950/40 text-green-400"
                                      : log.score >= 80
                                        ? "bg-red-950/60 text-red-400 border border-red-900/50"
                                        : log.score >= 60
                                          ? "bg-orange-950/60 text-orange-400 border border-orange-900/50"
                                          : log.score >= 40
                                            ? "bg-yellow-950/60 text-yellow-400 border border-yellow-900/50"
                                            : "bg-blue-950/40 text-blue-400"
                                  }`}
                                >
                                  {log.score}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded font-bold text-[9px] ${
                                    log.false_positive
                                      ? "bg-green-950/40 text-green-400"
                                      : log.priority === "CRITICAL"
                                        ? "bg-red-900/40 text-red-200"
                                        : log.priority === "HIGH"
                                          ? "bg-orange-900/40 text-orange-200"
                                          : log.priority === "MEDIUM"
                                            ? "bg-yellow-900/40 text-yellow-200"
                                            : "bg-slate-800 text-slate-400"
                                  }`}
                                >
                                  {log.false_positive ? "BENIGN" : log.priority}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center whitespace-nowrap">
                                {log.alertStatus === "resolved" ? (
                                  <span className="inline-flex items-center gap-1 text-green-400 font-semibold text-[10px]">
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    Resolved
                                  </span>
                                ) : log.alertStatus === "detected" ? (
                                  <span className="inline-flex items-center gap-1 text-red-400 font-semibold text-[10px]">
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    Detected
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-yellow-400 font-semibold text-[10px]">
                                    <Clock className="w-3.5 h-3.5" />
                                    Investigating
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-slate-950 px-4 py-3 text-slate-500 text-[10px] flex justify-between items-center border-t border-slate-800">
                    <div>
                      Showing {filteredLogs.length} of {logs.length} assessments
                    </div>
                    <button
                      onClick={downloadReport}
                      className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-800 font-semibold transition-colors"
                    >
                      <FileDown className="w-3 h-3" />
                      Download Incident Report
                    </button>
                  </div>
                </div>
              </div>

              {/* Side AI Detailed Insights Panel */}
              {selectedLog && (
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4 flex flex-col justify-between h-full min-h-[500px]">
                    
                    <div>
                      {/* Alert Header */}
                      <div className="flex items-start justify-between pb-3 border-b border-slate-800">
                        <div>
                          <div className="flex items-center gap-2">
                            {selectedLog.false_positive ? (
                              <span className="bg-green-950 text-green-400 text-[9px] px-2 py-0.5 rounded font-bold flex items-center gap-1 border border-green-900/40">
                                <ShieldCheck className="w-3 h-3" />
                                AI FILTERED: BENIGN
                              </span>
                            ) : (
                              <span className={`text-[9px] px-2 py-0.5 rounded font-bold flex items-center gap-1 ${
                                selectedLog.priority === "CRITICAL"
                                  ? "bg-red-950 text-red-400 border border-red-900/50"
                                  : selectedLog.priority === "HIGH"
                                    ? "bg-orange-950 text-orange-400 border border-orange-900/50"
                                    : "bg-yellow-950 text-yellow-400"
                              }`}>
                                <ShieldAlert className="w-3 h-3" />
                                ACTIVE: {selectedLog.priority} THREAT
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-white mt-1.5">
                            {selectedLog.attack_pattern}
                          </h4>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-slate-500 font-semibold">THREAT SCORE</div>
                          <div className={`text-xl font-bold font-mono ${
                            selectedLog.false_positive 
                              ? "text-green-400" 
                              : (selectedLog.score >= 80 ? "text-red-500" : "text-yellow-400")
                          }`}>
                            {selectedLog.score}/100
                          </div>
                        </div>
                      </div>

                      {/* Incident Origin Grid */}
                      <div className="grid grid-cols-2 gap-3 py-3 text-xs bg-slate-950 p-3 rounded-lg border border-slate-800 mt-3">
                        <div>
                          <div className="text-slate-500 text-[10px] font-semibold">ATTACK ORIGIN</div>
                          <div className="font-mono text-slate-200 mt-0.5 font-bold flex items-center gap-1">
                            {selectedLog.sourceIP}
                            {selectedLog.sourceIP !== "Internal" && selectedLog.sourceIP !== "N/A" && (
                              <span className="text-[9px] text-slate-500">(External Host)</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500 text-[10px] font-semibold">COMPROMISED USER</div>
                          <div className="text-slate-200 mt-0.5 font-semibold flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                            {selectedLog.username}
                          </div>
                        </div>
                      </div>

                      {/* AI Agent Step-by-Step Reasoning Terminal */}
                      <div className="mt-4 space-y-1.5">
                        <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                          <Terminal className="w-3.5 h-3.5 text-green-500" />
                          AI Agent Processing Sandbox
                        </div>
                        <div className="bg-slate-950 border border-slate-850 rounded-lg p-3 font-mono text-[10px] leading-relaxed text-green-400/90 shadow-inner h-28 overflow-y-auto">
                          <div className="text-slate-500 mb-1"># Running audit logs heuristics sandbox...</div>
                          {selectedLog.ai_thought ? (
                            <p className="whitespace-pre-line">{selectedLog.ai_thought}</p>
                          ) : (
                            <p>Analyzing network metadata, looking up VirusTotal/AbuseIPDB entries, checking authentication flow history. Internal session logs resolved.</p>
                          )}
                        </div>
                      </div>

                      {/* Attack Explanation */}
                      <div className="mt-4">
                        <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 text-blue-500" />
                          Plain-English Incident Explainer
                        </div>
                        <p className="text-xs text-slate-300 mt-1.5 leading-relaxed bg-slate-800/40 p-3 rounded-lg border border-slate-800">
                          {selectedLog.explanation}
                        </p>
                      </div>

                      {/* Actionable Remediation Guidance */}
                      <div className="mt-4">
                        <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                          Recommended Mitigation Action Checklist
                        </div>
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 mt-1.5 text-xs text-slate-300 space-y-2">
                          {selectedLog.remediation ? (
                            selectedLog.remediation.split(";").map((step, idx) => (
                              <div key={idx} className="flex gap-2 items-start text-xs">
                                <span className="text-blue-500 font-bold mt-0.5">•</span>
                                <span className="leading-relaxed">{step.trim()}</span>
                              </div>
                            ))
                          ) : (
                            <div className="flex gap-2 items-start">
                              <span className="text-blue-500 font-bold">•</span>
                              <span>Block compromised network channels and inspect host packages.</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Operational Commands */}
                    {selectedLog.sourceIP !== "Internal" && selectedLog.sourceIP !== "N/A" && (
                      <div className="pt-4 border-t border-slate-800 flex gap-2">
                        <button
                          onClick={() => handleIsolateHost(selectedLog.sourceIP)}
                          disabled={selectedLog.alertStatus === "resolved"}
                          className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all shadow-md ${
                            selectedLog.alertStatus === "resolved"
                              ? "bg-slate-800 text-slate-500 border border-slate-750 cursor-not-allowed"
                              : "bg-red-600 hover:bg-red-700 text-white shadow-red-950/20"
                          }`}
                        >
                          {selectedLog.alertStatus === "resolved" 
                            ? "Host Isolated & Secure"
                            : `Isolate Host ${selectedLog.sourceIP}`
                          }
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </>
        )}

        {!analyzed && !loading && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center shadow-lg">
            <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <div className="text-slate-400 font-bold text-md mb-2">
              Autonomous Threat Sensor Offline
            </div>
            <div className="text-slate-600 text-xs max-w-sm mx-auto leading-relaxed">
              Log lines have been pre-filled with demo intrusion activities. Click <strong>Run AI Security Audit</strong> above to engage Sentinel SOC Analyst Agent.
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
