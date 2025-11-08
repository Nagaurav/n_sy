import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors } from '../theme/colors';
import { ROUTES } from '../navigation/constants';
import type { RootStackParamList } from '../navigation/constants';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface RouteParams {
  category?: string;
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
  mode: 'online' | 'offline';
  location?: { city: string; latitude: number; longitude: number };
}

const ConsultationBookingScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const {
    category = 'yoga_consultation',
    categoryName = 'Yoga Consultation',
    categoryIcon = 'account-tie',
    categoryColor = colors.primaryGreen,
    mode,
    location,
  } = route.params as RouteParams;

  const handleContinue = () => {
    navigation.navigate(ROUTES.DATE_SELECTION, { mode, location });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{categoryName}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={[styles.iconWrapper, { backgroundColor: `${categoryColor}20` }]}>
          <MaterialCommunityIcons name={categoryIcon as any} size={72} color={categoryColor} />
        </View>
        <Text style={styles.title}>{categoryName}</Text>

        <Text style={styles.subtitle}>
          {mode === 'online' ? 'Online Consultation' : 'Offline Consultation'}
        </Text>

        {location && (
          <Text style={styles.locationText}>
            📍 Location: {location.city || 'Unknown'}
          </Text>
        )}

        <Text style={styles.description}>
          This screen will display a list of available professionals for {categoryName.toLowerCase()}.
          Users will be able to select a professional, pick a date & time, and confirm the booking.
        </Text>
      </View>

      {/* Bottom Action */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleContinue}>
          <Text style={styles.primaryButtonText}>Continue to Date Selection</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color={colors.offWhite} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// 💅 Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: { padding: 6 },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primaryText,
  },
  placeholder: { width: 40 },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 36,
  },
  iconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primaryText,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.secondaryText,
    marginBottom: 16,
    textAlign: 'center',
  },
  locationText: {
    fontSize: 14,
    color: colors.primaryGreen,
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: colors.primaryGreen,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  primaryButtonText: {
    color: colors.offWhite,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ConsultationBookingScreen;
