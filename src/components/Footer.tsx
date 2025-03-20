
import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="py-6 border-t border-border/40 mt-auto">
      <div className="container flex flex-col md:flex-row items-center justify-between">
        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
          <span>© {currentYear}</span>
          <span className="font-medium">CoHispania 2025</span>
        </div>
        
        <div className="flex items-center mt-4 md:mt-0">
          <span className="text-sm text-muted-foreground flex items-center">
            Creado con <Heart className="h-3 w-3 mx-1 text-naranja" /> para nuestros usuarios
          </span>
        </div>
        
        <nav className="mt-4 md:mt-0">
          <ul className="flex space-x-4 text-sm text-muted-foreground">
            <li>
              <Link to="/" className="hover:text-foreground transition-colors">
                Inicio
              </Link>
            </li>
            <li>
              <Link to="/tools" className="hover:text-foreground transition-colors">
                Herramientas
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-foreground transition-colors">
                Acerca de
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
