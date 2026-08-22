import React from 'react';

interface HutRi81LogoProps {
  className?: string;
}

export default function HutRi81Logo({ className = "w-full max-w-[380px] mx-auto" }: HutRi81LogoProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 760 360"
        className="w-full h-auto drop-shadow-2xl"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Left Side: Official 81 Emblem Vector */}
        <g transform="translate(10, 10)">
          {/* Artistic 8 Ribbon Path */}
          <path
            d="M 120 30 C 50 30, 10 75, 10 130 C 10 185, 60 210, 100 230 C 140 250, 170 280, 170 330 C 170 380, 120 410, 60 410 C 10 410, -5 370, -5 345"
            stroke="white"
            strokeWidth="36"
            strokeLinecap="round"
            fill="none"
          />
          {/* Secondary Ribbon Intersecting Line for 8 */}
          <path
            d="M 60 30 C 120 30, 160 70, 160 130 C 160 185, 110 210, 70 230 C 30 250, 0 280, 0 330"
            stroke="white"
            strokeWidth="20"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 110 65 C 75 65, 45 85, 45 130 C 45 175, 75 195, 110 215 C 145 235, 145 275, 145 325 C 145 360, 115 375, 80 375 C 50 375, 40 355, 40 335"
            stroke="white"
            strokeWidth="14"
            strokeLinecap="round"
            fill="none"
            opacity="0.95"
          />

          {/* Number 1 with 3D slanted roof and parallel vertical columns */}
          {/* Top slanted beam */}
          <polygon points="240,70 360,30 360,60 240,100" fill="white" />
          {/* Left vertical pillar */}
          <polygon points="240,95 275,85 275,345 240,360" fill="white" />
          {/* Right vertical pillar */}
          <polygon points="295,78 330,65 330,325 295,340" fill="white" />
        </g>

        {/* Right Side Stacked Text: INDONESIA BERDAULAT ADIL DAN MAKMUR */}
        <g transform="translate(415, 95)">
          <text
            x="0"
            y="0"
            fill="white"
            fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
            fontWeight="900"
            fontSize="40"
            letterSpacing="2.5"
          >
            INDONESIA
          </text>
          <text
            x="0"
            y="48"
            fill="white"
            fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
            fontWeight="900"
            fontSize="40"
            letterSpacing="2.5"
          >
            BERDAULAT
          </text>
          <text
            x="0"
            y="96"
            fill="white"
            fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
            fontWeight="900"
            fontSize="40"
            letterSpacing="2.5"
          >
            ADIL DAN
          </text>
          <text
            x="0"
            y="144"
            fill="white"
            fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
            fontWeight="900"
            fontSize="40"
            letterSpacing="2.5"
          >
            MAKMUR
          </text>
        </g>
      </svg>
    </div>
  );
}
