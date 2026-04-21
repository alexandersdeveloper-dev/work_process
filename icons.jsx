// Minimal inline SVG icon set — 16px stroke icons
// Usage: <Icon name="home" />

const ICONS = {
  home:        "M3 11 L10 4 L17 11 M5 9 V17 H15 V9",
  layers:      "M10 3 L3 7 L10 11 L17 7 Z M3 11 L10 15 L17 11 M3 15 L10 19 L17 15",
  users:       "M7 9 a2.5 2.5 0 1 0 0-5 a2.5 2.5 0 0 0 0 5 Z M13 10 a2 2 0 1 0 0-4 a2 2 0 0 0 0 4 Z M2 17 c0-2.5 2.3-4 5-4 s5 1.5 5 4 M12 13 c2.3 0 4 1.3 4 4",
  file:        "M5 2 H12 L15 5 V18 H5 Z M12 2 V5 H15",
  chart:       "M3 17 V3 M3 17 H17 M6 13 V10 M9 13 V7 M12 13 V9 M15 13 V5",
  settings:    "M10 7 a3 3 0 1 0 0 6 a3 3 0 0 0 0-6 Z M10 2 V4 M10 16 V18 M2 10 H4 M16 10 H18 M4.3 4.3 L5.7 5.7 M14.3 14.3 L15.7 15.7 M4.3 15.7 L5.7 14.3 M14.3 5.7 L15.7 4.3",
  shield:      "M10 2 L3 5 V10 C3 14 6 17 10 18 C14 17 17 14 17 10 V5 Z",
  archive:     "M2 5 H18 V8 H2 Z M4 8 V17 H16 V8 M8 11 H12",
  bell:        "M5 14 V9 A5 5 0 0 1 15 9 V14 L17 16 H3 Z M8 16 A2 2 0 0 0 12 16",
  search:      "M9 3 a6 6 0 1 0 0 12 a6 6 0 0 0 0-12 Z M14 14 L17 17",
  inbox:       "M2 11 H6 L7 14 H13 L14 11 H18 M2 11 V17 H18 V11 M2 11 L4 4 H16 L18 11",
  building:    "M4 17 V4 H16 V17 M4 17 H16 M7 7 H9 M11 7 H13 M7 10 H9 M11 10 H13 M7 13 H9 M11 13 H13",
  plus:        "M10 4 V16 M4 10 H16",
  filter:      "M3 4 H17 L12 10 V16 L8 14 V10 Z",
  download:    "M10 3 V13 M6 9 L10 13 L14 9 M3 17 H17",
  upload:      "M10 13 V3 M6 7 L10 3 L14 7 M3 17 H17",
  more:        "M5 10 a1 1 0 1 0 0 .1 Z M10 10 a1 1 0 1 0 0 .1 Z M15 10 a1 1 0 1 0 0 .1 Z",
  check:       "M4 10 L8 14 L16 6",
  x:           "M5 5 L15 15 M15 5 L5 15",
  chevron:     "M7 5 L13 10 L7 15",
  chevronL:    "M13 5 L7 10 L13 15",
  chevronD:    "M5 7 L10 13 L15 7",
  sparkle:     "M10 2 V7 M10 13 V18 M2 10 H7 M13 10 H18 M5.5 5.5 L7.5 7.5 M12.5 12.5 L14.5 14.5 M5.5 14.5 L7.5 12.5 M12.5 7.5 L14.5 5.5",
  book:        "M3 3 H9 C11 3 12 4 12 6 V17 C12 15 11 14 9 14 H3 Z M17 3 H11 C9 3 8 4 8 6 V17 C8 15 9 14 11 14 H17 Z",
  calendar:    "M3 5 H17 V17 H3 Z M3 8 H17 M7 3 V6 M13 3 V6",
  flag:        "M5 17 V3 M5 3 H15 L13 7 L15 11 H5",
  print:       "M6 3 H14 V7 H6 Z M4 7 H16 V14 H14 V17 H6 V14 H4 Z M6 10 H14",
  edit:        "M3 17 L3 13 L13 3 L17 7 L7 17 Z M12 4 L16 8",
  chat:        "M3 4 H17 V13 H10 L6 17 V13 H3 Z",
  pin:         "M10 2 L10 8 L13 11 H7 L10 8 M10 11 V17",
  link:        "M8 6 H5 a4 4 0 0 0 0 8 H8 M12 14 H15 a4 4 0 0 0 0-8 H12 M7 10 H13",
  refresh:     "M16 5 V9 H12 M4 15 V11 H8 M5 8 A6 6 0 0 1 15 6 M15 12 A6 6 0 0 1 5 14",
  panel:       "M2 4 H18 V16 H2 Z M7 4 V16",
  sun:         "M10 5 a5 5 0 1 0 0 10 a5 5 0 0 0 0-10 Z M10 1 V3 M10 17 V19 M1 10 H3 M17 10 H19 M3.5 3.5 L5 5 M15 15 L16.5 16.5 M3.5 16.5 L5 15 M15 5 L16.5 3.5",
  moon:        "M15 11 A6 6 0 0 1 9 5 A1 1 0 0 0 8 4 A7 7 0 1 0 16 12 A1 1 0 0 0 15 11 Z",
};

function Icon({ name, size = 16, className = "" }) {
  const d = ICONS[name];
  if (!d) return null;
  return (
    <svg className={`ico ${className}`} width={size} height={size} viewBox="0 0 20 20"
         fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

window.Icon = Icon;
