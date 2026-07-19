"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle, Activity, Users, Trophy, MapPin, Sparkles } from "lucide-react";
import Link from "next/link";
import { useAppStore } from "@/store/app-store";

const steps = [
  {
    icon: Activity,
    title: "Track Your Runs",
    description: "Log your activities, view your stats, and track your progress over time.",
  },
  {
    icon: Users,
    title: "Join Communities",
    description: "Connect with other runners, join clubs, and share your journey.",
  },
  {
    icon: Trophy,
    title: "Complete Challenges",
    description: "Join fitness challenges, earn achievements, and climb the leaderboard.",
  },
  {
    icon: MapPin,
    title: "Discover Events",
    description: "Find running events near you and register for races.",
  },
];

function WelcomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const profile = useAppStore((s) => s.profile);
  const [currentStep, setCurrentStep] = useState(0);
  const [skipped, setSkipped] = useState(false);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      router.push(redirectTo);
    }
  };

  const handleSkip = () => {
    setSkipped(true);
    router.push(redirectTo);
  };

  const CurrentIcon = steps[currentStep].icon;

  return (
    <div className="min-h-screen bg-background text-white overflow-hidden relative">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-white/[0.02] rounded-full blur-[80px]" />
      </div>

      <div className="fixed top-6 left-6 md:top-8 md:left-8 z-20">
        <Link href="/" className="text-lg font-bold tracking-tight">
          ZERO<span className="text-primary">6</span>
        </Link>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="glass-strong p-8 sm:p-10">
            <div className="flex flex-col items-center mb-8">
              <div className="badge inline-flex items-center gap-2 mb-4">
                <Sparkles className="w-3 h-3" />
                Welcome
              </div>
              <h1 className="heading-xl text-2xl mb-1">Welcome to ZERO6</h1>
              <p className="text-sm text-muted">
                {profile?.name ? `Hi ${profile.name.split(" ")[0]}!` : "Let's get you started"}
              </p>
            </div>

            <div className="mb-8">
              <div className="flex gap-2">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1 flex-1 rounded-full transition-all ${
                      index <= currentStep ? "bg-primary" : "bg-secondary"
                    }`}
                  />
                ))}
              </div>
            </div>

            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-col items-center text-center space-y-4 mb-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <CurrentIcon className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h2 className="heading-lg text-xl">{steps[currentStep].title}</h2>
                  <p className="mt-2 text-sm text-muted">
                    {steps[currentStep].description}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleNext}
                  className="btn-primary w-full h-11 flex items-center justify-center gap-2 text-sm"
                >
                  {currentStep === steps.length - 1 ? (
                    <>
                      Get Started <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    "Continue"
                  )}
                </button>
                <button
                  onClick={handleSkip}
                  className="btn-secondary w-full h-11 text-sm"
                >
                  Skip for now
                </button>
              </div>
            </motion.div>

            <div className="mt-6 rounded-xl bg-secondary/50 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-success shrink-0 mt-0.5" />
                <div className="text-xs text-muted">
                  <p className="font-medium text-foreground mb-1">Quick Start Tips</p>
                  <ul className="space-y-1">
                    <li>{"\u2022"} Log your first activity to start tracking</li>
                    <li>{"\u2022"} Complete your profile to connect with others</li>
                    <li>{"\u2022"} Join a challenge to earn XP and achievements</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin w-5 h-5 border border-primary border-t-transparent rounded-full" /></div>}>
      <WelcomeContent />
    </Suspense>
  );
}
