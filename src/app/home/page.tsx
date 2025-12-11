"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { io, Socket } from "socket.io-client";

const Slider = dynamic(() => import("react-slick"), { ssr: false });
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import ThreeHero from "@/components/ThreeHero";

/* ---------------------------- TYPES ---------------------------- */
type TestimonialType = {
  name: string;
  role?: string;
  feedback: string;
  image?: string;
};

type UseTestimonialsReturn = {
  testimonials: TestimonialType[];
  loading: boolean;
  fetchTestimonials: () => Promise<void>;
};

/* ---------------------------- TESTIMONIAL FETCH HOOK ---------------------------- */
function useTestimonials(): UseTestimonialsReturn {
  const [testimonials, setTestimonials] = useState<TestimonialType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchTestimonials = useCallback(async (): Promise<void> => {
    try {
      const base = process.env.NEXT_PUBLIC_API_URL;

      const res = await fetch(`${base}/api/testimonials`, {
        credentials: "include", // cookie safe even if route becomes protected later
      });

      if (!res.ok) {
        console.warn("Failed to fetch testimonials:", res.status);
        setTestimonials([]);
        setLoading(false);
        return;
      }

      const data = await res.json();
      const list: TestimonialType[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : [];

      setTestimonials(list);
      setLoading(false);
    } catch (err) {
      console.error("fetchTestimonials error:", err);
      setTestimonials([]);
      setLoading(false);
    }
  }, []);

  return { testimonials, loading, fetchTestimonials };
}

/* ---------------------------- SOCKET HOOK (LIVE UPDATES) ---------------------------- */
function useTestimonialsSocket(fetchTestimonials: () => Promise<void>) {
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL;
    if (!base || typeof window === "undefined") return;

    const socket: Socket = io(base, {
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 500,
      withCredentials: true, // important for cookie auth
    });

    socket.on("connect", () => console.log("🟢 Socket connected:", socket.id));
    socket.on("testimonialsUpdated", fetchTestimonials);

    return () => {
      socket.disconnect();
    };
  }, [fetchTestimonials]);
}

/* ======================== HOME PAGE ======================== */
export default function HomePage() {
  const { testimonials, loading, fetchTestimonials } = useTestimonials();

  useTestimonialsSocket(fetchTestimonials);

  useEffect(() => {
    fetchTestimonials();
  }, [fetchTestimonials]);

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      {/* BACKGROUND GLOWS */}
      <div className="absolute -top-40 -left-40 w-[450px] h-[450px] bg-emerald-500/20 blur-[120px] rounded-full animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-[350px] h-[350px] bg-cyan-400/15 blur-[100px] rounded-full animate-pulse"></div>

      <Header />

      {/* ======================== HERO ======================== */}
    <section className="relative flex flex-col items-center justify-center text-center min-h-screen px-4 overflow-hidden">

  {/* --- 3D PARTICLE BACKGROUND --- */}
  <div className="absolute inset-0 z-[1] opacity-[0.65]">
    <ThreeHero />
  </div>

  {/* --- HERO CONTENT --- */}
  <div className="relative z-[5]">
    <h1 className="text-4xl md:text-6xl font-extrabold max-w-3xl leading-tight">
      <span className="text-transparent bg-gradient-to-r from-cyan-300 via-emerald-300 to-cyan-500 bg-clip-text">
        CodeCommunity
      </span>
      <br />
      <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
        Build. Connect. Grow.
      </span>
    </h1>

    <p className="text-gray-300 text-lg md:text-xl mt-6 max-w-2xl">
      A next-gen platform for developers and clients to build future-ready projects together.
    </p>

    <div className="flex gap-6 mt-10 justify-center">
      <Link
        href="/register"
        className="bg-gradient-to-r from-emerald-400 to-cyan-400 px-10 py-3 rounded-lg text-black font-bold hover:scale-110 transition"
      >
        Join as Developer
      </Link>

      <Link
        href="/developers"
        className="border border-emerald-400 px-10 py-3 rounded-lg hover:bg-emerald-400 hover:text-black transition"
      >
        Hire Talent
      </Link>
    </div>
  </div>

</section>


      {/* ======================== COMPANY CARDS ======================== */}
      <section className="py-24 bg-gradient-to-b from-gray-950 via-gray-900 to-black">
        <h2 className="text-4xl text-center font-extrabold text-emerald-400 mb-16">
          Trusted by Industry Leaders
        </h2>

        <div className="w-full overflow-x-hidden">
          <div className="flex gap-14 animate-scroll items-center w-max px-8">
            {[
              "google",
              "microsoft",
              "amazon",
              "ibm",
              "infosys",
              "tcs",
              "meta",
              "adobe",
              "wipro",
              "deloitte",
            ].map((name) => (
              <div
                key={name}
                className="min-w-[170px] bg-gray-900/60 p-6 rounded-2xl border border-gray-800 hover:border-emerald-400 hover:scale-105 transition text-center"
              >
                <Image
                  src={`/logos/${name}.png`}
                  alt={name}
                  width={96}
                  height={96}
                  className="object-contain w-[96px] h-[96px]"
                />
                <p className="mt-3 text-gray-300 capitalize">{name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================== TESTIMONIALS ======================== */}
      <section className="py-24 bg-gradient-to-r from-gray-950 via-gray-900 to-black text-center">
        <h2 className="text-4xl font-bold text-emerald-400 mb-12">
          What Our Users Say
        </h2>

        {loading ? (
          <p className="text-gray-500">Loading testimonials...</p>
        ) : (
          <Slider
  dots={true}
  infinite={true}
  arrows={false}
  autoplay={true}
  speed={600}
  autoplaySpeed={2800}
  slidesToShow={4} // Desktop default
  responsive={[
    { breakpoint: 1280, settings: { slidesToShow: 3 } },
    { breakpoint: 1024, settings: { slidesToShow: 2 } },
    { breakpoint: 768,  settings: { slidesToShow: 1 } },
    { breakpoint: 480,  settings: { slidesToShow: 1 } },
  ]}
>
  {testimonials.map((t, i) => {
    const img =
      t.image?.startsWith("http")
        ? t.image
        : t.image
        ? `${process.env.NEXT_PUBLIC_API_URL}${t.image}`
        : null; // no image → fallback avatar

    return (
      <div key={i} className="px-4">
        <div className="bg-gray-800/70 p-8 rounded-2xl border border-gray-700 hover:border-emerald-400 transition shadow-lg">

          {/* IMAGE OR FIRST LETTER AVATAR */}
          {img ? (
            <Image
              src={img}
              alt={t.name}
              width={85}
              height={85}
              className="rounded-full mx-auto mb-4 object-cover"
            />
          ) : (
            <div className="w-[85px] h-[85px] mx-auto mb-4 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-3xl font-bold">
              {t.name?.charAt(0)?.toUpperCase()}
            </div>
          )}

          {/* NAME + ROLE + FEEDBACK */}
          <h3 className="font-semibold">{t.name}</h3>
          <p className="text-gray-400 text-sm">{t.role || "User"}</p>
          <p className="text-gray-300 italic mt-2">“{t.feedback}”</p>
        </div>
      </div>
    );
  })}
</Slider>


        )}
      </section>

      <Footer />
    </div>
  );
}
