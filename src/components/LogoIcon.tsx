import { memo } from 'react';

const LogoIcon = memo(function LogoIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="transition-transform duration-300 ease-out group-hover:rotate-[15deg] group-hover:scale-105"
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="50%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#A78BFA" />
        </linearGradient>
      </defs>
      {/* Orbit ring */}
      <circle
        cx="16"
        cy="16"
        r="13"
        stroke="url(#logoGradient)"
        strokeWidth="1.5"
        fill="none"
        opacity="0.6"
      />
      {/* Orbit ring 2 (tilted) */}
      <ellipse
        cx="16"
        cy="16"
        rx="13"
        ry="5"
        stroke="url(#logoGradient)"
        strokeWidth="1"
        fill="none"
        opacity="0.4"
        transform="rotate(-30 16 16)"
      />
      {/* Rocket body */}
      <path
        d="M16 6L18.5 14H13.5L16 6Z"
        fill="url(#logoGradient)"
      />
      {/* Rocket tip */}
      <path
        d="M16 4L17 7H15L16 4Z"
        fill="url(#logoGradient)"
      />
      {/* Rocket fin left */}
      <path
        d="M13.5 14L12 18L14 16L13.5 14Z"
        fill="url(#logoGradient)"
        opacity="0.8"
      />
      {/* Rocket fin right */}
      <path
        d="M18.5 14L20 18L18 16L18.5 14Z"
        fill="url(#logoGradient)"
        opacity="0.8"
      />
      {/* Flame */}
      <path
        d="M15 18L16 22L17 18H15Z"
        fill="#8B5CF6"
        opacity="0.7"
      />
      {/* Center dot */}
      <circle cx="16" cy="12" r="1.5" fill="white" />
    </svg>
  );
});

export default LogoIcon;
