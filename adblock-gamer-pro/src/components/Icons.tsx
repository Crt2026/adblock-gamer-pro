import { useId, type SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & {
  active?: boolean;
};

/** Brand emblem with gradient duotone finish */
export function AppBrandShieldIcon({ className = 'w-6 h-6', ...props }: IconProps) {
  const uid = useId();
  const gradId = `brand-grad-${uid}`;
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true" {...props}>
      <defs>
        <linearGradient id={gradId} x1="4" y1="3" x2="28" y2="29" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00E5FF" />
          <stop offset="100%" stopColor="#00E68A" />
        </linearGradient>
      </defs>
      <path
        d="M16 2.8L27.2 7.4V15.6C27.2 22.5 22.4 27.9 16 30C9.6 27.9 4.8 22.5 4.8 15.6V7.4L16 2.8Z"
        fill={`url(#${gradId})`}
        fillOpacity="0.16"
        stroke={`url(#${gradId})`}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M17.5 9.2L11.6 16.6H16.2L14.5 22.8L20.4 15.4H15.8L17.5 9.2Z"
        fill="#00E68A"
        stroke="#00E5FF"
        strokeWidth="0.9"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Upgraded 3-layer hardware-grade Power Core SVG */
export function PowerCoreIcon({ active = true, className = 'w-14 h-14', ...props }: IconProps) {
  const uid = useId();
  const shieldGrad = `core-shield-${uid}`;
  const arcGrad = `core-arc-${uid}`;

  return (
    <svg viewBox="0 0 72 72" fill="none" className={className} aria-hidden="true" {...props}>
      <defs>
        <linearGradient id={shieldGrad} x1="14" y1="8" x2="58" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={active ? '#00E68A' : '#64799E'} />
          <stop offset="100%" stopColor={active ? '#00E5FF' : '#3B4D70'} />
        </linearGradient>
        <linearGradient id={arcGrad} x1="24" y1="22" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={active ? '#FFFFFF' : '#E2E8F0'} />
          <stop offset="100%" stopColor={active ? '#00E5FF' : '#94A3B8'} />
        </linearGradient>
      </defs>

      {/* Outer armored shield */}
      <path
        d="M36 6L59 15.2V33.6C59 48.2 49.3 60.2 36 65C22.7 60.2 13 48.2 13 33.6V15.2L36 6Z"
        fill={active ? 'rgba(0, 230, 138, 0.14)' : 'rgba(15, 23, 42, 0.65)'}
        stroke={`url(#${shieldGrad})`}
        strokeWidth="2.8"
        strokeLinejoin="round"
      />

      {/* Inner precision hex frame */}
      <path
        d="M36 12.2L53.2 19.2V33.4C53.2 44.8 45.8 54.1 36 58C26.2 54.1 18.8 44.8 18.8 33.4V19.2L36 12.2Z"
        stroke={active ? '#00E5FF' : '#475C82'}
        strokeOpacity={active ? '0.5' : '0.35'}
        strokeWidth="1.5"
        strokeDasharray="5 3"
        strokeLinejoin="round"
      />

      {/* Circuit corner pins */}
      <circle cx="36" cy="12.2" r="2" fill={active ? '#00E68A' : '#64799E'} />
      <circle cx="18.8" cy="27" r="1.6" fill={active ? '#00E5FF' : '#475C82'} />
      <circle cx="53.2" cy="27" r="1.6" fill={active ? '#00E5FF' : '#475C82'} />

      {/* Power arc */}
      <path
        d="M26.8 30.2C23.2 33.8 23 39.7 26.2 43.7C29.6 48 35.9 48.9 40.7 46C45.7 43 47.7 36.4 44.8 31.2C44 29.9 43 28.8 41.7 28"
        stroke={`url(#${arcGrad})`}
        strokeWidth="3.8"
        strokeLinecap="round"
      />

      {/* Vertical power stem */}
      <path
        d="M36 19.5V35.2"
        stroke={active ? '#00E68A' : '#94A3B8'}
        strokeWidth="4.2"
        strokeLinecap="round"
      />
      <circle cx="36" cy="35.5" r="2.6" fill={active ? '#00E5FF' : '#64799E'} />
    </svg>
  );
}

/** Outer orbital telemetry HUD ring (layer 1) */
export function ReactorRingSvg({ active = true, className = 'w-full h-full', ...props }: IconProps) {
  const mainStroke = active ? '#00E68A' : '#33486E';
  const subStroke = active ? '#00E5FF' : '#213254';
  const tickAngles = Array.from({ length: 36 }, (_, i) => i * 10);

  return (
    <svg viewBox="0 0 280 280" fill="none" className={className} aria-hidden="true" {...props}>
      {/* Calibrated degree ticks */}
      {tickAngles.map((deg) => {
        const major = deg % 90 === 0;
        const rad = (deg * Math.PI) / 180;
        const r1 = major ? 127 : 131;
        const r2 = 136;
        const x1 = 140 + r1 * Math.cos(rad);
        const y1 = 140 + r1 * Math.sin(rad);
        const x2 = 140 + r2 * Math.cos(rad);
        const y2 = 140 + r2 * Math.sin(rad);
        return (
          <line
            key={deg}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={major ? mainStroke : subStroke}
            strokeOpacity={active ? (major ? '0.9' : '0.45') : '0.25'}
            strokeWidth={major ? '2.4' : '1.4'}
            strokeLinecap="round"
          />
        );
      })}

      {/* Outer segmented orbital ring */}
      <circle
        cx="140"
        cy="140"
        r="122"
        stroke={mainStroke}
        strokeOpacity={active ? '0.7' : '0.38'}
        strokeWidth="2.4"
        strokeDasharray="42 16 12 16"
        strokeLinecap="round"
      />

      {/* High-energy quadrant sweep arcs */}
      <path
        d="M140 24A116 116 0 0 1 256 140"
        stroke={mainStroke}
        strokeOpacity={active ? '0.9' : '0.3'}
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M140 256A116 116 0 0 1 24 140"
        stroke={subStroke}
        strokeOpacity={active ? '0.9' : '0.3'}
        strokeWidth="3.2"
        strokeLinecap="round"
      />

      {/* Cardinal nodes */}
      <circle cx="140" cy="18" r="4.2" fill={mainStroke} />
      <circle cx="140" cy="262" r="4.2" fill={subStroke} />
      <circle cx="18" cy="140" r="3.2" fill={subStroke} />
      <circle cx="262" cy="140" r="3.2" fill={mainStroke} />
    </svg>
  );
}

/** Counter-rotating inner orbital reticle (layer 2) */
export function ReactorInnerRingSvg({
  active = true,
  className = 'w-full h-full',
  ...props
}: IconProps) {
  const stroke = active ? '#00E5FF' : '#293D66';
  const accent = active ? '#00E68A' : '#33486E';

  return (
    <svg viewBox="0 0 280 280" fill="none" className={className} aria-hidden="true" {...props}>
      <circle
        cx="140"
        cy="140"
        r="105"
        stroke={stroke}
        strokeOpacity={active ? '0.55' : '0.28'}
        strokeWidth="1.8"
        strokeDasharray="18 22 6 22"
        strokeLinecap="round"
      />
      <circle
        cx="140"
        cy="140"
        r="96"
        stroke={accent}
        strokeOpacity={active ? '0.35' : '0.2'}
        strokeWidth="1.2"
        strokeDasharray="3 8"
      />
      <circle cx="66" cy="66" r="2.6" fill={accent} />
      <circle cx="214" cy="214" r="2.6" fill={stroke} />
    </svg>
  );
}

/** VPN Tunnel key icon */
export function KeyGamerIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true" {...props}>
      <circle
        cx="7.5"
        cy="12"
        r="4.3"
        fill="currentColor"
        fillOpacity="0.2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="7.5" cy="12" r="1.5" fill="currentColor" />
      <path d="M11.8 12H21" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
      <path d="M18.6 12V16" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
      <path d="M15.4 12V14.8" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
    </svg>
  );
}

