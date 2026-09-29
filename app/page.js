'use client';

import HeroSlider from '@/components/HeroSlider';
import LiveTelemetry from '@/components/LiveTelemetry';
import CorePillars from '@/components/CorePillars';
import Testimonials from '@/components/Testimonials';
import FactionArmory from '@/components/FactionArmory';
import CommandCenterFeed from '@/components/CommandCenterFeed';
import CommunityHub from '@/components/CommunityHub';
import DownloadHub from '@/components/DownloadHub';

export default function HomePage() {
  return (
    <>
      {/* 1. Cinematic Multi-Slide Hero with Canvas Particles */}
      <HeroSlider />

      {/* 2. Live Telemetry Ticker (Pioneers, Sectors, Voxel Shards, Ping) */}
      <LiveTelemetry />

      {/* 3. Core Pillars: 4 Alternating Feature Blocks (Scale, Terrain, Controls, Tactics) */}
      <CorePillars />

      {/* 4. Testimonials & Press Accolades Carousel */}
      <Testimonials />

      {/* 5. Interactive Faction Armory & Tech Tree Database */}
      <FactionArmory />

      {/* 6. Command Center Feed: 4-Tab Matrix (News, Devlog, Maps, Guides) */}
      <CommandCenterFeed />

      {/* 7. Community Hub, Discord & Competitive League */}
      <CommunityHub />

      {/* 8. Cross-Platform Download Hub & System Requirements */}
      <DownloadHub />
    </>
  );
}
