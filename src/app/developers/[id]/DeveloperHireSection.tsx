"use client";

import { useState, useEffect } from "react";
import { Briefcase, X, Rocket } from "lucide-react";
import toast from "react-hot-toast";
import Cookies from "js-cookie";

interface HireFormData {
  projectTitle: string;
  description: string;
  requirements: string;
  amount: string;
  deadline: string;
}

export default function DeveloperHireSection({ developer }: { developer: any }) {
  const [showHireModal, setShowHireModal] = useState(false);
  const [formData, setFormData] = useState<HireFormData>({
    projectTitle: "",
    description: "",
    requirements: "",
    amount: "",
    deadline: "",
  });

  const [user, setUser] = useState<any>(null); // ✅ track logged in user
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = Cookies.get("token") || localStorage.getItem("token");
        if (!token) return;

        const res = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });

        const data = await res.json();
        if (data?.user) {
          setUser(data.user);
          localStorage.setItem("user", JSON.stringify(data.user));
        }
      } catch (err) {
        console.error("❌ Fetch user error:", err);
      }
    };
    fetchUser();
  }, []);

  const handleHireSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { projectTitle, description, requirements, amount, deadline } = formData;
    if (!projectTitle || !description || !requirements || !amount || !deadline) {
      toast.error("⚠️ Please fill in all fields.");
      return;
    }

    if (!user || user.role !== "client") {
      toast.error("⚠️ Only clients can hire developers.");
      return;
    }

    try {
      const token = Cookies.get("token") || localStorage.getItem("token");
      const payload = {
        clientEmail: user.email,
        developerEmail: developer.email,
        projectTitle,
        description,
        requirements,
        amount: Number(amount),
        deadline,
      };

      const res = await fetch(`${API_URL}/api/hire`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("✅ Hire request sent successfully!");
        setShowHireModal(false);
        setFormData({
          projectTitle: "",
          description: "",
          requirements: "",
          amount: "",
          deadline: "",
        });
      } else {
        toast.error("❌ Failed: " + data.message);
      }
    } catch (err) {
      console.error("❌ Hire request error:", err);
      toast.error("Server error, please try again.");
    }
  };

  return (
    <>
      {/* ✅ Show Hire button only for Clients */}
      {user?.role === "client" && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowHireModal(true)}
            className="flex items-center gap-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-lg shadow-md transition mx-auto"
          >
            Hire Now <Briefcase className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Hire Modal */}
      {showHireModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg w-full max-w-lg shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Hire {developer.name}</h2>
              <button
                onClick={() => setShowHireModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleHireSubmit} className="space-y-4">
              {/* Project Title */}
              <div>
                <label className="block mb-1 font-medium">Project Title</label>
                <input
                  type="text"
                  value={formData.projectTitle}
                  onChange={(e) =>
                    setFormData({ ...formData, projectTitle: e.target.value })
                  }
                  className="w-full p-2 rounded bg-gray-800 border border-gray-600"
                />
              </div>

              {/* Project Description */}
              <div>
                <label className="block mb-1 font-medium">Project Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full p-2 rounded bg-gray-800 border border-gray-600"
                />
              </div>

              {/* Project Requirements */}
              <div>
                <label className="block mb-1 font-medium">Project Requirements</label>
                <textarea
                  value={formData.requirements}
                  onChange={(e) =>
                    setFormData({ ...formData, requirements: e.target.value })
                  }
                  className="w-full p-2 rounded bg-gray-800 border border-gray-600"
                />
              </div>

              {/* Budget */}
              <div>
                <label className="block mb-1 font-medium">Budget (in ₹)</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  className="w-full p-2 rounded bg-gray-800 border border-gray-600"
                />
              </div>

              {/* Deadline */}
              <div>
                <label className="block mb-1 font-medium">Deadline</label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) =>
                    setFormData({ ...formData, deadline: e.target.value })
                  }
                  className="w-full p-2 rounded bg-gray-800 border border-gray-600"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-2 rounded-lg shadow"
              >
                Submit Hire Request <Rocket className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
