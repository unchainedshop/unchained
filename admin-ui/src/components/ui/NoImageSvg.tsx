interface NoImageSvgProps {
  className?: string;
  width?: number;
  height?: number;
}

const NoImageSvg = ({
  className = 'w-full h-full',
  width = 200,
  height = 200,
}: NoImageSvgProps) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 200"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background rectangle */}
      <rect
        x="10"
        y="10"
        width="180"
        height="180"
        rx="8"
        stroke="currentColor"
        strokeWidth="3"
        strokeDasharray="8 4"
        fill="transparent"
        className="text-slate-800 dark:text-slate-400"
      />

      {/* Image icon outline */}
      <rect
        x="40"
        y="40"
        width="120"
        height="80"
        rx="4"
        stroke="currentColor"
        strokeWidth="3"
        fill="transparent"
      />

      {/* Mountain peaks */}
      <path
        d="M50 100 L70 80 L90 95 L110 75 L130 90 L150 70"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Sun/circle */}
      <circle
        cx="130"
        cy="55"
        r="8"
        stroke="currentColor"
        strokeWidth="3"
        fill="transparent"
      />

      {/* No Image text */}
      <text
        x="100"
        y="145"
        textAnchor="middle"
        className="text-slate-800 dark:text-slate-300 text-sm font-semibold"
        fill="currentColor"
      >
        No Image
      </text>
    </svg>
  );
};

export default NoImageSvg;
