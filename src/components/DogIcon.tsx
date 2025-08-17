import React from 'react';

interface DogIconProps {
  className?: string;
}

export function DogIcon({ className = "w-6 h-6" }: DogIconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Dog head */}
      <ellipse cx="16" cy="18" rx="8" ry="7" fill="currentColor" />
      
      {/* Dog ears */}
      <ellipse cx="11" cy="13" rx="2.5" ry="4" fill="currentColor" transform="rotate(-25 11 13)" />
      <ellipse cx="21" cy="13" rx="2.5" ry="4" fill="currentColor" transform="rotate(25 21 13)" />
      
      {/* Dog snout */}
      <ellipse cx="16" cy="21" rx="3" ry="2.5" fill="currentColor" />
      
      {/* Dog nose */}
      <circle cx="16" cy="20" r="1" fill="white" />
      
      {/* Dog eyes */}
      <circle cx="13.5" cy="16.5" r="1" fill="white" />
      <circle cx="18.5" cy="16.5" r="1" fill="white" />
      
      {/* Magnifying glass */}
      <circle cx="24" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="24" cy="8" r="2.5" stroke="currentColor" strokeWidth="1" fill="none" />
      <line x1="27" y1="11" x2="29.5" y2="13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      
      {/* Magnifying glass reflection */}
      <circle cx="23" cy="7" r="0.8" fill="white" opacity="0.7" />
    </svg>
  );
}