/** Nav 1: Protección */
export function NavShieldIcon({ active = false, className = 'w-5 h-5', ...props }: IconProps) {
  const uid = useId();
  const grad = `nav-sh-${uid}`;
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true" {...props}>
      <defs>
        <linearGradient id={grad} x1="4" y1="3" x2="20" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00E5FF" />
          <stop offset="100%" stopColor="#00E68A" />
        </linearGradient>
      </defs>
      <path
        d="M12 2.8L20 6V12.2C20 17.2 16.5 20.9 12 22.2C7.5 20.9 4 17.2 4 12.2V6L12 2.8Z"
        fill={active ? `url(#${grad})` : 'none'}
        fillOpacity={active ? '0.2' : '0'}
        stroke={active ? `url(#${grad})` : 'currentColor'}
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <path
        d="M9.2 12.3L11.2 14.3L15.2 10"
        stroke={active ? '#00E68A' : 'currentColor'}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Nav 2: Actividad */
export function NavActivityIcon({ active = false, className = 'w-5 h-5', ...props }: IconProps) {
  const uid = useId();
  const grad = `nav-act-${uid}`;
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true" {...props}>
      <defs>
        <linearGradient id={grad} x1="3" y1="4" x2="21" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00E5FF" />
          <stop offset="100%" stopColor="#00E68A" />
        </linearGradient>
      </defs>
      <rect
        x="3"
        y="4"
        width="18"
        height="16"
        rx="4.2"
        fill={active ? `url(#${grad})` : 'none'}
        fillOpacity={active ? '0.16' : '0'}
        stroke={active ? `url(#${grad})` : 'currentColor'}
        strokeWidth="1.9"
      />
      <path
        d="M6.2 12.5H9L10.8 8.2L13.3 15.8L15.1 12.5H17.8"
        stroke={active ? '#00E68A' : 'currentColor'}
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Nav 3: Filtros */
export function NavFiltersIcon({ active = false, className = 'w-5 h-5', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true" {...props}>
      <path d="M4 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle
        cx="9"
        cy="7"
        r="2.4"
        fill={active ? '#00E68A' : '#0C1322'}
        stroke={active ? '#00E68A' : 'currentColor'}
        strokeWidth="1.9"
      />
      <circle
        cx="15"
        cy="12"
        r="2.4"
        fill={active ? '#00E5FF' : '#0C1322'}
        stroke={active ? '#00E5FF' : 'currentColor'}
        strokeWidth="1.9"
      />
      <circle
        cx="10.5"
        cy="17"
        r="2.4"
        fill={active ? '#00E68A' : '#0C1322'}
        stroke={active ? '#00E68A' : 'currentColor'}
        strokeWidth="1.9"
      />
    </svg>
  );
}

/** Nav 4: Permisos */
export function NavPermsIcon({ active = false, className = 'w-5 h-5', ...props }: IconProps) {
  const uid = useId();
  const grad = `nav-perm-${uid}`;
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true" {...props}>
      <defs>
        <linearGradient id={grad} x1="5" y1="4" x2="19" y2="21" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00E5FF" />
          <stop offset="100%" stopColor="#00E68A" />
        </linearGradient>
      </defs>
      <rect
        x="5"
        y="10"
        width="14"
        height="10.5"
        rx="3.2"
        fill={active ? `url(#${grad})` : 'none'}
        fillOpacity={active ? '0.18' : '0'}
        stroke={active ? `url(#${grad})` : 'currentColor'}
        strokeWidth="1.9"
      />
      <path
        d="M8.5 10V7.5C8.5 5.4 10.1 3.8 12 3.8C13.9 3.8 15.5 5.4 15.5 7.5V10"
        stroke={active ? '#00E5FF' : 'currentColor'}
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <circle cx="12" cy="14.7" r="1.6" fill={active ? '#00E68A' : 'currentColor'} />
      <path
        d="M12 16.3V17.9"
        stroke={active ? '#00E68A' : 'currentColor'}
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Network: Wi-Fi + Datos Móviles Dual-Stack */
export function WifiDualIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true" {...props}>
      <path d="M2.8 8.6C6.7 5.1 12.3 5.1 16.2 8.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M5.6 11.5C7.9 9.4 11.1 9.4 13.4 11.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="9.5" cy="14.7" r="1.5" fill="currentColor" />
      <rect
        x="15.5"
        y="10"
        width="6"
        height="10.5"
        rx="1.8"
        fill="currentColor"
        fillOpacity="0.18"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M17.8 18H19.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/** Network: Wi-Fi Wave */
export function WifiWaveIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true" {...props}>
      <path d="M3 8.8C8.1 4.4 15.9 4.4 21 8.8" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
      <path d="M6.4 12.4C9.6 9.6 14.4 9.6 17.6 12.4" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
      <path d="M9.8 16C11.1 14.8 12.9 14.8 14.2 16" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
      <circle cx="12" cy="19" r="1.7" fill="currentColor" />
    </svg>
  );
}

/** Network: Datos Móviles 4G/5G */
export function MobileSignalIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true" {...props}>
      <path d="M4.5 19V15.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M9.5 19V12.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M14.5 19V9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M19.5 19V5.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/** Metric: Blocked Shield */
export function BlockedShieldIcon({ className = 'w-5 h-5', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true" {...props}>
      <path
        d="M12 3L19.5 6V11.8C19.5 16.5 16.3 20.1 12 21.4C7.7 20.1 4.5 16.5 4.5 11.8V6L12 3Z"
        fill="rgba(0, 230, 138, 0.16)"
        stroke="#00E68A"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <path d="M9 12.2L11 14.2L15.2 9.8" stroke="#00E68A" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Metric: DNS Queries Pulse */
export function QueryPulseIcon({ className = 'w-5 h-5', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="8.5" fill="rgba(0, 229, 255, 0.14)" stroke="#00E5FF" strokeWidth="1.9" />
      <path d="M6.8 12.2H9.6L11.2 8.4L13.1 15.6L14.7 12.2H17.2" stroke="#00E5FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Metric: Domains Database Globe */
export function DatabaseGlobeIcon({ className = 'w-5 h-5', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="8.5" fill="rgba(147, 197, 253, 0.14)" stroke="#93C5FD" strokeWidth="1.9" />
      <ellipse cx="12" cy="12" rx="3.8" ry="8.5" stroke="#93C5FD" strokeWidth="1.6" />
      <path d="M4 9.5H20" stroke="#93C5FD" strokeWidth="1.6" />
      <path d="M4 14.5H20" stroke="#93C5FD" strokeWidth="1.6" />
    </svg>
  );
}

/** Alert / Last Blocked Ad */
export function LastCutAlertIcon({ className = 'w-5 h-5', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="9" fill="rgba(255, 77, 109, 0.18)" stroke="#FF4D6D" strokeWidth="1.9" />
      <path d="M8.5 8.5L15.5 15.5" stroke="#FF4D6D" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M15.5 8.5L8.5 15.5" stroke="#FF4D6D" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

/** Tunnel Stack Icon */
export function TunnelStackIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true" {...props}>
      <path d="M12 3.5L20 7.8L12 12L4 7.8L12 3.5Z" fill="rgba(0, 229, 255, 0.2)" stroke="#00E5FF" strokeWidth="1.9" strokeLinejoin="round" />
      <path d="M4 12.2L12 16.4L20 12.2" stroke="#00E68A" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 16.5L12 20.6L20 16.5" stroke="#00E5FF" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Refresh / Sync Icon */
export function RefreshSyncIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true" {...props}>
      <path d="M19.5 10.5C18.6 6.8 15.2 4.5 11.4 4.8C8.3 5 5.8 7 4.9 9.8" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
      <path d="M4.5 13.5C5.4 17.2 8.8 19.5 12.6 19.2C15.7 19 18.2 17 19.1 14.2" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
      <path d="M16.5 10.8H20V7.3" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.5 13.2H4V16.7" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Search Glass Icon */
export function SearchGlassIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true" {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" fill="rgba(0, 229, 255, 0.1)" stroke="currentColor" strokeWidth="2" />
      <path d="M15.4 15.4L20 20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

/** Probe Play Icon */
export function ProbePlayIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="9" fill="rgba(0, 230, 138, 0.16)" stroke="currentColor" strokeWidth="1.9" />
      <path d="M10 8.5L16 12L10 15.5V8.5Z" fill="currentColor" />
    </svg>
  );
}

/** Traffic Row: Blocked */
export function AdBlockEntryIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="8.5" fill="rgba(255, 77, 109, 0.14)" stroke="currentColor" strokeWidth="2" />
      <path d="M6.5 17.5L17.5 6.5" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
    </svg>
  );
}

/** Traffic Row: Allowed */
export function AdAllowEntryIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="8.5" fill="rgba(0, 230, 138, 0.14)" stroke="currentColor" strokeWidth="2" />
      <path d="M8.5 12.2L11 14.7L15.8 9.5" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** DNS Server Rack Icon */
export function ServerDnsIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true" {...props}>
      <rect x="3.5" y="4" width="17" height="6.5" rx="2" fill="rgba(0, 229, 255, 0.16)" stroke="#00E5FF" strokeWidth="1.8" />
      <rect x="3.5" y="13.5" width="17" height="6.5" rx="2" fill="rgba(0, 230, 138, 0.14)" stroke="#00E68A" strokeWidth="1.8" />
      <circle cx="7" cy="7.25" r="1.2" fill="#00E5FF" />
      <circle cx="7" cy="16.75" r="1.2" fill="#00E68A" />
      <path d="M12 7.25H17.5" stroke="#00E5FF" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 16.75H17.5" stroke="#00E68A" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/** Speed Gauge Icon */
export function SpeedGaugeIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true" {...props}>
      <path d="M4.5 16.5A8.5 8.5 0 1 1 19.5 16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 13L16 9" stroke="#00E68A" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="12" cy="13" r="1.9" fill="currentColor" />
    </svg>
  );
}

/** Filter Layers Icon */
export function FilterLayerIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true" {...props}>
      <path d="M4 5H20L14 12.2V18.5L10 20V12.2L4 5Z" fill="rgba(0, 230, 138, 0.16)" stroke="#00E68A" strokeWidth="1.9" strokeLinejoin="round" />
    </svg>
  );
}

