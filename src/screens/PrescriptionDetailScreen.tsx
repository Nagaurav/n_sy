import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  StatusBar,
  Animated,
  SafeAreaView,
  Alert,
  Dimensions,
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../hooks/useAuth';
import { medicalService } from '../services';
import type { HomeStackParamList } from '../types/navigation';
import type { Prescription } from '../types/medical';
import { useTheme } from '../contexts/ThemeContext';
import { theme } from '../theme';

const { width, height } = Dimensions.get('window');

type PrescriptionDetailRouteProp = RouteProp<
  HomeStackParamList,
  'PrescriptionDetail'
>;

type PrescriptionDetailNavigationProp = StackNavigationProp<
  HomeStackParamList,
  'PrescriptionDetail'
>;

const PrescriptionDetailScreen: React.FC = () => {
  const route = useRoute<PrescriptionDetailRouteProp>();
  const navigation = useNavigation<PrescriptionDetailNavigationProp>();
  const { prescriptionId } = route.params;
  const { isAuthReady } = useAuth();
  const { theme: appTheme } = useTheme();

  console.log(' [PrescriptionDetail] Screen rendering with prescriptionId:', prescriptionId);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Start entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (isAuthReady) {
      fetchPrescriptionDetail();
    } else {
      setIsLoading(true);
    }
  }, [prescriptionId, isAuthReady]);

  const fetchPrescriptionDetail = async () => {
    console.log(' [PrescriptionDetail] Starting fetch for prescriptionId:', prescriptionId);
    setIsLoading(true);
    setError(null);
    try {
      const response = await medicalService.getPrescription(prescriptionId);

      console.log(' [PrescriptionDetail] Full API Response:', JSON.stringify(response, null, 2));

      let prescriptionData = null;

      if (response?.success) {
        prescriptionData = response.data?.data || response.data || null;
      } else if (response?.data) {
        prescriptionData = response.data;
      }

      console.log(' [PrescriptionDetail] Extracted prescription data:', prescriptionData);

      if (!prescriptionData) {
        console.log(' [PrescriptionDetail] No prescription data found');
        setError('No prescription found for this appointment. The doctor may not have issued a prescription yet.');
        setPrescription(null);
        return;
      }

      setPrescription(prescriptionData as Prescription);
    } catch (err: any) {
      console.error(' [PrescriptionDetail] Fetch error:', err);

      if (err.response?.status === 404) {
        setError('No prescription found for this appointment. The doctor may not have issued a prescription yet.');
      } else {
        setError(err.message || 'Failed to load prescription details.');
      }
      setPrescription(null);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchPrescriptionDetail();
  }, []);

  const handleDownloadPdf = useCallback(() => {
    console.log('Download PDF for prescription', prescriptionId);
    Alert.alert(
      'Download PDF',
      'PDF download feature will be available soon.',
      [{ text: 'OK', style: 'default' }]
    );
  }, [prescriptionId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading && !isRefreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor={appTheme.colors.primary} barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={appTheme.colors.primary} />
          <Text style={styles.loadingText}>Loading prescription details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !prescription) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor={appTheme.colors.primary} barStyle="light-content" />
        <View style={styles.errorContainer}>
          <View style={styles.errorCard}>
            <Ionicons name="document-text-outline" size={48} color={appTheme.colors.primary} />
            <Text style={styles.errorTitle}>No Prescription Found</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchPrescriptionDetail}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: appTheme.colors.background.secondary }]}
              onPress={() => navigation.goBack()}
            >
              <Text style={[styles.retryButtonText, { color: appTheme.colors.text.primary }]}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!prescription) {
    return null; // This will be handled by the error state above
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={appTheme.colors.primary} barStyle="light-content" />

      {/* Modern Header with Gradient */}
      <Animated.View
        style={[
          styles.headerWrapper,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={[appTheme.colors.primary, appTheme.colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <StatusBar backgroundColor={appTheme.colors.primary} barStyle="light-content" />
          
          <View style={styles.headerContent}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={24} color={appTheme.colors.background.surface} />
            </TouchableOpacity>
            
            <View style={styles.titleContainer}>
              <Text style={styles.headerTitle}>Prescription</Text>
              <Text style={styles.headerSubtitle}>Medical prescription details</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.moreButton} 
              onPress={handleDownloadPdf}
              activeOpacity={0.7}
            >
              <Ionicons name="download" size={20} color={appTheme.colors.background.surface} />
            </TouchableOpacity>
          </View>
          
          {/* Decorative elements */}
          <View style={styles.topCircle} />
          <View style={styles.bottomWave} />
        </LinearGradient>
      </Animated.View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Prescription ID Card */}
        <Animated.View
          style={[
            styles.prescriptionIdCard,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          <View style={styles.prescriptionIdHeader}>
            <View style={styles.prescriptionIdInfo}>
              <Text style={styles.prescriptionIdLabel}>Prescription ID</Text>
              <Text style={styles.prescriptionIdValue}>{prescription.prescriptionId}</Text>
            </View>
            <View style={styles.prescriptionTypeBadge}>
              <Text style={styles.prescriptionTypeText}>{prescription.prescriptionType}</Text>
            </View>
          </View>
          <View style={styles.prescriptionDate}>
            <Ionicons name="calendar-outline" size={16} color={appTheme.colors.text.secondary} />
            <Text style={styles.prescriptionDateText}>
              {prescription.prescriptionDate ? 
                new Date(prescription.prescriptionDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 
                'N/A'
              }
            </Text>
          </View>
        </Animated.View>

        {/* Patient & Doctor Info Card */}
        <Animated.View
          style={[
            styles.infoCard,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: Animated.add(slideAnim, 20) },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          <View style={styles.infoSection}>
            <View style={styles.infoHeader}>
              <Ionicons name="person-outline" size={20} color={appTheme.colors.primary} />
              <Text style={styles.infoTitle}>Patient Information</Text>
            </View>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>{prescription.patientName || 'N/A'}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Age</Text>
                <Text style={styles.infoValue}>{prescription.patientAge || 'N/A'} years</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Gender</Text>
                <Text style={styles.infoValue}>{prescription.patientGender || 'N/A'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoSection}>
            <View style={styles.infoHeader}>
              <Ionicons name="medkit-outline" size={20} color={appTheme.colors.primary} />
              <Text style={styles.infoTitle}>Doctor Information</Text>
            </View>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>
                  {prescription.professional?.first_name && prescription.professional?.last_name ? 
                    `${prescription.professional.first_name} ${prescription.professional.last_name}` : 
                    prescription.practitionerName || 'N/A'
                  }
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Qualification</Text>
                <Text style={styles.infoValue}>
                  {prescription.professional?.speciality_new?.name || prescription.practitionerQualification || 'N/A'}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Diagnosis */}
        <Animated.View
          style={[
            styles.sectionCard,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: Animated.add(slideAnim, 60) },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="medical-outline" size={20} color={appTheme.colors.primary} />
            <Text style={styles.sectionTitle}>Diagnosis</Text>
          </View>
          {prescription.diagnoses && prescription.diagnoses.length > 0 ? (
            prescription.diagnoses.map((diag, index) => (
              <View key={diag.id || index} style={styles.diagnosisItem}>
                <View style={styles.diagnosisHeader}>
                  <Ionicons name="medical" size={16} color={appTheme.colors.primary} />
                  <Text style={styles.diagnosisTitle}>{diag.condition}</Text>
                </View>
                <View style={styles.diagnosisDetails}>
                  {diag.severity && <Text style={styles.diagnosisDetail}>Severity: {diag.severity}</Text>}
                  {diag.duration && <Text style={styles.diagnosisDetail}>Duration: {diag.duration}</Text>}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="medical-outline" size={24} color={appTheme.colors.text.secondary} />
              <Text style={styles.emptyText}>No diagnoses recorded</Text>
            </View>
          )}
        </Animated.View>

        {/* Medicines */}
        <Animated.View
          style={[
            styles.sectionCard,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: Animated.add(slideAnim, 80) },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="pill-outline" size={20} color={appTheme.colors.primary} />
            <Text style={styles.sectionTitle}>Medicines</Text>
          </View>
          {prescription.medicines && prescription.medicines.length > 0 ? (
            prescription.medicines.map((med, index) => (
              <View key={med.id || index} style={styles.medicineItem}>
                <View style={styles.medicineHeader}>
                  <View style={styles.medicineIcon}>
                    <Ionicons name="medkit" size={20} color={appTheme.colors.primary} />
                  </View>
                  <View style={styles.medicineInfo}>
                    <Text style={styles.medicineName}>{med.name}</Text>
                    <Text style={styles.medicineDosage}>{med.dosage}</Text>
                  </View>
                </View>
                <View style={styles.medicineDetails}>
                  <View style={styles.medicineDetail}>
                    <Ionicons name="time-outline" size={16} color={appTheme.colors.text.secondary} />
                    <Text style={styles.medicineDetailText}>{med.frequency} for {med.duration}</Text>
                  </View>
                  {med.instructions && (
                    <View style={styles.medicineDetail}>
                      <Ionicons name="information-circle-outline" size={16} color={appTheme.colors.text.secondary} />
                      <Text style={styles.medicineDetailText}>{med.instructions}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="pill-outline" size={24} color={appTheme.colors.text.secondary} />
              <Text style={styles.emptyText}>No medicines prescribed</Text>
            </View>
          )}
        </Animated.View>

        {/* Advice */}
        <Animated.View
          style={[
            styles.sectionCard,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: Animated.add(slideAnim, 100) },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="bulb-outline" size={20} color={appTheme.colors.primary} />
            <Text style={styles.sectionTitle}>Medical Advice</Text>
          </View>
          {prescription.advices && prescription.advices.length > 0 ? (
            prescription.advices.map((adv, index) => (
              <View key={adv.id || index} style={styles.adviceItem}>
                <View style={styles.adviceHeader}>
                  <Ionicons name="bulb" size={16} color={appTheme.colors.accent} />
                  <Text style={styles.adviceTitle}>{adv.title}</Text>
                </View>
                <Text style={styles.adviceDescription}>{adv.description}</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="bulb-outline" size={24} color={appTheme.colors.text.secondary} />
              <Text style={styles.emptyText}>No specific advice given</Text>
            </View>
          )}
        </Animated.View>

        {/* Follow-up */}
        {prescription.followUpDate && (
          <Animated.View
            style={[
              styles.sectionCard,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: Animated.add(slideAnim, 120) },
                  { scale: scaleAnim },
                ],
              },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar-outline" size={20} color={appTheme.colors.primary} />
              <Text style={styles.sectionTitle}>Follow-up</Text>
            </View>
            <View style={styles.followUpCard}>
              <View style={styles.followUpDate}>
                <Ionicons name="calendar" size={20} color={appTheme.colors.primary} />
                <Text style={styles.followUpDateText}>
                  {new Date(prescription.followUpDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Text>
              </View>
              {prescription.followUpReason && (
                <Text style={styles.followUpReason}>{prescription.followUpReason}</Text>
              )}
            </View>
          </Animated.View>
        )}

        {/* Notes */}
        {prescription.notes && (
          <Animated.View
            style={[
              styles.sectionCard,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: Animated.add(slideAnim, 140) },
                  { scale: scaleAnim },
                ],
              },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text-outline" size={20} color={appTheme.colors.primary} />
              <Text style={styles.sectionTitle}>Doctor's Notes</Text>
            </View>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{prescription.notes}</Text>
            </View>
          </Animated.View>
        )}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  // Header styles
  headerWrapper: {
    paddingBottom: theme.spacing.l,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? theme.spacing.xl : theme.spacing.l,
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.l,
    borderBottomLeftRadius: theme.borderRadius.xl,
    borderBottomRightRadius: theme.borderRadius.xl,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...theme.typography.h2,
    color: theme.colors.background.surface,
    fontWeight: '600',
  },
  headerSubtitle: {
    ...theme.typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  moreButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Decorative elements
  topCircle: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    top: -60,
    right: -40,
  },
  bottomWave: {
    position: 'absolute',
    bottom: -30,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
  },
  // Content styles
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: theme.spacing.m,
  },
  // Prescription ID Card
  prescriptionIdCard: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.l,
    marginHorizontal: theme.spacing.l,
    marginBottom: theme.spacing.l,
    ...theme.shadows.card,
  },
  prescriptionIdHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.s,
  },
  prescriptionIdInfo: {
    flex: 1,
  },
  prescriptionIdLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  prescriptionIdValue: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  prescriptionTypeBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.m,
  },
  prescriptionTypeText: {
    ...theme.typography.small,
    color: theme.colors.background.surface,
    fontWeight: '600',
  },
  prescriptionDate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prescriptionDateText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.s,
  },
  // Info Card
  infoCard: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.l,
    marginHorizontal: theme.spacing.l,
    marginBottom: theme.spacing.l,
    ...theme.shadows.card,
  },
  infoSection: {
    marginBottom: theme.spacing.m,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
  },
  infoTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginLeft: theme.spacing.s,
  },
  infoGrid: {
    gap: theme.spacing.s,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  infoValue: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  infoDivider: {
    height: 1,
    backgroundColor: theme.colors.background.secondary,
    marginVertical: theme.spacing.m,
  },
  // Section Card
  sectionCard: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.l,
    marginHorizontal: theme.spacing.l,
    marginBottom: theme.spacing.l,
    ...theme.shadows.card,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginLeft: theme.spacing.s,
  },
  // Vitals
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.m,
  },
  vitalItem: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    minWidth: (width - theme.spacing.l * 4) / 2,
  },
  vitalLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  vitalValue: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  // Diagnosis
  diagnosisItem: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.s,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  diagnosisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  diagnosisTitle: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginLeft: theme.spacing.s,
  },
  diagnosisDetails: {
    marginLeft: theme.spacing.m,
  },
  diagnosisDetail: {
    ...theme.typography.small,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  // Medicines
  medicineItem: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.s,
  },
  medicineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.s,
  },
  medicineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.m,
  },
  medicineInfo: {
    flex: 1,
  },
  medicineName: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  medicineDosage: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
  medicineDetails: {
    gap: theme.spacing.xs,
  },
  medicineDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  medicineDetailText: {
    ...theme.typography.small,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.s,
  },
  // Advice
  adviceItem: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.s,
  },
  adviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.s,
  },
  adviceTitle: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginLeft: theme.spacing.s,
  },
  adviceDescription: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    lineHeight: 22,
  },
  // Follow-up
  followUpCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
  },
  followUpDate: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.s,
  },
  followUpDateText: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginLeft: theme.spacing.s,
  },
  followUpReason: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
  },
  // Notes
  notesCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
  },
  notesText: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
  // Empty states
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.s,
  },
  // Loading states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.m,
  },
  loadingText: {
    marginTop: theme.spacing.m,
    ...theme.typography.body,
    color: theme.colors.text.secondary,
  },
  // Error states
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.m,
  },
  errorCard: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.xl,
    alignItems: 'center',
    ...theme.shadows.card,
  },
  errorTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginTop: theme.spacing.m,
    marginBottom: theme.spacing.s,
  },
  errorMessage: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.l,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    ...theme.shadows.card,
  },
  retryButtonText: {
    ...theme.typography.body,
    color: theme.colors.background.surface,
    fontWeight: '600',
  },
  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.m,
  },
  emptyCard: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.xl,
    alignItems: 'center',
    ...theme.shadows.card,
  },
  emptyTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginTop: theme.spacing.m,
    marginBottom: theme.spacing.s,
  },
  emptyMessage: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  // Bottom spacing
  bottomSpacing: {
    height: theme.spacing.xl,
  },
});

export default PrescriptionDetailScreen;
