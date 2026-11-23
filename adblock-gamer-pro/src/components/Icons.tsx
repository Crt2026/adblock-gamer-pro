import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

export function BrandShieldIcon({ className = 'w-7 h-7', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} {...props}>
      <path
        d="M16 2.5L5.5 6.8V14.8C5.5 21.8 10 27.6 16 29.5C22 27.6 26.5 21.8 26.5 14.8V6.8L16 2.5Z"
        fill="currentColor"
        fillOpacity="0.14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M17.5 9.5L11.8 17H16L14.5 22.8L20.2 15.2H16L17.5 9.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function NavHomeIcon({ className = 'w-5 h-5', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <path
        d="M12 3L4 6.5V12.2C4 17 7.4 20.9 12 22C16.6 20.9 20 17 20 12.2V6.5L12 3Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <path
        d="M9.2 12.5L11.2 14.5L15.2 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function NavYoutubeIcon({ className = 'w-5 h-5', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <rect
        x="2.5"
        y="5"
        width="19"
        height="14"
        rx="4"
        stroke="currentColor"
        strokeWidth="1.9"
      />
      <path
        d="M10.2 9.2L15.4 12L10.2 14.8V9.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function NavDnsIcon({ className = 'w-5 h-5', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <rect
        x="3.5"
        y="4"
        width="17"
        height="6.5"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <rect
        x="3.5"
        y="13.5"
        width="17"
        height="6.5"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="7.5" cy="7.25" r="1.1" fill="currentColor" />
      <circle cx="7.5" cy="16.75" r="1.1" fill="currentColor" />
      <path
        d="M12 7.25H16.5M12 16.75H16.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function NavSettingsIcon({ className = 'w-5 h-5', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <path
        d="M4 7H14M18 7H20M4 17H6M10 17H20M4 12H9M13 12H20"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <circle cx="16" cy="7" r="2.2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="11" cy="12" r="2.2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="8" cy="17" r="2.2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function WifiSignalIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <path
        d="M3.5 9.2C8.3 4.8 15.7 4.8 20.5 9.2"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <path
        d="M6.8 12.8C9.8 10 14.2 10 17.2 12.8"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <path
        d="M10.1 16.3C11.2 15.3 12.8 15.3 13.9 16.3"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <circle cx="12" cy="19.2" r="1.4" fill="currentColor" />
    </svg>
  );
}

export function MobileDataIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <path
        d="M4 19V15.5M8.5 19V12.5M13 19V9M17.5 19V5"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <path
        d="M19.5 6.5L21 5M21 5L19.5 3.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DualNetworkIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <path
        d="M4 14L8 10L12 14M8 10V20"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 10L16 14L12 10M16 14V4"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AdBlockCrossIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <path
        d="M12 2.8L4.5 6V12.5C4.5 17.5 7.7 21.1 12 22.3C16.3 21.1 19.5 17.5 19.5 12.5V6L12 2.8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 9.5L14.5 14.5M14.5 9.5L9.5 14.5"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function GamerBoltIcon({ className = 'w-5 h-5', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <rect
        x="2.5"
        y="6.5"
        width="19"
        height="11"
        rx="5.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M7.5 10V14M5.5 12H9.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="15.2" cy="10.8" r="1" fill="currentColor" />
      <circle cx="17.5" cy="13.2" r="1" fill="currentColor" />
    </svg>
  );
}

export function YoutubeHomeIcon({
  filled = false,
  className = 'w-6 h-6',
  ...props
}: IconProps & { filled?: boolean }) {
  return filled ? (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...props}>
      <path d="M12 3.1L3.5 10.1V20.5C3.5 21.05 3.95 21.5 4.5 21.5H9.5V15C9.5 14.45 9.95 14 10.5 14H13.5C14.05 14 14.5 14.45 14.5 15V21.5H19.5C20.05 21.5 20.5 21.05 20.5 20.5V10.1L12 3.1Z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <path
        d="M4 10.3L12 3.5L20 10.3V20.5C20 20.78 19.78 21 19.5 21H14.5V14.5H9.5V21H4.5C4.22 21 4 20.78 4 20.5V10.3Z"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function YoutubeShortsIcon({
  filled = false,
  className = 'w-6 h-6',
  ...props
}: IconProps & { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <path
        d="M17.45 11.12L15.72 10.12L17.49 9.1C19.34 8.03 19.98 5.66 18.91 3.81C17.84 1.96 15.47 1.32 13.62 2.39L6.51 6.5C4.66 7.57 4.02 9.94 5.09 11.79C5.53 12.56 6.18 13.15 6.95 13.5L8.28 14.12L6.51 15.14C4.66 16.21 4.02 18.58 5.09 20.43C6.16 22.28 8.53 22.92 10.38 21.85L17.49 17.74C19.34 16.67 19.98 14.3 18.91 12.45C18.53 11.8 18.02 11.44 17.45 11.12Z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M10.2 9.4V14.8L14.9 12.1L10.2 9.4Z"
        fill={filled ? '#0F0F0F' : 'currentColor'}
      />
    </svg>
  );
}

export function YoutubePlusCircleIcon({
  className = 'w-6 h-6',
  ...props
}: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <circle cx="12" cy="12" r="9.2" stroke="currentColor" strokeWidth="1.85" />
      <path
        d="M12 8.2V15.8M8.2 12H15.8"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
      />
    </svg>
  );
}

