import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { 
  Bell, Lock, Key, Shield, UserPlus, Trash2, Globe, Link, HelpCircle, 
  AlertCircle, Save, Settings2, Sparkles, Image, Compass, MessageSquare, 
  History, Eye, FileText, CheckCircle2, AlertTriangle, KeyRound, Loader2
} from "lucide-react";
import { toast } from "sonner";

interface ApiKeyItem {
  id: string;
  key: string;
  created: string;
}

interface TeamMember {
  id: string;
  email: string;
  role: string;
  status: "Active" | "Invited";
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState<"workspace" | "members" | "operations" | "security">("workspace");

  // --- PERSISTENT STATE DEFINITIONS ---

  // 1. General Workspace Settings
  const [wsName, setWsName] = useState(() => localStorage.getItem("sentinel_ws_name") || "SENTIAL AI");
  const [wsUrl, setWsUrl] = useState(() => localStorage.getItem("sentinel_ws_url") || "sentialai.slack.com");
  const [wsLang, setWsLang] = useState(() => localStorage.getItem("sentinel_ws_lang") || "English (US)");
  const [approvedDomains, setApprovedDomains] = useState(() => localStorage.getItem("sentinel_ws_domains") || "sentialai.com, sential.ai");
  const [defaultChannels, setDefaultChannels] = useState(() => localStorage.getItem("sentinel_ws_channels") || "#general, #alerts-soc, #all-sential-ai");

  // 2. Display & Profiles Settings
  const [displayNameGuidelines, setDisplayNameGuidelines] = useState(() => 
    localStorage.getItem("sentinel_ws_guidelines") || "Please use 'Firstname Lastname' or 'Handle (Team)' format."
  );
  const [showFullNames, setShowFullNames] = useState(() => localStorage.getItem("sentinel_ws_fullnames") !== "false");
  const [showEmails, setShowEmails] = useState(() => localStorage.getItem("sentinel_ws_show_emails") !== "false");
  const [showPronouns, setShowPronouns] = useState(() => localStorage.getItem("sentinel_ws_show_pronouns") !== "false");

  // 3. Operations & Integrations Toggles
  const [allowGifs, setAllowGifs] = useState(() => localStorage.getItem("sentinel_ws_gifs") !== "false");
  const [promptAltText, setPromptAltText] = useState(() => localStorage.getItem("sentinel_ws_alttext") === "true");
  const [dndEnabled, setDndEnabled] = useState(() => localStorage.getItem("sentinel_ws_dnd_enabled") !== "false");
  const [dndHours, setDndHours] = useState(() => localStorage.getItem("sentinel_ws_dnd_hours") || "22:00 to 08:00");
  const [notifyJoinLeave, setNotifyJoinLeave] = useState(() => localStorage.getItem("sentinel_ws_joinleave") === "true");
  const [notifyNewUsers, setNotifyNewUsers] = useState(() => localStorage.getItem("sentinel_ws_notify_new") !== "false");
  const [thirdPartyCalls, setThirdPartyCalls] = useState(() => localStorage.getItem("sentinel_ws_calls") !== "false");
  const [slackConnectVisible, setSlackConnectVisible] = useState(() => localStorage.getItem("sentinel_ws_connect_visible") || "Full Profile");

  // 4. Canvases & Workflow Blueprint Options
  const [canvasVersionHistory, setCanvasVersionHistory] = useState(() => localStorage.getItem("sentinel_ws_canvas_history") !== "false");
  const [canvasPrinting, setCanvasPrinting] = useState(() => localStorage.getItem("sentinel_ws_canvas_print") !== "false");
  const [canvasSharing, setCanvasSharing] = useState(() => localStorage.getItem("sentinel_ws_canvas_share") !== "false");
  const [canvasUpdateMsgs, setCanvasUpdateMsgs] = useState(() => localStorage.getItem("sentinel_ws_canvas_msgs") !== "false");
  const [listSharing, setListSharing] = useState(() => localStorage.getItem("sentinel_ws_list_share") !== "false");
  const [exportWorkflows, setExportWorkflows] = useState(() => localStorage.getItem("sentinel_ws_export_workflows") !== "false");