/** Manual Rules Code List Icon */
export function ManualRulesIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true" {...props}>
      <rect x="4" y="4" width="16" height="16" rx="3.2" fill="rgba(0, 229, 255, 0.14)" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 9H16" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M8 12.5H14" stroke="#00E68A" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M8 16H12" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

/** Permission Icons (VPN, Bell, Battery, AutoStart) */
export function PermVpnIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true" {...props}>
      <path d="M12 3L19 6V11.8C19 16.3 16 19.8 12 21C8 19.8 5 16.3 5 11.8V6L12 3Z" fill="currentColor" fillOpacity="0.16" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
      <path d="M9.5 12H14.5M12 9.5V14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function PermBellIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true" {...props}>
      <path d="M6.5 16.5H17.5L16.2 14.5V10.5C16.2 8 14.4 6 12 6C9.6 6 7.8 8 7.8 10.5V14.5L6.5 16.5Z" fill="currentColor" fillOpacity="0.16" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
      <path d="M10.2 19C10.6 19.8 11.2 20.2 12 20.2C12.8 20.2 13.4 19.8 13.8 19" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

export function PermBatteryIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true" {...props}>
      <rect x="3" y="7" width="16" height="10" rx="2.5" fill="currentColor" fillOpacity="0.16" stroke="currentColor" strokeWidth="1.9" />
      <path d="M21 10.5V13.5" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
      <path d="M11.5 9L9 12.2H11.8L10.5 15L13 11.8H10.2L11.5 9Z" fill="currentColor" />
    </svg>
  );
}

