
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
  // If the tool is under maintenance, render a div instead of a Link
  const CardComponent = maintenance ? 'div' : Link;
  const cardProps = maintenance 
    ? { className: cn(
        "group relative flex flex-col items-center rounded-xl p-4 bg-card/80 shadow-sm border border-border opacity-70 cursor-not-allowed",
        className
      )}
    : { 
        to, 
        className: cn(
          "group relative flex flex-col items-center rounded-xl p-4 bg-card shadow-sm border border-border hover:border-primary/20 card-hover",
          className
        )
      };

  return (
    <CardComponent {...cardProps}>
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
      {maintenance && (
        <div className="mt-2 text-amber-600 dark:text-amber-400 text-xs font-medium">
          En desarrollo
        </div>
      )}
      {!maintenance && (
        <div className="mt-2 text-primary text-xs font-medium opacity-0 group-hover:opacity-100 transition-all duration-200">
          Usar →
        </div>
      )}
    </CardComponent>
  );
};

export default ToolCard;
