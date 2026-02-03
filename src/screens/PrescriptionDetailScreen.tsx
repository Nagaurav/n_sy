import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  Animated,
  SafeAreaView,
  Alert,
  Dimensions,
  RefreshControl,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Share from 'react-native-share';
const RNHTMLtoPDF = require('react-native-html-to-pdf');
import { useAuth } from '../hooks/useAuth';
import { medicalService } from '../services';
import type { HomeStackParamList } from '../types/navigation';
import type { Prescription } from '../types/medical';
import { useTheme } from '../contexts/ThemeContext';
import { theme } from '../theme';
import { downloadPDFEnhanced, showEnhancedPDFResult } from '../utils/enhancedPDFDownload';

const { width } = Dimensions.get('window');

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
      // Since we're getting prescriptionId from appointment/booking, try booking-based endpoint first
      let response = await medicalService.getPrescriptionByBooking(prescriptionId);
      
      console.log(' [PrescriptionDetail] Response from booking endpoint:', JSON.stringify(response, null, 2));

      // If booking endpoint fails, try direct prescription ID
      if (!response?.success || !response?.data) {
        console.log(' [PrescriptionDetail] Booking endpoint failed, trying direct prescription ID');
        response = await medicalService.getPrescription(prescriptionId);
        console.log(' [PrescriptionDetail] Response from direct endpoint:', JSON.stringify(response, null, 2));
      }

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

  const handleDownloadPdf = useCallback(async () => {
    console.log('PDF download for prescription', prescriptionId);
    if (!prescription) {
      console.log('No prescription data available');
      Alert.alert('Error', 'No prescription data available to generate PDF.');
      return;
    }
    
    try {
      // Show loading indicator
      Alert.alert('Generating PDF', 'Please wait while we generate and download your prescription PDF...');

      // Generate HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Prescription - ${prescription.id || prescriptionId}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
              line-height: 1.6;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #2196F3;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .title {
              color: #2196F3;
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .subtitle {
              color: #666;
              font-size: 16px;
              margin-bottom: 5px;
            }
            .section {
              margin-bottom: 30px;
              padding: 20px;
              border: 1px solid #e0e0e0;
              border-radius: 8px;
              background-color: #f9f9f9;
            }
            .section-title {
              color: #2196F3;
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 15px;
              border-bottom: 2px solid #2196F3;
              padding-bottom: 5px;
            }
            .info-row {
              margin-bottom: 10px;
              display: flex;
              justify-content: space-between;
            }
            .info-label {
              font-weight: bold;
              color: #555;
            }
            .medicine-item {
              margin-bottom: 20px;
              padding: 15px;
              border-left: 4px solid #2196F3;
              background-color: white;
              border-radius: 4px;
            }
            .medicine-name {
              font-weight: bold;
              color: #2196F3;
              font-size: 16px;
              margin-bottom: 5px;
            }
            .dosage {
              color: #666;
              font-size: 14px;
              margin-bottom: 5px;
            }
            .instructions {
              margin-top: 10px;
              padding: 10px;
              background-color: #fff3cd;
              border-left: 3px solid #ffc107;
              font-style: italic;
              color: #856404;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              color: #666;
              font-size: 12px;
              border-top: 1px solid #e0e0e0;
              padding-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">PRESCRIPTION</div>
            <div class="subtitle">Dr. ${prescription.practitionerName || (prescription.professional?.first_name && prescription.professional?.last_name ? `Dr. ${prescription.professional.first_name} ${prescription.professional.last_name}` : 'Doctor')}</div>
            <div class="subtitle">Patient: ${prescription.patientName || 'Patient'}</div>
            <div class="subtitle">Date: ${prescription.prescriptionDate ? new Date(prescription.prescriptionDate).toLocaleDateString() : prescription.created_at ? new Date(prescription.created_at).toLocaleDateString() : 'Date N/A'}</div>
          </div>

          <div class="section">
            <div class="section-title">Prescription Details</div>
            <div class="info-row">
              <span class="info-label">Prescription ID:</span>
              <span>${prescription.id || prescriptionId}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Date Issued:</span>
              <span>${prescription.prescriptionDate ? new Date(prescription.prescriptionDate).toLocaleDateString() : prescription.created_at ? new Date(prescription.created_at).toLocaleDateString() : 'Date N/A'}</span>
            </div>
            ${prescription.followUpDate ? `
            <div class="info-row">
              <span class="info-label">Follow Up Date:</span>
              <span>${new Date(prescription.followUpDate).toLocaleDateString()}</span>
            </div>
            ` : ''}
          </div>

          ${prescription.diagnoses && prescription.diagnoses.length > 0 ? `
          <div class="section">
            <div class="section-title">Diagnosis</div>
            ${prescription.diagnoses.map((diagnosis: any) => `
              <div style="margin-bottom: 10px;">
                <strong>${diagnosis.condition}</strong>
                ${diagnosis.severity ? ` (${diagnosis.severity})` : ''}
                ${diagnosis.duration ? ` - Duration: ${diagnosis.duration}` : ''}
              </div>
            `).join('')}
          </div>
          ` : ''}

          ${prescription.medicines && prescription.medicines.length > 0 ? `
          <div class="section">
            <div class="section-title">Medicines</div>
            ${prescription.medicines.map((medicine: any) => `
              <div class="medicine-item">
                <div class="medicine-name">${medicine.name || 'Medicine'}</div>
                <div class="dosage">Dosage: ${medicine.dosage || 'N/A'}</div>
                <div class="dosage">Frequency: ${medicine.frequency || 'N/A'}</div>
                <div class="dosage">Duration: ${medicine.duration || 'N/A'}</div>
                ${medicine.instructions ? `<div class="instructions"><strong>Instructions:</strong> ${medicine.instructions}</div>` : ''}
              </div>
            `).join('')}
          </div>
          ` : ''}

          ${prescription.advices && prescription.advices.length > 0 ? `
          <div class="section">
            <div class="section-title">Medical Advice</div>
            ${prescription.advices.map(adv => `
              <div class="item">
                <div class="item-header">
                  <div class="item-title">${adv.title}</div>
                </div>
                <div class="item-details">
                  ${adv.description}
                </div>
              </div>
            `).join('')}
          </div>
          ` : ''}

          ${prescription.followUpDate ? `
          <div class="section">
            <div class="section-title">Follow-up</div>
            <div class="info-row">
              <span class="info-label">Next Appointment:</span>
              <span>${new Date(prescription.followUpDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
            </div>
          </div>
          ` : ''}

          <div class="footer">
            Generated on ${new Date().toLocaleDateString()} by SamyaYog App
          </div>
        </body>
        </html>
      `;

      // Generate PDF using the enhanced utility with reliable Downloads folder saving
      const fileName = `Prescription_${prescription.id || prescriptionId}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      const result = await downloadPDFEnhanced(
        { html: htmlContent, fileName },
        RNHTMLtoPDF
      );

      // Show enhanced user feedback with detailed location information
      showEnhancedPDFResult(result, fileName);
      
    } catch (error: any) {
      console.error('PDF generation error:', error);
      showEnhancedPDFResult({ success: false, error: error.message || 'Failed to generate PDF' }, '');
    }
  }, [prescription, prescriptionId]);

  if (isLoading && !isRefreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor={appTheme.colors.primary} barStyle="light-content" />
        <View style={styles.center}>
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
        <View style={styles.center}>
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
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={appTheme.colors.primary} barStyle="light-content" />
      <LinearGradient 
        colors={[appTheme.colors.primary, appTheme.colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.background.surface} />
          </TouchableOpacity>
          
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>Prescription Details</Text>
            <Text style={styles.headerSubtitle}>View your medical prescription</Text>
          </View>
          
          <View style={styles.placeholderButton} />
        </View>
        
        {/* Decorative elements */}
        <View style={styles.topCircle} />
        <View style={styles.bottomWave} />
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Main Info Card - Standardized */}
        <Animated.View style={[
          styles.card,
          { 
            opacity: fadeAnim, 
            transform: [{ translateY: slideAnim }], 
            borderLeftColor: theme.colors.primary, 
            borderLeftWidth: 5 
          }
        ]}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Prescription Details</Text>
              <Text style={styles.sub}>Medical prescription information</Text>
            </View>
            <View style={[styles.typeBadge, { backgroundColor: theme.colors.primary + '20' }]}>
              <Ionicons name="document-text" size={14} color={theme.colors.primary} />
              <Text style={[styles.typeText, { color: theme.colors.primary }]}>PRESCRIPTION</Text>
            </View>
          </View>
          
          {/* Patient Information */}
          <View style={styles.cardContent}>
            <View style={styles.detailRow}>
              <Ionicons name="person-outline" size={16} color="#666" />
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>Patient: </Text>
                {prescription.patientName || 'N/A'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={16} color="#666" />
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>Age: </Text>
                {prescription.patientAge ? `${prescription.patientAge} years` : 'N/A'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="medkit-outline" size={16} color="#666" />
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>Doctor: </Text>
                {prescription.professional?.first_name && prescription.professional?.last_name ? 
                  `${prescription.professional.first_name} ${prescription.professional.last_name}` : 
                  prescription.practitionerName || 'N/A'
                }
              </Text>
            </View>
            <View style={styles.bookingIdRow}>
              <Ionicons name="pricetag-outline" size={16} color="#666" />
              <Text style={styles.bookingIdText}>
                Booking ID: #{prescription.id || prescriptionId}
              </Text>
            </View>
          </View>
          
          <View style={styles.cardFooter}>
            <Text style={[styles.statusText, { color: theme.colors.primary }]}>
              {prescription.prescriptionDate ? 
                new Date(prescription.prescriptionDate).toLocaleDateString() : 
                'Date N/A'
              }
            </Text>
            <TouchableOpacity onPress={handleDownloadPdf}>
              <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>Download PDF</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Diagnosis Section - Standardized */}
        {prescription.diagnoses && prescription.diagnoses.length > 0 && (
          <Animated.View style={[
            styles.card,
            { 
              borderLeftColor: theme.colors.primary, 
              borderLeftWidth: 5, 
              opacity: fadeAnim, 
              transform: [{ translateY: Animated.add(slideAnim, 20) }] 
            }
          ]}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Diagnosis</Text>
                <Text style={styles.sub}>Medical conditions identified</Text>
              </View>
              <View style={[styles.typeBadge, { backgroundColor: theme.colors.primary + '20' }]}>
                <Ionicons name="medical" size={14} color={theme.colors.primary} />
                <Text style={[styles.typeText, { color: theme.colors.primary }]}>{prescription.diagnoses.length}</Text>
              </View>
            </View>
            
            <View style={styles.cardContent}>
              {prescription.diagnoses.map((diag: any, index: number) => (
                <View key={diag.id || index} style={styles.detailRow}>
                  <Ionicons name="medical-outline" size={16} color={theme.colors.primary} />
                  <Text style={styles.detailText}>
                    <Text style={styles.detailLabel}>{diag.condition}: </Text>
                    {diag.severity && `Severity: ${diag.severity}`}
                    {diag.duration && ` | Duration: ${diag.duration}`}
                  </Text>
                </View>
              ))}
            </View>
            
            <View style={styles.cardFooter}>
              <Text style={[styles.statusText, { color: theme.colors.primary }]}>
                {prescription.diagnoses.length} {prescription.diagnoses.length === 1 ? 'condition' : 'conditions'}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Medicines Section - Standardized */}
        {prescription.medicines && prescription.medicines.length > 0 && (
          <Animated.View style={[
            styles.card,
            { 
              borderLeftColor: '#FF9800', 
              borderLeftWidth: 5, 
              opacity: fadeAnim, 
              transform: [{ translateY: Animated.add(slideAnim, 40) }] 
            }
          ]}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Medicines</Text>
                <Text style={styles.sub}>Prescribed medications</Text>
              </View>
              <View style={[styles.typeBadge, { backgroundColor: '#FF9800' + '20' }]}>
                <Ionicons name="pill" size={14} color="#FF9800" />
                <Text style={[styles.typeText, { color: '#FF9800' }]}>{prescription.medicines.length}</Text>
              </View>
            </View>
            
            <View style={styles.cardContent}>
              {prescription.medicines.map((med: any, index: number) => (
                <View key={med.id || index} style={styles.detailRow}>
                  <Ionicons name="medical" size={16} color="#FF9800" />
                  <Text style={styles.detailText}>
                    <Text style={styles.detailLabel}>{med.name}: </Text>
                    {med.dosage} - {med.frequency} for {med.duration}
                  </Text>
                </View>
              ))}
            </View>
            
            <View style={styles.cardFooter}>
              <Text style={[styles.statusText, { color: '#FF9800' }]}>
                {prescription.medicines.length} {prescription.medicines.length === 1 ? 'medicine' : 'medicines'}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Medical Advice Section - Standardized */}
        {prescription.advices && prescription.advices.length > 0 && (
          <Animated.View style={[
            styles.card,
            { 
              borderLeftColor: '#9C27B0', 
              borderLeftWidth: 5, 
              opacity: fadeAnim, 
              transform: [{ translateY: Animated.add(slideAnim, 60) }] 
            }
          ]}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Medical Advice</Text>
                <Text style={styles.sub}>Doctor's recommendations</Text>
              </View>
              <View style={[styles.typeBadge, { backgroundColor: '#9C27B0' + '20' }]}>
                <Ionicons name="bulb" size={14} color="#9C27B0" />
                <Text style={[styles.typeText, { color: '#9C27B0' }]}>{prescription.advices.length}</Text>
              </View>
            </View>
            
            <View style={styles.cardContent}>
              {prescription.advices.map((adv: any, index: number) => (
                <View key={adv.id || index} style={styles.detailRow}>
                  <Ionicons name="bulb-outline" size={16} color="#9C27B0" />
                  <Text style={styles.detailText}>
                    <Text style={styles.detailLabel}>{adv.title}: </Text>
                    {adv.description}
                  </Text>
                </View>
              ))}
            </View>
            
            <View style={styles.cardFooter}>
              <Text style={[styles.statusText, { color: '#9C27B0' }]}>
                {prescription.advices.length} {prescription.advices.length === 1 ? 'tip' : 'tips'}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Follow-up Section - Standardized */}
        {prescription.followUpDate && (
          <Animated.View style={[
            styles.card,
            { 
              borderLeftColor: '#4CAF50', 
              borderLeftWidth: 5, 
              opacity: fadeAnim, 
              transform: [{ translateY: Animated.add(slideAnim, 80) }] 
            }
          ]}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Next Follow-up</Text>
                <Text style={styles.sub}>Schedule your next consultation</Text>
              </View>
              <View style={[styles.typeBadge, { backgroundColor: '#4CAF50' + '20' }]}>
                <Ionicons name="calendar-check" size={14} color="#4CAF50" />
                <Text style={[styles.typeText, { color: '#4CAF50' }]}>IMPORTANT</Text>
              </View>
            </View>
            
            <View style={styles.cardContent}>
              <View style={styles.detailRow}>
                <Ionicons name="calendar" size={16} color="#4CAF50" />
                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Appointment Date: </Text>
                  {new Date(prescription.followUpDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="notifications" size={16} color="#4CAF50" />
                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Reminder: </Text>
                  We'll notify you 1 day before
                </Text>
              </View>
            </View>
            
            <View style={styles.cardFooter}>
              <Text style={[styles.statusText, { color: '#4CAF50' }]}>
                Follow-up scheduled
              </Text>
              <TouchableOpacity>
                <Text style={{ color: '#4CAF50', fontWeight: 'bold' }}>Set Reminder</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background.primary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 16 },
  
  header: { 
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: { 
    color: theme.colors.background.surface, 
    fontSize: 20, 
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    color: theme.colors.background.surface,
    fontSize: 14,
    opacity: 0.8,
    marginTop: 2,
  },
  placeholderButton: {
    width: 40,
  },
  topCircle: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  bottomWave: {
    position: 'absolute',
    bottom: -20,
    left: -50,
    right: -50,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },

  card: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.l,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15
  },
  docName: { fontSize: 16, fontWeight: '700', color: theme.colors.text.primary },
  docSpec: { fontSize: 14, color: theme.colors.text.secondary, marginTop: 2 },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6
  },

  // Standard Card Pattern Styles (matching AppointmentsScreen)
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#eee' },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  sub: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 40,
    justifyContent: 'center',
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  cardContent: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    flex: 1,
    marginLeft: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  doctorInfoContainer: {
    flex: 1,
    marginLeft: 8,
    justifyContent: 'center',
  },
  bookingIdText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '500',
    marginLeft: 8,
  },
  bookingIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  divider: { height: 1, backgroundColor: '#e9ecef', marginVertical: 15 },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoText: { marginLeft: 10, color: theme.colors.text.primary, fontWeight: '500', fontSize: 15 },

  loadingText: {
    marginTop: theme.spacing.m,
    color: theme.colors.text.secondary,
    ...theme.typography.body,
    fontSize: 16,
    fontWeight: '500',
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
    marginBottom: theme.spacing.s,
  },
  retryButtonText: {
    color: theme.colors.background.surface,
    fontWeight: '600',
  },

  // Diagnosis Card Styles
  diagnosisCard: {
    borderLeftColor: theme.colors.primary,
    borderLeftWidth: 4,
    backgroundColor: '#F0F8FF',
  },
  diagnosisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  diagnosisIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  diagnosisTitleContainer: {
    flex: 1,
  },
  diagnosisMainTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  diagnosisSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  diagnosisBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  diagnosisBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  diagnosisContent: {
    gap: 12,
  },
  diagnosisItemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E3F2FD',
  },
  diagnosisItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  diagnosisItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  diagnosisItemText: {
    flex: 1,
  },
  diagnosisItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  diagnosisItemDetail: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  diagnosisItemStatus: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
  },

  // Medicines Card Styles
  medicinesCard: {
    borderLeftColor: '#FF9800',
    borderLeftWidth: 4,
    backgroundColor: '#FFF8E1',
  },
  medicinesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  medicinesIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  medicinesTitleContainer: {
    flex: 1,
  },
  medicinesMainTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  medicinesSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  medicinesBadge: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  medicinesBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  medicinesContent: {
    gap: 12,
  },
  medicineItemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  medicineItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  medicineItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  medicineItemText: {
    flex: 1,
  },
  medicineItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  medicineItemDosage: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  medicineItemStatus: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: '#FFF3E0',
  },
  medicineItemDetails: {
    marginTop: 12,
  },

  // Medical Advice Card Styles
  adviceCard: {
    borderLeftColor: '#9C27B0',
    borderLeftWidth: 4,
    backgroundColor: '#F3E5F5',
  },
  adviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  adviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#9C27B0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  adviceTitleContainer: {
    flex: 1,
  },
  adviceMainTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  adviceSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  adviceBadge: {
    backgroundColor: '#9C27B0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adviceBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  adviceContent: {
    gap: 12,
  },
  adviceItemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E1BEE7',
  },
  adviceItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  adviceItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#9C27B0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  adviceItemText: {
    flex: 1,
  },
  adviceItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  adviceItemDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: 2,
    lineHeight: 20,
  },
  adviceItemStatus: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: '#F3E5F5',
  },

  // Main Info Card Styles
  infoCard: {
    borderLeftColor: '#2196F3',
    borderLeftWidth: 4,
    backgroundColor: '#E3F2FD',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  infoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoTitleContainer: {
    flex: 1,
  },
  infoMainTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  infoSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  infoBadge: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  infoBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  infoContent: {
    gap: 16,
  },
  infoSectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  infoSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoSectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  infoSectionContent: {
    gap: 8,
  },
  followUpCard: {
    borderLeftColor: '#4CAF50',
    borderLeftWidth: 4,
    backgroundColor: '#F8FFF8',
  },
  followUpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  followUpIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  followUpTitleContainer: {
    flex: 1,
  },
  followUpTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  followUpSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  followUpBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  followUpBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  followUpStatusIcon: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
  },
  followUpDateContainer: {
    gap: 12,
  },
  followUpDateCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8F5E9',
  },
  followUpDateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  followUpDateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginLeft: 8,
  },
  followUpDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  followUpReminderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 12,
  },
  followUpReminderIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  followUpReminderText: {
    flex: 1,
  },
  followUpReminderTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  followUpReminderSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  followUpActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  followUpActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  followUpActionButtonSecondary: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  followUpActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
    marginLeft: 6,
  },
});

export default PrescriptionDetailScreen;
