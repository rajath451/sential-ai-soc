import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { ParsedLog, processLogs } from "@/lib/logProcessor";
import { TrendingUp, BarChart3, PieChart as PieChartIcon, ShieldAlert, Activity, User } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";

const COLORS = ["#ef4444", "#f97316", "#3b82f6", "#eab308", "#a855f7", "#06b6d4"];

const SAMPLE_LOGS = `2026-05-24T08:12:01 IP=198.51.100.42 PORT=4444 USER=admin ACTION=failed_login
2026-05-24T08:12:15 IP=198.51.100.42 PORT=4444 USER=admin ACTION=failed_login
2026-05-24T08:12:31 IP=198.51.100.42 PORT=4444 USER=admin ACTION=failed_login
2026-05-24T08:13:02 IP=198.51.100.42 PORT=4444 USER=admin ACTION=success_login
2026-05-24T14:02:40 IP=10.0.0.50 PORT=80 USER=svc-monitor ACTION=routine_healthcheck
2026-05-24T14:05:12 IP=45.12.88.192 PORT=80 USER=guest ACTION=union_select_sql_injection
2026-05-24T14:10:00 IP=192.168.1.5 PORT=22 USER=sysadmin ACTION=success_login
2026-05-24T14:15:33 IP=203.0.113.111 PORT=3389 USER=unknown ACTION=failed_rdp_bruteforce`;

interface AggregatedThreat {
  type: string;
  count: number;
  pct: number;
}

interface ActorProfile {
  ip: string;
  count: number;
  maxScore: number;
  priority: string;
}

