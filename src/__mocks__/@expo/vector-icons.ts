import React from 'react';

// Mock implementation of Ionicons from @expo/vector-icons
const Ionicons = ({ name, size, color, style, ...props }: any) => {
  return React.createElement('Ionicons', {
    name,
    size,
    color,
    style,
    ...props
  });
};

export { Ionicons };

// This is a mock implementation for testing purposes only.
