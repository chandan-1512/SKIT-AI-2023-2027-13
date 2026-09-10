/**
 * LoadingSpinner — animated SVG spinner.
 *
 * @param {'sm'|'md'|'lg'} size
 * @param {string} color  - CSS color value (defaults to accent)
 * @param {string} label  - accessible sr-only label
 */
export default function LoadingSpinner({
  size = 'md',
  color = 'var(--color-accent)',
  label = 'Loading…',
}) {
  const dimensions = { sm: 14, md: 24, lg: 40 };
  const strokeWidth = { sm: 2.5, md: 2.5, lg: 3 };
  const px = dimensions[size];
  const sw = strokeWidth[size];
  const r = (px - sw) / 2;
  const circumference = 2 * Math.PI * r;

  return (
    <span role="status" aria-label={label} className="inline-flex items-center justify-center">
      <svg
        width={px}
        height={px}
        viewBox={`0 0 ${px} ${px}`}
        fill="none"
        className="animate-spin-slow"
      >
        {/* Track */}
        <circle
          cx={px / 2}
          cy={px / 2}
          r={r}
          stroke="currentColor"
          strokeWidth={sw}
          className="opacity-20"
        />
        {/* Spinner arc */}
        <circle
          cx={px / 2}
          cy={px / 2}
          r={r}
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * 0.75}
          transform={`rotate(-90 ${px / 2} ${px / 2})`}
        />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
}
