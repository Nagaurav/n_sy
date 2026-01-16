import { Dimensions, Platform } from 'react-native';

export type ColorPalette = {
  primary: string;      // Calming Teal
  secondary: string;    // Deep Forest Green
  accent: string;        // Soft Coral for alerts/urgent CTAs
  error: string;        // Error color
  text: {
    primary: string;     // Deep Gray
    secondary: string;   // Subtle gray for captions
  };
  background: {
    primary: string;     // Off-White for screen backgrounds
    secondary: string;   // Light gray for alternative backgrounds (was #F3F4F6)
    surface: string;     // Pure white for cards/modals
    white: string;       // Pure white for text/icons
  };
  feedback: {
    error: string;
    success: string;
    warning: string;
  };
  // For backward compatibility
  colors?: {
    primary: string;
    secondary: string;
    accent: string;
    error: string;
    text: string;
    background: string;
    surface: string;
    border: string;
  };
};

export type Spacing = {
  xs: number;    // 4px
  s: number;     // 8px
  m: number;     // 16px
  l: number;     // 24px
  xl: number;    // 32px
  xxl: number;   // 48px
};

export type BorderRadius = {
  xs: number;
  s: number;
  m: number;
  l: number;
  xl: number;
  circle: number;
};

export type Shadows = {
  card: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  float: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  none: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
};

export type Typography = {
  fontFamily?: string;
  h1: {
    fontSize: number;
    fontWeight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
    lineHeight: number;
  };
  h2: {
    fontSize: number;
    fontWeight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
    lineHeight: number;
  };
  h3: {
    fontSize: number;
    fontWeight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
    lineHeight: number;
  };
  body: {
    fontSize: number;
    fontWeight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
    lineHeight: number;
  };
  small: {
    fontSize: number;
    fontWeight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
    lineHeight: number;
  };
  caption: {
    fontSize: number;
    fontWeight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
    lineHeight: number;
  };
};

export type Theme = {
  colors: ColorPalette;
  spacing: Spacing;
  borderRadius: BorderRadius;
  shadows: Shadows;
  typography: Typography;
  dimensions: {
    width: number;
    height: number;
  };
};

const { width, height } = Dimensions.get('window');

export const theme: Theme = {
  colors: {
    primary: '#008272',      // Calming Teal
    secondary: '#4C7360',    // Deep Forest Green
    accent: '#FF7043',       // Soft Coral for alerts/urgent CTAs
    error: '#DC2626',        // Error red
    text: {
      primary: '#1A202C',     // Deep Gray
      secondary: '#6B7280',   // Subtle gray for captions
    },
    background: {
      primary: '#F7F9FC',     // Off-White for screen backgrounds
      secondary: '#F3F4F6',   // Light gray for alternative backgrounds
      surface: '#FFFFFF',     // Pure white for cards/modals
      white: '#FFFFFF',       // Pure white for text/icons
    },
    feedback: {
      error: '#DC2626',      // Error red
      success: '#059669',     // Success green
      warning: '#D97706',     // Warning orange
    },
    // For backward compatibility with existing code
    colors: {
      primary: '#008272',
      secondary: '#4C7360',
      accent: '#FF7043',
      error: '#DC2626',
      text: '#1A202C',
      background: '#F7F9FC',
      surface: '#FFFFFF',
      border: '#E5E7EB',
    },
  },
  spacing: {
    xs: 4,      // 4px
    s: 8,       // 8px
    m: 16,      // 16px
    l: 24,      // 24px
    xl: 32,     // 32px
    xxl: 48,    // 48px
  },
  borderRadius: {
    xs: 4,
    s: 8,
    m: 12,
    l: 16,
    xl: 20,
    circle: 9999, // Very large for perfect circles
  },
  shadows: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 3,
    },
    float: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 6,
    },
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
  },
  typography: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    h1: {
      fontSize: 32,
      fontWeight: '700' as const,
      lineHeight: 40,
    },
    h2: {
      fontSize: 24,
      fontWeight: '600' as const,
      lineHeight: 32,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 28,
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
    },
    small: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
    },
    caption: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 16,
    },
  },
  dimensions: {
    width,
    height,
  },
};

// Common styles that can be reused across components
export const commonStyles = {
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  surfaceContainer: {
    flex: 1,
    backgroundColor: theme.colors.background.surface,
  },
  contentContainer: {
    flex: 1,
    padding: theme.spacing.m,
  },
  // Standardized header styles
  header: {
    backgroundColor: theme.colors.primary,
    paddingTop: 40, // Will be overridden with StatusBar.currentHeight
    paddingBottom: theme.spacing.m,
    paddingHorizontal: theme.spacing.m,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  headerTitle: {
    ...theme.typography.h2,
    color: theme.colors.background.surface,
    fontWeight: '600' as const,
  },
  // Standardized card styles
  card: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.m,
    ...theme.shadows.card,
  },
  appointmentCard: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.l,
    marginBottom: theme.spacing.l,
    ...theme.shadows.card,
  },
  surfaceCard: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.s,
    ...theme.shadows.card,
  },
  floatingCard: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.m,
    ...theme.shadows.float,
  },
  // Standardized typography
  heading: {
    ...theme.typography.h2,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.m,
  },
  subheading: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.m,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    fontWeight: '600' as const,
    marginBottom: theme.spacing.m,
  },
  cardTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    fontWeight: '600' as const,
    marginBottom: theme.spacing.s,
  },
  body: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
  },
  caption: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
  // Standardized button styles
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.l,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center' as const,
    marginVertical: theme.spacing.s,
    ...theme.shadows.card,
  },
  buttonText: {
    ...theme.typography.body,
    color: theme.colors.background.surface,
    fontWeight: '600' as const,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.l,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center' as const,
    marginVertical: theme.spacing.s,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  secondaryButtonText: {
    ...theme.typography.body,
    color: theme.colors.primary,
    fontWeight: '600' as const,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.text.secondary,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.m,
    fontSize: theme.typography.body.fontSize,
    backgroundColor: theme.colors.background.surface,
  },
  pillBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: theme.spacing.s,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.xl,
    gap: theme.spacing.xs,
  },
};
