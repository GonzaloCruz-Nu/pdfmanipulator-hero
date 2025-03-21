
import React from 'react';
import { cn } from '@/lib/utils';
import Footer from './Footer';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, className }) => {
  console.log('Layout rendering with children:', children ? 'has children' : 'no children');
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex flex-col">
      <Header />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex-1">
        <div className={cn("page-transition", className)}>
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
