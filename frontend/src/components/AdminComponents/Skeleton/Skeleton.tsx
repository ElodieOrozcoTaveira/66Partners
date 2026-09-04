import "./Skeleton.scss";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  radius?: string | number;
  className?: string;
}

export default function Skeleton({
  width = "100%",
  height = "1rem",
  radius = "8px",
  className = "",
}: SkeletonProps) {
  return (
    <span
      className={`admin-skeleton ${className}`}
      style={{ width, height, borderRadius: radius }}
    />
  );
}
