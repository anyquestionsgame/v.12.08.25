'use client';

import { useRouter } from 'next/navigation';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showGoBack?: boolean;
}

export default function ErrorState({
  title = "Oops! Something went wrong",
  message = "We couldn't load that. Please try again.",
  onRetry,
  showGoBack = true
}: ErrorStateProps) {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#1F1E1C] flex flex-col items-center justify-center px-6 animate-fadeIn">
      <div className="text-center max-w-[400px]">
        <div className="text-6xl mb-6">😕</div>
        <h1 className="font-heading text-[32px] font-bold text-[#F0EEE9] mb-4">
          {title}
        </h1>
        <p className="font-body text-[16px] text-[#9B9388] mb-8">
          {message}
        </p>
        <div className="flex flex-col gap-4">
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-8 py-4 bg-[#F0EEE9] text-[#1F1E1C] font-body text-lg font-bold rounded-lg cursor-pointer transition-all duration-150 ease-out hover:opacity-90 hover:scale-[0.98] active:scale-[0.96]"
            >
              Try Again
            </button>
          )}
          {showGoBack && (
            <button
              onClick={() => router.push('/')}
              className="px-8 py-4 bg-transparent border-2 border-[#9B9388] text-[#9B9388] font-body text-[16px] font-medium rounded-lg cursor-pointer transition-all duration-150 ease-out hover:border-[#F0EEE9] hover:text-[#F0EEE9]"
            >
              Go Back Home
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

