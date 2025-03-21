
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText } from 'lucide-react';

const Header: React.FC = () => {
  const location = useLocation();

  return (
    <header className="py-8">
      <div className="container flex flex-col items-center justify-center">
        <Link to="/" className="flex items-center space-x-3 text-foreground mb-6">
          <FileText className="h-12 w-12 text-naranja" />
          <div className="flex flex-col">
            <span className="text-2xl font-bold">PDFmanager</span>
            <span className="text-sm text-muted-foreground">by CoHispania</span>
          </div>
        </Link>
        
        <nav className="w-full">
          <ul className="flex justify-center space-x-8">
            <li>
              <Link 
                to="/" 
                className={`${location.pathname === '/' ? 'text-foreground font-medium' : 'text-muted-foreground'} hover:text-foreground transition-colors`}
              >
                Herramientas
              </Link>
            </li>
            <li>
              <Link 
                to="/wiki" 
                className={`${location.pathname === '/wiki' ? 'text-foreground font-medium' : 'text-muted-foreground'} hover:text-foreground transition-colors`}
              >
                Wiki
              </Link>
            </li>
            <li>
              <Link 
                to="/about" 
                className={`${location.pathname === '/about' ? 'text-foreground font-medium' : 'text-muted-foreground'} hover:text-foreground transition-colors`}
              >
                Acerca de
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
