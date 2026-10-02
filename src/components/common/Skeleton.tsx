import React from 'react';

export interface SkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
}) => {
  const variantStyles = {
    rectangular: 'rounded-xl',
    circular: 'rounded-full',
    text: 'rounded-md h-4 my-1',
  };

  const style: React.CSSProperties = {
    width: width !== undefined ? width : undefined,
    height: height !== undefined ? height : undefined,
  };

  return (
    <div
      style={style}
      className={`
        animate-pulse 
        bg-slate-200/80 dark:bg-slate-800/80
        ${variantStyles[variant]}
        ${className}
      `}
    />
  );
};

export const StatCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton variant="text" width="40%" height={16} />
        <Skeleton variant="circular" width={36} height={36} />
      </div>
      <Skeleton variant="text" width="60%" height={28} />
      <div className="flex items-center gap-2 pt-1">
        <Skeleton variant="text" width="50%" height={14} />
      </div>
    </div>
  );
};

export const TableRowSkeleton: React.FC<{ cols?: number }> = ({ cols = 5 }) => {
  return (
    <tr className="border-b border-slate-100 dark:border-slate-800 animate-pulse">
      {Array.from({ length: cols }).map((_, index) => (
        <td key={index} className="py-3 px-4">
          <Skeleton variant="text" width={`${Math.floor(50 + Math.random() * 40)}%`} height={14} />
        </td>
      ))}
    </tr>
  );
};
