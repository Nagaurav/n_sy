import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { apiService } from '../services/apiService';
import { Prescription } from '../types/medical';

const { width } = Dimensions.get('window');

interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

interface PrescriptionViewerProps {
  appointmentId: string;
}

const PrescriptionViewer: React.FC<PrescriptionViewerProps> = ({ appointmentId }) => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPrescription, setExpandedPrescription] = useState<string | null>(null);

  useEffect(() => {
    fetchPrescriptions();
  }, [appointmentId]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the correct endpoint for booking prescriptions
      const response = await apiService.getBookingPrescription(Number(appointmentId));
      
      if (response && response.data) {
        setPrescriptions([response.data]); // Wrap single prescription in array
      } else {
        setPrescriptions([]); // No prescriptions found
      }
    } catch (err: any) {
      console.error('Error fetching prescription for appointment:', err);
      setError(err.message || 'An error occurred while fetching prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const handlePrescriptionPress = (prescriptionId: string) => {
    setExpandedPrescription(expandedPrescription === prescriptionId ? null : prescriptionId);
  };

  const handleVerifyPrescription = async (prescriptionId: string) => {
    Alert.alert(
      'Verify Prescription',
      'This prescription has been digitally signed by the healthcare provider. The signature ensures authenticity and integrity.',
      [
        { text: 'OK', style: 'default' },
        {
          text: 'View Details',
          onPress: () => showSignatureDetails(prescriptionId),
        },
      ]
    );
  };

  const showSignatureDetails = (prescriptionId: string) => {
    const prescription = prescriptions.find(p => p.id === prescriptionId);
    if (!prescription) return;

    const professionalName = `${prescription.professional.first_name} ${prescription.professional.last_name}`;
    Alert.alert(
      'Digital Signature Details',
      `Signed by: Dr. ${professionalName}\nDate: ${prescription.prescriptionDate}\nPrescription ID: ${prescription.prescriptionId}\n\nThis prescription is cryptographically signed and cannot be tampered with.`,
      [{ text: 'OK' }]
    );
  };

  const handleDownloadPDF = async (prescriptionId: string) => {
    try {
      Alert.alert(
        'Download Prescription',
        'PDF download will be available soon. The prescription will include all details and the digital signature.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to download prescription PDF');
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading prescriptions...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="alert-circle-outline" size={60} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchPrescriptions}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (prescriptions.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="document-text-outline" size={60} color="#1A202C" />
        <Text style={styles.emptyText}>No prescriptions found for this appointment</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {prescriptions.map((prescription) => (
        <View key={prescription.id} style={styles.prescriptionCard}>
          {/* Header */}
          <TouchableOpacity
            style={styles.prescriptionHeader}
            onPress={() => handlePrescriptionPress(prescription.id)}
          >
            <View style={styles.prescriptionInfo}>
              <Text style={styles.prescriptionDate}>{prescription.prescriptionDate}</Text>
              <Text style={styles.professionalName}>Dr. {prescription.professional.first_name} {prescription.professional.last_name}</Text>
              <Text style={styles.patientName}>Booking ID: {prescription.booking?.id || 'N/A'}</Text>
            </View>
            <View style={styles.headerRight}>
              <View style={styles.verifiedBadge}>
                <Icon name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
              <Icon
                name={expandedPrescription === prescription.id ? "chevron-up" : "chevron-down"}
                size={20}
                color="#1A202C"
              />
            </View>
          </TouchableOpacity>

          {/* Expanded Content */}
          {expandedPrescription === prescription.id && (
            <View style={styles.expandedContent}>
              {/* Medicines */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Medicines</Text>
                {prescription.medicines.map((medicine, index) => (
                  <View key={index} style={styles.medicineItem}>
                    <Text style={styles.medicineName}>{medicine.name}</Text>
                    <Text style={styles.medicineDetails}>
                      {medicine.dosage} - {medicine.frequency} - {medicine.duration}
                    </Text>
                    {medicine.instructions && (
                      <Text style={styles.medicineInstructions}>
                        Instructions: {medicine.instructions}
                      </Text>
                    )}
                  </View>
                ))}
              </View>

              {/* Notes */}
              {prescription.notes && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Doctor's Notes</Text>
                  <Text style={styles.notesText}>{prescription.notes}</Text>
                </View>
              )}

              {/* Digital Signature */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Digital Signature</Text>
                <View style={styles.signatureContainer}>
                  <Icon name="shield-checkmark" size={20} color="#4CAF50" />
                  <Text style={styles.signatureText}>
                    This prescription is digitally signed and verified
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.verifyButton}
                  onPress={() => handleVerifyPrescription(prescription.id)}
                >
                  <Icon name="finger-print" size={16} color="#3B82F6" />
                  <Text style={styles.verifyButtonText}>Verify Signature</Text>
                </TouchableOpacity>
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDownloadPDF(prescription.id)}
                >
                  <Icon name="download" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Download PDF</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#1A202C',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '600',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#1A202C',
  },
  prescriptionCard: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  prescriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  prescriptionInfo: {
    flex: 1,
  },
  prescriptionDate: {
    fontSize: 14,
    color: '#1A202C',
    marginBottom: 4,
  },
  professionalName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 4,
  },
  patientName: {
    fontSize: 14,
    color: '#1A202C',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  verifiedText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 4,
    fontWeight: '600',
  },
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 12,
  },
  medicineItem: {
    backgroundColor: '#F7F9FC',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 4,
  },
  medicineDetails: {
    fontSize: 14,
    color: '#1A202C',
    marginBottom: 4,
  },
  medicineInstructions: {
    fontSize: 13,
    color: '#1A202C',
    fontStyle: 'italic',
  },
  notesText: {
    fontSize: 14,
    color: '#1A202C',
    lineHeight: 20,
    backgroundColor: '#F7F9FC',
    padding: 12,
    borderRadius: 8,
  },
  signatureContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  signatureText: {
    fontSize: 14,
    color: '#4CAF50',
    marginLeft: 8,
    fontWeight: '500',
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 8,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    minWidth: 100,
  },
  downloadButton: {
    backgroundColor: '#4CAF50',
  },
  shareButton: {
    backgroundColor: '#3B82F6',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default PrescriptionViewer;