export function PermBoltIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true" {...props}>
      <path d="M13.5 3L6 13.5H12L10.5 21L18 10.5H12L13.5 3Z" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
    </svg>
  );
}

export function CacheSweepIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true" {...props}>
      <path d="M5 7H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M9.5 4H14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 7L8 19H16L17 7" fill="currentColor" fillOpacity="0.14" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
      <path d="M10.5 11V15.5M13.5 11V15.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function TerminalDiagIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true" {...props}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="3" fill="rgba(0, 229, 255, 0.14)" stroke="#00E5FF" strokeWidth="1.9" />
      <path d="M7.5 10L10.5 12.5L7.5 15" stroke="#00E68A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.5 15H16.5" stroke="#00E5FF" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function GitHubBranchIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true" {...props}>
      <circle cx="7" cy="6.5" r="2.3" fill="rgba(0, 230, 138, 0.22)" stroke="#00E68A" strokeWidth="1.9" />
      <circle cx="7" cy="17.5" r="2.3" fill="rgba(0, 229, 255, 0.22)" stroke="#00E5FF" strokeWidth="1.9" />
      <circle cx="17" cy="8.5" r="2.3" fill="rgba(0, 230, 138, 0.22)" stroke="#00E68A" strokeWidth="1.9" />
      <path d="M7 8.8V15.2" stroke="#00E5FF" strokeWidth="1.9" />
      <path d="M17 10.8C17 14 14 15.2 9.3 15.2" stroke="#00E68A" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

