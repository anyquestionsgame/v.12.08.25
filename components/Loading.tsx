export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#1F1E1C] animate-fadeIn">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#9B9388] border-t-[#D4A574] rounded-full animate-spin" />
        <div className="text-[#F0EEE9] text-lg font-body animate-pulse-slow">
          Loading...
        </div>
      </div>
    </div>
  );
}

