import { RefreshCw, TriangleAlert } from "lucide-react";
import "./ErrorBlock.scss";

interface ErrorBlockProps {
  message?: string;
  onRetry: () => void;
}

export default function ErrorBlock({
  message = "Impossible de charger ces données.",
  onRetry,
}: ErrorBlockProps) {
  return (
    <div className="admin-error-block">
      <TriangleAlert size={18} strokeWidth={2.2} />
      <p>{message}</p>
      <button type="button" onClick={onRetry}>
        <RefreshCw size={14} strokeWidth={2.4} />
        Réessayer
      </button>
    </div>
  );
}
