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
import { useTypedNavigation } from '../hooks/useTypedNavigation';
import { bookingService } from '../services';

type Prescription = {
  id: string;
  date: string;
  doctorName: string;
  fileUrl?: string;
};

type DietChart = {
  id: string;
  date: string;
  nutritionistName: string;
  fileUrl?: string;
};

type SessionHistoryItem = {
  id: string;
  date: string;
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
  const navigation = useTypedNavigation();

  const [records, setRecords] = useState<SectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Fetch Health Records */
  const fetchHealthRecords = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const userId = 'user_123'; // TODO: Replace with actual user context or auth
      let sessionHistory: SessionHistoryItem[] = [];

      /** 🩺 Fetch session history */
      const bookingResponse = await bookingService.getUserBookings(userId);
      if (bookingResponse.success && bookingResponse.data) {
        sessionHistory = bookingResponse.data.map((b: any) => ({
          id: b.booking_id || b.id,
          date: b.date || b.booking_date,
          professionalName: b.professional_name || 'Professional',
          serviceName: b.service_name || 'Consultation',
          mode: b.mode || 'Online',
          duration: b.duration || 60,
          notes: b.notes || 'Session completed successfully',
          status: b.booking_status?.toLowerCase() || 'completed',
          amount: b.amount || 0,
        }));
      }

      /** 🧾 Fetch prescriptions & diet charts (if APIs exist) */
      const [prescriptionsResponse, dietResponse] = await Promise.allSettled([
        // Replace with actual API calls when available
        Promise.resolve([]),
        Promise.resolve([]),
      ]);

      const prescriptions: Prescription[] =
        prescriptionsResponse.status === 'fulfilled'
          ? (prescriptionsResponse.value as Prescription[])
          : [];

      const dietCharts: DietChart[] =
        dietResponse.status === 'fulfilled'
          ? (dietResponse.value as DietChart[])
          : [];

      setRecords([
        { title: 'Session History', data: sessionHistory, key: 'sessions' },
        { title: 'Prescriptions', data: prescriptions, key: 'prescriptions' },
        { title: 'Diet Charts', data: dietCharts, key: 'dietCharts' },
      ]);
    } catch (e: any) {
      console.error('Error fetching records:', e);
      setError(e.message || 'Failed to load health records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealthRecords();
  }, [fetchHealthRecords]);

  /** Open file URL */
  const handleOpenFile = async (url?: string) => {
    if (!url) return Alert.alert('No File', 'No file available for this record.');
    try {
      const supported = await Linking.canOpenURL(url);
      supported ? await Linking.openURL(url) : Alert.alert('Error', 'Unsupported file type.');
    } catch {
      Alert.alert('Error', 'Failed to open file.');
    }
  };

  /** Show Session Details */
  const showSessionDetails = (session: SessionHistoryItem) => {
    Alert.alert(
      'Session Details',
      `Professional: ${session.professionalName}\nService: ${session.serviceName}\nMode: ${session.mode}\nDuration: ${session.duration} min\nStatus: ${session.status}\nNotes: ${session.notes || 'N/A'}`,
      [{ text: 'OK' }]
    );
  };

  /** Get Status Color */
  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'completed') return colors.success;
    if (s === 'cancelled') return colors.error;
    if (s === 'pending') return colors.accentYellow;
    return colors.secondaryText;
  };

  /** Render Each Record Item */
  const renderItem = ({ item, section }: { item: any; section: SectionData }) => {
    const isSession = section.key === 'sessions';
    const isPrescription = section.key === 'prescriptions';
    const isDietChart = section.key === 'dietCharts';

    const iconName = isSession
      ? 'calendar-check'
      : isPrescription
      ? 'file-document'
      : 'food-apple';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          isSession ? showSessionDetails(item) : handleOpenFile(item.fileUrl)
        }
      >
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <View style={styles.titleRow}>
              <MaterialCommunityIcons
                name={iconName}
                size={20}
                color={colors.primaryGreen}
              />
              <Text style={styles.cardTitle}>
                {isSession
                  ? item.serviceName
                  : isPrescription
                  ? `Prescription by ${item.doctorName}`
                  : `Diet Chart by ${item.nutritionistName}`}
              </Text>
            </View>

            <Text style={styles.cardDate}>
              {new Date(item.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>

            {isSession && (
              <View style={styles.sessionRow}>
                <Text style={styles.sessionInfo}>
                  {item.professionalName} • {item.mode} • {item.duration} min
                </Text>
                <View style={styles.statusRow}>
                  <View
                    style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]}
                  />
                  <Text
                    style={[styles.statusText, { color: getStatusColor(item.status) }]}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {(isPrescription || isDietChart) && item.fileUrl && (
            <TouchableOpacity onPress={() => handleOpenFile(item.fileUrl)}>
              <MaterialCommunityIcons name="download" size={22} color={colors.primaryGreen} />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  /** Loading State */
  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primaryGreen} />
        <Text style={styles.subText}>Loading health records...</Text>
      </SafeAreaView>
    );
  }

  /** Error State */
  if (error) {
    return (
      <SafeAreaView style={styles.centered}>
        <MaterialCommunityIcons name="alert-circle" size={60} color={colors.error} />
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchHealthRecords}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  /** Empty State */
  if (!records.some((r) => r.data.length)) {
    return (
      <SafeAreaView style={styles.centered}>
        <MaterialCommunityIcons
          name="file-document-outline"
          size={70}
          color={colors.secondaryText}
        />
        <Text style={styles.emptyTitle}>No Health Records</Text>
        <Text style={styles.subText}>
          Your prescriptions and consultation records will appear here.
        </Text>
      </SafeAreaView>
    );
  }

  /** Main Render */
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Health Records</Text>
        <View style={{ width: 40 }} />
      </View>

      <SectionList
        sections={records}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionTitle}>{section.title}</Text>
        )}
        contentContainerStyle={{ paddingBottom: 40 }}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

/** 💅 Styles */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.offWhite,
  },
  backBtn: { padding: 6 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.primaryGreen },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primaryGreen,
    backgroundColor: colors.lightGreen,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: colors.offWhite,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.lightGreen,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.primaryText, marginLeft: 8 },
  cardDate: { fontSize: 13, color: colors.secondaryText, marginBottom: 4 },
  sessionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sessionInfo: { fontSize: 13, color: colors.secondaryText },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },
  errorTitle: { fontSize: 18, fontWeight: '700', color: colors.primaryText, marginTop: 12 },
  errorText: { fontSize: 14, color: colors.secondaryText, marginTop: 6, textAlign: 'center' },
  retryBtn: {
    backgroundColor: colors.primaryGreen,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  retryText: { color: colors.offWhite, fontWeight: '600', fontSize: 15 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.primaryText, marginTop: 14 },
  subText: { fontSize: 14, color: colors.secondaryText, textAlign: 'center', marginTop: 6 },
});

export default HealthRecordsScreen;
