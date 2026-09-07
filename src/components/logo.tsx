export function WorkHubLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="40" height="40" rx="9" fill="#1a63e6" />
      <path
        d="M11 13.5L20 9l9 4.5v9c0 5-3.8 8.4-9 10.5-5.2-2.1-9-5.5-9-10.5v-9Z"
        fill="#fff"
        fillOpacity="0.18"
      />
      <path
        d="M14 16.5l6-3 6 3v6c0 3.3-2.5 5.6-6 7-3.5-1.4-6-3.7-6-7v-6Z"
        fill="#fff"
      />
      <path d="M17 19.5l2.2 2.2L23.5 17.5" stroke="#1a63e6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
