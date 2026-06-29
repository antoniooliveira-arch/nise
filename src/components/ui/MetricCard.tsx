import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Card from './Card';

interface MetricCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  change?: number;
  changeLabel?: string;
  color?: 'blue' | 'green' | 'amber' | 'red' | 'slate';
}

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  icon: Icon,
  change,
  changeLabel,
  color = 'blue'
}) => {
  const colors = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      ring: 'hover:ring-blue-100',
    },
    green: {
      bg: 'bg-green-50',
      icon: 'text-green-600',
      ring: 'hover:ring-green-100',
    },
    amber: {
      bg: 'bg-amber-50',
      icon: 'text-amber-600',
      ring: 'hover:ring-amber-100',
    },
    red: {
      bg: 'bg-red-50',
      icon: 'text-red-600',
      ring: 'hover:ring-red-100',
    },
    slate: {
      bg: 'bg-slate-50',
      icon: 'text-slate-600',
      ring: 'hover:ring-slate-100',
    },
  };

  const colorScheme = colors[color];

  const getTrendIcon = () => {
    if (change === undefined) return null;
    if (change > 0) return <TrendingUp className="w-3 h-3" />;
    if (change < 0) return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  const getTrendColor = () => {
    if (change === undefined) return '';
    if (change > 0) return 'text-red-600';
    if (change < 0) return 'text-green-600';
    return 'text-gray-600';
  };

  return (
    <Card hover className={`transition-all duration-200 border border-slate-200/80 ${colorScheme.ring}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-lg ${colorScheme.bg} border border-current/10`}>
          <Icon className={`w-5 h-5 ${colorScheme.icon}`} />
        </div>
        {change !== undefined && (
          <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${getTrendColor()} bg-current/10`}>
            {getTrendIcon()}
            <span className="ml-1">{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
        <p className="text-sm text-slate-500 mt-1 font-medium">{label}</p>
      </div>
      {changeLabel && (
        <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100">{changeLabel}</p>
      )}
    </Card>
  );
};

export default MetricCard;