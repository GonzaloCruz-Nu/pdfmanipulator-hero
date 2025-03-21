
import React from 'react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import HeroSection from '@/components/index-page/HeroSection';
import ToolsGrid from '@/components/index-page/ToolsGrid';
import PrivacyBanner from '@/components/index-page/PrivacyBanner';
import DiagnosticsLogger from '@/components/index-page/DiagnosticsLogger';

const Index = () => {
  console.log('Rendering Index page');

  return (
    <Layout>
      <DiagnosticsLogger />
      <Header />
      
      <div className="pt-8 pb-16">
        <HeroSection />
        <ToolsGrid />
        <PrivacyBanner />
      </div>
    </Layout>
  );
};

export default Index;
