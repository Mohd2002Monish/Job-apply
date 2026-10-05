import { Platform, StyleSheet } from 'react-native';

export const Theme = {
  colors: {
    // Obsidian Dark Canvas & Glass Surfaces (Matching Web Frontend OKLCH Palette)
    bgApp: '#09090b',
    bgCard: '#121217',
    bgCardHover: '#181822',
    bgCardSolid: '#16161d',
    bgElevated: '#1e1e28',
    bgInput: '#181820',
    
    // Frost & Rim Borders
    borderCard: '#272732',
    borderCardHover: '#3b3b4f',
    borderSubtle: 'rgba(255, 255, 255, 0.08)',
    borderFocus: '#6366f1',
    
    // Typography Hierarchy
    textMain: '#f4f4f5',
    textMuted: '#a1a1aa',
    textSubtle: '#71717a',
    textInverse: '#09090b',
    
    // Brand & Status Accents
    brandPrimary: '#6366f1',       // Electric Indigo
    brandPrimaryHover: '#4f46e5',
    brandPrimaryLight: '#818cf8',
    brandAccent: '#10b981',        // Emerald Teal
    brandAccentLight: '#34d399',
    brandCyan: '#38bdf8',          // Sky / Opened
    brandAmber: '#f59e0b',         // Amber / Pending
    brandRose: '#f43f5e',          // Rose / Danger
  },
  
  shadows: {
    card: Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 8px 24px -6px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
      },
    }),
    glow: Platform.select({
      ios: {
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 0 20px rgba(99, 102, 241, 0.25)',
      },
    }),
  },
  
  radii: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
};

export const Colors = {
  light: {
    text: '#09090b',
    background: '#ffffff',
    backgroundElement: '#f4f4f5',
    backgroundSelected: '#e4e4e7',
    textSecondary: '#71717a',
  },
  dark: {
    text: Theme.colors.textMain,
    background: Theme.colors.bgApp,
    backgroundElement: Theme.colors.bgCard,
    backgroundSelected: Theme.colors.bgElevated,
    textSecondary: Theme.colors.textMuted,
  },
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'system-ui, -apple-system, sans-serif',
    serif: 'serif',
    rounded: 'sans-serif',
    mono: 'ui-monospace, monospace',
  },
}) ?? {
  sans: 'normal',
  serif: 'serif',
  rounded: 'normal',
  mono: 'monospace',
};

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

export const SharedStyles = StyleSheet.create({
  card: {
    backgroundColor: Theme.colors.bgCard,
    borderColor: Theme.colors.borderCard,
    borderWidth: 1,
    borderRadius: Theme.radii.lg,
    padding: Theme.spacing.lg,
    ...Theme.shadows.card,
  },
  cardInteractive: {
    backgroundColor: Theme.colors.bgCard,
    borderColor: Theme.colors.borderCard,
    borderWidth: 1,
    borderRadius: Theme.radii.lg,
    padding: Theme.spacing.lg,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.radii.full,
    borderWidth: 1,
  },
  buttonPrimary: {
    backgroundColor: Theme.colors.brandPrimary,
    borderRadius: Theme.radii.md,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Theme.spacing.lg,
    ...Theme.shadows.glow,
  },
  buttonSecondary: {
    backgroundColor: Theme.colors.bgCard,
    borderColor: Theme.colors.borderCard,
    borderWidth: 1,
    borderRadius: Theme.radii.md,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Theme.spacing.lg,
  },
  input: {
    backgroundColor: Theme.colors.bgInput,
    borderColor: Theme.colors.borderCard,
    borderWidth: 1,
    borderRadius: Theme.radii.md,
    color: Theme.colors.textMain,
    fontSize: 15,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.md,
  },
});
