"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, User, Briefcase, IndianRupee } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export default function ProjectDetailsPage() {
  const { projectId } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!projectId) return;

    // Cookie-based authentication request
    fetch(`${API_URL}/api/projects/${projectId}`, {
      method: "GET",
      credentials: "include", // <-- sends cookies automatically
    })
      .then(async (res) => {
        if (res.status === 401) {
          router.push("/login");
          return null;
        }
        if (!res.ok) throw new Error("Failed to load project");
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        setProject(data.project);
      })
      .catch(() => setError("Failed to load project"))
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return <div className="p-10 text-white">Loading...</div>;
  if (error) return <div className="p-10 text-red-500">{error}</div>;

  if (!project) return <div className="p-10 text-white">Project not found</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-gray-950 px-6 py-12">
      <div className="max-w-4xl mx-auto text-white">

        {/* Back Button */}
        <div className="bg-gray-900/60 backdrop-blur-xl p-8 rounded-3xl border border-gray-800 shadow-xl mt-10">
          <button
            className="flex items-center gap-2 text-white hover:text-emerald-300 mb-6"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft size={18} /> Back to Dashboard
          </button>

          {/* Title */}
          <div className="flex items-center gap-3 mb-6">
            <Briefcase className="text-emerald-400" size={34} />
            <h1 className="text-3xl font-bold">{project.title}</h1>
          </div>

          {/* Project Meta */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {/* Status */}
            <div className="bg-gray-800/50 border border-gray-700 p-5 rounded-xl">
              <h3 className="flex items-center gap-2 text-gray-300 font-semibold">
                <Briefcase size={18} /> Status
              </h3>
              <p className="text-emerald-400 text-xl mt-2">
                {project.status?.toUpperCase()}
              </p>
            </div>

            {/* Deadline */}
            <div className="bg-gray-800/50 border border-gray-700 p-5 rounded-xl">
              <h3 className="flex items-center gap-2 text-gray-300 font-semibold">
                <Calendar size={18} /> Deadline
              </h3>
              <p className="text-emerald-400 text-lg mt-2">
                {project.deadline
                  ? new Date(project.deadline).toLocaleDateString()
                  : "Not Assigned"}
              </p>
            </div>
          </div>

          {/* Client + Developer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {/* Client */}
            <div className="bg-gray-800/50 border border-gray-700 p-5 rounded-xl">
              <h3 className="flex items-center gap-2 text-gray-300 font-semibold">
                <User size={18} /> Client
              </h3>
              <p className="text-xl mt-2 text-emerald-400">
                {project.client?.name}
              </p>
              <p className="text-gray-300">{project.client?.email}</p>
            </div>

            {/* Developer */}
            <div className="bg-gray-800/50 border border-gray-700 p-5 rounded-xl">
              <h3 className="flex items-center gap-2 text-gray-300 font-semibold">
                <User size={18} /> Developer
              </h3>
              <p className="text-xl mt-2 text-emerald-400">
                {project.developer?.name}
              </p>
              <p className="text-gray-300">{project.developer?.email}</p>
            </div>
          </div>

          {/* Requirements */}
          <h2 className="text-2xl font-bold text-emerald-400 mb-4">
            Requirements ({project.requirements?.length || 0})
          </h2>

          <div className="space-y-5">
            {project.requirements?.map((req: any) => (
              <div
                key={req._id}
                className="bg-gray-800/40 border border-gray-700 p-6 rounded-xl"
              >
                <p className="text-xl font-semibold text-white">{req.title}</p>
                <p className="text-gray-400 mt-1">{req.description}</p>

                <p className="mt-3 flex items-center gap-2 text-emerald-300 font-semibold">
                  <IndianRupee size={16} />
                  ₹{req.charges}
                </p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
