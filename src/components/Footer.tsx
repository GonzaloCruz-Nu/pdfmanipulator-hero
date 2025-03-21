
import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="py-8 border-t border-naranja/10 mt-auto bg-gradient-to-r from-white to-accent/30">
      <div className="container flex flex-col md:flex-row items-center justify-between">
        <div className="flex items-center space-x-1 text-sm text-secondary">
          <span>© {currentYear}</span>
          <span className="font-medium">CoHispania</span>
        </div>
        
        <div className="flex items-center mt-4 md:mt-0">
          <span className="text-sm text-secondary flex items-center">
            Creado con <Heart className="h-3 w-3 mx-1 text-naranja fill-naranja" /> para nuestros usuarios
          </span>
        </div>
        
        <nav className="mt-4 md:mt-0">
          <ul className="flex space-x-6 text-sm font-medium">
            <li>
              <Link to="/" className="text-secondary hover:text-naranja transition-colors">
                Inicio
              </Link>
            </li>
            <li>
              <Link to="/tools" className="text-secondary hover:text-naranja transition-colors">
                Herramientas
              </Link>
            </li>
            <li>
              <Link to="/about" className="text-secondary hover:text-naranja transition-colors">
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
