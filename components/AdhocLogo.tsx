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
      viewBox="0 0 512 512" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Logo oficial de Adhoc - Círculo exterior */}
      <circle cx="256" cy="256" r="256" fill="#7C6CD8"/>
      
      {/* Triángulo/Nave principal - blanco */}
      <path 
        d="M256 100 L380 380 L132 380 Z" 
        fill="white"
      />
      
      {/* Triángulo interior - Lavender */}
      <path 
        d="M256 160 L340 340 L172 340 Z" 
        fill="#BCAFEF"
      />
      
      {/* Letra A estilizada en el centro */}
      <path 
        d="M256 200 L310 320 H280 L256 270 L232 320 H202 Z" 
        fill="white"
      />
      <rect x="240" y="280" width="32" height="15" fill="white"/>
    </svg>
  );
};
