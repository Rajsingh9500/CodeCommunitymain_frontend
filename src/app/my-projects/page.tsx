"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Calendar,
  User,
  FolderKanban,
  ArrowLeft,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Safe requirement normalizer
const safeRequirement = (req: any) => {
  if (!req) return null;

  if (typeof req === "string") {
    return {
      _id: req,
      title: "Requirement",
      description: "",
      charges: 0,
      status: "",
    };
  }

  return req;
};

export default function MyProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch with cookies included
    fetch(`${API_URL}/api/projects`, {
      method: "GET",
      credentials: "include", // <-- important for cookie based auth
    })
      .then(async (res) => {
        if (res.status === 401) {
          router.push("/login");
          return null;
        }

        if (!res.ok) throw new Error("Failed to load projects");
        return res.json();
      })
      .then((data) => {
        if (!data) return;

        const fixedProjects = (data.projects || []).map((p: any) => ({
          ...p,
          requirements: (p.requirements || [])
            .filter(Boolean)
            .map((r: any) => safeRequirement(r)),
        }));

        setProjects(fixedProjects);
      })
      .catch((err) => {
        console.error("Project load error:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center mt-40 text-white text-lg">
        Loading your projects...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-gray-950 px-6 py-12">
      <div className="max-w-5xl mx-auto text-white mt-12">
        {/* PAGE TITLE */}
        <h2 className="text-2xl font-bold mb-8 text-emerald-400 flex items-center gap-3">
          <button
            className="flex items-center"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft size={34} />
          </button>
        My Projects
        </h2>

        {/* NO PROJECTS */}
        {projects.length === 0 ? (
          <p className="text-gray-400 text-lg">You have no projects yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {projects.map((p) => (
              <div
                key={p._id}
                className="bg-gray-900/50 border border-gray-800 p-6 rounded-2xl shadow-lg hover:border-emerald-500/40 hover:shadow-emerald-500/10 transition-all duration-300"
              >
                {/* TITLE */}
                <h2 className="text-2xl font-bold text-emerald-300 flex items-center gap-2">
                  <Briefcase size={22} /> {p.title}
                </h2>

                {/* STATUS */}
                <span
                  className={`inline-block mt-3 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
                    p.status === "in-progress"
                      ? "bg-yellow-400/20 text-yellow-300 border border-yellow-400/40"
                      : p.status === "completed"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40"
                      : "bg-red-500/20 text-red-300 border border-red-400/40"
                  }`}
                >
                  {p.status || "unknown"}
                </span>

                {/* DEADLINE */}
                <div className="mt-4 flex items-center gap-2 text-gray-300">
                  <Calendar size={18} />
                  <span>
                    {p.deadline
                      ? new Date(p.deadline).toLocaleDateString()
                      : "No deadline"}
                  </span>
                </div>

                {/* CLIENT + DEVELOPER */}
                <div className="mt-5 border-t border-gray-700 pt-4 text-sm space-y-2">
                  <p className="flex items-center gap-2 text-gray-300">
                    <User size={16} className="text-emerald-400" />
                    <span className="text-gray-400">Client:</span>
                    <span className="text-white">{p.client?.name || "N/A"}</span>
                  </p>

                  <p className="flex items-center gap-2 text-gray-300">
                    <User size={16} className="text-emerald-400" />
                    <span className="text-gray-400">Developer:</span>
                    <span className="text-white">
                      {p.developer?.name || "N/A"}
                    </span>
                  </p>
                </div>

                {/* REQUIREMENTS */}
                {p.requirements?.length > 0 && (
                  <div className="mt-5 bg-gray-800/40 border border-gray-700 p-4 rounded-xl">
                    <h3 className="font-semibold text-gray-300 mb-2">
                      Requirements ({p.requirements.length})
                    </h3>

                    {p.requirements.slice(0, 2).map((req: any) => (
                      <p key={req._id} className="text-gray-400 text-sm">
                        • {req.title}
                      </p>
                    ))}

                    {p.requirements.length > 2 && (
                      <p className="text-gray-500 text-sm mt-1">
                        + {p.requirements.length - 2} more
                      </p>
                    )}
                  </div>
                )}

                {/* BUTTON */}
                <button
                  onClick={() => router.push(`/my-projects/${p._id}`)}
                  className="w-full mt-6 px-4 py-3 bg-emerald-500 rounded-lg text-black font-semibold hover:bg-emerald-400 transition-all duration-200"
                >
                  View Project →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
