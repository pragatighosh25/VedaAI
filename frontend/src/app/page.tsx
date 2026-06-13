"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/store/authStore";
import { ArrowRight, CheckCircle2, Star, Sparkles, BookOpen, GraduationCap, BarChart3, Search, FolderHeart, Bookmark } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { token, hydrated } = useAuthStore();
  const [activeCard, setActiveCard] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollTextRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setActiveCard((prev) => (prev + 1) % 4);
    }, 1000);
    return () => clearInterval(timer);
  }, [isHovered]);

  useEffect(() => {
    if (!hydrated) return;

    if (token) {
      router.replace("/assignments");
    }
  }, [token, hydrated, router]);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (scrollTextRef.current) {
            const rect = scrollTextRef.current.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            
            // If element is completely off-screen, progress is 0
            if (rect.bottom < 0 || rect.top > windowHeight) {
              setScrollProgress(0);
              ticking = false;
              return;
            }

            const elementCenter = rect.top + rect.height / 2;
            const elementCenterRelative = (windowHeight - elementCenter) / windowHeight;

            let p = 0;
            if (elementCenterRelative < 0.35) {
              // Entering from bottom: map 0.1 -> 0.35 to 0 -> 1
              p = (elementCenterRelative - 0.1) / (0.35 - 0.1);
            } else if (elementCenterRelative <= 0.65) {
              // Fully visible in the middle 30% of the viewport: progress = 1
              p = 1;
            } else {
              // Exiting through the top: map 0.65 -> 0.9 to 1 -> 0
              p = 1 - (elementCenterRelative - 0.65) / (0.9 - 0.65);
            }

            const clampedProgress = Math.min(1, Math.max(0, p));
            setScrollProgress(clampedProgress);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Run initially to calculate state on load
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#EAF2F6]">
        <div className="flex flex-col items-center gap-3">
          <Image
            src="/logo.png"
            alt="VedaAI Logo"
            width={48}
            height={48}
            className="animate-pulse"
          />
          <p className="text-sm font-medium text-veda-dark/60">Loading VedaAI...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EAF2F6] font-sans text-veda-dark antialiased selection:bg-veda-orange/20 selection:text-veda-orange relative">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-black/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link className="flex items-center gap-2.5 group" href="#">
            <Image
              alt="VedaAI Logo"
              className="h-8 w-8 rounded-lg object-contain transition-transform group-hover:scale-105"
              src="/logo.png"
              width={32}
              height={32}
            />
            <span className="text-xl font-bold tracking-tight text-veda-dark group-hover:text-veda-orange transition-colors">
              VedaAI
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link className="text-sm font-semibold text-veda-orange transition-colors" href="#">
              Home
            </Link>
            <a className="text-sm font-medium text-veda-dark/60 hover:text-veda-orange transition-colors" href="#library">
              Library
            </a>
            <a className="text-sm font-medium text-veda-dark/60 hover:text-veda-orange transition-colors" href="#features">
              Features
            </a>
            <a className="text-sm font-medium text-veda-dark/60 hover:text-veda-orange transition-colors" href="#discovery">
              Resource Discovery
            </a>
          </nav>

          {/* CTA */}
          <Link
            className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold text-white bg-veda-dark rounded-full hover:bg-black transition-colors"
            href="/login"
          >
            Get Started
          </Link>
        </div>
      </header>

      <main className="pb-24 overflow-x-hidden">
        {/* Hero Section Wrapper with full-width gradient */}
        <div className="w-full bg-gradient-to-b from-white to-[#EAF2F6] pt-36 pb-20 mb-20">
          <section className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left side: Texts */}
            <div className="lg:col-span-6 text-left flex flex-col items-start animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 border border-black/5 text-sm font-semibold mb-8 shadow-sm">
                <span className="text-veda-orange">✨</span> Curriculum Companion
              </div>

              <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6 text-[#1F1F1F]">
                Next-Generation AI{" "}
                <span className="text-veda-orange block mt-2">
                  Companion for Educators
                </span>
              </h1>

              <p className="text-base md:text-lg text-veda-dark/70 mb-10 leading-relaxed max-w-xl">
                An intelligent classroom co-pilot that simplifies lesson prep, question generation, and resource management—empowering teachers to save hours every single week.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 items-center w-full sm:w-auto">
                <Link
                  className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-4 text-base font-semibold text-white bg-[#1F1F1F] rounded-full hover:bg-black transition-all hover:scale-[1.03] group shadow-md"
                  href="/login"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* Right side: Interactive Stacked Screenshots Deck */}
            <div className="lg:col-span-6 relative flex justify-center items-center h-[420px] md:h-[480px] animate-fade-in-right">
              {/* Interactive Hover Card Deck */}
              <div 
                className="relative w-full max-w-[440px] h-[300px] md:h-[340px]"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                {[0, 1, 2, 3].map((index) => {
                  const pos = (3 - index - activeCard + 8) % 4;
                  let cardClass = "";
                  if (pos === 0) {
                    cardClass = "z-40 scale-100 translate-y-0 opacity-100 rotate-0 shadow-2xl";
                  } else if (pos === 1) {
                    cardClass = "z-30 scale-95 translate-y-4 opacity-90 rotate-[2deg] shadow-xl";
                  } else if (pos === 2) {
                    cardClass = "z-20 scale-90 translate-y-8 opacity-80 rotate-[-2deg] shadow-lg";
                  } else {
                    cardClass = "z-10 scale-85 translate-y-12 opacity-0 translate-x-32 rotate-[6deg] pointer-events-none";
                  }

                  return (
                    <div
                      key={index}
                      onClick={() => setActiveCard((prev) => (prev + 1) % 4)}
                      className={`absolute inset-0 bg-white rounded-2xl border border-black/5 overflow-hidden transition-all duration-700 ease-in-out cursor-pointer p-5 flex flex-col justify-between text-xs ${cardClass}`}
                    >
                      {pos === 0 && (
                        <div className="absolute inset-0 bg-gradient-to-b from-black/0 to-black/5 pointer-events-none z-10" />
                      )}

                      {/* Card contents depending on index */}
                      {index === 0 && (
                        /* Card 0: Personal Library Mockup */
                        <div className="flex flex-col h-full justify-between">
                          <div className="flex items-center justify-between border-b border-black/5 pb-2">
                            <div className="flex items-center gap-1.5 font-bold text-veda-dark">
                              <FolderHeart className="w-4 h-4 text-veda-orange" />
                              <span>My Personal Library</span>
                            </div>
                            <span className="text-[9px] font-bold text-veda-dark/40">3 Collections</span>
                          </div>

                          <div className="grid grid-cols-3 gap-2.5 my-2 text-left">
                            <div className="bg-[#1F1F1F] text-white rounded-xl p-2 border border-black/10 flex flex-col gap-2 relative shadow-md">
                              <div className="absolute inset-0 bg-veda-orange/10 opacity-30 blur-sm rounded-xl" />
                              <FolderHeart className="w-3.5 h-3.5 text-veda-orange relative z-10" />
                              <div className="relative z-10">
                                <div className="text-[9px] font-bold truncate">Physics</div>
                                <div className="text-[7px] text-white/55 font-medium">12 items</div>
                              </div>
                            </div>

                            <div className="bg-[#1F1F1F] text-white rounded-xl p-2 border border-black/10 flex flex-col gap-2 relative shadow-md">
                              <div className="absolute inset-0 bg-veda-orange/10 opacity-30 blur-sm rounded-xl" />
                              <FolderHeart className="w-3.5 h-3.5 text-veda-orange relative z-10" />
                              <div className="relative z-10">
                                <div className="text-[9px] font-bold truncate">Chemistry</div>
                                <div className="text-[7px] text-white/55 font-medium">8 items</div>
                              </div>
                            </div>

                            <div className="bg-[#1F1F1F] text-white rounded-xl p-2 border border-black/10 flex flex-col gap-2 relative shadow-md">
                              <div className="absolute inset-0 bg-veda-orange/10 opacity-30 blur-sm rounded-xl" />
                              <FolderHeart className="w-3.5 h-3.5 text-veda-orange relative z-10" />
                              <div className="relative z-10">
                                <div className="text-[9px] font-bold truncate">Biology</div>
                                <div className="text-[7px] text-white/55 font-medium">15 items</div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 my-1.5 text-[10px] text-left">
                            <div className="flex items-center justify-between bg-[#F5F5F7] p-2 rounded-lg border border-black/5">
                              <div className="flex items-center gap-2">
                                <Bookmark className="w-3.5 h-3.5 text-veda-orange shrink-0" />
                                <span className="font-bold text-veda-dark truncate max-w-[180px]">Limits & Derivatives Cheat Sheet</span>
                              </div>
                              <span className="text-[8px] text-veda-dark/40 font-semibold shrink-0">Maths</span>
                            </div>

                            <div className="flex items-center justify-between bg-[#F5F5F7] p-2 rounded-lg border border-black/5">
                              <div className="flex items-center gap-2">
                                <Bookmark className="w-3.5 h-3.5 text-veda-orange shrink-0" />
                                <span className="font-bold text-veda-dark truncate max-w-[180px]">Alkanes & Alkynes Reaction Map</span>
                              </div>
                              <span className="text-[8px] text-veda-dark/40 font-semibold shrink-0">Chemistry</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 bg-[#F5F5F7] rounded-lg p-2 border border-black/5 text-[9px] font-semibold text-veda-dark/60">
                            <GraduationCap className="w-3.5 h-3.5 text-veda-orange shrink-0" />
                            <span>Easily organize curriculum by subjects and topics</span>
                          </div>
                        </div>
                      )}

                      {index === 1 && (
                        /* Card 1: Discovery Hub Mockup */
                        <div className="flex flex-col h-full justify-between">
                          <div className="flex items-center justify-between border-b border-black/5 pb-2">
                            <div className="flex items-center gap-1.5 font-bold text-veda-dark">
                              <Search className="w-4 h-4 text-veda-orange" />
                              <span>Resource Discovery</span>
                            </div>
                            <span className="text-[9px] font-bold text-veda-dark/40">External Search</span>
                          </div>

                          <div className="bg-[#F5F5F7] rounded-xl px-3 py-2 flex items-center justify-between text-[11px] border border-black/5 my-1.5">
                            <div className="flex items-center text-veda-dark font-bold">
                              <span>Quantum Mechanics</span>
                              <span className="w-[1.5px] h-3.5 bg-veda-orange ml-0.5"></span>
                            </div>
                            <Search className="w-3.5 h-3.5 text-veda-dark/40" />
                          </div>

                          <div className="flex gap-1.5 my-1 overflow-x-auto pb-1 text-[8px]">
                            <span className="px-2.5 py-1 rounded-full font-bold bg-veda-orange text-white shadow-sm shrink-0">Physics</span>
                            <span className="px-2.5 py-1 rounded-full font-bold bg-[#F5F5F7] text-veda-dark/50 border border-black/5 shrink-0">Chemistry</span>
                            <span className="px-2.5 py-1 rounded-full font-bold bg-[#F5F5F7] text-veda-dark/50 border border-black/5 shrink-0">Biology</span>
                          </div>

                          <div className="flex flex-col gap-2.5 my-1 text-left">
                            <div className="bg-[#F5F5F7]/80 rounded-xl p-2.5 border border-black/5 flex justify-between items-center gap-2">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-veda-dark text-veda-orange shadow-glow border border-veda-orange/10 flex items-center justify-center shrink-0">
                                  <BookOpen className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="font-bold text-veda-dark text-[10px] truncate max-w-[130px]">Intro to Quantum Physics</div>
                                  <div className="text-[8px] text-veda-dark/40 font-semibold flex items-center gap-1.5">
                                    <span>Video</span>
                                    <span>&bull;</span>
                                    <span>Class 11</span>
                                  </div>
                                </div>
                              </div>
                              <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[8px] font-extrabold shrink-0 border border-amber-200">
                                ★ 4.8
                              </span>
                            </div>

                            <div className="bg-[#F5F5F7]/80 rounded-xl p-2.5 border border-black/5 flex justify-between items-center gap-2">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-veda-dark text-veda-orange shadow-glow border border-veda-orange/10 flex items-center justify-center shrink-0">
                                  <GraduationCap className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="font-bold text-veda-dark text-[10px] truncate max-w-[130px]">Thermodynamics Guide</div>
                                  <div className="text-[8px] text-veda-dark/40 font-semibold flex items-center gap-1.5">
                                    <span>PDF Ebook</span>
                                    <span>&bull;</span>
                                    <span>Class 12</span>
                                  </div>
                                </div>
                              </div>
                              <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[8px] font-extrabold shrink-0 border border-amber-200">
                                ★ 4.9
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 text-[8px] font-bold text-veda-dark/45 mt-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-veda-orange shrink-0" />
                            <span>Save directly to your folders</span>
                          </div>
                        </div>
                      )}

                      {index === 2 && (
                        /* Card 2: Question Creator Mockup */
                        <div className="flex flex-col h-full justify-between">
                          <div className="flex items-center justify-between border-b border-black/5 pb-2">
                            <div className="flex items-center gap-1.5 font-bold text-veda-dark">
                              <Sparkles className="w-4 h-4 text-veda-orange" />
                              <span>Create Assignment</span>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-veda-orange/10 text-[8px] font-bold text-veda-orange animate-pulse">
                              Active
                            </span>
                          </div>

                          <div className="border border-dashed border-veda-orange/30 bg-orange-50/15 rounded-xl p-2.5 my-1.5 text-center flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-white shadow-sm border border-black/5 flex items-center justify-center text-veda-orange shrink-0">
                                <BookOpen className="w-4 h-4" />
                              </div>
                              <div className="text-left">
                                <div className="font-bold text-veda-dark truncate max-w-[130px]">Physics_Ch_4_Force.pdf</div>
                                <div className="text-[8px] text-veda-dark/40">2.4 MB &bull; Uploaded</div>
                              </div>
                            </div>
                            <CheckCircle2 className="w-4 h-4 text-[#0E703C] shrink-0" />
                          </div>

                          <div className="flex gap-2 my-0.5">
                            <div className="flex-1 bg-[#F5F5F7] border border-black/5 p-1 rounded-lg text-left">
                              <div className="text-[7px] font-bold text-veda-dark/40 uppercase">Class</div>
                              <div className="font-bold text-veda-dark text-[9px]">Class 11</div>
                            </div>
                            <div className="flex-1 bg-[#F5F5F7] border border-black/5 p-1 rounded-lg text-left">
                              <div className="text-[7px] font-bold text-veda-dark/40 uppercase">Subject</div>
                              <div className="font-bold text-veda-dark text-[9px]">Physics</div>
                            </div>
                            <div className="flex-1 bg-[#F5F5F7] border border-black/5 p-1 rounded-lg text-left">
                              <div className="text-[7px] font-bold text-veda-dark/40 uppercase">Difficulty</div>
                              <div className="font-bold text-veda-orange text-[9px]">Medium</div>
                            </div>
                          </div>

                          <div className="bg-[#F5F5F7] border border-black/5 rounded-xl p-2 text-left my-1 relative">
                            <div className="absolute right-1.5 top-1.5 bg-veda-orange/10 text-[7px] font-bold text-veda-orange px-1.5 py-0.5 rounded">
                              Subjective
                            </div>
                            <span className="text-veda-orange font-bold mr-1">Q1.</span> 
                            <span className="text-veda-dark font-medium leading-normal text-[9px]">State Newton&apos;s second law of motion and derive the formula F = ma.</span>
                          </div>

                          <div className="flex items-center gap-1.5 bg-[#F5F5F7]/50 rounded-lg p-1.5 border border-dashed border-black/5 text-[8px] font-medium text-veda-dark/40 text-left">
                            <span className="w-1 h-1 bg-veda-orange rounded-full animate-ping shrink-0" />
                            <span>Formulating 9 more questions from curriculum...</span>
                          </div>
                        </div>
                      )}

                      {index === 3 && (
                        /* Card 3: Dashboard Mockup */
                        <div className="flex flex-col h-full justify-between">
                          <div className="flex items-center justify-between border-b border-black/5 pb-2">
                            <div className="flex items-center gap-1.5 font-bold text-veda-dark">
                              <Image src="/logo.png" alt="Logo" width={14} height={14} className="rounded" />
                              <span>VedaAI Dashboard</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-veda-dark/40">
                              <span className="text-[9px] font-semibold">Home</span>
                              <div className="w-4.5 h-4.5 rounded-full bg-veda-orange/10 border border-black/5 relative overflow-hidden">
                                <Image
                                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80"
                                  alt="User"
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="text-left my-1">
                            <h4 className="font-extrabold text-veda-dark text-xs">Hi Madhur</h4>
                            <p className="text-[9px] text-veda-dark/50">Ready to review your assignments?</p>
                          </div>

                          <div className="grid grid-cols-3 gap-1.5 my-1 text-[9px] text-left">
                            <div className="bg-[#F5F5F7] p-1.5 rounded-lg border border-black/5 flex flex-col justify-between h-[48px]">
                              <span className="text-[7px] font-bold text-veda-dark/50 leading-tight">Reviewed</span>
                              <div className="flex items-baseline gap-0.5">
                                <span className="font-extrabold text-veda-orange text-xs">67</span>
                              </div>
                            </div>
                            <div className="bg-[#F5F5F7] p-1.5 rounded-lg border border-black/5 flex flex-col justify-between h-[48px]">
                              <span className="text-[7px] font-bold text-veda-dark/50 leading-tight">Saved by AI</span>
                              <div className="flex items-baseline gap-0.5">
                                <span className="font-extrabold text-veda-dark text-xs">31.7</span>
                                <span className="text-[6px] text-veda-dark/40 font-semibold">hrs</span>
                              </div>
                            </div>
                            <div className="bg-[#F5F5F7] p-1.5 rounded-lg border border-black/5 flex flex-col justify-between h-[48px]">
                              <span className="text-[7px] font-bold text-veda-dark/50 leading-tight">Graded</span>
                              <div className="flex items-baseline">
                                <span className="font-extrabold text-veda-dark text-xs">128</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1.5 my-1 text-[9px] text-left">
                            <div className="flex items-center justify-between bg-[#F5F5F7]/50 p-1.5 rounded-lg border border-black/5">
                              <div>
                                <div className="font-bold text-veda-dark text-[9px]">Assignment on Motion</div>
                                <div className="text-[7px] text-veda-dark/40">Class 11A &bull; Science</div>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[8px] font-bold text-veda-dark">50/50</span>
                                <span className="px-1.5 py-0.5 rounded-full text-[7px] font-bold bg-[#E8F8F0] text-[#0E703C]">Active</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between bg-[#F5F5F7]/50 p-1.5 rounded-lg border border-black/5">
                              <div>
                                <div className="font-bold text-veda-dark text-[9px]">Quiz on Electricity</div>
                                <div className="text-[7px] text-veda-dark/40">Class 10B &bull; Physics</div>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[8px] font-bold text-veda-dark text-veda-dark/40">47/50</span>
                                <span className="px-1.5 py-0.5 rounded-full text-[7px] font-bold bg-[#F4F4F5] text-[#71717A]">Closed</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end mt-1">
                            <button className="bg-[#1F1F1F] text-white rounded-full px-2.5 py-1 text-[8px] font-bold flex items-center gap-1 shadow-glow border border-veda-orange/20 hover:bg-black transition-colors">
                              <Sparkles className="w-2.5 h-2.5 text-veda-orange animate-pulse" />
                              <span>Create Assignment</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </div>

        {/* Value Prop Statement */}
        <section className="max-w-6xl mx-auto px-6 text-center mb-32" id="about">
          <h2 ref={scrollTextRef} className="text-3xl md:text-5xl font-bold leading-snug tracking-tight">
            {"VedaAI is an intelligent platform designed for modern educators to design curriculum, generate customized assignments, and organize resources to elevate the academic experience without increasing workload.".split(" ").map((word, index, arr) => {
              const wordProgress = index / arr.length;
              const start = wordProgress * 0.85;
              const end = start + 0.15;
              
              let wordP = (scrollProgress - start) / (end - start);
              if (wordP < 0) wordP = 0;
              if (wordP > 1) wordP = 1;
              
              const opacity = 0.25 + wordP * 0.75;
              
              return (
                <span 
                  key={index} 
                  style={{ color: `rgba(31, 31, 31, ${opacity})` }}
                >
                  {word}{index < arr.length - 1 ? " " : ""}
                </span>
              );
            })}
          </h2>
        </section>

        {/* Create Assignment Feature Preview */}
        <section className="max-w-6xl mx-auto px-6 relative mb-32 flex flex-col items-center">
          <div className="relative w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl border-4 border-white/50 bg-white">
            {/* Stat Overlays */}
            <div className="absolute top-8 left-8 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-lg text-center rotate-[-3deg] border border-black/5 z-20 hidden md:block">
              <div className="text-3xl font-extrabold text-veda-orange">32+</div>
              <div className="text-[11px] font-semibold text-veda-dark/60 uppercase tracking-wider">Hours saved per teacher</div>
            </div>
            <div className="absolute bottom-8 right-8 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-lg text-center rotate-[3deg] border border-black/5 z-20 hidden md:block">
              <div className="text-3xl font-extrabold text-veda-orange">94%</div>
              <div className="text-[11px] font-semibold text-veda-dark/60 uppercase tracking-wider">Faster assignment evaluation</div>
            </div>

            <Image
              alt="VedaAI Create Assignment Screen"
              className="w-full h-auto object-cover"
              src="/screenshot_create.png"
              width={1600}
              height={1000}
            />
          </div>
        </section>

        {/* Dedicated Library & Collections Section */}
        <section className="max-w-6xl mx-auto px-6 mb-32 grid md:grid-cols-2 gap-12 items-center" id="library">
          <div>
            <h2 className="text-4xl font-bold mb-6 text-[#1F1F1F] tracking-tight">
              Organize with Your Personal Library
            </h2>
            <p className="text-veda-dark/70 text-base leading-relaxed mb-8">
              Store, sort, and retrieve all your resources in one secure location. Group academic materials into custom folders like Physics, Biology, and Chemistry to plan curriculum effortlessly.
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="text-veda-orange w-5 h-5 shrink-0" />
                <span className="text-veda-dark/80 text-sm font-medium">Create custom collections to categorize materials</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="text-veda-orange w-5 h-5 shrink-0" />
                <span className="text-veda-dark/80 text-sm font-medium">Filter by resource type - Videos, Articles, Books, Papers</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="text-veda-orange w-5 h-5 shrink-0" />
                <span className="text-veda-dark/80 text-sm font-medium">Access recently saved academic assets in one click</span>
              </li>
            </ul>
          </div>
          <div className="relative rounded-3xl overflow-hidden shadow-xl border border-black/5 bg-white">
            <Image
              alt="VedaAI Library & Collections View"
              className="w-full h-auto object-cover"
              src="/screenshot_library.png"
              width={1000}
              height={600}
            />
          </div>
        </section>

        {/* Features Grid */}
        <section className="max-w-6xl mx-auto px-6 mb-32" id="features">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-[#1F1F1F]">What VedaAI Enables</h2>
            <p className="text-veda-dark/60 max-w-2xl mx-auto text-base">
              VedaAI automates grading, delivers structured feedback, and provides deep learning analytics helping institutions scale quality education effortlessly.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Feature 1 */}
            <div className="bg-[#F3F4F6] rounded-[2rem] p-8 md:p-10 border border-black/5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
              <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-white/40 border border-black/5 shadow-sm flex items-center justify-center p-4">
                <div className="relative w-full h-full rounded-xl overflow-hidden shadow-md border border-black/5 bg-white">
                  <Image
                    alt="VedaAI Dashboard Preview"
                    src="/screenshot_assignments.png"
                    width={800}
                    height={500}
                    className="object-cover object-top w-full h-full transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              </div>
              <div className="mt-6">
                <h3 className="text-2xl font-bold mb-3 text-veda-dark">Turn Data into Actionable Insights</h3>
                <p className="text-veda-dark/65 text-sm md:text-base leading-relaxed">
                  Visualize class trends, identify learning gaps, and make data-backed academic decisions with our built-in performance summaries.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#F3F4F6] rounded-[2rem] p-8 md:p-10 border border-black/5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
              <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-white/40 border border-black/5 shadow-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-5 shadow-md border border-black/5 flex flex-col gap-3.5 w-full max-w-[340px] h-[220px]">
                  <div className="text-xs font-bold text-veda-dark text-left">Search Academic Resources</div>
                  
                  <div className="bg-[#F5F5F7] rounded-xl px-4 py-2 flex items-center justify-between text-xs border border-black/5">
                    <div className="flex items-center text-veda-dark font-semibold">
                      <span>Quantum</span>
                      <span className="w-[1.5px] h-3.5 bg-veda-orange ml-0.5"></span>
                    </div>
                    <Search className="w-3.5 h-3.5 text-veda-dark/40" />
                  </div>

                  <div className="text-[9px] font-bold text-veda-dark/40 uppercase tracking-wider text-left mt-1">
                    Recent searches
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {/* Resource 1 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-veda-orange shrink-0">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <div className="text-[11px] font-bold text-veda-dark">Quantum Physics Intro</div>
                          <div className="text-[9px] font-semibold text-veda-dark/40">Class 11 &bull; Video</div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#FFF1F2] text-[#E11D48]">
                        Physics
                      </span>
                    </div>

                    {/* Resource 2 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 shrink-0">
                          <GraduationCap className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <div className="text-[11px] font-bold text-veda-dark">Organic Reactions</div>
                          <div className="text-[9px] font-semibold text-veda-dark/40">Class 12 &bull; Article</div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#EFF6FF] text-[#2563EB]">
                        Chemistry
                      </span>
                    </div>

                    {/* Resource 3 */}
                    <div className="flex items-center justify-between opacity-50">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <div className="text-[11px] font-bold text-veda-dark">Limits & Derivatives</div>
                          <div className="text-[9px] font-semibold text-veda-dark/40">Class 11 &bull; PDF</div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#ECFDF5] text-[#059669]">
                        Maths
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <h3 className="text-2xl font-bold mb-3 text-veda-dark">Curated Resource Discovery</h3>
                <p className="text-veda-dark/65 text-sm md:text-base leading-relaxed">
                  Explore academic directories containing top-tier articles, sample papers, and interactive guides across subjects.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#F3F4F6] rounded-[2rem] p-8 md:p-10 border border-black/5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
              <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-white/40 border border-black/5 shadow-sm flex items-center justify-center p-4 relative">
                <div className="bg-white rounded-2xl p-5 shadow-md border border-black/5 flex flex-col justify-between w-full max-w-[340px] h-[220px] relative overflow-hidden">
                  {/* Orange background shapes as seen in reference image */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-veda-orange/5 rounded-full blur-2xl pointer-events-none" />
                  
                  {/* Beautiful orbiting orange rings */}
                  <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full border-4 border-dashed border-veda-orange/20 animate-[spin_40s_linear_infinite]" />
                  <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full border-[3px] border-veda-orange/30" />
                  
                  <div className="flex items-center justify-between border-b border-black/5 pb-2.5 z-10">
                    <span className="text-xs font-bold text-veda-dark flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-veda-orange" />
                      AI Question Generator
                    </span>
                    <span className="px-2 py-0.5 rounded bg-veda-orange/10 text-[9px] font-bold text-veda-orange">
                      Active
                    </span>
                  </div>

                  <div className="flex flex-col gap-2.5 z-10 text-left my-2">
                    <div className="bg-[#F5F5F7] rounded-lg p-2.5 border border-black/5 text-[11px] font-semibold text-veda-dark/80 relative">
                      <span className="text-veda-orange mr-1">Q1.</span> What is the law of conservation of energy?
                      <div className="absolute -right-2 -bottom-2 bg-veda-orange text-white rounded-full p-1 shadow-sm">
                        <CheckCircle2 className="w-3 h-3" />
                      </div>
                    </div>
                    
                    <div className="bg-[#F5F5F7]/75 rounded-lg p-2 text-[10px] font-medium text-veda-dark/50 italic border border-dashed border-black/5">
                      Generating subjective & MCQs from "Physics_Ch3.pdf"...
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-bold text-veda-dark/40 z-10">
                    <span>Difficulty: Medium</span>
                    <span className="text-veda-orange font-semibold">10 Questions</span>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <h3 className="text-2xl font-bold mb-3 text-veda-dark">AI-Powered Question Generation</h3>
                <p className="text-veda-dark/65 text-sm md:text-base leading-relaxed">
                  Create fully tailored assignments, subjective, and objective questions from your uploaded textbook chapters or PDFs.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="bg-[#F3F4F6] rounded-[2rem] p-8 md:p-10 border border-black/5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
              <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-white/40 border border-black/5 shadow-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-5 shadow-md border border-black/5 flex flex-col justify-between w-full max-w-[340px] h-[220px] relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-black/5 pb-2.5 z-10">
                    <span className="text-xs font-bold text-veda-dark flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-veda-orange" />
                      My Library
                    </span>
                    <span className="text-[10px] font-bold text-veda-dark/40">3 Collections</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 my-2.5 z-10 text-left">
                    {/* Folder 1 */}
                    <div className="bg-[#1F1F1F] text-white rounded-xl p-2.5 border border-black/10 flex flex-col gap-2 relative shadow-md hover:scale-105 transition-transform duration-300">
                      <div className="absolute inset-0 bg-veda-orange/10 opacity-30 blur-sm rounded-xl" />
                      <FolderHeart className="w-4 h-4 text-veda-orange relative z-10" />
                      <div className="relative z-10">
                        <div className="text-[10px] font-bold truncate">Physics</div>
                        <div className="text-[8px] text-white/55 font-medium">12 items</div>
                      </div>
                    </div>

                    {/* Folder 2 */}
                    <div className="bg-[#1F1F1F] text-white rounded-xl p-2.5 border border-black/10 flex flex-col gap-2 relative shadow-md hover:scale-105 transition-transform duration-300">
                      <div className="absolute inset-0 bg-veda-orange/10 opacity-30 blur-sm rounded-xl" />
                      <FolderHeart className="w-4 h-4 text-veda-orange relative z-10" />
                      <div className="relative z-10">
                        <div className="text-[10px] font-bold truncate">Chemistry</div>
                        <div className="text-[8px] text-white/55 font-medium">8 items</div>
                      </div>
                    </div>

                    {/* Folder 3 */}
                    <div className="bg-[#1F1F1F] text-white rounded-xl p-2.5 border border-black/10 flex flex-col gap-2 relative shadow-md hover:scale-105 transition-transform duration-300">
                      <div className="absolute inset-0 bg-veda-orange/10 opacity-30 blur-sm rounded-xl" />
                      <FolderHeart className="w-4 h-4 text-veda-orange relative z-10" />
                      <div className="relative z-10">
                        <div className="text-[10px] font-bold truncate">Biology</div>
                        <div className="text-[8px] text-white/55 font-medium">15 items</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-[#F5F5F7] rounded-lg p-2 border border-black/5 text-[9px] font-semibold text-veda-dark/60 z-10">
                    <GraduationCap className="w-3.5 h-3.5 text-veda-orange shrink-0" />
                    <span>Curated academic materials ready to assign</span>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <h3 className="text-2xl font-bold mb-3 text-veda-dark">Curated Library & Collections</h3>
                <p className="text-veda-dark/65 text-sm md:text-base leading-relaxed">
                  Organize, categorize, and access your custom collections of articles, videos, and papers for quick reference and assignment planning.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Deep Dive Resource Discovery */}
        <section className="max-w-6xl mx-auto px-6 mb-32" id="discovery">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-[#1F1F1F]">Explore Resource Discovery</h2>
            <p className="text-veda-dark/60 max-w-2xl mx-auto text-base">
              A comprehensive directory designed to help educators find, collect, and save relevant academic resources.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-4 shadow-xl border border-black/5 mb-12 max-w-5xl mx-auto">
            <Image
              alt="Full Discovery Dashboard"
              className="w-full h-auto rounded-2xl border border-black/5"
              src="/screenshot_discovery.png"
              width={1600}
              height={900}
            />
          </div>

          <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 shadow-sm border border-black/5">
            <ul className="grid sm:grid-cols-2 gap-4">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="text-veda-orange w-5 h-5 mt-0.5 shrink-0" />
                <span className="text-veda-dark/80 text-sm font-medium">Search academic materials by keyword</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="text-veda-orange w-5 h-5 mt-0.5 shrink-0" />
                <span className="text-veda-dark/80 text-sm font-medium">Filter by subject and source registry</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="text-veda-orange w-5 h-5 mt-0.5 shrink-0" />
                <span className="text-veda-dark/80 text-sm font-medium">Save resources directly to collections</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="text-veda-orange w-5 h-5 mt-0.5 shrink-0" />
                <span className="text-veda-dark/80 text-sm font-medium">Assign materials straight to classroom groups</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="text-veda-orange w-5 h-5 mt-0.5 shrink-0" />
                <span className="text-veda-dark/80 text-sm font-medium">Fully customisable query settings</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="text-veda-orange w-5 h-5 mt-0.5 shrink-0" />
                <span className="text-veda-dark/80 text-sm font-medium">Fast real-time data retrieval</span>
              </li>
            </ul>
          </div>
        </section>
      </main>

      <footer className="bg-white py-12 border-t border-black/5 text-center">
        <p className="text-sm font-semibold text-veda-dark/45">
          &copy; {new Date().getFullYear()} VedaAI. All rights reserved.
        </p>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 800ms cubic-bezier(0.215, 0.61, 0.355, 1) forwards;
        }
        .animate-fade-in-right {
          animation: fadeInRight 900ms cubic-bezier(0.215, 0.61, 0.355, 1) forwards;
        }
      `}} />
    </div>
  );
}
