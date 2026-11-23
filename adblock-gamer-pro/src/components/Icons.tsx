import type { SVGProps } from 'react';

export function PowerCoreIcon({
  active = true,
  className = 'w-12 h-12',
}: {
  active?: boolean;
  className?: string;
}) {
  const stroke = active ? '#FFFFFF' : '#E2E8F0';
  const accent = active ? '#00E68A' : '#00E5FF';
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <path
        d="M32 7L51 14.5V30.5C51 43.2 42.9 53.3 32 57C21.1 53.3 13 43.2 13 30.5V14.5L32 7Z"
        fill={active ? 'rgba(0, 230, 138, 0.14)' : 'rgba(15, 23, 42, 0.55)'}
        stroke={accent}
        strokeWidth="2.8"
        strokeLinejoin="round"
      />
      <path
        d="M24.2 27.6C21.4 30.6 21.1 35.4 23.6 38.7C26.4 42.4 31.8 43.2 35.8 40.9C40.1 38.4 41.9 32.8 39.4 28.4C38.8 27.3 38.0 26.4 37.0 25.7"
        stroke={stroke}
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M32 18.5V31.5"
        stroke={accent}
        strokeWidth="3.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ReactorRingSvg({
  active,
  className = 'w-full h-full',
}: {
  active: boolean;
  className?: string;
}) {
  const mainStroke = active ? '#00E68A' : '#33486E';
  const subStroke = active ? '#00E5FF' : '#213254';
  return (
    <svg viewBox="0 0 240 240" fill="none" className={className} aria-hidden="true">
      <circle
        cx="120"
        cy="120"
        r="112"
        stroke={mainStroke}
        strokeOpacity={active ? '0.65' : '0.45'}
        strokeWidth="2.5"
        strokeDasharray="34 14 10 14"
        strokeLinecap="round"
      />
      <circle
        cx="120"
        cy="120"
        r="98"
        stroke={subStroke}
        strokeOpacity={active ? '0.55' : '0.35'}
        strokeWidth="2"
        strokeDasharray="18 22"
        strokeLinecap="round"
      />
      <circle cx="120" cy="8" r="3.5" fill={mainStroke} />
      <circle cx="120" cy="232" r="3.5" fill={subStroke} />
      <circle cx="8" cy="120" r="2.5" fill={subStroke} />
      <circle cx="232" cy="120" r="2.5" fill={mainStroke} />
    </svg>
  );
}

export function KeyGamerIcon({ className = 'w-4 h-4', ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className={className} {...props}>
      <circle cx="7.5" cy="12" r="4" />
      <path d="M11.5 12H21" strokeLinecap="round" />
      <path d="M18 12V15.5" strokeLinecap="round" />
      <path d="M15 12V14.5" strokeLinecap="round" />
    </svg>
  );
}

export function NavShieldIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M12 3L20 6.2V12.2C20 17.1 16.6 20.8 12 22C7.4 20.8 4 17.1 4 12.2V6.2L12 3Z" strokeLinejoin="round" />
      <path d="M9.5 12.2L11.3 14L15 10.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function NavActivityIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M3 12H7L10 5L14 19L17 12H21" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function NavFiltersIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M4 6H20" strokeLinecap="round" />
      <path d="M7 12H17" strokeLinecap="round" />
      <path d="M10 18H14" strokeLinecap="round" />
    </svg>
  );
}

export function NavPermsIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path
        d="M12 3L19 6V11.5C19 16.1 16 19.8 12 21C8 19.8 5 16.1 5 11.5V6L12 3Z"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="11.5" r="2.2" />
      <path d="M12 13.7V16" strokeLinecap="round" />
    </svg>
  );
}
