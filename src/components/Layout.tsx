
import React from 'react';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, className }) => {
  console.log('Layout rendering with children:', children ? 'has children' : 'no children');
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={cn("page-transition", className)}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
