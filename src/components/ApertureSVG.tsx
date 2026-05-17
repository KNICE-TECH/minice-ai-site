type Props = { size?: number; spin?: boolean; className?: string };

export function ApertureSVG({ size = 64, spin = false, className }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 96 96"
      width={size}
      height={size}
      fill="none"
      className={className}
      style={spin ? { animation: "aperture-spin 24s linear infinite" } : undefined}
      aria-hidden="true"
    >
      <path d="M 14 78 L 14 22 L 48 56 Z" fill="#f5f4f1" />
      <path d="M 82 78 L 82 22 L 48 56 Z" fill="#f5f4f1" opacity="0.55" />
      <path d="M 14 78 L 48 56 L 82 78 Z" fill="#e8a87c" />
      <style>{`@keyframes aperture-spin { to { transform: rotate(360deg); transform-origin: 50% 50%; } }`}</style>
    </svg>
  );
}
