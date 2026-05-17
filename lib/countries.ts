export interface Country {
  code: string;
  name: string;
  flag: string;
  primaryColor: string;
  secondaryColor: string;
  group: string;
}

export const COUNTRIES: Country[] = [
  // Group A
  { code: "ARG", name: "Argentina", flag: "🇦🇷", primaryColor: "#74ACDF", secondaryColor: "#FFFFFF", group: "South America" },
  { code: "BRA", name: "Brazil", flag: "🇧🇷", primaryColor: "#009C3B", secondaryColor: "#FFDF00", group: "South America" },
  { code: "URU", name: "Uruguay", flag: "🇺🇾", primaryColor: "#5AAEF0", secondaryColor: "#FFFFFF", group: "South America" },
  { code: "COL", name: "Colombia", flag: "🇨🇴", primaryColor: "#FCD116", secondaryColor: "#003087", group: "South America" },
  { code: "CHI", name: "Chile", flag: "🇨🇱", primaryColor: "#D52B1E", secondaryColor: "#FFFFFF", group: "South America" },
  { code: "ECU", name: "Ecuador", flag: "🇪🇨", primaryColor: "#FFD100", secondaryColor: "#003580", group: "South America" },

  // Europe
  { code: "FRA", name: "France", flag: "🇫🇷", primaryColor: "#002395", secondaryColor: "#FFFFFF", group: "Europe" },
  { code: "GER", name: "Germany", flag: "🇩🇪", primaryColor: "#FFFFFF", secondaryColor: "#000000", group: "Europe" },
  { code: "ESP", name: "Spain", flag: "🇪🇸", primaryColor: "#AA151B", secondaryColor: "#F1BF00", group: "Europe" },
  { code: "ENG", name: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", primaryColor: "#FFFFFF", secondaryColor: "#CF081F", group: "Europe" },
  { code: "ITA", name: "Italy", flag: "🇮🇹", primaryColor: "#003399", secondaryColor: "#FFFFFF", group: "Europe" },
  { code: "POR", name: "Portugal", flag: "🇵🇹", primaryColor: "#006600", secondaryColor: "#FF0000", group: "Europe" },
  { code: "NED", name: "Netherlands", flag: "🇳🇱", primaryColor: "#FF6600", secondaryColor: "#FFFFFF", group: "Europe" },
  { code: "BEL", name: "Belgium", flag: "🇧🇪", primaryColor: "#ED2939", secondaryColor: "#000000", group: "Europe" },
  { code: "CRO", name: "Croatia", flag: "🇭🇷", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", group: "Europe" },
  { code: "DEN", name: "Denmark", flag: "🇩🇰", primaryColor: "#C60C30", secondaryColor: "#FFFFFF", group: "Europe" },
  { code: "SWI", name: "Switzerland", flag: "🇨🇭", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", group: "Europe" },
  { code: "SER", name: "Serbia", flag: "🇷🇸", primaryColor: "#C6363C", secondaryColor: "#0C4076", group: "Europe" },
  { code: "POL", name: "Poland", flag: "🇵🇱", primaryColor: "#FFFFFF", secondaryColor: "#DC143C", group: "Europe" },

  // North America
  { code: "USA", name: "USA", flag: "🇺🇸", primaryColor: "#002868", secondaryColor: "#BF0A30", group: "CONCACAF" },
  { code: "MEX", name: "Mexico", flag: "🇲🇽", primaryColor: "#006847", secondaryColor: "#CE1126", group: "CONCACAF" },
  { code: "CAN", name: "Canada", flag: "🇨🇦", primaryColor: "#FF0000", secondaryColor: "#FFFFFF", group: "CONCACAF" },
  { code: "CRC", name: "Costa Rica", flag: "🇨🇷", primaryColor: "#002B7F", secondaryColor: "#CE1126", group: "CONCACAF" },
  { code: "PAN", name: "Panama", flag: "🇵🇦", primaryColor: "#FFFFFF", secondaryColor: "#005293", group: "CONCACAF" },
  { code: "JAM", name: "Jamaica", flag: "🇯🇲", primaryColor: "#000000", secondaryColor: "#FED100", group: "CONCACAF" },

  // Africa
  { code: "MAR", name: "Morocco", flag: "🇲🇦", primaryColor: "#C1272D", secondaryColor: "#006233", group: "Africa" },
  { code: "SEN", name: "Senegal", flag: "🇸🇳", primaryColor: "#00853F", secondaryColor: "#FDEF42", group: "Africa" },
  { code: "NIG", name: "Nigeria", flag: "🇳🇬", primaryColor: "#008751", secondaryColor: "#FFFFFF", group: "Africa" },
  { code: "GHA", name: "Ghana", flag: "🇬🇭", primaryColor: "#006B3F", secondaryColor: "#FCD116", group: "Africa" },
  { code: "CMR", name: "Cameroon", flag: "🇨🇲", primaryColor: "#007A5E", secondaryColor: "#CE1126", group: "Africa" },
  { code: "EGY", name: "Egypt", flag: "🇪🇬", primaryColor: "#CE1126", secondaryColor: "#FFFFFF", group: "Africa" },
  { code: "CIV", name: "Ivory Coast", flag: "🇨🇮", primaryColor: "#F77F00", secondaryColor: "#009A44", group: "Africa" },
  { code: "TUN", name: "Tunisia", flag: "🇹🇳", primaryColor: "#E70013", secondaryColor: "#FFFFFF", group: "Africa" },

  // Asia
  { code: "JPN", name: "Japan", flag: "🇯🇵", primaryColor: "#003087", secondaryColor: "#FFFFFF", group: "Asia" },
  { code: "KOR", name: "South Korea", flag: "🇰🇷", primaryColor: "#CE1126", secondaryColor: "#003478", group: "Asia" },
  { code: "AUS", name: "Australia", flag: "🇦🇺", primaryColor: "#00843D", secondaryColor: "#FFD700", group: "Asia/Oceania" },
  { code: "IRN", name: "Iran", flag: "🇮🇷", primaryColor: "#239F40", secondaryColor: "#FFFFFF", group: "Asia" },
  { code: "SAU", name: "Saudi Arabia", flag: "🇸🇦", primaryColor: "#006C35", secondaryColor: "#FFFFFF", group: "Asia" },
  { code: "QAT", name: "Qatar", flag: "🇶🇦", primaryColor: "#8D1B3D", secondaryColor: "#FFFFFF", group: "Asia" },
];

export const GROUPS = Array.from(new Set(COUNTRIES.map((c) => c.group)));
