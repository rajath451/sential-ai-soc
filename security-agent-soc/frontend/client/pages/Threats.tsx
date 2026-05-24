import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { ParsedLog, processLogs } from "@/lib/logProcessor";
import { AlertTriangle, Eye, MapPin, Zap, ShieldAlert, ShieldCheck, Play, ArrowRight, RefreshCw, Terminal } from "lucide-react";
import { toast } from "sonner";

const SAMPLE_LOGS = `2026-05-24T08:12:01 IP=198.51.100.42 PORT=4444 USER=admin ACTION=failed_login
2026-05-24T08:12:15 IP=198.51.100.42 PORT=4444 USER=admin ACTION=failed_login
2026-05-24T08:12:31 IP=198.51.100.42 PORT=4444 USER=admin ACTION=failed_login
2026-05-24T08:13:02 IP=198.51.100.42 PORT=4444 USER=admin ACTION=success_login
2026-05-24T14:02:40 IP=10.0.0.50 PORT=80 USER=svc-monitor ACTION=routine_healthcheck
2026-05-24T14:05:12 IP=45.12.88.192 PORT=80 USER=guest ACTION=union_select_sql_injection
2026-05-24T14:10:00 IP=192.168.1.5 PORT=22 USER=sysadmin ACTION=success_login
2026-05-24T14:15:33 IP=203.0.113.111 PORT=3389 USER=unknown ACTION=failed_rdp_bruteforce`;

