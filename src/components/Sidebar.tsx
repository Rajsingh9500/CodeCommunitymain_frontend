"use client";

import Link from "next/link";
import { Home, Users, Folder, BarChart3 } from "lucide-react";

const links = [
  { href: "/Dashboard", label: "Dashboard", icon: Home },
  { href: "/Dashboard/users", label: "Users", icon: Users },
  { href: "/Dashboard/projects", label: "Projects", icon: Folder },
  { href: "/Dashboard/reports", label: "Reports", icon: BarChart3 },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white shadow-md">
      <div className="p-6 text-2xl font-bold border-b">CodeCommunity</div>
      <nav className=" p-4 space-y-2">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-700 hover:bg-blue-100 hover:text-blue-600 transition"
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
