import React from 'react'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  isLoading?: boolean
  children?: React.ReactNode
  count?: number
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  isLoading = true,
  children,
  count = 1,
  ...props
}) => {
  if (!isLoading && children) {
    return <>{children}</>
  }

  const skeletons = Array.from({ length: count }).map((_, i) => (
    <div
      key={i}
      className={`animate-pulse rounded-md bg-muted ${className}`}
      {...props}
    />
  ))

  return <>{skeletons}</>
}

export const SkeletonCard: React.FC<{ count?: number }> = ({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3 rounded-lg border border-border bg-card p-5 shadow-xs">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="space-y-2 pt-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
          </div>
        </div>
      ))}
    </>
  )
}

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 4,
}) => {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, rowI) => (
        <div key={rowI} className="flex gap-4">
          {Array.from({ length: cols }).map((_, colI) => (
            <Skeleton
              key={colI}
              className="h-8 flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export const SkeletonAvatar: React.FC = () => {
  return <Skeleton className="h-10 w-10 rounded-full" />
}

export const SkeletonText: React.FC<{ lines?: number }> = ({ lines = 3 }) => {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === lines - 1 ? 'w-5/6' : 'w-full'}`}
        />
      ))}
    </div>
  )
}

export const SkeletonButton: React.FC = () => {
  return <Skeleton className="h-10 w-24 rounded-md" />
}
