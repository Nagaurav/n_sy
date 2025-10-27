import { Dimensions } from 'react-native';

export type ColorPalette = {
  primary: string;
  accent: string;
  error: string; // Added error color at the root level for direct access
  text: {
    primary: string;
    secondary: string;
  };
  background: {
    light: string;
    white: string;
  };
  feedback: {
    error: string;
  };
  // For backward compatibility
  colors?: {
    primary: string;
    error: string;
    text: string;
    background: string;
    border: string;
  };
};

export type Spacing = {
  small: number;
  medium: number;
  large: number;
};

export type BorderRadius = {
  small: number;
  medium: number;
  large: number;
  circle: number;
};

export type Theme = {
  colors: ColorPalette;
  spacing: Spacing;
  borderRadius: BorderRadius;
  dimensions: {
    width: number;
    height: number;
  };
};

const { width, height } = Dimensions.get('window');

export const theme: Theme = {
  colors: {
    primary: '#1E88E5',
    accent: '#50E3C2',
    error: '#EF4444', // Added error at root level
    text: {
      primary: '#1F2937',
      secondary: '#6B7280',
    },
    background: {
      light: '#F3F4F6',
      white: '#FFFFFF',
    },
    feedback: {
      error: '#EF4444',
    },
    // For backward compatibility with existing code
    colors: {
      primary: '#1E88E5',
      error: '#EF4444',
      text: '#1F2937',
      background: '#FFFFFF',
      border: '#E5E7EB',
    },
  },
  spacing: {
    small: 8,
    medium: 16,
    large: 24,
  },
  borderRadius: {
    small: 4,
    medium: 8,
    large: 16,
    circle: 30,
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
    backgroundColor: theme.colors.background.white,
  },
  contentContainer: {
    flex: 1,
    padding: theme.spacing.medium,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.medium,
  },
  subheading: {
    fontSize: 18,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.medium,
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.medium,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center' as const,
    marginVertical: theme.spacing.small,
  },
  buttonText: {
    color: theme.colors.background.white,
    fontWeight: 'bold' as const,
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.text.secondary,
    borderRadius: theme.borderRadius.small,
    padding: theme.spacing.medium,
    marginBottom: theme.spacing.medium,
    fontSize: 16,
  },
};
