// SeedBanner.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../../theme/colors';

interface SeedBannerProps {
  message?: string;
}

const SeedBanner: React.FC<SeedBannerProps> = ({ message }) => {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="alert-circle-outline" size={18} color={colors.primaryGreen} />
      <Text style={styles.text}>
        {message || 'Seed data is being shown until the API is available.'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F5EF',
    borderWidth: 1,
    borderColor: colors.primaryGreen,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 8,
  },
  text: {
    marginLeft: 8,
    color: colors.primaryGreen,
    fontSize: 12,
    fontWeight: '600',
  },
});

export default SeedBanner;


