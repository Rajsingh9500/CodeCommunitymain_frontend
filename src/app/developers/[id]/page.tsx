"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Star, Folder, MessageSquare, ArrowLeft } from "lucide-react";
import DeveloperHireSection from "./DeveloperHireSection";

interface DeveloperType {
  _id: string;
  name: string;
  email: string;
  role: string;
  technologies?: string[];
  experience?: number;
  charges?: number;
  avgRating?: number;
}

interface ProjectType {
  _id: string;
  title: string;
  status: string;
}

interface ReviewType {
  _id: string;
  client: { name: string; email: string };
  rating: number;
  comment: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function DeveloperIdPage() {
  const { id: devId } = useParams<{ id: string }>();
  const router = useRouter();

  const [developer, setDeveloper] = useState<DeveloperType | null>(null);
  const [projects, setProjects] = useState<ProjectType[]>([]);
  const [reviews, setReviews] = useState<ReviewType[]>([]);
  const [avgRating, setAvgRating] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Average rating calculator
  const recalcAvgRating = useCallback((list: ReviewType[]) => {
    if (!list.length) return 0;
    const sum = list.reduce((acc, r) => acc + r.rating, 0);
    return parseFloat((sum / list.length).toFixed(1));
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!devId) return;

        const [devRes, projRes, revRes, userRes] = await Promise.all([
          fetch(`${API_URL}/api/developers/${devId}`, { credentials: "include" }),
          fetch(`${API_URL}/api/developers/${devId}/projects`, { credentials: "include" }),
          fetch(`${API_URL}/api/reviews/${devId}`, { credentials: "include" }),
          fetch(`${API_URL}/api/auth/me`, { credentials: "include" }),
        ]);

        const safeJSON = async (res: Response) =>
          res.headers.get("content-type")?.includes("application/json")
            ? await res.json()
            : null;

        const [devData, projData, revData, userData] = await Promise.all([
          safeJSON(devRes),
          safeJSON(projRes),
          safeJSON(revRes),
          safeJSON(userRes),
        ]);

        // Backend might send { developer: ... } OR { user: ... }
        if (devData?.success) {
          setDeveloper(devData.developer || devData.user);
        }

        if (projData?.success) setProjects(projData.projects || []);

        if (revData?.success) {
          setReviews(revData.reviews || []);
          setAvgRating(
            Number(revData.avgRating) || recalcAvgRating(revData.reviews)
          );
        }

        if (userData?.success) setCurrentUser(userData.user);
      } catch (err) {
        console.error("❌ Developer Page Error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [devId, recalcAvgRating]);

  if (loading)
    return (
      <div className="text-gray-300 p-8 text-center animate-pulse">
        Loading developer...
      </div>
    );

  if (!developer)
    return (
      <div className="text-gray-300 p-8 text-center">
        Developer not found
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-gray-900 text-white pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto space-y-10">

        {/* BACK BUTTON */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-300 hover:text-white mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        {/* PROFILE CARD */}
        <div className="bg-gray-900/60 border border-gray-400 rounded-2xl p-10 text-center shadow-xl backdrop-blur-md hover:border-emerald-400/50 transition-all duration-300">

          {/* Avatar */}
          <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-5xl font-extrabold text-black shadow-lg mb-4">
            {developer.name.charAt(0).toUpperCase()}
          </div>

          <h1 className="text-3xl font-bold mb-1">{developer.name}</h1>
          <p className="text-gray-400 text-sm mb-6">{developer.email}</p>

          {/* Rating */}
          <div className="flex justify-center items-center gap-1 mb-6">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-5 h-5 ${
                  s <= Math.round(avgRating)
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-600"
                }`}
              />
            ))}
            <span className="ml-2 text-gray-300 text-sm">{avgRating} / 5</span>
          </div>

          {/* Skills */}
          <h3 className="text-lg font-semibold text-emerald-400 mb-3">Skills</h3>
          {developer.technologies?.length ? (
            <div className="flex flex-wrap justify-center gap-3 mb-6">
              {developer.technologies.map((tech, i) => (
                <span
                  key={i}
                  className="px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-300"
                >
                  {tech}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No skills listed</p>
          )}

          {/* Experience/Charges */}
          <div className="flex justify-center gap-10 text-gray-300 mb-6">
            <div>
              <p className="text-sm text-gray-400">Experience</p>
              <p className="text-xl font-bold">{developer.experience || 0} yrs</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Charges</p>
              <p className="text-xl font-bold text-emerald-400">
                ₹{developer.charges || 0}
              </p>
            </div>
          </div>

          {/* Hire Section */}
          <DeveloperHireSection developer={developer} />

          {/* Chat Button */}
          <button
            onClick={() => router.push(`/chat/${developer._id}`)}
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-400 to-cyan-400 text-black font-semibold hover:scale-105 transition-transform shadow-lg hover:shadow-emerald-400/20"
          >
            <MessageSquare className="w-5 h-5" />
            Chat with {developer.name}
          </button>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { label: "Projects", value: projects.length },
            { label: "Avg Rating", value: `${avgRating} / 5` },
            { label: "Total Reviews", value: reviews.length },
          ].map((stat, i) => (
            <div
              key={i}
              className="p-6 bg-gray-900/70 border border-gray-800 rounded-xl text-center hover:border-emerald-400/40 transition"
            >
              <h3 className="text-3xl font-bold text-emerald-400">{stat.value}</h3>
              <p className="text-gray-400 mt-2">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* PROJECTS */}
        <div className="bg-gray-900/70 border border-gray-800 p-8 rounded-2xl shadow-md">
          <h2 className="text-2xl font-bold text-emerald-400 flex items-center gap-2 mb-6">
            <Folder className="w-6 h-6" /> Projects
          </h2>

          {projects.length === 0 ? (
            <p className="text-gray-400 text-center">No projects yet.</p>
          ) : (
            <ul className="space-y-3">
              {projects.map((p) => (
                <li
                  key={p._id}
                  className="p-4 rounded-lg bg-gray-800/60 border border-gray-700 hover:border-emerald-400/40 transition"
                >
                  <span className="font-medium">{p.title}</span>
                  <span
                    className={`ml-3 text-xs px-3 py-1 rounded border ${
                      p.status === "completed"
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                        : "bg-yellow-500/20 text-yellow-400 border-yellow-400/40"
                    }`}
                  >
                    {p.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* REVIEWS */}
        <div className="bg-gray-900/70 border border-gray-800 p-8 rounded-2xl shadow-md">
          <h2 className="text-2xl font-bold text-yellow-400 flex items-center gap-2 mb-6">
            <Star className="w-6 h-6 fill-yellow-400" /> Ratings & Reviews
          </h2>

          {reviews.length === 0 ? (
            <p className="text-gray-400 text-center">No reviews yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {reviews.map((r) => (
                <div
                  key={r._id}
                  className="p-5 rounded-xl bg-gray-800/70 border border-gray-700 hover:border-emerald-400/40 transition"
                >
                  <div className="flex justify-between">
                    <p className="font-semibold">{r.client.name}</p>
                    <p className="text-xs text-gray-500">{r.client.email}</p>
                  </div>

                  <div className="flex gap-1 my-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-5 h-5 ${
                          s <= r.rating
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-600"
                        }`}
                      />
                    ))}
                  </div>

                  <p className="text-gray-300 italic">{r.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
