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
    ink: '#14532D',
    muted: '#6B7280',
    border: '#E5E7EB',
    surface: '#FFFFFF',
    canvas: '#F0F7F4',
    canvasAlt: '#F9FAFB',
  },
  radius: {
    card: 16,
    pill: 9999,
    sheet: 24,
  },
} as const;
