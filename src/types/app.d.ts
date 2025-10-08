declare module '*.json' {
  const value: {
    name: string;
    displayName: string;
    // Add other properties from your app.json here
  };
  export default value;
}
