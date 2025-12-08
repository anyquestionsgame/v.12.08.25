'use client';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon = "📭",
  title,
  message,
  actionLabel,
  onAction
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 animate-fadeIn">
      <div className="text-6xl mb-6">{icon}</div>
      <h2 className="font-heading text-[24px] font-bold text-[#F0EEE9] mb-3 text-center">
        {title}
      </h2>
      <p className="font-body text-[16px] text-[#9B9388] mb-6 text-center max-w-[300px]">
        {message}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-8 py-4 bg-[#F0EEE9] text-[#1F1E1C] font-body text-lg font-bold rounded-lg cursor-pointer transition-all duration-150 ease-out hover:opacity-90 hover:scale-[0.98] active:scale-[0.96]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

