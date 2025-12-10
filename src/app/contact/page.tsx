"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  MessageCircle,
  Send,
  Star,
} from "lucide-react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { Card, CardContent } from "../../components/card";
import { toast } from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

/* ---------------- Custom Components ---------------- */
const CustomButton = ({ children, onClick, type = "button", disabled }: any) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`bg-gradient-to-r from-emerald-400 to-cyan-400 text-black font-semibold py-2 px-6 rounded-md shadow-md hover:shadow-lg disabled:opacity-50`}
  >
    {children}
  </button>
);

const CustomInput = ({ label, ...props }: any) => (
  <div className="flex flex-col mb-4">
    <label className="text-sm font-medium mb-1 text-white">{label}</label>
    <input
      {...props}
      className="border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 text-black"
    />
  </div>
);

const CustomTextarea = ({ label, ...props }: any) => (
  <div className="flex flex-col mb-4">
    <label className="text-sm font-medium mb-1 text-white">{label}</label>
    <textarea
      {...props}
      className="border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 text-black resize-none"
    />
  </div>
);

export default function ContactPage() {
  /* ---------------- Form State ---------------- */
  const [formData, setFormData] = useState({
    fname: "",
    lname: "",
    email: "",
    knowus: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    alert("Message Sent! Thank you for contacting us.");
    setFormData({
      fname: "",
      lname: "",
      email: "",
      knowus: "",
      subject: "",
      message: "",
    });
    setIsSubmitting(false);
  };

  const contactInfo = [
    { icon: Mail, title: "Email Support", info: "support@codecommunity.dev", description: "General inquiries and support" },
    { icon: Phone, title: "Phone Support", info: "+91 6262253146", description: "Mon-Fri, 9 AM - 6 PM EST" },
    { icon: MapPin, title: "Office Location", info: "Indore, India", description: "Global presence" },
    { icon: Clock, title: "Response Time", info: "< 24 hours", description: "Average response time" },
  ];

  /* ---------------- Review Section State ---------------- */
  const [reviews, setReviews] = useState([]);
  const [average, setAverage] = useState(0);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/reviews`);
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews);
        setAverage(data.averageRating);
      }
    } catch (err) {
      console.error("❌ Fetch reviews error:", err);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleReviewSubmit = async () => {
    if (!rating || !comment.trim()) {
      toast.error("Please provide both rating and review.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rating, comment }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Thank you for your feedback!");
        setRating(0);
        setComment("");
        fetchReviews();
      } else {
        toast.error(data.message || "Failed to submit review");
      }
    } catch (err) {
      console.error("❌ Submit review error:", err);
      toast.error("Something went wrong");
    }
  };

  /* ---------------- Main UI ---------------- */
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center">
        <div className="absolute inset-0">
          <img src="/hero-bg.jpg" alt="Contact Background" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-gray-900/80 to-black"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center">
          <h1 className="text-5xl font-extrabold mb-6 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Get in Touch
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Have questions about CodeCommunity? We're here to help you connect, collaborate, and create amazing projects.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20">
        <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <Card className="bg-white border border-gray-200 shadow-lg pt-5">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-black">
                <Send className="w-6 h-6 text-emerald-500" />
                Send us a Message
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols gap-4 ">
                  <CustomInput label="First Name *" name="fname" value={formData.fname} onChange={handleChange} required placeholder="Your First Name" />
                  <CustomInput label="Last Name *" name="lname" value={formData.lname} onChange={handleChange} required placeholder="Your Last Name" />
                  <CustomInput label="Email Address *" name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="your.email@example.com" />
                  <CustomInput label="How You Know Us *" name="knowus" value={formData.knowus} onChange={handleChange} required placeholder="How You Know Us?" />
                  <CustomInput label="Subject *" name="subject" value={formData.subject} onChange={handleChange} required placeholder="What's this about?" />
                  <CustomTextarea label="Message *" name="message" value={formData.message} onChange={handleChange} required placeholder="Tell us more about your inquiry..." />
                  <CustomButton type="submit" disabled={isSubmitting}>{isSubmitting ? "Sending..." : "Send Message"}</CustomButton>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-4 text-emerald-400">Let's Start a Conversation</h2>
              <p className="text-gray-300">Whether you're a developer looking to join our community or a client seeking talented developers, we're here to help you succeed.</p>
            </div>

            <div className="space-y-4">
              {contactInfo.map((item, index) => (
                <Card key={index} className="bg-white border border-gray-200 shadow-md">
                  <CardContent className="flex items-start gap-4 p-6 text-black">
                    <div className="bg-emerald-100 p-3 rounded-lg">
                      <item.icon className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{item.title}</h4>
                      <p className="text-emerald-600 font-medium mb-1">{item.info}</p>
                      <p className="text-gray-600 text-sm">{item.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Live Chat */}
            <Card className="shadow-lg">
              <CardContent className="flex items-center gap-4 p-6 text-black">
                <MessageCircle className="w-8 h-8" />
                <div>
                  <h4 className="font-semibold mb-1">Need Immediate Help?</h4>
                  <p className="mb-3 text-black/80">Start a live chat with our support team</p>
                  <CustomButton>Start Live Chat</CustomButton>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-emerald-400">Frequently Asked Questions</h2>
            <p className="text-gray-300">Quick answers to common questions</p>
          </div>
          {/* FAQ Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            {[
              { q: "How do I get started?", a: "Simply sign up, complete your profile, and start browsing projects or posting your requirements." },
              { q: "Is CodeCommunity free?", a: "We offer both free and premium plans. Basic features are free, with advanced tools available in premium." },
              { q: "How are payments handled?", a: "All payments are processed securely with escrow protection for both parties." },
              { q: "What if I need technical support?", a: "Our support team is available 24/7 via chat, email, or phone." },
            ].map((faq, i) => (
              <Card key={i} className="bg-white border border-gray-200 shadow-md">
                <CardContent className="p-6 text-black">
                  <h4 className="font-semibold mb-2">{faq.q}</h4>
                  <p className="text-gray-700">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ⭐ Review Section */}
<section className="py-24 bg-gradient-to-b from-black via-gray-950 to-gray-900 text-center relative overflow-hidden">
  {/* 🌈 Subtle Background Glow */}
  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/10 blur-[160px] rounded-full pointer-events-none"></div>

  <div className="container mx-auto px-6 max-w-6xl relative z-10">
    {/* 🔹 Heading */}
    <h2 className="text-4xl md:text-5xl font-extrabold text-emerald-400 mb-4">
      Rate <span className="text-cyan-400">CodeCommunity</span>
    </h2>
    <p className="text-gray-400 mb-12 max-w-2xl mx-auto text-lg leading-relaxed">
      Share your experience and help us make CodeCommunity even better for everyone.
    </p>

    {/* ⭐ Rating */}
    <div className="flex justify-center gap-3 mb-6">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-10 h-10 cursor-pointer transition-transform duration-200 hover:scale-110 ${
            rating >= star ? "text-emerald-400 fill-emerald-400" : "text-gray-600"
          }`}
          onClick={() => setRating(star)}
        />
      ))}
    </div>

    {/* 💬 Comment Box */}
    <div className="flex justify-center mb-8">
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Write your review..."
        className="w-full md:w-2/3 lg:w-1/2 bg-gray-900/80 border border-gray-700 rounded-xl p-4 text-white placeholder-gray-500 focus:border-emerald-400 outline-none resize-none shadow-inner"
        rows={4}
      />
    </div>

    {/* 🚀 Submit Button */}
    <div className="flex justify-center">
      <CustomButton onClick={handleReviewSubmit}>Submit Review</CustomButton>
    </div>

    {/* 📊 Average Rating */}
    <div className="mt-12">
      <p className="text-lg text-gray-300 font-medium">
        Average Rating:{" "}
        <span className="text-emerald-400 font-bold text-xl">
          {average.toFixed(1)} / 5 ⭐
        </span>
      </p>
    </div>

    {/* 💬 Recent Reviews */}
    <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
      {reviews.slice(0, 6).map((r: any, i: number) => (
        <div
          key={i}
          className="relative bg-gray-800/70 border border-gray-700 rounded-2xl p-6 w-full max-w-[340px]
                     text-left hover:border-emerald-400 transition-all duration-300 
                     hover:shadow-[0_0_25px_rgba(16,185,129,0.3)]"
        >
          {/* Accent Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/5 to-cyan-400/5 rounded-2xl opacity-0 hover:opacity-100 transition duration-500"></div>

          {/* Star Rating */}
          <div className="flex items-center mb-3">
            {[...Array(r.rating)].map((_, j) => (
              <Star
                key={j}
                className="w-4 h-4 text-emerald-400 fill-emerald-400"
              />
            ))}
          </div>

          {/* Comment */}
          <p className="text-gray-300 italic mb-3 leading-relaxed line-clamp-4">
            “{r.comment}”
          </p>

          {/* Name */}
          <p className="text-sm text-gray-500 text-right">— {r.name}</p>
        </div>
      ))}
    </div>
  </div>
</section>

      <Footer />
    </div>
  );
}
