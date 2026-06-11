"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/shared/AppLayout";
import HeroSection from "@/components/home/HeroSection";
import DistributionStatsSection from "@/components/home/DistributionStatsSection";
import ReligiousEducationSection from "@/components/home/ReligiousEducationSection";
import RemoteSPPGSection from "@/components/home/RemoteSPPGSection";
import StatsSection from "@/components/shared/StatsSection";
import AboutSection from "@/components/shared/AboutSection";
import { 
  DistributionStatsSkeleton,
  ReligiousEducationSkeleton,
  RemoteSPPGSkeleton
} from "@/components/shared/HomeSectionSkeletons";

export default function Home() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Optimized loading - reduce delay for better UX
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AppLayout className="bg-white">
      {/* Hero Section - Has its own loading state */}
      <HeroSection />

      {/* Distribution Statistics Section with Skeleton */}
      {loading ? <DistributionStatsSkeleton /> : <DistributionStatsSection />}

      {/* Religious Education Section with Skeleton */}
      {/* {loading ? <ReligiousEducationSkeleton /> : <ReligiousEducationSection />} */}

      {/* Remote SPPG Section with Skeleton */}
      {/* {loading ? <RemoteSPPGSkeleton /> : <RemoteSPPGSection />} */}

      {/* Stats Section */}
      {/* <StatsSection /> */}

      {/* About Section */}
      <div id="about">
        <AboutSection />
      </div>
    </AppLayout>
  );
}
