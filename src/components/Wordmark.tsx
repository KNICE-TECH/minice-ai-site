type Props = { size?: "sm" | "md" | "lg"; className?: string };

const sizeMap = {
  sm: "text-sm",
  md: "text-lg",
  lg: "text-3xl",
};

export function Wordmark({ size = "md", className = "" }: Props) {
  return (
    <span className={`wordmark ${sizeMap[size]} ${className}`} aria-label="Minice">
      Minice
    </span>
  );
}
