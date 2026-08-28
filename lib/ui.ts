/**
 * Shared UI tokens — use across tabs and stack screens for consistency.
 * Icons: prefer @expo/vector-icons MaterialIcons with these sizes.
 */
export const UI = {
  icon: {
    sm: 20,
    md: 22,
    lg: 24,
    xl: 28,
  },
  color: {
    primary: '#059669',
    primaryDark: '#047857',
    primaryLight: '#ECFDF5',
    ink: '#14532D',
    muted: '#6B7280',
    border: '#E5E7EB',
    surface: '#FFFFFF',
    canvas: '#F0F7F4',
    canvasAlt: '#F9FAFB',
    /** Terracotta accent — reserved for small highlights (badges, tips, ratings), never large fills. */
    accent: '#C2703D',
    accentLight: '#FBEEE4',
  },
  radius: {
    card: 16,
    pill: 9999,
    sheet: 24,
  },
  /**
   * Static-weight custom fonts — for inline `style` (use the matching `font-*`
   * className from tailwind.config.js instead when nativewind will do). Never
   * combine with a `font-bold`/`fontWeight` override — each entry is its own font file.
   */
  font: {
    display: 'Fraunces_600SemiBold',
    displayBold: 'Fraunces_700Bold',
    displayBlack: 'Fraunces_900Black',
    displayItalic: 'Fraunces_500Medium_Italic',
    displayBoldItalic: 'Fraunces_700Bold_Italic',
    body: 'Manrope_400Regular',
    bodyMedium: 'Manrope_500Medium',
    bodySemiBold: 'Manrope_600SemiBold',
    bodyBold: 'Manrope_700Bold',
    bodyExtraBold: 'Manrope_800ExtraBold',
  },
  /** Soft, consistent elevation — pass to a View's `style` alongside a background color. */
  shadow: {
    sm: {
      shadowColor: '#0F3D2E',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#0F3D2E',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
  },
} as const;
