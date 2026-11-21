interface WinSmileLogoProps {
  className?: string;
}

export function WinSmileLogo({className = 'w-8 h-8'}: WinSmileLogoProps) {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="2"
        y="2"
        width="32"
        height="32"
        rx="10"
        fill="#F2EDE4"
        stroke="#E5DDD0"
        strokeWidth="1.5"
      />
      {/* Montessori wooden arch turned into a gentle warm smile */}
      <path
        d="M9.5 19.5C11.4 23.8 14.5 25.8 18 25.8C21.5 25.8 24.6 23.8 26.5 19.5"
        stroke="#4A5D3F"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      {/* Warm wooden block accents */}
      <circle cx="13" cy="13.5" r="2.1" fill="#9C7A54" />
      <circle cx="23" cy="13.5" r="2.1" fill="#9C7A54" />
    </svg>
  );
}
