'use client';

import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

export default function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = {
    success: 'bg-[#D4A574]',
    error: 'bg-red-600',
    info: 'bg-[#2D2B28]'
  }[type];

  return (
    <div className={`fixed top-24 left-1/2 z-50 ${bgColor} text-[#F0EEE9] px-6 py-4 rounded-lg shadow-lg animate-slideUpFromBottom`}>
      <p className="font-body text-[16px] font-medium">{message}</p>
    </div>
  );
}