export function GitCommitNodeIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true" {...props}>
      <path d="M4 12H8.5M15.5 12H20" stroke="#00E5FF" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="12" r="3.4" fill="rgba(0, 230, 138, 0.22)" stroke="#00E68A" strokeWidth="2" />
    </svg>
  );
}

export function ArchiveZipIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true" {...props}>
      <rect x="4" y="4" width="16" height="16" rx="3.2" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.9" />
      <path d="M12 4V14" stroke="currentColor" strokeWidth="2" strokeDasharray="2 2" />
      <rect x="10" y="13.5" width="4" height="3.5" rx="1" fill="currentColor" />
    </svg>
  );
}

export function DownloadApkIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true" {...props}>
      <path d="M12 4V14.5M12 14.5L8 10.5M12 14.5L16 10.5" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.5 17.5V19C4.5 19.8 5.2 20.5 6 20.5H18C18.8 20.5 19.5 19.8 19.5 19V17.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function CopyPromptIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true" {...props}>
      <rect x="8.5" y="8.5" width="11" height="11" rx="2.4" fill="rgba(0, 229, 255, 0.16)" stroke="currentColor" strokeWidth="1.9" />
      <path d="M15.5 8.5V6.5C15.5 5.4 14.6 4.5 13.5 4.5H6.5C5.4 4.5 4.5 5.4 4.5 6.5V13.5C4.5 14.6 5.4 15.5 6.5 15.5H8.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}
