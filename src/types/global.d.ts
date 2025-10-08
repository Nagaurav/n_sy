// src/types/global.d.ts
import { AsyncStorageStatic } from '@react-native-async-storage/async-storage';

declare global {
  var AsyncStorage: AsyncStorageStatic;
}

// If you're using any other global types, add them here
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.svg' {
  import { SvgProps } from 'react-native-svg';
  const content: React.FC<SvgProps>;
  export default content;
}