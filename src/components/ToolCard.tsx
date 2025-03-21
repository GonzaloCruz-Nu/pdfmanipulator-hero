
import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ToolCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  to: string;
  className?: string;
  maintenance?: boolean;
  isNew?: boolean;
}

const ToolCard: React.FC<ToolCardProps> = ({
  title,
  description,
  icon: Icon,
  to,
  className,
  maintenance = false,
  isNew = false,
}) => {
  // Define common styling for both versions of the card
  const cardStyles = cn(
    "group relative flex flex-col items-center rounded-xl p-4 shadow-sm border",
    maintenance 
      ? "bg-card/80 border-border opacity-70 cursor-not-allowed" 
      : "bg-card border-border hover:border-primary/20 card-hover",
    className
  );

  // Render different components based on the maintenance state
  if (maintenance) {
    return (
      <div className={cardStyles}>
        <div className="mb-3 rounded-full bg-primary/10 p-3 text-primary transition-transform group-hover:scale-110">
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="mb-1 text-base font-medium text-foreground flex items-center justify-center gap-2">
          {title}
          {isNew && (
            <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 text-[10px] dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-400">
              NUEVO
            </Badge>
          )}
        </h3>
        <p className="text-center text-muted-foreground text-xs">{description}</p>
        <div className="mt-2 text-amber-600 dark:text-amber-400 text-xs font-medium">
          En desarrollo
        </div>
      </div>
    );
  }

  // Return the Link version for non-maintenance tools
  return (
    <Link to={to} className={cardStyles}>
      <div className="mb-3 rounded-full bg-primary/10 p-3 text-primary transition-transform group-hover:scale-110">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mb-1 text-base font-medium text-foreground flex items-center justify-center gap-2">
        {title}
        {isNew && (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 text-[10px] dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-400">
            NUEVO
          </Badge>
        )}
      </h3>
      <p className="text-center text-muted-foreground text-xs">{description}</p>
      <div className="mt-2 text-primary text-xs font-medium opacity-0 group-hover:opacity-100 transition-all duration-200">
        Usar →
      </div>
    </Link>
  );
};

export default ToolCard;
