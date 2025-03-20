
import React from 'react';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="py-6">
      <div className="container flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2 text-foreground">
          <FileText className="h-8 w-8 text-primary" />
          <span className="text-xl font-medium">PDF Local Studio</span>
        </Link>
        <nav className="hidden md:block">
          <ul className="flex space-x-8">
            <li>
              <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
                Inicio
              </Link>
            </li>
            <li>
              <Link to="/tools" className="text-muted-foreground hover:text-foreground transition-colors">
                Herramientas
              </Link>
            </li>
            <li>
              <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">
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
