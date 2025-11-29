import React from 'react';

export const AdhocLogo: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => {
  return (
    <svg 
      viewBox="0 0 300 300" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Purple circle background */}
      <circle cx="150" cy="150" r="150" fill="#8B7FC9"/>
      
      {/* White "A" shape */}
      <path 
        d="M 150 60 L 220 240 L 180 240 L 165 200 L 135 200 L 120 240 L 80 240 Z M 150 120 L 140 160 L 160 160 Z" 
        fill="white"
      />
      
      {/* Bottom arc */}
      <path 
        d="M 80 240 Q 150 280 220 240" 
        stroke="white" 
        strokeWidth="8" 
        fill="none"
      />
    </svg>
  );
};
