"use client";

import { io, Socket } from "socket.io-client";
import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

import Header from "../../components/Header";
import Footer from "../../components/Footer";

/* -------------------------
   Types
------------------------- */
type RoleType = "developer" | "client" | "admin" | "superadmin";

interface UserType {
  _id?: string;
  id?: string;
  userId?: string;
  developerId?: string;
  name?: string;
  email?: string;
  role?: RoleType;
  technologies?: string[];
  experience?: number;
  charges?: number;
  photo?: string | null;
  developerType?: string;
}

type MaybeUserRef = string | { _id?: any; id?: any; name?: string; email?: string; role?: string } | null;

interface RequirementType {
  _id: string;
  title: string;
  description?: string;
  charges?: number;
  deadline?: string | null;
  status?: "pending" | "accepted" | "rejected";
  client?: MaybeUserRef;
  developer?: MaybeUserRef | null;
  createdAt?: string;
  updatedAt?: string;
}

interface ProjectType {
  _id: any;
  title: string;
  client?: MaybeUserRef;
  developer?: MaybeUserRef | null;
  requirements?: RequirementType[] | string[]; // sometimes IDs only
  status?: string;
  deadline?: string | null;
}

interface HireRequestType {
  _id: string;
  clientEmail?: string;
  developerEmail?: string;
  projectTitle?: string;
  status?: string;
}

interface NotificationType {
  _id: string;
  userEmail?: string;
  message?: string;
  read?: boolean;
  createdAt?: string;
}

/* -------------------------
   API URL
   Keep localhost allowed — socket uses same-origin when possible
------------------------- */
const API_URL = process.env.NEXT_PUBLIC_API_URL;

/* -------------------------
   fetchWithAuth (COOKIE ONLY)
   - Uses credentials: 'include'
   - Does NOT set Authorization header
------------------------- */
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const opts: RequestInit = {
    credentials: "include",
    ...options,
    headers: {
      ...(options.headers ? (options.headers as Record<string, string>) : {}),
    },
  };

  // if body and not FormData, set json content-type
  if (opts.body && !(opts.body instanceof FormData)) {
    (opts.headers as Record<string, string>)["Content-Type"] =
      (opts.headers as Record<string, string>)["Content-Type"] || "application/json";
  }

  const res = await fetch(url, opts);
  if (!res.ok) {
    let text = "";
    try {
      text = await res.text();
    } catch {}
    throw new Error(text || `Fetch failed: ${res.status} ${res.statusText}`);
  }
  try {
    return await res.json();
  } catch {
    return {};
  }
};

/* -------------------------
   Robust ID helpers
------------------------- */
const extractId = (maybeId: any): string | undefined => {
  if (!maybeId && maybeId !== 0) return undefined;
  if (typeof maybeId === "string") return maybeId;
  if (typeof maybeId === "number") return String(maybeId);

  if (typeof maybeId === "object") {
    if (typeof maybeId.id === "string") return maybeId.id;
    if (typeof maybeId._id === "string") return maybeId._id;
    if (maybeId._id?.$oid && typeof maybeId._id.$oid === "string") return maybeId._id.$oid;
    if (maybeId.$oid && typeof maybeId.$oid === "string") return maybeId.$oid;
    try {
      const s = String(maybeId);
      if (s && !s.includes("[object")) return s;
    } catch {}
  }
  return undefined;
};

const getRefId = (ref?: MaybeUserRef | null): string | undefined => extractId(ref);

const getRefName = (ref?: MaybeUserRef | null): string | undefined => {
  if (!ref) return undefined;
  if (typeof ref === "string") return undefined;
  return (ref as any).name;
};

const getRefEmail = (ref?: MaybeUserRef | null): string | undefined => {
  if (!ref) return undefined;
  if (typeof ref === "string") return undefined;
  return (ref as any).email;
};

const getCurrentUserIdFrom = (user: UserType | null | undefined): string | undefined => {
  if (!user) return undefined;
  if (typeof user.id === "string" && user.id) return user.id;
  if (typeof user._id === "string" && user._id) return user._id;
  return extractId(user);
};

