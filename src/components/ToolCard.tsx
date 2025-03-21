
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
  return (
    <Link
      to={to}
      className={cn(
        "group relative flex flex-col items-center rounded-xl p-4 bg-white shadow-subtle card-hover",
        className
      )}
    >
      <div className="mb-2 rounded-full bg-primary/10 p-2 text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mb-1 text-base font-medium">
        {title}
        {isNew && (
          <Badge variant="outline" className="ml-2 bg-emerald-50 text-emerald-600 border-emerald-200 text-[10px]">
            NUEVO
          </Badge>
        )}
      </h3>
      <p className="text-center text-muted-foreground text-xs">{description}</p>
      {maintenance && (
        <div className="mt-2 text-amber-600 text-xs font-medium">
          En mantenimiento
        </div>
      )}
      {!maintenance && (
        <div className="mt-2 text-primary text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          Usar →
        </div>
      )}
    </Link>
  );
};

export default ToolCard;
