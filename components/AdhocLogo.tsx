import React from 'react';

interface AdhocLogoProps {
  size?: number;
  className?: string;
}

export const AdhocLogo: React.FC<AdhocLogoProps> = ({ size = 40, className = '' }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Triángulo exterior - Adhoc Violet */}
      <path 
        d="M50 10 L90 85 L10 85 Z" 
        fill="#7C6CD8"
      />
      {/* Triángulo interior - más claro */}
      <path 
        d="M50 25 L75 75 L25 75 Z" 
        fill="#BCAFEF"
      />
      {/* Letra A en el centro */}
      <text 
        x="50" 
        y="70" 
        fontSize="40" 
        fontWeight="bold" 
        fill="white" 
        textAnchor="middle" 
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        A
      </text>
    </svg>
  );
};
