import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import type { HomeStackParamList } from '../types/navigation';
import type { Prescription } from '../types/medical';
import Card from '../components/Card';
import CollapsibleCard from '../components/CollapsibleCard';

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

  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // CRITICAL: Wait for Auth Context to be ready before making API calls
    if (isAuthReady) {
      fetchPrescriptionDetail();
    }
  }, [prescriptionId, isAuthReady]);

  const fetchPrescriptionDetail = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // API call to the specific detail endpoint
      const response = await apiService.getPrescriptionById(prescriptionId);
      
      // Data structure: { msg: "Prescription fetched successfully", data: prescription }
      setPrescription(response.data);
    } catch (err: any) {
      console.error('Prescription detail fetch error:', err.message);
      setError(err.message || 'Failed to load prescription details.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- UI RENDERING LOGIC: Sync with Nested Backend Data ---

  const renderDiagnosis = () => {
    if (!prescription?.diagnoses?.length) {
      return <Text style={styles.detailText}>No diagnoses recorded.</Text>;
    }
    return prescription.diagnoses.map((diag, index) => (
      <View key={diag.id || index} style={styles.nestedItem}>
        <Text style={styles.nestedTitle}>- {diag.condition}</Text>
        {diag.severity && <Text style={styles.nestedDetail}>Severity: {diag.severity}</Text>}
        {diag.duration && <Text style={styles.nestedDetail}>Duration: {diag.duration}</Text>}
      </View>
    ));
  };

  const renderMedicines = () => {
    if (!prescription?.medicines?.length) {
      return <Text style={styles.detailText}>No medicines prescribed.</Text>;
    }
    return prescription.medicines.map((med, index) => (
      <View key={med.id || index} style={styles.nestedItem}>
        <Text style={styles.nestedTitle}>- {med.name} ({med.dosage})</Text>
        <Text style={styles.nestedDetail}>Frequency: {med.frequency} for {med.duration}</Text>
        {med.instructions && <Text style={styles.nestedDetail}>Instructions: {med.instructions}</Text>}
      </View>
    ));
  };
  
  const renderAdvices = () => {
    if (!prescription?.advices?.length) {
      return <Text style={styles.detailText}>No specific advice given.</Text>;
    }
    return prescription.advices.map((adv, index) => (
      <View key={adv.id || index} style={styles.nestedItem}>
        <Text style={styles.nestedTitle}>- {adv.title}</Text>
        <Text style={styles.nestedDetail}>{adv.description}</Text>
      </View>
    ));
  };

  const handleDownloadPdf = () => {
    // Placeholder for future PDF download integration
    console.log('Download PDF for prescription', prescriptionId);
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Fetching Prescription...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: 'red', textAlign: 'center', padding: 20 }}>Error: {error}</Text>
        <TouchableOpacity onPress={fetchPrescriptionDetail} style={{ marginTop: 10 }}>
          <Text style={{ color: 'blue' }}>Tap to Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!prescription) {
    return (
      <View style={styles.centered}>
        <Text>Prescription not found.</Text>
      </View>
    );
  }

  const bookingDate = prescription.prescriptionDate || prescription.booking?.booking_date;
  const doctorName = `${prescription.professional?.first_name ?? ''} ${
    prescription.professional?.last_name ?? ''
  }`.trim() || 'Doctor';
  const doctorQualification = prescription.practitionerQualification || prescription.professional?.speciality_new?.name;
  const type = prescription.prescriptionType || 'Consultation';

  const vitals = prescription.vitals || {};
  const bloodPressure = vitals.bloodPressure || vitals.bp;
  const weight = vitals.weight;
  const pulse = vitals.pulse || vitals.heartRate;

  const patientName = prescription.patientName || vitals.patientName || vitals.name;
  const patientAge = prescription.patientAge || vitals.age;
  const patientGender = prescription.patientGender || vitals.gender;

  return (
    <ScrollView style={styles.container}>
      <Card>
        <Text style={styles.header}>Prescription: {prescription.prescriptionId}</Text>
        <Text style={styles.subheader}>{prescription.prescriptionType}</Text>
        
        {/* --- Patient and Practitioner Details --- */}
        <CollapsibleCard title="Details" content={
          <View>
            <Text style={styles.sectionTitle}>Patient</Text>
            <Text style={styles.detailText}>Name: {patientName || 'N/A'}</Text>
            {patientAge && <Text style={styles.detailText}>Age: {patientAge}</Text>}
            {patientGender && <Text style={styles.detailText}>Gender: {patientGender}</Text>}
            
            <Text style={[styles.sectionTitle, { marginTop: 15 }]}>Practitioner</Text>
            <Text style={styles.detailText}>Dr. {doctorName}</Text>
            {doctorQualification && <Text style={styles.detailText}>Qualification: {doctorQualification}</Text>}
            {bookingDate && <Text style={styles.detailText}>Date: {new Date(bookingDate).toLocaleDateString()}</Text>}
          </View>
        } />

        {/* --- Diagnosis (Nested Data Sync) --- */}
        <CollapsibleCard title={`Diagnosis (${prescription.diagnoses?.length || 0})`} content={renderDiagnosis()} />

        {/* --- Medicines (Nested Data Sync) --- */}
        <CollapsibleCard title={`Medication (${prescription.medicines?.length || 0})`} content={renderMedicines()} />

        {/* --- Lifestyle Advice (Nested Data Sync) --- */}
        <CollapsibleCard title={`Advice (${prescription.advices?.length || 0})`} content={renderAdvices()} />

        {/* --- Follow-up & Vitals --- */}
        <CollapsibleCard title="Vitals & Follow-up" content={
          <View>
            {/* Assuming vitals is a JSON object */}
            <Text style={styles.sectionTitle}>Vitals</Text>
            {bloodPressure && <Text style={styles.detailText}>Blood Pressure: {bloodPressure}</Text>}
            {weight && <Text style={styles.detailText}>Weight: {weight}</Text>}
            {pulse && <Text style={styles.detailText}>Pulse: {pulse}</Text>}
            {!bloodPressure && !weight && !pulse && <Text style={styles.detailText}>No vitals recorded.</Text>}
            
            <Text style={[styles.sectionTitle, { marginTop: 15 }]}>Follow-up</Text>
            {prescription.followUpDate ? (
                <Text style={styles.detailText}>Scheduled for: {new Date(prescription.followUpDate).toLocaleDateString()}</Text>
            ) : (
                <Text style={styles.detailText}>No follow-up scheduled.</Text>
            )}
            {prescription.followUpReason && <Text style={styles.detailText}>Reason: {prescription.followUpReason}</Text>}

            {prescription.notes && (
                <View style={{ marginTop: 15 }}>
                    <Text style={styles.sectionTitle}>Notes</Text>
                    <Text style={styles.detailText}>{prescription.notes}</Text>
                </View>
            )}
          </View>
        } />
      </Card>

      {/* Download PDF */}
      <TouchableOpacity style={styles.downloadButton} onPress={handleDownloadPdf}>
        <Text style={styles.downloadButtonText}>Download PDF</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subheader: {
    fontSize: 18,
    color: '#666',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 3
  },
  detailText: {
    fontSize: 14,
    color: '#444',
    marginBottom: 3,
  },
  nestedItem: {
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: '#ddd',
    marginBottom: 10,
  },
  nestedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  nestedDetail: {
    fontSize: 12,
    color: '#666',
    marginLeft: 10,
  },
  downloadButton: {
    backgroundColor: '#1E88E5',
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PrescriptionDetailScreen;
