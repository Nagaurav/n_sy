// HealthRecordsScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  StatusBar,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useNavigation } from '@react-navigation/native';
import { bookingService } from '../services';

type Prescription = {
  id: string;
  date: string; // ISO
  doctorName: string;
  fileUrl?: string; // downloadable PDF or image
};

type DietChart = {
  id: string;
  date: string; // ISO
  nutritionistName: string;
  fileUrl?: string;
};

type SessionHistoryItem = {
  id: string;
  date: string;   // ISO
  professionalName: string;
  serviceName: string;
  mode: string;
  duration: number;
  notes?: string;
  status: string;
  amount: number;
};

type SectionData = {
  title: string;
  data: Array<Prescription | DietChart | SessionHistoryItem>;
  key: 'prescriptions' | 'dietCharts' | 'sessions';
};

const HealthRecordsScreen: React.FC = () => {
  const navigation = useNavigation();

  const [records, setRecords] = useState<SectionData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealthRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Mock data for prescriptions and diet charts since no specific APIs exist
      const mockPrescriptions = [
        {
          id: '1',
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          doctorName: 'Dr. Ananya Sharma',
          fileUrl: 'https://example.com/prescription1.pdf',
        },
        {
          id: '2',
          date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          doctorName: 'Dr. Rajesh Kumar',
          fileUrl: 'https://example.com/prescription2.pdf',
        },
      ];

      const mockDietCharts = [
        {
          id: '1',
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          nutritionistName: 'Priya Patel',
          fileUrl: 'https://example.com/dietchart1.pdf',
        },
      ];

      // Fetch real session history from booking API
      let sessionHistory: SessionHistoryItem[] = [];
      try {
        const userId = 'user_123'; // Replace with actual user ID from context
        const bookingsResponse = await bookingService.getUserBookings(userId);
        
        if (bookingsResponse.success && bookingsResponse.data) {
          // Transform bookings to session history format
          sessionHistory = bookingsResponse.data.map((booking: any) => ({
            id: booking.booking_id || booking.id,
            date: booking.date || booking.booking_date,
            professionalName: booking.professional_name || 'Professional',
            serviceName: booking.service_name || 'Consultation',
            mode: booking.mode || 'Online',
            duration: booking.duration || 60,
            notes: booking.notes || 'Session completed successfully',
            status: booking.booking_status?.toLowerCase() || 'completed',
            amount: booking.amount || 0,
          }));
        }
      } catch (bookingError) {
        console.error('Error fetching session history:', bookingError);
        // Fallback to mock session data
        sessionHistory = [
          {
            id: '1',
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            professionalName: 'Dr. Kavita',
            serviceName: 'Yoga Therapy',
            mode: 'Video Call',
            duration: 60,
            notes: 'Focus on stress management and breathing techniques',
            status: 'completed',
            amount: 800,
          },
          {
            id: '2',
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            professionalName: 'Anil Kumar',
            serviceName: 'Meditation Session',
            mode: 'Video Call',
            duration: 45,
            notes: 'Guided meditation for anxiety relief',
            status: 'completed',
            amount: 600,
          },
          {
            id: '3',
            date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            professionalName: 'Dr. Priya',
            serviceName: 'Ayurveda Consultation',
            mode: 'Clinic Visit',
            duration: 90,
            notes: 'Initial consultation and health assessment',
            status: 'completed',
            amount: 1200,
          },
        ];
      }

      setRecords([
        {
          title: 'Session History',
          data: sessionHistory,
          key: 'sessions',
        },
        {
          title: 'Prescriptions',
          data: mockPrescriptions,
          key: 'prescriptions',
        },
        {
          title: 'Diet Charts',
          data: mockDietCharts,
          key: 'dietCharts',
        },
      ]);
    } catch (e: any) {
      setError(e.message || 'Failed to load health records');
      console.error('Error fetching health records:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealthRecords();
  }, [fetchHealthRecords]);

  const handleOpenFile = async (url?: string) => {
    if (!url) {
      Alert.alert('No File', 'No file available for this record.');
      return;
    }

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open this file type.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open file.');
    }
  };

  const renderItem = ({ item, section }: { item: any; section: SectionData }) => {
    const isSession = section.key === 'sessions';
    const isPrescription = section.key === 'prescriptions';
    const isDietChart = section.key === 'dietCharts';

    const getIcon = () => {
      if (isSession) return 'calendar-check';
      if (isPrescription) return 'file-document';
      if (isDietChart) return 'food-apple';
      return 'file';
    };

    const getStatusColor = (status: string) => {
      switch (status?.toLowerCase()) {
        case 'completed':
          return colors.success;
        case 'cancelled':
          return colors.error;
        case 'pending':
          return colors.accentYellow;
        default:
          return colors.secondaryText;
      }
    };

    return (
      <TouchableOpacity
        style={styles.recordCard}
        onPress={() => {
          if (isPrescription || isDietChart) {
            handleOpenFile(item.fileUrl);
          } else {
            // For sessions, show details
            Alert.alert(
              'Session Details',
              `Professional: ${item.professionalName}\nService: ${item.serviceName}\nDuration: ${item.duration} min\nNotes: ${item.notes || 'No notes available'}`,
              [{ text: 'OK' }]
            );
          }
        }}
      >
        <View style={styles.recordHeader}>
          <View style={styles.recordInfo}>
            <View style={styles.recordTitleRow}>
              <MaterialCommunityIcons
                name={getIcon() as any}
                size={20}
                color={colors.primaryGreen}
                style={styles.recordIcon}
              />
              <Text style={styles.recordTitle}>
                {isSession
                  ? item.serviceName
                  : isPrescription
                  ? `Prescription by ${item.doctorName}`
                  : `Diet Chart by ${item.nutritionistName}`}
              </Text>
            </View>
            <Text style={styles.recordDate}>
              {new Date(item.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
            {isSession && (
              <View style={styles.sessionDetails}>
                <Text style={styles.sessionInfo}>
                  {item.professionalName} • {item.mode} • {item.duration} min
                </Text>
                <View style={styles.statusContainer}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: getStatusColor(item.status) },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(item.status) },
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>
            )}
          </View>
          {(isPrescription || isDietChart) && item.fileUrl && (
            <TouchableOpacity
              style={styles.downloadButton}
              onPress={() => handleOpenFile(item.fileUrl)}
            >
              <MaterialCommunityIcons
                name="download"
                size={20}
                color={colors.primaryGreen}
              />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <ActivityIndicator size="large" color={colors.primaryGreen} />
        <Text style={styles.loadingText}>Loading health records...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <MaterialCommunityIcons
          name="alert-circle"
          size={64}
          color={colors.error}
        />
        <Text style={styles.errorTitle}>Error Loading Records</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchHealthRecords}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle}>Health Records</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      {records.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons 
            name="file-document-outline" 
            size={80} 
            color={colors.secondaryText} 
          />
          <Text style={styles.emptyTitle}>No Health Records Available</Text>
          <Text style={styles.emptySubtitle}>
            Your health records, prescriptions, and session history will appear here after your first consultation.
          </Text>
        </View>
      ) : (
        <SectionList
          sections={records}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={({ section: { title } }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{title}</Text>
            </View>
          )}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: colors.primaryGreen,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700' as const,
  },
  placeholder: { width: 40 }, // Placeholder for the right side of the header
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.secondaryText,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primaryText,
    marginTop: 16,
  },
  errorMessage: {
    fontSize: 16,
    color: colors.secondaryText,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: colors.primaryGreen,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  retryButtonText: {
    color: colors.offWhite,
    fontWeight: '700',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.primaryText,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 24,
  },
  sectionHeader: {
    backgroundColor: colors.lightSage,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 18,
    color: colors.primaryGreen,
  },
  recordCard: {
    backgroundColor: colors.offWhite,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordInfo: {
    flex: 1,
    marginRight: 10,
  },
  recordTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordIcon: {
    marginRight: 8,
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryText,
  },
  recordDate: {
    fontSize: 13,
    color: colors.secondaryText,
    marginTop: 2,
  },
  sessionDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  sessionInfo: {
    fontSize: 13,
    color: colors.secondaryText,
    marginRight: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  downloadButton: {
    padding: 8,
  },
  listContainer: {
    paddingBottom: 24,
  },
});

export default HealthRecordsScreen; 