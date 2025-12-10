"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import toast from "react-hot-toast";
import { getSocket } from "@/lib/socket";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

/* ---------- TYPES ---------- */
type UserType = {
  role?: string;
  developerType?: string;
  [key: string]: any;
};

type GrowthPoint = { _id: string; count: number };
type StatusPoint = { status: string; count: number };

type AnalyticsState = {
  totalUsers?: number;
  newUsers?: number;
  totalProjects?: number;
  completedProjects?: number;
  liveConnections?: number;
  usersGrowth?: GrowthPoint[];
  completedGrowth?: GrowthPoint[];
  projectsByStatus?: StatusPoint[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/* ---------- CSV Helper ---------- */
const toCSV = (rows: any[]) => {
  if (!rows?.length) return "";
  const keys = Object.keys(rows[0]);
  return [
    keys.join(","),
    ...rows.map((r) =>
      keys.map((k) => JSON.stringify(r[k] ?? "")).join(",")
    ),
  ].join("\n");
};

/* ---------- Format Number ---------- */
const formatNumber = (v?: number) =>
  typeof v === "number" ? v.toLocaleString() : "0";

export default function AdminAnalytics() {
  const socket = useMemo(() => getSocket(), []);

  const [analytics, setAnalytics] = useState<AnalyticsState | null>(null);
  const [loading, setLoading] = useState(true);

  const [fromDate, setFromDate] = useState(() => {
    const d = new Date(Date.now() - 30 * 86400000);
    return d.toISOString().slice(0, 10);
  });

  const [toDate, setToDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );

  const [devCount, setDevCount] = useState(0);
  const [clientCount, setClientCount] = useState(0);

  /* ---------- FETCH ANALYTICS ---------- */
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);

      const [aRes, uRes] = await Promise.all([
        fetch(
          `${API_URL}/api/stats/analytics?from=${fromDate}&to=${toDate}`,
          { credentials: "include" }
        ),
        fetch(`${API_URL}/api/users?limit=0`, { credentials: "include" }),
      ]);

      const aJson = await aRes.json();
      const uJson = await uRes.json();

      const analyticsData = aJson.analytics ?? aJson;

      const rawUsers =
        Array.isArray(uJson.users)
          ? uJson.users
          : Array.isArray(uJson.data)
          ? uJson.data
          : [];

      const users: UserType[] = rawUsers as UserType[];

      setDevCount(
        users.filter(
          (u) => (u.role ?? "").toLowerCase() === "developer"
        ).length
      );
      setClientCount(
        users.filter((u) => (u.role ?? "").toLowerCase() === "client")
          .length
      );

      setAnalytics(analyticsData);
    } catch (err) {
      console.error(err);
      toast.error("Unable to load analytics");
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  /* ---------- CALL FETCH ON MOUNT OR DATE CHANGE ---------- */
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  /* ---------- SOCKET REALTIME REFRESH ---------- */
useEffect(() => {
  if (!socket) return;

  const handler = () => {
    fetchAnalytics().catch(() => {});
  };

  socket.on("analytics:update", handler);

  return () => {
    socket.off("analytics:update", handler);
  };
}, [socket]);


  /* ---------- DERIVED DATA ---------- */
  const usersGrowth = analytics?.usersGrowth ?? [];
  const completedGrowth = analytics?.completedGrowth ?? [];
  const projectsByStatus = analytics?.projectsByStatus ?? [];

  const newUsersLine = {
    labels: usersGrowth.map((p) => p._id),
    data: usersGrowth.map((p) => p.count),
  };

  const completedLine = {
    labels: completedGrowth.map((p) => p._id),
    data: completedGrowth.map((p) => p.count),
  };

  const projectsBar = {
    labels: projectsByStatus.map((p) => p.status),
    data: projectsByStatus.map((p) => p.count),
  };

  const devClientBar = {
    labels: ["Developers", "Clients"],
    data: [devCount, clientCount],
  };

  const totalUsersDonut = {
    labels: ["Developers", "Clients", "Others"],
    data: [
      devCount,
      clientCount,
      Math.max(
        0,
        (analytics?.totalUsers ?? 0) - devCount - clientCount
      ),
    ],
  };

  /* ---------- CHART OPTIONS ---------- */
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
  };

  /* ---------- LOADING ---------- */
  if (loading || !analytics)
    return (
      <div className="flex items-center justify-center h-72 text-gray-400">
        Loading analytics...
      </div>
    );

  /* ---------- UI RENDER ---------- */
  return (
    <div className="p-6 space-y-6 text-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-emerald-400">
          Analytics Dashboard
        </h1>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="bg-gray-800 px-2 py-1 rounded border border-gray-700 text-sm"
          />

          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="bg-gray-800 px-2 py-1 rounded border border-gray-700 text-sm"
          />

          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded font-semibold"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPI title="Total Users" value={formatNumber(analytics.totalUsers)} />
        <KPI title="New Users" value={formatNumber(analytics.newUsers)} />
        <KPI title="Total Projects" value={formatNumber(analytics.totalProjects)} />
        <KPI
          title="Completed Projects"
          value={formatNumber(analytics.completedProjects)}
        />
        <KPI
          title="Live Connections"
          value={formatNumber(analytics.liveConnections)}
        />
      </div>

      {/* CHART ROW 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* New Users */}
        <ChartCard
          title="New Users (Last 30 Days)"
          exportFn={() => {
            const csv = toCSV(
              usersGrowth.map((p) => ({
                date: p._id,
                count: p.count,
              }))
            );
            if (!csv) return toast.error("No data");

            const blob = new Blob([csv], { type: "text/csv" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `new-users-${fromDate}-${toDate}.csv`;
            link.click();
          }}
        >
          <div className="w-full h-[220px]">
            <Line
              options={commonOptions}
              data={{
                labels: newUsersLine.labels,
                datasets: [
                  {
                    label: "New Users",
                    data: newUsersLine.data,
                    borderColor: "#34D399",
                    borderWidth: 2,
                    tension: 0.35,
                    fill: false,
                    pointRadius: 0,
                  },
                ],
              }}
            />
          </div>
        </ChartCard>

        {/* Developers vs Clients */}
        <ChartCard
          title="Developers vs Clients"
          exportFn={() => {
            const csv = toCSV([
              { type: "Developers", count: devClientBar.data[0] },
              { type: "Clients", count: devClientBar.data[1] },
            ]);

            const blob = new Blob([csv], { type: "text/csv" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `dev-vs-client-${fromDate}-${toDate}.csv`;
            link.click();
          }}
        >
          <div className="w-full h-[220px]">
            <Bar
              options={commonOptions}
              data={{
                labels: devClientBar.labels,
                datasets: [
                  {
                    data: devClientBar.data,
                    backgroundColor: ["#10B981", "#3B82F6"],
                    borderRadius: 6,
                  },
                ],
              }}
            />
          </div>
        </ChartCard>

        {/* Total Users Breakdown */}
        <ChartCard
          title="Total Users Breakdown"
          exportFn={() => {
            const csv = toCSV([
              { type: "Developers", count: totalUsersDonut.data[0] },
              { type: "Clients", count: totalUsersDonut.data[1] },
              { type: "Others", count: totalUsersDonut.data[2] },
            ]);

            const blob = new Blob([csv], { type: "text/csv" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `total-users-${fromDate}-${toDate}.csv`;
            link.click();
          }}
        >
          <div className="w-full h-[220px] flex justify-center">
            <Doughnut
              data={{
                labels: totalUsersDonut.labels,
                datasets: [
                  {
                    data: totalUsersDonut.data,
                    backgroundColor: [
                      "#10B981",
                      "#3B82F6",
                      "#64748B",
                    ],
                  },
                ],
              }}
              options={{ plugins: { legend: { position: "bottom" } } }}
            />
          </div>
        </ChartCard>
      </div>

      {/* CHART ROW 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Projects by Status */}
        <ChartCard
          title="Projects by Status"
          exportFn={() => {
            const csv = toCSV(
              projectsByStatus.map((p) => ({
                status: p.status,
                count: p.count,
              }))
            );
            const blob = new Blob([csv], { type: "text/csv" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `projects-by-status-${fromDate}-${toDate}.csv`;
            link.click();
          }}
        >
          <div className="w-full h-[300px]">
            <Bar
              options={commonOptions}
              data={{
                labels: projectsBar.labels,
                datasets: [
                  {
                    data: projectsBar.data,
                    backgroundColor: "#f59e0b",
                    borderRadius: 6,
                  },
                ],
              }}
            />
          </div>
        </ChartCard>

        {/* Completed Projects Growth */}
        <ChartCard
          title="Completed Projects Growth"
          exportFn={() => {
            const csv = toCSV(
              completedGrowth.map((p) => ({
                date: p._id,
                count: p.count,
              }))
            );
            const blob = new Blob([csv], { type: "text/csv" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `completed-growth-${fromDate}-${toDate}.csv`;
            link.click();
          }}
        >
          <div className="w-full h-[300px]">
            <Line
              options={commonOptions}
              data={{
                labels: completedLine.labels,
                datasets: [
                  {
                    label: "Completed",
                    data: completedLine.data,
                    borderColor: "#7C3AED",
                    borderWidth: 2,
                    tension: 0.35,
                    fill: false,
                    pointRadius: 0,
                  },
                ],
              }}
            />
          </div>
        </ChartCard>

      </div>
    </div>
  );
}

/* ---------- KPI ---------- */
function KPI({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="p-4 rounded-lg bg-gray-800 text-gray-200 shadow">
      <div className="text-sm text-gray-400">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

/* ---------- CHART CARD WITH CSV BUTTON ---------- */
function ChartCard({
  title,
  children,
  exportFn,
}: {
  title: string;
  children: React.ReactNode;
  exportFn?: () => void;
}) {
  return (
    <div className="bg-gray-900 p-4 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="text-gray-300 text-sm font-semibold">{title}</div>

        {exportFn && (
          <button
            onClick={exportFn}
            className="text-xs text-emerald-400 hover:underline"
          >
            Download CSV
          </button>
        )}
      </div>

      {children}
    </div>
  );
}
