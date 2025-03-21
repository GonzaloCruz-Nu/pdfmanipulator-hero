
import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface ToolCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  to: string;
  className?: string;
}

const ToolCard: React.FC<ToolCardProps> = ({
  title,
  description,
  icon: Icon,
  to,
  className,
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
      <h3 className="mb-1 text-base font-medium">{title}</h3>
      <p className="text-center text-muted-foreground text-xs">{description}</p>
      <div className="mt-2 text-primary text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
        Usar →
      </div>
    </Link>
  );
};

export default ToolCard;