  // 5. Data Retention Parameters
  const [dataRetentionDays, setDataRetentionDays] = useState(() => localStorage.getItem("sentinel_ws_data_retention") || "Keep all messages");
  const [fileHistoryDays, setFileHistoryDays] = useState(() => localStorage.getItem("sentinel_ws_file_history") || "Keep all files");
  const [canvasHistoryDays, setCanvasHistoryDays] = useState(() => localStorage.getItem("sentinel_ws_canvas_retention") || "Keep forever");

  // 6. Access Control & API keys
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>(() => {
    const saved = localStorage.getItem("sentinel_ws_apikeys");
    return saved ? JSON.parse(saved) : [
      { id: "key-1", key: "sk_live_83a17df9a0ec521b83d1c...", created: "Created 3 months ago" }
    ];
  });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    const saved = localStorage.getItem("sentinel_ws_team");
    return saved ? JSON.parse(saved) : [
      { id: "mem-1", email: "admin@sential.ai", role: "Admin", status: "Active" },
      { id: "mem-2", email: "analyst@sential.ai", role: "Analyst", status: "Active" },
      { id: "mem-3", email: "viewer@sential.ai", role: "Viewer", status: "Invited" }
    ];
  });

  // 7. Security Workspace Deletion State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  // --- PERSISTENCE STATE EFFECTS ---
  useEffect(() => {
    localStorage.setItem("sentinel_ws_name", wsName);
    localStorage.setItem("sentinel_ws_url", wsUrl);
    localStorage.setItem("sentinel_ws_lang", wsLang);
    localStorage.setItem("sentinel_ws_domains", approvedDomains);
    localStorage.setItem("sentinel_ws_channels", defaultChannels);
    localStorage.setItem("sentinel_ws_guidelines", displayNameGuidelines);
    localStorage.setItem("sentinel_ws_fullnames", String(showFullNames));
    localStorage.setItem("sentinel_ws_show_emails", String(showEmails));
    localStorage.setItem("sentinel_ws_show_pronouns", String(showPronouns));
    localStorage.setItem("sentinel_ws_gifs", String(allowGifs));
    localStorage.setItem("sentinel_ws_alttext", String(promptAltText));
    localStorage.setItem("sentinel_ws_dnd_enabled", String(dndEnabled));
    localStorage.setItem("sentinel_ws_dnd_hours", dndHours);
    localStorage.setItem("sentinel_ws_joinleave", String(notifyJoinLeave));
    localStorage.setItem("sentinel_ws_notify_new", String(notifyNewUsers));
    localStorage.setItem("sentinel_ws_calls", String(thirdPartyCalls));
    localStorage.setItem("sentinel_ws_connect_visible", slackConnectVisible);
    localStorage.setItem("sentinel_ws_canvas_history", String(canvasVersionHistory));
    localStorage.setItem("sentinel_ws_canvas_print", String(canvasPrinting));
    localStorage.setItem("sentinel_ws_canvas_share", String(canvasSharing));
    localStorage.setItem("sentinel_ws_canvas_msgs", String(canvasUpdateMsgs));
    localStorage.setItem("sentinel_ws_list_share", String(listSharing));
    localStorage.setItem("sentinel_ws_export_workflows", String(exportWorkflows));
    localStorage.setItem("sentinel_ws_data_retention", dataRetentionDays);
    localStorage.setItem("sentinel_ws_file_history", fileHistoryDays);
    localStorage.setItem("sentinel_ws_canvas_retention", canvasHistoryDays);
    localStorage.setItem("sentinel_ws_apikeys", JSON.stringify(apiKeys));
    localStorage.setItem("sentinel_ws_team", JSON.stringify(teamMembers));
  }, [
    wsName, wsUrl, wsLang, approvedDomains, defaultChannels, displayNameGuidelines,
    showFullNames, showEmails, showPronouns, allowGifs, promptAltText, dndEnabled, dndHours,
    notifyJoinLeave, notifyNewUsers, thirdPartyCalls, slackConnectVisible, canvasVersionHistory,
    canvasPrinting, canvasSharing, canvasUpdateMsgs, listSharing, exportWorkflows,
    dataRetentionDays, fileHistoryDays, canvasHistoryDays, apiKeys, teamMembers
  ]);

  // --- OPERATIONAL ACTIONS ---
  const handleSaveAll = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1000)),
      {
        loading: "Syncing SENTIAL AI workspace policies...",
        success: () => "All SENTIAL AI workspace configurations successfully updated!",
        error: "Sync error occurred."
      }
    );
  };

  const handleGenerateKey = () => {
    const randPart = Array.from({ length: 16 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join("");
    const newKeyItem: ApiKeyItem = {
      id: `key-${Date.now()}`,
      key: `sk_live_${randPart}...`,
      created: "Created just now"
    };
    setApiKeys(prev => [...prev, newKeyItem]);
    toast.success("New live API key generated successfully!");
  };

  const handleRevokeKey = (id: string) => {
    setApiKeys(prev => prev.filter(k => k.id !== id));
    toast.error("API key has been revoked and invalidated.");
  };

  const handleInviteUser = () => {
    const email = window.prompt("Enter corporate email to invite to SENTIAL AI:");
    if (!email) return;
    if (!email.includes("@") || !email.includes(".")) {
      toast.error("Invalid email address format.");
      return;
    }
    const role = window.prompt("Enter role (Admin, Analyst, Viewer):", "Analyst");
    if (!role) return;
    const normalizedRole = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
    if (!["Admin", "Analyst", "Viewer"].includes(normalizedRole)) {
      toast.error("Supported roles are Admin, Analyst, or Viewer.");
      return;
    }

    const newMember: TeamMember = {
      id: `mem-${Date.now()}`,
      email,
      role: normalizedRole,
      status: "Invited"
    };
    setTeamMembers(prev => [...prev, newMember]);
    toast.success(`Cleared credentials created & invite sent to ${email}`);
  };

  const handleRemoveMember = (id: string, email: string) => {
    if (email === "admin@sential.ai") {
      toast.warning("Primary administrative coordinator cannot be removed.");
      return;
    }
    setTeamMembers(prev => prev.filter(m => m.id !== id));
    toast.info(`clearance credentials revoked for ${email}`);
  };

  const handleDeleteWorkspace = async () => {
    if (deleteConfirmText !== "SENTIAL AI") {
      toast.error("Typing verification mismatch. Action aborted.");
      return;
    }

    setDeleting(true);
    const steps = [
      "Downloading backup secure files...",
      "Stopping background threat scanning engines...",
      "Revoking all machine and agent credentials...",
      "Wiping database entries...",
      "Workspace destroyed!"
    ];

    for (let i = 0; i < steps.length; i++) {
      toast.info(steps[i]);
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    // Reset settings to defaults
    localStorage.clear();
    toast.success("SENTIAL AI has been completely wiped from servers.");
    setShowDeleteModal(false);
    setDeleteConfirmText("");
    setDeleting(false);
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <Layout title="SIEM Workspace Administration">
      <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-5xl">
        
        {/* Workspace Quick Summary Banner */}
        <div className="bg-gradient-to-r from-blue-600/10 via-blue-500/5 to-transparent border border-blue-500/20 rounded-2xl p-6 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-black tracking-wider text-slate-900 dark:text-white uppercase flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-blue-500" />
              SENTIAL AI
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Workspace URL: <a href={`https://${wsUrl}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">{wsUrl}</a>
            </p>
          </div>
          
          <button
            onClick={handleSaveAll}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer shadow-blue-600/20"
          >
            <Save className="w-4 h-4" />
            Save Workspace Preferences
          </button>
        </div>

        {/* Workspace Admin Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto pb-px no-scrollbar flex-nowrap">
          {(["workspace", "members", "operations", "security"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-xs font-bold capitalize transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                activeTab === tab
                  ? "border-blue-500 text-blue-600 dark:text-blue-400 font-black"
                  : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-350"
              }`}
            >
              {tab === "workspace" ? "General settings" : tab === "members" ? "Permissions & Clearance" : tab === "operations" ? "Workspace Operations" : "Data Retention & Hazard"}
            </button>
          ))}
        </div>

        {/* --- TAB CONTENT 1: GENERAL WORKSPACE SETTINGS --- */}
        {activeTab === "workspace" && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Workspace details card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Globe className="w-4.5 h-4.5 text-blue-500" />
                Workspace Metadata
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                {/* WS Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Workspace Name</label>
                  <input
                    type="text"
                    value={wsName}
                    onChange={(e) => setWsName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  />
                </div>

                {/* WS URL */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Workspace URL Address</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={wsUrl}
                      onChange={(e) => setWsUrl(e.target.value)}
                      className="w-full pl-3 pr-24 py-2 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                    />
                    <span className="absolute right-3 top-2 text-[10px] text-slate-450 font-mono font-bold">https://</span>
                  </div>
                </div>

                {/* WS Lang */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Workspace system Language</label>
                  <select
                    value={wsLang}
                    onChange={(e) => setWsLang(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold cursor-pointer"
                  >
                    <option value="English (US)">English (US)</option>
                    <option value="English (UK)">English (UK)</option>
                    <option value="Español">Español</option>
                    <option value="Deutsch">Deutsch</option>
                    <option value="Français">Français</option>
                  </select>
                </div>

                {/* Approved Domain */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Approved email domains to auto-join</label>
                  <input
                    type="text"
                    value={approvedDomains}
                    onChange={(e) => setApprovedDomains(e.target.value)}
                    placeholder="sentialai.com, company.com"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Ingestion & Default channels */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Link className="w-4.5 h-4.5 text-blue-500" />
                Default Ingestion Channels
              </h3>
              <div className="space-y-3 text-xs">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Default Ingress Channels (Auto-Joined)</label>
                  <input
                    type="text"
                    value={defaultChannels}
                    onChange={(e) => setDefaultChannels(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  />
                  <p className="text-[9px] text-slate-400 dark:text-slate-500">Separated by commas. New operators automatically join these telemetry paths.</p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* --- TAB CONTENT 2: PERMISSIONS & MEMBERS CLEARANCE --- */}
        {activeTab === "members" && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Display preferences card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-4.5 h-4.5 text-blue-500" />
                Operator Display & Profile Parameters
              </h3>
              
              <div className="space-y-3 text-xs">
                {/* Guidelines */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Display Name Guidelines</label>
                  <input
                    type="text"
                    value={displayNameGuidelines}
                    onChange={(e) => setDisplayNameGuidelines(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  />
                </div>

                {/* Show Toggles */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  {/* Toggle 1: Full name */}
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-850 rounded-lg">
                    <div>
                      <div className="font-semibold text-[11px]">Display Full Names</div>
                      <div className="text-[9px] text-slate-500 mt-0.5">Show operator full names instead of handle.</div>
                    </div>
                    <button
                      onClick={() => setShowFullNames(prev => !prev)}
                      className={`relative inline-flex h-4.5 w-8 items-center rounded-full transition-colors cursor-pointer ${
                        showFullNames ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-800"
                      }`}
                    >
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        showFullNames ? "translate-x-4" : "translate-x-1"
                      }`} />
                    </button>
                  </div>

                  {/* Toggle 2: Show Email */}
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-850 rounded-lg">
                    <div>
                      <div className="font-semibold text-[11px]">Display Email Address</div>
                      <div className="text-[9px] text-slate-500 mt-0.5">Show emails inside operator cards.</div>
                    </div>
                    <button
                      onClick={() => setShowEmails(prev => !prev)}
                      className={`relative inline-flex h-4.5 w-8 items-center rounded-full transition-colors cursor-pointer ${
                        showEmails ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-800"
                      }`}
                    >
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        showEmails ? "translate-x-4" : "translate-x-1"
                      }`} />
                    </button>
                  </div>

                  {/* Toggle 3: Show Pronouns */}
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-850 rounded-lg">
                    <div>
                      <div className="font-semibold text-[11px]">Display Pronouns</div>
                      <div className="text-[9px] text-slate-500 mt-0.5">Show pronouns (ex: they/them/theirs).</div>
                    </div>
                    <button
                      onClick={() => setShowPronouns(prev => !prev)}
                      className={`relative inline-flex h-4.5 w-8 items-center rounded-full transition-colors cursor-pointer ${
                        showPronouns ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-800"
                      }`}
                    >
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        showPronouns ? "translate-x-4" : "translate-x-1"
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Clearance list card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Lock className="w-4.5 h-4.5 text-blue-500" />
                  Clearance Authorization Register
                </h3>
                <button
                  onClick={handleInviteUser}
                  className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer shadow-md"
                >
                  Invite Teammate
                </button>
              </div>

              <div className="space-y-2 text-xs">
                {teamMembers.map((member) => (
                  <div key={member.id} className="p-4 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-850 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">{member.email}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] text-slate-500 font-bold uppercase">{member.role} role</span>
                        <span className="text-slate-300 dark:text-slate-700 text-[9px]">•</span>
                        <span className={`text-[9px] font-extrabold ${
                          member.status === "Active" ? "text-green-500" : "text-yellow-500"
                        }`}>
                          {member.status === "Active" ? "● Active" : "○ Invited"}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleRemoveMember(member.id, member.email)}
                      disabled={member.email === "admin@sential.ai"}
                      className={`transition-all p-1.5 rounded border cursor-pointer ${
                        member.email === "admin@sential.ai"
                          ? "bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-850 text-slate-400 cursor-not-allowed"
                          : "bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/60 text-red-500 border-red-200 dark:border-red-900/30"
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* --- TAB CONTENT 3: WORKSPACE OPERATIONS --- */}
        {activeTab === "operations" && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Communication & call tools */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Compass className="w-4.5 h-4.5 text-blue-500" />
                Workspace operational features
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Tenor GIF */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-850 rounded-lg">
                  <div>
                    <div className="font-semibold">Attach Giphy/GIF Assets</div>
                    <div className="text-[9px] text-slate-500 mt-0.5">Allow operators to utilize Tenor GIFs inside chat messages.</div>
                  </div>
                  <button
                    onClick={() => setAllowGifs(prev => !prev)}
                    className={`relative inline-flex h-4.5 w-8 items-center rounded-full transition-colors cursor-pointer ${
                      allowGifs ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-800"
                    }`}
                  >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      allowGifs ? "translate-x-4" : "translate-x-1"
                    }`} />
                  </button>
                </div>

                {/* Alt Text Prompt */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-850 rounded-lg">
                  <div>
                    <div className="font-semibold">Prompt Alt Text to Images</div>
                    <div className="text-[9px] text-slate-500 mt-0.5">Prompt operators to add visual summaries to uploaded photos.</div>
                  </div>
                  <button
                    onClick={() => setPromptAltText(prev => !prev)}
                    className={`relative inline-flex h-4.5 w-8 items-center rounded-full transition-colors cursor-pointer ${
                      promptAltText ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-800"
                    }`}
                  >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      promptAltText ? "translate-x-4" : "translate-x-1"
                    }`} />
                  </button>
                </div>

                {/* Slack Connect profiles */}
                <div className="p-4 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-850 rounded-lg flex flex-col justify-between gap-2.5">
                  <div>
                    <div className="font-semibold">Slack Connect Member Profiles</div>
                    <div className="text-[9px] text-slate-500 mt-0.5">Choose visible details when collaborating externally.</div>
                  </div>
                  <select
                    value={slackConnectVisible}
                    onChange={(e) => setSlackConnectVisible(e.target.value)}
                    className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-850 rounded px-2.5 py-1 text-[10px] focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-semibold"
                  >
                    <option value="Full Profile">Full Profile Details</option>
                    <option value="Display Name & Role">Display Name & Role Only</option>
                    <option value="Anonymized">Anonymized Token</option>
                  </select>
                </div>

                {/* DND Schedule */}
                <div className="p-4 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-850 rounded-lg flex flex-col justify-between gap-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">Do Not Disturb Hours</div>
                      <div className="text-[9px] text-slate-500 mt-0.5">Toggle default daily quiet periods.</div>
                    </div>
                    <button
                      onClick={() => setDndEnabled(prev => !prev)}
                      className={`relative inline-flex h-4.5 w-8 items-center rounded-full transition-colors cursor-pointer ${
                        dndEnabled ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-800"
                      }`}
                    >
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        dndEnabled ? "translate-x-4" : "translate-x-1"
                      }`} />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={dndHours}
                    onChange={(e) => setDndHours(e.target.value)}
                    placeholder="22:00 to 08:00"
                    disabled={!dndEnabled}
                    className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-850 rounded px-2.5 py-1 text-[10px] focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed font-semibold"
                  />
                </div>

                {/* Third Party providers */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-850 rounded-lg">
                  <div>
                    <div className="font-semibold">Third-party Call Providers</div>
                    <div className="text-[9px] text-slate-500 mt-0.5">Allow zoom/teams triggers inside channel boards.</div>
                  </div>
                  <button
                    onClick={() => setThirdPartyCalls(prev => !prev)}
                    className={`relative inline-flex h-4.5 w-8 items-center rounded-full transition-colors cursor-pointer ${
                      thirdPartyCalls ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-800"
                    }`}
                  >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      thirdPartyCalls ? "translate-x-4" : "translate-x-1"
                    }`} />
                  </button>
                </div>

                {/* Workflows Export */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-850 rounded-lg">
                  <div>
                    <div className="font-semibold">Export Workflow Blueprints</div>
                    <div className="text-[9px] text-slate-500 mt-0.5">Allow developers to export workflow blueprints as JSON.</div>
                  </div>
                  <button
                    onClick={() => setExportWorkflows(prev => !prev)}
                    className={`relative inline-flex h-4.5 w-8 items-center rounded-full transition-colors cursor-pointer ${
                      exportWorkflows ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-800"
                    }`}
                  >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      exportWorkflows ? "translate-x-4" : "translate-x-1"
                    }`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Canvas parameters */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4.5 h-4.5 text-blue-500" />
                Vigilance Canvases & List Operations
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Canvas Share */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-850 rounded-lg">
                  <div>
                    <div className="font-semibold">Canvas Sharing</div>
                    <div className="text-[9px] text-slate-500 mt-0.5">Allow canvas viewers to re-share items externally.</div>
                  </div>
                  <button
                    onClick={() => setCanvasSharing(prev => !prev)}
                    className={`relative inline-flex h-4.5 w-8 items-center rounded-full transition-colors cursor-pointer ${
                      canvasSharing ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-800"
                    }`}
                  >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      canvasSharing ? "translate-x-4" : "translate-x-1"
                    }`} />
                  </button>
                </div>

                {/* Canvas print */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-850 rounded-lg">
                  <div>
                    <div className="font-semibold">Canvas Printing</div>
                    <div className="text-[9px] text-slate-500 mt-0.5">Allow operators to print canvases to physical/PDF assets.</div>
                  </div>
                  <button
                    onClick={() => setCanvasPrinting(prev => !prev)}
                    className={`relative inline-flex h-4.5 w-8 items-center rounded-full transition-colors cursor-pointer ${
                      canvasPrinting ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-800"
                    }`}
                  >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      canvasPrinting ? "translate-x-4" : "translate-x-1"
                    }`} />
                  </button>
                </div>

                {/* Canvas history */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-850 rounded-lg">
                  <div>
                    <div className="font-semibold">Canvas Version Restore</div>
                    <div className="text-[9px] text-slate-500 mt-0.5">Allow editors to access history and restore prior canvas states.</div>
                  </div>
                  <button
                    onClick={() => setCanvasVersionHistory(prev => !prev)}
                    className={`relative inline-flex h-4.5 w-8 items-center rounded-full transition-colors cursor-pointer ${
                      canvasVersionHistory ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-800"
                    }`}
                  >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      canvasVersionHistory ? "translate-x-4" : "translate-x-1"
                    }`} />
                  </button>
                </div>

                {/* List Sharing */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-850 rounded-lg">
                  <div>
                    <div className="font-semibold">Interactive List Sharing</div>
                    <div className="text-[9px] text-slate-500 mt-0.5">Enable viewers of dynamic lists to easily share them.</div>
                  </div>
                  <button
                    onClick={() => setListSharing(prev => !prev)}
                    className={`relative inline-flex h-4.5 w-8 items-center rounded-full transition-colors cursor-pointer ${
                      listSharing ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-800"
                    }`}
                  >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      listSharing ? "translate-x-4" : "translate-x-1"
                    }`} />
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* --- TAB CONTENT 4: RETENTION & HAZARD WARNINGS --- */}
        {activeTab === "security" && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Retention Policies */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-4.5 h-4.5 text-blue-500" />
                Telemetry Data Retention Policies
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* Message Retention */}
                <div className="p-4 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-850 rounded-lg flex flex-col justify-between gap-2.5">
                  <div>
                    <div className="font-semibold">Message History Retention</div>
                    <div className="text-[9px] text-slate-500 mt-0.5">Auto-wipe chat logs after set thresholds.</div>
                  </div>
                  <select
                    value={dataRetentionDays}
                    onChange={(e) => setDataRetentionDays(e.target.value)}
                    className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-850 rounded px-2.5 py-1 text-[10px] focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-semibold"
                  >
                    <option value="Keep all messages">Keep all messages forever</option>
                    <option value="Delete after 30 days">Delete after 30 days</option>
                    <option value="Delete after 90 days">Delete after 90 days</option>
                    <option value="Delete after 1 year">Delete after 1 year</option>
                  </select>
                </div>

                {/* File Retention */}
                <div className="p-4 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-850 rounded-lg flex flex-col justify-between gap-2.5">
                  <div>
                    <div className="font-semibold">File & Asset History Retention</div>
                    <div className="text-[9px] text-slate-500 mt-0.5">Wipe image/pdf files on timer loops.</div>
                  </div>
                  <select
                    value={fileHistoryDays}
                    onChange={(e) => setFileHistoryDays(e.target.value)}
                    className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-850 rounded px-2.5 py-1 text-[10px] focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-semibold"
                  >
                    <option value="Keep all files">Keep all files forever</option>
                    <option value="Delete after 30 days">Delete after 30 days</option>
                    <option value="Delete after 90 days">Delete after 90 days</option>
                    <option value="Delete after 180 days">Delete after 180 days</option>
                  </select>
                </div>

                {/* Canvas Retention */}
                <div className="p-4 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-850 rounded-lg flex flex-col justify-between gap-2.5">
                  <div>
                    <div className="font-semibold">Canvas & List Retention</div>
                    <div className="text-[9px] text-slate-500 mt-0.5">Wipe collaborative canvases and notes.</div>
                  </div>
                  <select
                    value={canvasHistoryDays}
                    onChange={(e) => setCanvasHistoryDays(e.target.value)}
                    className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-850 rounded px-2.5 py-1 text-[10px] focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-semibold"
                  >
                    <option value="Keep forever">Keep forever</option>
                    <option value="Delete after 60 days">Delete after 60 days</option>
                    <option value="Delete after 1 year">Delete after 1 year</option>
                  </select>
                </div>
              </div>
            </div>

            {/* API Keys Subpanel */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <KeyRound className="w-4.5 h-4.5 text-blue-500" />
                  Operator API Integration Tokens
                </h3>
                <button
                  onClick={handleGenerateKey}
                  className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer shadow-md"
                >
                  Generate Token
                </button>
              </div>

              <div className="space-y-2 text-xs">
                {apiKeys.length === 0 ? (
                  <div className="text-center py-6 text-slate-650 italic bg-slate-50 dark:bg-slate-950/50 rounded-lg border border-slate-200 dark:border-slate-850">
                    No active developer API tokens generated.
                  </div>
                ) : (
                  apiKeys.map((k) => (
                    <div key={k.id} className="p-4 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-850 rounded-lg flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="font-mono text-slate-800 dark:text-slate-300 font-bold select-all">{k.key}</div>
                        <div className="text-[9px] text-slate-450 font-bold">{k.created}</div>
                      </div>
                      <button
                        onClick={() => handleRevokeKey(k.id)}
                        className="text-red-500 hover:text-red-400 p-1.5 bg-red-50 dark:bg-red-950/30 rounded border border-red-200 dark:border-red-900/30 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* WIPE & HAZARD WIDGET */}
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <h4 className="font-black text-red-500 uppercase tracking-wide">Danger Zone - Delete Workspace</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Deleting the SENTIAL AI Slack workspace cannot be undone. All threat history logs, SMTP alerting logs, incident reports, canvases, lists, and authorized operator credentials will be permanently erased.
                  </p>
                </div>
              </div>
              <div className="pt-2 border-t border-red-500/10">
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg text-[10px] font-black tracking-wide uppercase transition-all shadow-md active:scale-95 cursor-pointer shadow-red-600/10"
                >
                  Delete Workspace
                </button>
              </div>
            </div>

          </div>
        )}

        {/* --- DANGER ZONE VERIFICATION MODAL --- */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex justify-center items-center p-4 z-50">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-scaleUp">
              
              <div className="flex items-start gap-3 text-xs">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/40 text-red-500 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-black text-slate-900 dark:text-white text-sm uppercase">Confirm Workspace Destruction</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    This will permanently destroy the SENTIAL AI workspace, wiping all records from the host node. Please type <strong className="text-red-500 select-all">SENTIAL AI</strong> below to authorize the protocol.
                  </p>
                </div>
              </div>

              {deleting ? (
                <div className="flex flex-col justify-center items-center py-6 space-y-3 font-mono text-xs text-red-500">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="font-extrabold uppercase animate-pulse">Running Wipe Script</span>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Type SENTIAL AI to confirm"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-bold font-mono text-center placeholder-slate-400 dark:placeholder-slate-700"
                  />
                  
                  <div className="flex gap-2">
                    <button
                      onClick={handleDeleteWorkspace}
                      disabled={deleteConfirmText !== "SENTIAL AI"}
                      className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-slate-100 dark:disabled:bg-slate-950 text-white disabled:text-slate-400 dark:disabled:text-slate-700 font-black py-2.5 rounded-lg uppercase text-[10px] tracking-wider transition-all disabled:cursor-not-allowed shadow-md cursor-pointer"
                    >
                      I understand, wipe all data
                    </button>
                    <button
                      onClick={() => {
                        setShowDeleteModal(false);
                        setDeleteConfirmText("");
                      }}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 font-bold rounded-lg uppercase text-[10px] tracking-wider transition-colors cursor-pointer border border-slate-200/50 dark:border-slate-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
