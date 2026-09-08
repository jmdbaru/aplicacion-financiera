type BrandProps = {
  className?: string;
  compact?: boolean;
  label?: string;
};

/** The NUMA 2B-3 mark: flowing N, balance and the independent focal point. */
export function Brand({ className = "", compact = false, label = "NUMA" }: BrandProps) {
  return <div className={`numa-brand ${compact ? "numa-brand--compact" : ""} ${className}`.trim()} aria-label={label}>
    <svg className="numa-brand__mark" viewBox="0 0 96 96" role="img" aria-hidden="true" focusable="false">
      <path className="numa-brand__ribbon" d="M19.2 22.2c5.2-5 13.4-4.7 18.2.1l40.1 39.1c5.4 5.3 1.7 14.6-5.9 14.6h-5.1c-2.5 0-4.9-1-6.7-2.7L25.5 39.9v28.7c0 5-4 9-9 9s-9-4-9-9V31.1c0-3.4 1.4-6.7 3.9-8.9l7.8-7Z" />
      <path className="numa-brand__cut" d="M25.5 43.4c7.9 1.6 13.7 8.5 13.7 16.5 0 7.9-5.8 14.8-13.7 16.4V43.4Z" />
      <circle className="numa-brand__dot" cx="74.6" cy="20.7" r="9.3" />
    </svg>
    {!compact && <span className="numa-brand__wordmark">NUMA</span>}
  </div>;
}
