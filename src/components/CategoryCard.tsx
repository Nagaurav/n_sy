import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

interface CategoryCardProps {
  title: string;
  onPress?: () => void;
  icon?: React.ReactNode;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ title, onPress, icon }) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    <View style={styles.icon}>{icon}</View>
    <Text style={typography.label}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.offWhite,
    borderRadius: 16,
    padding: 20,
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryGreen,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    minWidth: 100,
    minHeight: 100,
  },
  icon: {
    marginBottom: 8,
  },
});

export default CategoryCard;