export default function Threats() {
  const [threats, setThreats] = useState<ParsedLog[]>([]);
  const [selectedThreatIndex, setSelectedThreatIndex] = useState<number>(0);

  useEffect(() => {
    try {
      let parsed: ParsedLog[] = [];
      const savedLogs = localStorage.getItem("sentinel_logs");
      if (savedLogs) {
        parsed = JSON.parse(savedLogs);
      } else {
        parsed = processLogs(SAMPLE_LOGS);
      }
      // Filter only medium/high/critical real threats
      const filtered = parsed.filter(l => l.score >= 40 && !l.false_positive);
      setThreats(filtered.length > 0 ? filtered : parsed);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const activeThreat = threats[selectedThreatIndex];

  const handleIsolateHost = (ip: string) => {
    if (!ip || ip === "Internal" || ip === "N/A") return;
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: `Sending Sentinel Isolation Command to firewall for IP ${ip}...`,
        success: () => {
          // Update local threats state
          setThreats(prev => prev.map((t, idx) => {
            if (t.sourceIP === ip) {
              return { ...t, alertStatus: "resolved" as const };
            }
            return t;
          }));
          
          // Also update full logs in localStorage
          try {
            const savedLogs = localStorage.getItem("sentinel_logs");
            if (savedLogs) {
              const parsed: ParsedLog[] = JSON.parse(savedLogs);
              const updated = parsed.map(l => {
                if (l.sourceIP === ip) {
                  return { ...l, alertStatus: "resolved" as const };
                }
                return l;
              });
              localStorage.setItem("sentinel_logs", JSON.stringify(updated));
            }
          } catch (e) {
            console.error(e);
          }

          return `IP Address ${ip} has been isolated and banned on standard port filters.`;
        },
        error: "Quarantine action failed."
      }
    );
  };

  return (
    <Layout title="Threat Sandbox & Intelligence">
      <div className="p-8 space-y-6">
        
        {/* Dynamic Threat Selector Header */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />
            <div>
              <h3 className="text-sm font-bold text-white">Active Threat Catalog</h3>
              <p className="text-[10px] text-slate-500">Intrusion vectors parsed from local auditing logs.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {threats.length === 0 ? (
              <span className="text-xs text-slate-500 font-semibold italic">No active threats detected. Paste logs in Ingestion first.</span>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-semibold">Active Threat:</span>
                <select
                  value={selectedThreatIndex}
                  onChange={(e) => setSelectedThreatIndex(Number(e.target.value))}
                  className="bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {threats.map((t, idx) => (
                    <option key={idx} value={idx}>
                      {idx + 1}. [{t.priority}] {t.eventType} - {t.sourceIP}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {activeThreat ? (
          <div className="bg-slate-900 border border-slate-855 rounded-xl p-6 shadow-xl space-y-6">
            
            {/* Top Identity Block */}
            <div className="flex flex-col md:flex-row items-start justify-between pb-5 border-b border-slate-800 gap-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  {activeThreat.eventType}
                </h3>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span className={`text-[10px] px-2.5 py-0.5 rounded font-extrabold tracking-wider ${
                    activeThreat.false_positive
                      ? "bg-green-950 text-green-400"
                      : activeThreat.priority === "CRITICAL"
                        ? "bg-red-950 text-red-400 border border-red-900/50"
                        : activeThreat.priority === "HIGH"
                          ? "bg-orange-950 text-orange-400 border border-orange-900/50"
                          : "bg-yellow-950 text-yellow-400"
                  }`}>
                    {activeThreat.false_positive ? "BENIGN / FALSE POSITIVE" : activeThreat.priority}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    SESSION_ID: TRT-{(activeThreat.score * 83).toString().substring(0, 4)}-AI
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    SEEN: {activeThreat.timestamp}
                  </span>
                </div>
              </div>

              {activeThreat.sourceIP !== "Internal" && activeThreat.sourceIP !== "N/A" && (
                <button
                  onClick={() => handleIsolateHost(activeThreat.sourceIP)}
                  disabled={activeThreat.alertStatus === "resolved"}
                  className={`px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-md ${
                    activeThreat.alertStatus === "resolved"
                      ? "bg-slate-950 text-green-400 border border-green-900 cursor-not-allowed flex items-center gap-1.5"
                      : "bg-red-600 hover:bg-red-700 text-white shadow-red-950/20"
                  }`}
                >
                  {activeThreat.alertStatus === "resolved" ? (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      IP isolated & Secured
                    </>
                  ) : (
                    `Quarantine & Isolate Host`
                  )}
                </button>
              )}
            </div>

            {/* Middle Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Threat Profile Card */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-inner">
                <h4 className="font-bold text-sm text-slate-200 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4.5 h-4.5 text-red-500" />
                  Threat Profile Score
                </h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-baseline">
                      <div className="text-2xl font-black text-red-500 font-mono">
                        {activeThreat.score} / 100
                      </div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase">AI Risk index</div>
                    </div>
                    <div className="mt-2.5 w-full bg-slate-900 rounded-full h-3.5 border border-slate-800">
                      <div
                        className={`h-3 rounded-full bg-gradient-to-r ${
                          activeThreat.false_positive
                            ? "from-green-600 to-green-500"
                            : "from-blue-600 via-yellow-500 to-red-600"
                        }`}
                        style={{ width: `${activeThreat.score}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-900 space-y-3">
                    <div>
                      <div className="text-[10px] text-slate-500 font-semibold">ATTACK ORIGIN ADDRESS</div>
                      <div className="font-mono text-sm text-slate-200 font-bold mt-0.5 flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-red-400" />
                        {activeThreat.sourceIP} 
                        {activeThreat.sourceIP !== "Internal" && activeThreat.sourceIP !== "N/A" && (
                          <span className="text-[10px] font-normal text-slate-500">(External ASN Blocked)</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-500 font-semibold">COMPROMISED ASSETS</div>
                      <div className="flex gap-2 mt-1.5 flex-wrap">
                        {["auth-gateway-proxy", "svc-security-broker", "prod-app-db"].map((asset, i) => (
                          <span
                            key={i}
                            className={`text-[9px] px-2 py-0.5 rounded font-mono ${
                              activeThreat.score >= 80 && i === 2
                                ? "bg-red-950 text-red-400 border border-red-900/40"
                                : "bg-slate-900 text-slate-400 border border-slate-800"
                            }`}
                          >
                            {asset}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Attack Pattern Flowchart */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-inner">
                <h4 className="font-bold text-sm text-slate-200 mb-4 flex items-center gap-2">
                  <Zap className="w-4.5 h-4.5 text-yellow-500" />
                  Kill-Chain Stage Correlator
                </h4>
                <div className="space-y-4">
                  {/* Flow Steps */}
                  <div className="flex items-center justify-between text-center gap-1 bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <div className="flex-1">
                      <div className="text-[9px] text-slate-500 font-bold uppercase">STAGE 1</div>
                      <div className="bg-red-950/60 text-red-400 border border-red-900/30 text-[9px] py-1 rounded font-bold mt-1 max-w-[100px] mx-auto truncate">
                        {activeThreat.sourceIP}
                      </div>
                      <div className="text-[9px] text-slate-400 mt-1 font-semibold">Intruder Client</div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-600 flex-shrink-0 mt-3" />

                    <div className="flex-1">
                      <div className="text-[9px] text-slate-500 font-bold uppercase">STAGE 2</div>
                      <div className="bg-yellow-950/60 text-yellow-400 border border-yellow-900/30 text-[9px] py-1 rounded font-bold mt-1 max-w-[100px] mx-auto truncate">
                        AI SOC Ruleset
                      </div>
                      <div className="text-[9px] text-slate-400 mt-1 font-semibold">Security Shield</div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-600 flex-shrink-0 mt-3" />

                    <div className="flex-1">
                      <div className="text-[9px] text-slate-500 font-bold uppercase">STAGE 3</div>
                      <div className={`text-[9px] py-1 rounded font-bold mt-1 max-w-[100px] mx-auto truncate ${
                        activeThreat.false_positive 
                          ? "bg-green-950 text-green-400 border border-green-900/30"
                          : "bg-red-950 text-red-400 border border-red-900/30 animate-pulse"
                      }`}>
                        {activeThreat.false_positive ? "Filtered Benign" : "Compromise Alert"}
                      </div>
                      <div className="text-[9px] text-slate-400 mt-1 font-semibold">Sensor Payload</div>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-500 leading-relaxed text-center italic bg-slate-900/50 p-2.5 rounded border border-slate-900">
                    Real-time traffic pipeline correlation. Anomaly isolation verified over SSL connections.
                  </div>
                </div>
              </div>

            </div>

            {/* AI Core Insight explainer */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-md">
              <h4 className="font-bold text-sm text-slate-200 mb-3 flex items-center gap-1.5">
                <ShieldCheck className="w-4.5 h-4.5 text-blue-500" />
                AI Agent Insights & Explanation
              </h4>
              <div className="space-y-3">
                <p className="text-xs text-slate-300 leading-relaxed">
                  {activeThreat.explanation}
                </p>
                {activeThreat.ai_thought && (
                  <div className="bg-slate-900/70 p-3 rounded-lg border border-slate-800 mt-2">
                    <div className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1">
                      <Terminal className="w-3.5 h-3.5 text-green-500" />
                      Agent Decision Tree Log
                    </div>
                    <p className="text-[10px] font-mono text-green-400 mt-1.5 leading-relaxed whitespace-pre-line">
                      {activeThreat.ai_thought}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Payload Terminal */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-md">
              <h4 className="font-bold text-sm text-slate-200 mb-3">Intruder Log Payload Inspection</h4>
              <div className="bg-slate-900 rounded-lg p-4 font-mono text-[10px] text-slate-300 border border-slate-850 overflow-x-auto leading-relaxed">
                <pre>{activeThreat.message}</pre>
              </div>
            </div>

          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-16 text-center shadow-lg">
            <ShieldCheck className="w-12 h-12 text-slate-750 mx-auto mb-3" />
            <h3 className="text-md font-bold text-slate-400">Intrusion Sensor Baselines Clean</h3>
            <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed mt-1">
              Currently there are no high-priority threat files parsed in local session memory. Run an AI audit on the Overview console to explore security incidents.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
