const BaseIcon = ({ children, size = 24, className = '', ...props }: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {children}
  </svg>
);

export const IconRoad = (props: any) => (
  <BaseIcon {...props}>
    <path d="M4 19l4 -14" />
    <path d="M16 5l4 14" />
    <path d="M12 8v-2" />
    <path d="M12 13v-2" />
    <path d="M12 18v-2" />
  </BaseIcon>
);

export const IconSpray = (props: any) => (
  <BaseIcon {...props}>
    <path d="M4 10m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v7a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" />
    <path d="M8 10v-4h8v4" />
    <path d="M11 6v-2h2v2" />
    <path d="M15 20v-3" />
    <path d="M9 20v-3" />
  </BaseIcon>
);

export const IconDroplet = (props: any) => (
  <BaseIcon {...props}>
    <path d="M6.8 11a6 6 0 1 0 10.396 0l-5.197 -8l-5.2 8z" />
  </BaseIcon>
);

export const IconCameraUpload = (props: any) => (
  <BaseIcon {...props}>
    <path d="M12 20h-7a2 2 0 0 1 -2 -2v-9a2 2 0 0 1 2 -2h1a2 2 0 0 0 2 -2a1 1 0 0 1 1 -1h6a1 1 0 0 1 1 1a2 2 0 0 0 2 2h1a2 2 0 0 1 2 2v3.5" />
    <path d="M14.996 13.003a3 3 0 1 0 -2.71 2.97" />
    <path d="M19 22v-6" />
    <path d="M22 19l-3 -3l-3 3" />
  </BaseIcon>
);

export const IconEye = (props: any) => (
  <BaseIcon {...props}>
    <path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
    <path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6" />
  </BaseIcon>
);

export const IconMapPin = (props: any) => (
  <BaseIcon {...props}>
    <path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
    <path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z" />
  </BaseIcon>
);

export const IconBook = (props: any) => (
  <BaseIcon {...props}>
    <path d="M3 19a9 9 0 0 1 9 0a9 9 0 0 1 9 0" />
    <path d="M3 6a9 9 0 0 1 9 0a9 9 0 0 1 9 0" />
    <path d="M3 6l0 13" />
    <path d="M12 6l0 13" />
    <path d="M21 6l0 13" />
  </BaseIcon>
);

export const IconCpu = (props: any) => (
  <BaseIcon {...props}>
    <path d="M5 5m0 1a1 1 0 0 1 1 -1h12a1 1 0 0 1 1 1v12a1 1 0 0 1 -1 1h-12a1 1 0 0 1 -1 -1z" />
    <path d="M9 9h6v6h-6z" />
    <path d="M3 10h2" />
    <path d="M3 14h2" />
    <path d="M10 3v2" />
    <path d="M14 3v2" />
    <path d="M21 10h-2" />
    <path d="M21 14h-2" />
    <path d="M14 21v-2" />
    <path d="M10 21v-2" />
  </BaseIcon>
);

export const IconShieldCheck = (props: any) => (
  <BaseIcon {...props}>
    <path d="M11.46 20.846a12 12 0 0 1 -7.96 -14.846a12 12 0 0 0 8.5 -3a12 12 0 0 0 8.5 3a12 12 0 0 1 -1.116 9.376" />
    <path d="M15 19l2 2l4 -4" />
  </BaseIcon>
);

export const IconAlertTriangle = (props: any) => (
  <BaseIcon {...props}>
    <path d="M12 9v4" />
    <path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0z" />
  </BaseIcon>
);

export const IconCheck = (props: any) => (
  <BaseIcon {...props}>
    <path d="M5 12l5 5l10 -10" />
  </BaseIcon>
);

export const IconCircle = (props: any) => (
  <BaseIcon {...props}>
    <circle cx="12" cy="12" r="9" />
  </BaseIcon>
);

export const IconSend = (props: any) => (
  <BaseIcon {...props}>
    <path d="M10 14l11 -11" />
    <path d="M21 3l-6.5 18a0.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a0.55 .55 0 0 1 0 -1l18 -6.5" />
  </BaseIcon>
);
