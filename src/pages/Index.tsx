import { useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import HeroSection from '@/components/home/HeroSection';
import FeaturedProperties from '@/components/home/FeaturedProperties';
import MapPreview from '@/components/home/MapPreview';
import CalculatorSection from '@/components/home/CalculatorSection';
import TransitionBanner from '@/components/home/TransitionBanner';
import TestimonialsSection from '@/components/home/TestimonialsSection';
import SuccessCasesSlider from '@/components/home/SuccessCasesSlider';
import { scrollToHashElement } from '@/lib/hashScroll';

function SectionDivider() {
  return (
    <div className="container">
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="w-2 h-2 rounded-full bg-primary/20" />
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      </div>
    </div>
  );
}

export default function Index() {
  useEffect(() => {
    const raw = window.location.hash.replace(/^#/, '');
    if (!raw || !['calculadora', 'contacto'].includes(raw)) return;
    const t = window.setTimeout(() => scrollToHashElement(raw), 120);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <Layout>
      <HeroSection />
      <TestimonialsSection />
      <SectionDivider />
      <FeaturedProperties />
      <TransitionBanner />
      <SectionDivider />
      <SuccessCasesSlider />
      <SectionDivider />
      <MapPreview />
      <SectionDivider />
      <CalculatorSection />
    </Layout>
  );
}
