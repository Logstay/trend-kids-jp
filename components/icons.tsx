import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

const base = (size = 20): SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
});

export const SearchIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} strokeWidth={2} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export const BagIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} strokeWidth={2.2} {...p}>
    <path d="M5 8h14l-1 12H6L5 8Z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </svg>
);

export const ArrowRight = ({ size = 18, ...p }: P) => (
  <svg {...base(size)} strokeWidth={2.4} {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const ArrowLeft = ({ size = 18, ...p }: P) => (
  <svg {...base(size)} strokeWidth={2.4} {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
);

export const HangerIcon = ({ size = 72, ...p }: P) => (
  <svg {...base(size)} stroke="#C41E5A" strokeWidth={1.4} {...p}>
    <path d="M12 4.5a1.8 1.8 0 1 1 1.8 1.8c-1 0-1.8.6-1.8 1.4V9" />
    <path d="M12 9 3.4 15.4c-.7.5-.4 1.6.5 1.6h16.2c.9 0 1.2-1.1.5-1.6L12 9Z" />
  </svg>
);

export const WhatsAppIcon = ({ size = 18, ...p }: P) => (
  <svg {...base(size)} strokeWidth={2} {...p}>
    <path d="M4 20l1.3-3.9A8 8 0 1 1 8 19l-4 1Z" />
  </svg>
);

export const InstagramIcon = ({ size = 18, ...p }: P) => (
  <svg {...base(size)} strokeWidth={2} {...p}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
  </svg>
);
