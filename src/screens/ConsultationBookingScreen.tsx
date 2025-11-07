// ConsultationBookingScreen.tsx
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
import { useNavigation, useRoute, NavigationProp } from '@react-navigation/native';

import { colors } from '../theme/colors';
import { ROUTES } from '../navigation/constants';

const ConsultationBookingScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const route = useRoute();
  const { mode, location } = route.params as {
    mode: 'online' | 'offline';
    location?: { city: string; latitude: number; longitude: number };
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yoga Consultation</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <MaterialCommunityIcons name="account-tie" size={80} color={colors.primaryGreen} />
        <Text style={styles.title}>Yoga Consultation Booking</Text>
        <Text style={styles.subtitle}>
          {mode === 'online' ? 'Online' : 'Offline'} consultation mode
        </Text>
        {location && (
          <Text style={styles.location}>
            Location: {location.city}
          </Text>
        )}
        <Text style={styles.description}>
          This screen will be implemented to show available yoga consultation professionals
          and allow users to select date, time, and duration for their consultation.
        </Text>
      </View>

      {/* Action Button */}
      <View style={styles.bottomAction}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate(ROUTES.DATE_SELECTION, {
            mode,
            location,
          })}
        >
          <Text style={styles.buttonText}>Continue to Date Selection</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.primaryText,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.primaryText,
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.secondaryText,
    marginBottom: 16,
    textAlign: 'center',
  },
  location: {
    fontSize: 14,
    color: colors.primaryGreen,
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomAction: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  button: {
    backgroundColor: colors.primaryGreen,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.offWhite,
  },
});

export default ConsultationBookingScreen;
