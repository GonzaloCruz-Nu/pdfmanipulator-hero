
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { Button } from '@/components/ui/button';

const Header: React.FC = () => {
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center space-x-3 text-foreground">
          <FileText className="h-8 w-8 text-naranja" />
          <div className="flex flex-col">
            <span className="text-xl font-bold">PDFmanager</span>
            <span className="text-xs text-muted-foreground">by CoHispania</span>
          </div>
        </Link>
        
        <nav className="hidden md:block">
          <ul className="flex space-x-8">
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
            <li>
              <Link 
                to="/historial" 
                className={`${location.pathname === '/historial' ? 'text-foreground font-medium' : 'text-muted-foreground'} hover:text-foreground transition-colors`}
              >
                Historial
              </Link>
            </li>
          </ul>
        </nav>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
            <span className="sr-only">Cambiar tema</span>
          </Button>
          
          <div className="block md:hidden">
            <Button variant="ghost" size="icon" className="md:hidden">
              <span className="sr-only">Abrir menú</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
