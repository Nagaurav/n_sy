import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SectionList,
  Platform,
  StatusBar,
  Alert
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { format, parseISO } from 'date-fns';
import Ionicons from 'react-native-vector-icons/Ionicons';

// ✅ CORRECT IMPORTS
import type { RootStackParamList } from '../../App';
import { apiService } from '../services/apiService';
import { theme } from '../theme';
import { useAppSelector } from '../store';
import { AvailableSlot, FormattedAvailableSlot, SectionData } from '../types/booking';

type SelectTimeRouteProp = RouteProp<RootStackParamList, 'SelectTime'>;
type SelectTimeNavigationProp = StackNavigationProp<RootStackParamList, 'SelectTime'>;

const SelectTimeScreen = () => {
  console.log('🚀 SelectTimeScreen MOUNTED - Fresh File');
  
  const navigation = useNavigation<SelectTimeNavigationProp>();
  const route = useRoute<SelectTimeRouteProp>();
  const { professionalId, professionalName, serviceDetails } = route.params;

  // Debug: Log received parameters
  console.log('📦 SelectTimeScreen received params:', {
    professionalId,
    professionalName,
    serviceDetails
  });

  const [sectionedSlots, setSectionedSlots] = useState<SectionData[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<FormattedAvailableSlot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [priceDetails, setPriceDetails] = useState<any>(null);
  const [isPriceLoading, setIsPriceLoading] = useState(false);

  const { user } = useAppSelector((state: any) => state.auth);
  const userId = user?.user_id || user?._id || user?.id;

  // --- HELPER FUNCTIONS ---
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      let hours = date.getUTCHours();
      const minutes = date.getUTCMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
      return `${hours}:${minutesStr} ${ampm}`;
    } catch (e) { return dateString; }
  };

  const getSlotDuration = (startTime: string, endTime: string) => {
    try {
      const start = new Date(startTime);
      const end = new Date(endTime);
      return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    } catch { return 0; }
  };

  // --- API CALLS ---
  const fetchAvailableSlots = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔍 Fetching slots for:', professionalId);
      
      const slots = await apiService.getAllAvailableSlots(professionalId);
      
      if (!slots || slots.length === 0) {
        setSectionedSlots([]);
        setError('No available time slots found.');
        return;
      }

      const groupedSlots = (slots as AvailableSlot[]).reduce<SectionData[]>((acc, slot) => {
        const dateKey = slot.date.substring(0, 10);
        const formattedSlot: FormattedAvailableSlot = {
          ...slot,
          displayStartTime: formatTime(slot.start_time),
          displayEndTime: formatTime(slot.end_time),
          isSelected: false
        };

        let section = acc.find((sec) => sec.title === dateKey);
        if (!section) {
          section = { 
            title: dateKey, 
            data: [],
            formattedDate: format(parseISO(dateKey), 'EEEE, MMMM d, yyyy')
          };
          acc.push(section);
        }
        section.data.push(formattedSlot);
        return acc;
      }, []);

      groupedSlots.sort((a, b) => a.title.localeCompare(b.title));
      groupedSlots.forEach(s => s.data.sort((a, b) => a.start_time.localeCompare(b.start_time)));

      setSectionedSlots(groupedSlots);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Failed to load slots');
    } finally {
      setIsLoading(false);
    }
  }, [professionalId]);

  const fetchPriceForSlot = async (slot: FormattedAvailableSlot) => {
    try {
      setIsPriceLoading(true);
      const duration = getSlotDuration(slot.start_time, slot.end_time);
      const result = await apiService.calculateBookingPrice({
        slotId: slot.id,
        duration,
        userId
      });
      if (result.success) setPriceDetails(result.data);
    } catch (e) { console.error(e); } 
    finally { setIsPriceLoading(false); }
  };

  useEffect(() => { fetchAvailableSlots(); }, [fetchAvailableSlots]);

  const handleSlotSelect = (slot: FormattedAvailableSlot) => {
    if (selectedSlot?.id === slot.id) {
      setSelectedSlot(null);
      setPriceDetails(null);
    } else {
      setSelectedSlot(slot);
      fetchPriceForSlot(slot);
    }
  };

  const handleConfirm = () => {
    if (!selectedSlot || !serviceDetails) return;
    const duration = getSlotDuration(selectedSlot.start_time, selectedSlot.end_time);
    
    navigation.getParent()?.getParent()?.navigate('BookingConfirmation', {
      bookingData: {
        professionalId,
        professionalName,
        slot_id: selectedSlot.id,
        date: selectedSlot.date,
        startTime: selectedSlot.start_time,
        endTime: selectedSlot.end_time,
        duration,
        price: priceDetails?.final_amount || 0,
        isOnline: selectedSlot.is_online,
        serviceDetails: { ...serviceDetails, price: priceDetails?.final_amount || 0 }
      }
    });
  };

  // --- RENDER ---
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Time</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {isLoading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 50 }} />
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchAvailableSlots} style={styles.retryBtn}>
              <Text style={{color: '#fff'}}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <SectionList
            sections={sectionedSlots}
            keyExtractor={(item) => item.id.toString()}
            renderSectionHeader={({ section }) => (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{section.formattedDate}</Text>
              </View>
            )}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[styles.slotItem, selectedSlot?.id === item.id && styles.slotSelected]}
                onPress={() => handleSlotSelect(item)}
              >
                <Text style={[styles.slotText, selectedSlot?.id === item.id && styles.slotTextSelected]}>
                  {item.displayStartTime} - {item.displayEndTime}
                </Text>
                <Text style={styles.durationText}>
                  {getSlotDuration(item.start_time, item.end_time)} min
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.confirmBtn, !selectedSlot && styles.disabledBtn]}
          disabled={!selectedSlot}
          onPress={handleConfirm}
        >
          <Text style={styles.confirmText}>
            {selectedSlot ? 'Confirm Booking' : 'Select a Slot'}
          </Text>
          {priceDetails && (
            <Text style={styles.priceText}>₹{priceDetails.final_amount}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 20) + 10 : 50
  },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  backButton: { padding: 8 },
  content: { flex: 1 },
  center: { alignItems: 'center', marginTop: 50 },
  errorText: { color: 'red', marginBottom: 20 },
  retryBtn: { backgroundColor: theme.colors.primary, padding: 10, borderRadius: 8 },
  sectionHeader: { backgroundColor: '#f8f9fa', padding: 12 },
  sectionTitle: { fontWeight: '600', color: '#555' },
  slotItem: { 
    padding: 16, margin: 8, borderWidth: 1, borderColor: '#eee', borderRadius: 8,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
  },
  slotSelected: { backgroundColor: '#e3f2fd', borderColor: theme.colors.primary },
  slotText: { fontSize: 16 },
  slotTextSelected: { color: theme.colors.primary, fontWeight: '600' },
  durationText: { color: '#888', fontSize: 12 },
  footer: { 
    position: 'absolute', bottom: 0, left: 0, right: 0, 
    padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#eee' 
  },
  confirmBtn: { 
    backgroundColor: theme.colors.primary, padding: 16, borderRadius: 12,
    flexDirection: 'row', justifyContent: 'space-between'
  },
  disabledBtn: { backgroundColor: '#ccc' },
  confirmText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  priceText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});

export default SelectTimeScreen;
