"use client";

import { Code, Target, Users, Heart, Shield } from "lucide-react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { Card, CardContent } from "../../components/card";

export default function AboutPage() {
  const values = [
    {
      icon: Shield,
      title: "Trust",
      description:
        "We build lasting relationships by connecting verified developers and clients in a secure, transparent environment.",
    },
    {
      icon: Users,
      title: "Collaboration",
      description:
        "Collaboration is at our core — empowering teams to build faster, smarter, and better together.",
    },
    {
      icon: Code,
      title: "Innovation",
      description:
        "We embrace innovation, constantly improving our platform with the latest tools and technologies.",
    },
  ];

  const team = [
    {
      name: "Raj Singh",
      role: "Founder & CEO",
      bio: "Developer, visionary, and community builder — passionate about connecting talent and opportunity through technology.",
    },
    {
      name: "Vaibhav Gupta",
      role: "Co-Founder & CTO",
      bio: "Tech innovator and strategist dedicated to creating scalable, impactful solutions for developers worldwide.",
    },
  ];

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      <Header />

      {/* 🌟 HERO SECTION */}
      <section className="relative flex flex-col items-center justify-center text-center min-h-[85vh] px-6">
        <div className="absolute inset-0">
          <div className="absolute top-[-10%] left-[10%] w-[600px] h-[600px] bg-emerald-500/20 blur-[160px] rounded-full animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[5%] w-[500px] h-[500px] bg-cyan-400/15 blur-[150px] rounded-full animate-pulse"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent animate-gradient">
            About <span className="text-emerald-400">CodeCommunity</span>
          </h1>
          <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            We’re building the world’s most trusted platform for developers and
            clients to collaborate, innovate, and grow — together.
          </p>
        </div>
      </section>

      {/* 🎯 MISSION & VISION */}
      <section className="py-24 bg-gradient-to-b from-gray-950 via-gray-900 to-black relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.05),transparent_70%)]"></div>
        <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-10 relative z-10">
          <Card className="bg-gray-900/60 border border-gray-800 backdrop-blur-md p-8 rounded-2xl hover:shadow-[0_0_40px_rgba(6,182,212,0.15)] hover:border-emerald-400/40 transition-all duration-300">
            <CardContent>
              <div className="flex items-center gap-3 mb-5">
                <Target className="w-8 h-8 text-emerald-400" />
                <h3 className="text-2xl font-bold text-emerald-400">
                  Our Mission
                </h3>
              </div>
              <p className="text-black leading-relaxed text-lg">
                To empower developers and clients through a transparent,
                collaborative ecosystem that bridges creativity and opportunity,
                driving innovation and success worldwide.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/60 border border-gray-800 backdrop-blur-md p-8 rounded-2xl hover:shadow-[0_0_40px_rgba(6,182,212,0.15)] hover:border-cyan-400/40 transition-all duration-300">
            <CardContent>
              <div className="flex items-center gap-3 mb-5">
                <Heart className="w-8 h-8 text-cyan-400" />
                <h3 className="text-2xl font-bold text-cyan-400">Our Vision</h3>
              </div>
              <p className="text-black leading-relaxed text-lg">
                To redefine how talent meets technology — creating a global
                community where every developer can thrive and every idea can
                become reality.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 💡 VALUES SECTION */}
      <section className="py-24 bg-gradient-to-br from-black via-gray-950 to-gray-900 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-emerald-500/10 blur-[150px] rounded-full"></div>
        <div className="container mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl font-extrabold mb-6 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Our Core Values
          </h2>
          <p className="text-gray-400 mb-12 text-lg">
            These values shape our culture and guide every connection we make.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {values.map((value, i) => (
              <div
                key={i}
                className="group bg-gray-900/60 border border-gray-800 rounded-2xl p-8 backdrop-blur-md shadow-lg hover:border-emerald-400/40 hover:shadow-[0_0_40px_rgba(6,182,212,0.2)] transition-all duration-300"
              >
                <div className="bg-gradient-to-r from-emerald-400 to-cyan-400 p-4 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <value.icon className="w-8 h-8 text-black" />
                </div>
                <h4 className="text-2xl font-semibold text-emerald-300 mb-3">
                  {value.title}
                </h4>
                <p className="text-gray-300 leading-relaxed text-base">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 👥 TEAM SECTION */}
      <section className="py-24 bg-gradient-to-b from-gray-950 via-gray-900 to-black relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.05),transparent_70%)]"></div>
        <div className="container mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl font-extrabold mb-6 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Meet Our Team
          </h2>
          <p className="text-gray-400 mb-12 text-lg">
            The passionate innovators shaping the future of collaboration.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            {team.map((member, i) => (
              <div
                key={i}
                className="bg-gray-900/60 border border-gray-800 rounded-2xl p-8 shadow-lg hover:border-cyan-400/40 hover:shadow-[0_0_40px_rgba(16,185,129,0.2)] transition-all duration-300"
              >
                <div className="relative w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-3xl font-bold text-black shadow-md">
                  {member.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <h4 className="text-xl font-bold text-white mb-1">
                  {member.name}
                </h4>
                <p className="text-emerald-400 font-medium mb-4">
                  {member.role}
                </p>
                <p className="text-gray-300 leading-relaxed text-sm">
                  {member.bio}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 🚀 CTA SECTION */}
      <section className="py-28 bg-gradient-to-b from-black via-gray-950 to-gray-900 text-center">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6 bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Join the Revolution of Collaboration
          </h2>
          <p className="text-gray-400 text-lg mb-10">
            Become a part of CodeCommunity today and experience the next level
            of innovation, connection, and growth.
          </p>
          <a
            href="/Register"
            className="inline-block bg-gradient-to-r from-emerald-400 to-cyan-400 text-black font-semibold py-3 px-10 rounded-lg shadow-md hover:scale-105 hover:shadow-[0_0_40px_rgba(6,182,212,0.3)] transition-all duration-300"
          >
            Get Started Now
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
