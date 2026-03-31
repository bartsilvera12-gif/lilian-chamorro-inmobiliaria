import { useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import HeroSection from '@/components/home/HeroSection';
import FeaturedProperties from '@/components/home/FeaturedProperties';
import MapPreview from '@/components/home/MapPreview';
import TransitionBanner from '@/components/home/TransitionBanner';
import TestimonialsSection from '@/components/home/TestimonialsSection';
import SuccessCasesSlider from '@/components/home/SuccessCasesSlider';
import { scrollToHashElement } from '@/lib/hashScroll';

export default function Index() {
  useEffect(() => {
    const raw = window.location.hash.replace(/^#/, '');
    if (!raw || !['contacto'].includes(raw)) return;
    const t = window.setTimeout(() => scrollToHashElement(raw), 120);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <Layout>
      <HeroSection />
      <FeaturedProperties />
      <TransitionBanner />
      <SuccessCasesSlider />
      <MapPreview />
      <TestimonialsSection />
    </Layout>
  );
}
