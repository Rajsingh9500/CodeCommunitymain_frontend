'use client';

import Link from 'next/link';
import { Code, Mail, Linkedin, Twitter, Github } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-gray-950 via-gray-900 to-black text-gray-300">
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand Section */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-r from-emerald-400 to-cyan-400 p-2 rounded-xl">
                <Code className="w-6 h-6 text-black" />
              </div>
              <h3 className="text-2xl font-bold text-white">CodeCommunity</h3>
            </div>
            <p className="text-gray-400 mb-6 max-w-md">
              Where Developers & Clients Build Together. The premier platform
              for connecting talented developers with visionary clients to
              create amazing projects.
            </p>
            <div className="flex gap-4">
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-800 p-3 rounded-lg hover:bg-emerald-500/80 transition"
              >
                <Linkedin className="w-5 h-5 text-white" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-800 p-3 rounded-lg hover:bg-cyan-500/80 transition"
              >
                <Twitter className="w-5 h-5 text-white" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-800 p-3 rounded-lg hover:bg-emerald-400/80 transition"
              >
                <Github className="w-5 h-5 text-white" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-6 text-white">Platform</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/About" className="text-gray-400 hover:text-emerald-400">
                  About
                </Link>
              </li>
              <li>
                <Link href="/Developers" className="text-gray-400 hover:text-emerald-400">
                  Developers
                </Link>
              </li>
              <li>
                <Link href="/Contact" className="text-gray-400 hover:text-emerald-400">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/Chat" className="text-gray-400 hover:text-emerald-400">
                  Chat
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-6 text-white">Contact</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-emerald-400" />
                <a
                  href="mailto:contact@codecommunity.dev"
                  className="text-gray-400 hover:text-emerald-400"
                >
                  contact@codecommunity.dev
                </a>
              </div>
              <div className="text-gray-400 text-sm">
                <p>Building the future of</p>
                <p>developer collaboration</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-12 pt-6 text-sm flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500">
            © 2024 CodeCommunity. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="#" className="text-gray-400 hover:text-emerald-400">
              Privacy Policy
            </Link>
            <Link href="#" className="text-gray-400 hover:text-emerald-400">
              Terms of Service
            </Link>
            <Link href="#" className="text-gray-400 hover:text-emerald-400">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