export default function Analytics() {
  const [logs, setLogs] = useState<ParsedLog[]>([]);

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

  // Compute Dynamic Metrics
  const totalLogs = logs.length;
  const activeThreatsCount = logs.filter(l => !l.false_positive && l.score >= 40).length;
  const falsePositivesCount = logs.filter(l => l.false_positive).length;
  const criticalCount = logs.filter(l => l.priority === "CRITICAL" && !l.false_positive).length;

  const fpRate = totalLogs > 0 ? ((falsePositivesCount / totalLogs) * 100).toFixed(1) : "0.0";
  const detectionAccuracy = totalLogs > 0 ? (100 - (falsePositivesCount / totalLogs) * 10).toFixed(1) : "99.8";

  // Compute Threat Distribution dynamically
  const threatTypesMap: Record<string, number> = {};
  logs.forEach(l => {
    if (!l.false_positive) {
      const category = l.attack_pattern || l.eventType || "Unknown Intrusion";
      threatTypesMap[category] = (threatTypesMap[category] || 0) + 1;
    }
  });

  const threatDistribution: AggregatedThreat[] = Object.entries(threatTypesMap).map(([type, count]) => {
    const totalThreats = activeThreatsCount || 1;
    return {
      type,
      count,
      pct: Math.round((count / totalThreats) * 100)
    };
  }).sort((a, b) => b.count - a.count);

  // Compute Top Threat Actors dynamically
  const actorsMap: Record<string, { count: number; maxScore: number; priority: string }> = {};
  logs.forEach(l => {
    if (l.sourceIP && l.sourceIP !== "Internal" && l.sourceIP !== "N/A") {
      const current = actorsMap[l.sourceIP] || { count: 0, maxScore: 0, priority: "LOW" };
      actorsMap[l.sourceIP] = {
        count: current.count + 1,
        maxScore: Math.max(current.maxScore, l.score),
        priority: l.score >= 80 ? "CRITICAL" : (l.score >= 60 ? "HIGH" : "MEDIUM")
      };
    }
  });

  const topActors: ActorProfile[] = Object.entries(actorsMap).map(([ip, data]) => ({
    ip,
    ...data
  })).sort((a, b) => b.maxScore - a.maxScore).slice(0, 5);

  const priorityData = [
    { name: "Critical", value: logs.filter(l => l.priority?.toUpperCase() === "CRITICAL" && !l.false_positive).length, color: "#ef4444" },
    { name: "High", value: logs.filter(l => l.priority?.toUpperCase() === "HIGH" && !l.false_positive).length, color: "#f97316" },
    { name: "Medium", value: logs.filter(l => l.priority?.toUpperCase() === "MEDIUM" && !l.false_positive).length, color: "#eab308" },
    { name: "Low", value: logs.filter(l => l.priority?.toUpperCase() === "LOW" && !l.false_positive).length, color: "#3b82f6" },
    { name: "Benign/FP", value: logs.filter(l => l.false_positive).length, color: "#22c55e" }
  ];

  return (
    <Layout title="AI threat Intelligence Analytics">
      <div className="p-4 sm:p-6 md:p-8 space-y-6">
        
        {/* Analytics Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-500 text-xs font-semibold">Total Security Audits</span>
              <BarChart3 className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-3xl font-black text-white">{totalLogs}</div>
            <div className="text-xs text-slate-400 mt-2">Parsed events processed in local sandbox</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-500 text-xs font-semibold">Active Threats Isolated</span>
              <Activity className="w-5 h-5 text-red-500" />
            </div>
            <div className="text-3xl font-black text-red-500">{activeThreatsCount}</div>
            <div className="text-xs text-slate-400 mt-2">
              Critical priority threats quarantined: <strong className="text-red-400">{criticalCount}</strong>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-500 text-xs font-semibold">False Positive Filter Rate</span>
              <PieChartIcon className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-3xl font-black text-green-500">{fpRate}%</div>
            <div className="text-xs text-slate-400 mt-2">
              Routine alerts filtered from SOC pipeline: <strong className="text-green-400">{falsePositivesCount}</strong>
            </div>
          </div>
        </div>

        {/* Charts & Distributions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Dynamic Vulnerability Distribution Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white">Vulnerability Vector Distribution</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Top threat categories parsed by AI agent classifiers.</p>
            </div>
            
            <div className="h-64 pt-2">
              {threatDistribution.length === 0 ? (
                <div className="text-center py-20 text-slate-500 text-xs italic font-semibold">
                  No active threat vectors classified. Paste logs in Ingestion panel.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={threatDistribution}
                      cx="50%"
                      cy="48%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="count"
                      nameKey="type"
                    >
                      {threatDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", color: "#f8fafc", fontSize: 10 }}
                      itemStyle={{ color: "#94a3b8" }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => <span className="text-[10px] text-slate-350">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Top Threat Actors List */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white">Top External Intruder Targets</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Highest threat level actors tracked in the audit session.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="border-b border-slate-800 text-slate-500 font-bold uppercase text-[9px] tracking-wider">
                  <tr>
                    <th className="px-4 py-2 text-left">ACTOR HOST IP</th>
                    <th className="px-4 py-2 text-center">EVENTS</th>
                    <th className="px-4 py-2 text-center">MAX RISK SCORE</th>
                    <th className="px-4 py-2 text-center">THREAT CLASSIFICATION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {topActors.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-slate-500 text-xs italic">
                        No external threat hosts found.
                      </td>
                    </tr>
                  ) : (
                    topActors.map((actor, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-mono text-slate-200 font-bold flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {actor.ip}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-355 font-bold">{actor.count}</td>
                        <td className="px-4 py-3 text-center text-red-400 font-mono font-extrabold">{actor.maxScore}/100</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                            actor.maxScore >= 80
                              ? "bg-red-950 text-red-400 border border-red-900/30"
                              : "bg-orange-950 text-orange-400"
                          }`}>
                            {actor.priority}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Threat Severity Breakdown Bar Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white">Incident Severity Vector Matrix</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Real-time threat level aggregation across the current security session.</p>
          </div>
          <div className="h-72">
            {totalLogs === 0 ? (
              <div className="text-center py-20 text-slate-500 text-xs italic font-semibold">
                No telemetry data available. Load scenario logs on the Overview screen.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", color: "#f8fafc", fontSize: 10 }}
                    cursor={{ fill: "#1e293b", opacity: 0.15 }}
                  />
                  <Bar dataKey="value" name="Threat Events count" radius={[4, 4, 0, 0]}>
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>
    </Layout>
  );
}
