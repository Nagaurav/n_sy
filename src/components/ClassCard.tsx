import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

interface ClassCardProps {
  title: string;
  instructor: string;
  time: string;
  imageUrl?: string;
  onPress?: () => void;
}

const ClassCard: React.FC<ClassCardProps> = ({ title, instructor, time, imageUrl, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.image} /> : null}
    <Text style={typography.label}>{title}</Text>
    <Text style={styles.meta}>{instructor} • {time}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.offWhite,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.primaryGreen,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    minWidth: 140,
  },
  image: {
    width: '100%',
    height: 90,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: colors.lightSage,
  },
  meta: {
    ...typography.body,
    color: colors.secondaryText,
    marginTop: 4,
  },
});

export default ClassCard;