/* -------------------------
   Dashboard component
------------------------- */
export default function Dashboard() {
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);
  const mountedRef = useRef(true);

  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  const [projects, setProjects] = useState<ProjectType[]>([]);
  const [requirements, setRequirements] = useState<RequirementType[]>([]);
  const [hireRequests, setHireRequests] = useState<HireRequestType[]>([]);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [activeTab, setActiveTab] = useState<"projects" | "requirements" | "hires" | "notifications">("projects");

  // filters (admin)
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "accepted" | "rejected">("all");
  const [filterUser, setFilterUser] = useState<string>(""); // search by client/developer email or name

  // delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState<RequirementType | null>(null);

  /* -------------------------
     loadDashboard
     - cookie-based verify via /api/auth/me
  ------------------------- */
  const loadDashboard = useCallback(async () => {
    try {
      if (!mountedRef.current) return;
      setLoading(true);

      // verify user via cookie
      let verifyRaw: any = null;
      try {
        verifyRaw = await fetchWithAuth(`${API_URL}/api/auth/me`);
      } catch (err) {
        // treat as unauthenticated
        verifyRaw = null;
      }

      const verifyUser: UserType | null =
        verifyRaw?.user ?? (verifyRaw && (verifyRaw.id || verifyRaw._id) ? verifyRaw : null);

      if (!verifyUser) {
        // unauthenticated -> redirect to login
        if (mountedRef.current) {
          setUser(null);
          router.replace("/login");
        }
        return;
      }

      // set user
      setUser(verifyUser);

      const role = (verifyUser.role || "client") as RoleType;

      // Prepare parallel requests (defensive)
      const reqPromise =
        role === "admin" || role === "superadmin"
          ? fetchWithAuth(`${API_URL}/api/requirements/all`).catch(() => fetchWithAuth(`${API_URL}/api/requirements`))
          : fetchWithAuth(`${API_URL}/api/requirements`);

      const projectPromise = fetchWithAuth(`${API_URL}/api/projects`);
      const notifPromise =
        role === "admin" || role === "superadmin"
          ? fetchWithAuth(`${API_URL}/api/notifications/all`).catch(() => fetchWithAuth(`${API_URL}/api/notifications`))
          : fetchWithAuth(`${API_URL}/api/notifications`);
      const hirePromise =
        role === "client" || role === "developer"
          ? fetchWithAuth(`${API_URL}/api/hire?${role}Email=${encodeURIComponent(verifyUser.email || "")}`)
          : fetchWithAuth(`${API_URL}/api/hire`);

      const [reqData, projectData, notifData, hireData] = await Promise.all([reqPromise, projectPromise, notifPromise, hirePromise]);

      // Defensive parsing
      const reqs: RequirementType[] = Array.isArray(reqData?.requirements)
        ? reqData.requirements
        : Array.isArray(reqData)
        ? reqData
        : reqData?.data ?? [];

      const projs: ProjectType[] = Array.isArray(projectData?.projects)
        ? projectData.projects
        : Array.isArray(projectData)
        ? projectData
        : projectData?.data ?? [];

      const notifs: NotificationType[] = Array.isArray(notifData?.notifications)
        ? notifData.notifications
        : Array.isArray(notifData)
        ? notifData
        : notifData?.data ?? [];

      const hires: HireRequestType[] = Array.isArray(hireData?.requests)
        ? hireData.requests
        : Array.isArray(hireData)
        ? hireData
        : hireData?.data ?? [];

      // Role-based filtering for requirements
      let filteredReqs = Array.isArray(reqs) ? reqs : [];
      if (role === "client" || role === "developer") {
        filteredReqs = filteredReqs.filter((r) => r && r._id && r.status !== "accepted");
      }

      if (mountedRef.current) {
        setRequirements(filteredReqs.filter((r) => r && r._id));
        setProjects(projs || []);
        setNotifications(notifs || []);
        setHireRequests(hires || []);
      }
    } catch (err) {
      console.error("Dashboard load error:", err);
      try {
        const msg = (err as Error).message?.toLowerCase() || "";
        if (msg.includes("401") || msg.includes("unauthorized") || msg.includes("no valid token")) {
          if (mountedRef.current) router.replace("/login");
        } else {
          toast.error("Failed to load some dashboard data (see console).");
        }
      } catch {}
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  /* -------------------------
     Init + socket
     - socket is cookie-authenticated (no token header)
     - tries to reuse singleton on window to avoid duplicate sockets
  ------------------------- */
  useEffect(() => {
    mountedRef.current = true;

    const init = async () => {
      try {
        // optimistic: try to read user quickly from header (header component may fill)
        // but do NOT rely on localStorage for auth; call server
        await loadDashboard();

        // Only connect socket if authenticated user exists
        if (!mountedRef.current) return;
        if (!user) return;

        // Create or reuse singleton socket on window (same-origin preferred)
        if (!(window as any).__cc_socket) {
          (window as any).__cc_socket = io("/", {
            path: "/socket.io/",
            withCredentials: true, // allow cookie auth
            transports: ["websocket"],
            autoConnect: true,
          });
        }

        socketRef.current = (window as any).__cc_socket as Socket;
        const socket = socketRef.current;

        socket.on("connect", () => {
          console.log("✅ Socket connected", socket.id);
        });

        // Requirement events
        socket.on("requirement:posted", (newReq: RequirementType) => {
          setRequirements((prev) => [newReq, ...prev]);
        });

        socket.on("requirement:updated", (updatedReq: RequirementType) => {
          setRequirements((prev) => prev.map((r) => (r._id === updatedReq._id ? updatedReq : r)));
          if (updatedReq.status === "accepted") {
            // refresh to pick up project assignment
            loadDashboard();
          }
        });

        socket.on("requirement:deleted", (idOrObj: any) => {
          const id = typeof idOrObj === "string" ? idOrObj : extractId(idOrObj) || (idOrObj?._id as string);
          if (id) setRequirements((prev) => prev.filter((r) => r._id !== id));
        });

        // Project events
        socket.on("project:new", (proj: ProjectType) => {
          toast.success(`🆕 New project: ${proj.title}`);
          setProjects((prev) => [proj, ...prev]);
        });

        socket.on("project:update", (proj: ProjectType) => {
          toast.success(`📁 Project updated: ${proj.title}`);
          setProjects((prev) => prev.map((p) => (extractId(p._id) === extractId(proj._id) ? proj : p)));
        });

        socket.on("project:deleted", (payload: any) => {
          const id = typeof payload === "string" ? payload : extractId(payload?.id) || extractId(payload?._id);
          if (id) {
            toast.error(`Project deleted${payload?.title ? `: ${payload.title}` : ""}`);
            setProjects((prev) => prev.filter((p) => extractId(p._id) !== id));
          }
        });

        // Notifications
        socket.on("notification:new", (notif: NotificationType) => {
          toast(`${notif.message}`, { icon: "🔔" });
          setNotifications((prev) => [notif, ...prev]);
        });

        socket.on("notification:deleted", ({ id }: { id: string }) => {
          setNotifications((prev) => prev.filter((n) => n._id !== id));
        });

        socket.on("admin:notification", (notif: NotificationType) => {
          toast(`${notif.message}`);
          setNotifications((prev) => [notif, ...prev]);
        });

        socket.on("connect_error", (err: any) => {
          console.error("⚠️ Socket connection error:", err?.message || err);
          const msg = (err?.message || "").toLowerCase();
          if (msg.includes("unauthorized") || msg.includes("no token") || msg.includes("invalid")) {
            toast.error("Session expired. Please log in again.");
            if (mountedRef.current) router.replace("/login");
          }
        });
      } catch (err) {
        console.error("❌ Init failed:", err);
        if (mountedRef.current) router.replace("/login");
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };

    init();

    return () => {
      mountedRef.current = false;
      // do NOT forcibly disconnect a global singleton socket here; only clean listeners we created
      if (socketRef.current) {
        try {
          socketRef.current.removeAllListeners();
        } catch {}
        socketRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadDashboard, router]);

  /* -------------------------
     Helper: client-side filters for requirements
  ------------------------- */
  const getFilteredRequirements = useCallback(() => {
    const safe = (requirements || []).filter((r) => r && r._id);
    return safe.filter((r) => {
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      if (!filterUser) return true;
      const q = filterUser.toLowerCase();
      const clientName = (getRefName(r.client) || "").toLowerCase();
      const clientEmail = (getRefEmail(r.client) || "").toLowerCase();
      const devName = (getRefName(r.developer) || "").toLowerCase();
      const devEmail = (getRefEmail(r.developer) || "").toLowerCase();
      return clientName.includes(q) || clientEmail.includes(q) || devName.includes(q) || devEmail.includes(q);
    });
  }, [requirements, filterStatus, filterUser]);

  /* -------------------------
     Delete requirement (client)
  ------------------------- */
  const handleDelete = async () => {
    if (!selectedRequirement) return;
    try {
      await fetchWithAuth(`${API_URL}/api/requirements/${selectedRequirement._id}`, {
        method: "DELETE",
      });
      toast.success("Requirement deleted");
      setRequirements((prev) => prev.filter((r) => r._id !== selectedRequirement._id));
    } catch (err) {
      console.error(err);
      toast.error("Error deleting requirement");
    } finally {
      setShowDeleteModal(false);
      setSelectedRequirement(null);
    }
  };

  /* -------------------------
     Logout
     - cookie logout endpoint
  ------------------------- */
  const logout = async () => {
    try {
      await fetchWithAuth(`${API_URL}/api/auth/logout`, { method: "POST" });
    } catch {}
    // No local token to clear; simply go to login
    router.replace("/login");
    toast.success("Logged out");
  };

  /* -------------------------
     UI helpers
  ------------------------- */
  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const getFormattedDate = () =>
    new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  const currentUserId = useMemo(() => getCurrentUserIdFrom(user), [user]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!user) return <div className="p-6">Please login</div>;

  const filteredRequirements = getFilteredRequirements();

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 mt-20 p-6">
        {/* Header */}
        <div className="flex justify-between items-start md:items-center mb-8 flex-col md:flex-row">
         <div>
  <h1 className="text-3xl font-extrabold bg-gradient-to-r from-emerald-500 to-blue-600 bg-clip-text text-transparent">
    {getGreeting()}, {user?.name?.split(" ")[0] || ""}!
  </h1>
  <p className="text-gray-500 dark:text-gray-400">{getFormattedDate()}</p>
</div>


          <div className="flex gap-3 mt-4 md:mt-0">
            {(user?.role === "developer" || user?.role === "client") && (
              <button
                onClick={() => router.push("/my-projects")}
                className="px-4 py-2 bg-emerald-500 text-black rounded font-medium hover:bg-emerald-400"
              >
                My Projects
              </button>
            )}

            {(user?.role === "admin" || user?.role === "superadmin") && (
              <button
                onClick={() => router.push("/admin")}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-black rounded font-semibold hover:scale-105 transition-transform"
              >
                🛠 Access Admin Panel
              </button>
            )}

            <Link href="/profile" className="px-4 py-2 bg-emerald-500 text-black rounded font-medium hover:bg-emerald-400">
              View Profile
            </Link>

            <button
              onClick={logout}
              className="px-4 py-2 border border-gray-400 rounded text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-3 mb-6">
          {["projects", "requirements", "hires", "notifications"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded font-medium ${activeTab === tab ? "bg-emerald-500 text-black" : "bg-gray-700 text-white hover:bg-gray-600"}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Projects */}
        {activeTab === "projects" && (
          <>
            {(() => {
              const activeProjects = (projects || []).filter((p) => {
                if (user.role === "admin" || user.role === "superadmin") {
                  return p.status !== "completed";
                }
                const projectDevId = getRefId(p.developer);
                return (
                  p.status !== "completed" &&
                  currentUserId &&
                  projectDevId &&
                  String(projectDevId) === String(currentUserId)
                );
              });

              if (activeProjects.length === 0) {
                return <p className="text-gray-400 italic">No active projects</p>;
              }

              return activeProjects.map((p) => {
                const safeReqs: RequirementType[] =
                  (p.requirements || [])
                    .filter(Boolean)
                    .map((r: any) => (typeof r === "string" ? { _id: r, title: "Requirement", description: "" } : r)) || [];

                const clientName = getRefName(p.client) || getRefEmail(p.client) || "Unknown";
                const clientEmail = getRefEmail(p.client) || "";

                const projectDevId = getRefId(p.developer);
                const mine = currentUserId && projectDevId && String(projectDevId) === String(currentUserId);

                return (
                  <div key={extractId(p._id) || p._id} className="p-5 mb-5 border border-gray-700 rounded-xl bg-gray-900 hover:border-emerald-500/50 transition-all shadow-lg">
                    <div className="flex flex-col sm:flex-row justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-emerald-400">{p.title}</h3>
                        <p className="text-sm text-gray-400 mt-1">
                          Client: <span className="font-medium text-white">{clientName}</span> {clientEmail ? `(${clientEmail})` : ""}
                        </p>
                        <p className="text-sm text-gray-400">
                          Deadline:{" "}
                          {p.deadline
                            ? new Date(p.deadline).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })
                            : "Not specified"}
                        </p>
                      </div>

                      <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide mt-3 sm:mt-0 ${
                        p.status === "in-progress" ? "bg-yellow-400/20 text-yellow-300 border border-yellow-400/40" :
                        p.status === "completed" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40" :
                        "bg-red-500/20 text-red-300 border border-red-400/40"
                      }`}>
                        {p.status}
                      </span>
                    </div>

                    {safeReqs.length > 0 && (
                      <div className="mt-4 bg-gray-800/70 border border-gray-700 p-4 rounded-lg">
                        <h4 className="text-sm font-semibold mb-2 text-gray-300">Requirement Details:</h4>
                        {safeReqs.map((r) => (
                          <div key={r._id} className="text-sm text-gray-400 space-y-1 mb-3">
                            <p><strong className="text-gray-300">Title:</strong> {r.title}</p>
                            <p><strong className="text-gray-300">Description:</strong> {r.description}</p>
                            <p><strong className="text-gray-300">Charges:</strong> ₹{r.charges ?? 0}</p>
                            <p><strong className="text-gray-300">Status:</strong> <span className={`px-2 py-1 rounded text-xs ${r.status === "pending" ? "bg-yellow-400 text-black" : r.status === "accepted" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>{r.status}</span></p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3 mt-5">
                      <button onClick={() => {
                        const id = extractId(p._id) || p._id?.toString();
                        if (!id) {
                          toast.error("Invalid project ID");
                          return;
                        }
                        router.push(`/my-projects/${id}`);
                      }} className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black rounded-md text-sm font-semibold">View Project</button>

                      {mine && p.status !== "completed" && (
                        <button onClick={async () => {
                          try {
                            const projId = extractId(p._id) || p._id;
                            if (!projId) return toast.error("Invalid project ID");
                            const result = await fetchWithAuth(`${API_URL}/api/projects/${projId}/complete`, { method: "PUT" });
                            if (!result?.success) return toast.error(result?.message || "Failed to update");
                            toast.success("Project marked completed!");
                            setProjects((prev) => prev.filter((prj) => extractId(prj._id) !== extractId(projId)));
                          } catch (err) {
                            console.error(err);
                            toast.error("Something went wrong");
                          }
                        }} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-md text-sm font-semibold">Mark as Completed</button>
                      )}

                      {(user.role === "admin" || user.role === "superadmin") && (
                        <button onClick={async () => {
                          if (!confirm("Delete this project?")) return;
                          try {
                            await fetchWithAuth(`${API_URL}/api/projects/${extractId(p._id) || p._id}`, { method: "DELETE" });
                            toast.success("Project deleted");
                            setProjects((prev) => prev.filter((x) => extractId(x._id) !== extractId(p._id)));
                          } catch (e) {
                            console.error(e);
                            toast.error("Delete error");
                          }
                        }} className="px-4 py-2 bg-red-700 text-white rounded-md">Delete Project</button>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </>
        )}

        {/* Requirements (tab) */}
        {activeTab === "requirements" && (
          <section className="bg-white dark:bg-gray-800 p-6 rounded shadow mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <div>
                <h3 className="font-bold">Requirements</h3>
                <p className="text-sm text-gray-400">All pending / rejected / accepted (depending on role)</p>
              </div>

              <div className="flex gap-3 items-center">
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="px-3 py-2 rounded bg-gray-700 text-white">
                  <option value="all">All status</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>

                <input placeholder="Filter by user email or name" value={filterUser} onChange={(e) => setFilterUser(e.target.value)} className="px-3 py-2 rounded border border-gray-300 dark:border-gray-700" />

                <button onClick={() => { setFilterStatus("all"); setFilterUser(""); loadDashboard(); }} className="px-3 py-2 bg-gray-600 rounded text-white">Reset</button>

                {user.role === "client" && (
                  <button onClick={() => router.push("/requirements/new")} className="px-3 py-2 bg-emerald-500 text-black rounded hover:bg-emerald-400 font-medium">Add Requirement</button>
                )}
              </div>
            </div>

            {filteredRequirements.length === 0 ? (
              <p>No requirements</p>
            ) : (
              filteredRequirements.map((req) => (
                <div key={req._id} className="p-4 mb-3 border rounded-lg dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-lg">{req.title}</h4>
                      <p className="text-sm text-gray-400">{req.description}</p>
                      <p className="mt-1">💰 ₹{req.charges ?? 0}</p>
                      <p className="text-sm text-gray-500">Deadline: {req.deadline ? new Date(req.deadline).toLocaleDateString() : "Not set"}</p>
                      <p className="mt-2 text-sm">Status: <span className={`px-2 py-1 rounded text-xs ${req.status === "pending" ? "bg-yellow-400 text-black" : req.status === "accepted" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>{req.status}</span></p>
                      <p className="text-sm text-gray-500 mt-1">Client: {getRefName(req.client) || getRefEmail(req.client) || "Unknown"}</p>
                    </div>

                    {user.role === "developer" && req.status === "pending" && (
                      <div className="flex flex-col gap-2">
                        <button onClick={async () => {
                          try {
                            const data = await fetchWithAuth(`${API_URL}/api/requirements/${req._id}/accept`, { method: "PUT" });
                            if (data?.success) {
                              toast.success("Requirement accepted ✅");
                              setRequirements((prev) => prev.map((r) => (r._id === req._id ? { ...r, status: "accepted", developer: { id: currentUserId, name: user.name, email: user.email } } : r)));
                              await loadDashboard();
                            } else {
                              toast.error(data?.message || "Failed to accept");
                            }
                          } catch (err) {
                            console.error(err);
                            toast.error("Error accepting requirement");
                          }
                        }} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm">Accept</button>

                        <button onClick={async () => {
                          try {
                            const data = await fetchWithAuth(`${API_URL}/api/requirements/${req._id}/reject`, { method: "PUT" });
                            if (data?.success) {
                              toast.success("Requirement rejected ❌");
                              setRequirements((prev) => prev.map((r) => (r._id === req._id ? { ...r, status: "rejected" } : r)));
                              await loadDashboard();
                            } else {
                              toast.error(data?.message || "Failed to reject");
                            }
                          } catch (err) {
                            console.error(err);
                            toast.error("Error rejecting requirement");
                          }
                        }} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">Reject</button>
                      </div>
                    )}

                    <div className="ml-4">
                      {user.role === "client" && String(getRefId(req.client)) === String(currentUserId) && req.status === "pending" && (
                        <button onClick={() => { setSelectedRequirement(req); setShowDeleteModal(true); }} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </section>
        )}

        {/* Hires */}
        {activeTab === "hires" && (
          <section>
            <h3 className="text-xl font-semibold mb-4">Hire Requests</h3>
            {hireRequests.length === 0 ? (
              <p>No hire requests</p>
            ) : (
              hireRequests.map((h) => (
                <div key={h._id} className="p-4 mb-3 border rounded-lg bg-white dark:bg-gray-800">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold">{h.projectTitle}</h4>
                      <p className="text-sm text-gray-500">Client: {h.clientEmail}</p>
                      <p className="text-sm text-gray-500">Developer: {h.developerEmail}</p>
                      <p className="text-sm text-gray-400 mt-1">Status: {h.status}</p>
                    </div>

                    <div>
                      {(user.role === "admin" || user.role === "superadmin") && (
                        <button onClick={async () => {
                          try {
                            await fetchWithAuth(`${API_URL}/api/hire/${h._id}`, { method: "DELETE" });
                            toast.success("Hire request deleted");
                            await loadDashboard();
                          } catch (err) {
                            console.error(err);
                            toast.error("Failed to delete");
                          }
                        }} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </section>
        )}

        {/* Notifications */}
        {activeTab === "notifications" && (
          <section>
            <h3 className="text-xl font-semibold mb-4">Notifications</h3>
            {notifications.length === 0 ? (
              <p>No notifications</p>
            ) : (
              notifications.map((n) => (
                <div key={n._id} className="p-3 mb-3 border rounded bg-white dark:bg-gray-800">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm">{n.message}</p>
                      <p className="text-xs text-gray-400">{n.userEmail}</p>
                    </div>
                    <div>
                      {(String(n.userEmail) === String(user.email) || user.role === "admin" || user.role === "superadmin") && (
                        <button onClick={async () => {
                          try {
                            await fetchWithAuth(`${API_URL}/api/notifications/${n._id}`, { method: "DELETE" });
                            setNotifications((prev) => prev.filter((x) => x._id !== n._id));
                            toast.success("Notification deleted");
                          } catch (err) {
                            console.error(err);
                            toast.error("Failed to delete");
                          }
                        }} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </section>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && selectedRequirement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-80 text-center shadow-lg">
            <h3 className="text-lg font-semibold mb-3">Confirm Delete</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-5">Are you sure you want to delete <br /><span className="font-bold">{selectedRequirement.title}</span>?</p>
            <div className="flex justify-center gap-3">
              <button onClick={handleDelete} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Yes, Delete</button>
              <button onClick={() => { setShowDeleteModal(false); setSelectedRequirement(null); }} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded hover:bg-gray-400 dark:hover:bg-gray-700">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
