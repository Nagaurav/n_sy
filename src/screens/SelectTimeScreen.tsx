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
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { format, parseISO } from 'date-fns';
import Ionicons from 'react-native-vector-icons/Ionicons';

// ✅ CORRECT IMPORTS
import type { RootStackParamList } from '../../App';
import { apiService } from '../services';
import { useAuth } from '../hooks/useAuth';
import { useAppSelector } from '../store';
import { theme } from '../theme';
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
      
      if (!slots || !slots.data || !Array.isArray(slots.data) || slots.data.length === 0) {
        setSectionedSlots([]);
        setError('No available time slots found.');
        return;
      }

      const groupedSlots = (slots.data as AvailableSlot[]).reduce<SectionData[]>((acc, slot) => {
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
    
    console.log('🚀 SelectTimeScreen: Attempting to navigate to BookingConfirmation');
    console.log('📦 Navigation data:', {
      professionalId,
      professionalName,
      slot_id: selectedSlot.id,
      date: selectedSlot.date,
      startTime: selectedSlot.start_time,
      endTime: selectedSlot.end_time,
      duration,
      price: priceDetails?.final_amount || 0,
      isOnline: selectedSlot.is_online,
    });
    
    try {
      console.log('🚀 SelectTimeScreen: Attempting to navigate to BookingConfirmation');
      console.log('📦 Navigation data:', {
        professionalId,
        professionalName,
        slot_id: selectedSlot.id,
        date: selectedSlot.date,
        startTime: selectedSlot.start_time,
        endTime: selectedSlot.end_time,
        duration,
        price: priceDetails?.final_amount || 0,
        isOnline: selectedSlot.is_online,
      });
      
      // SelectTime is at RootStack level, so we need to navigate to MainDrawer -> HomeStack -> BookingConfirmation
      const rootNav = navigation;
      console.log('🧭 Root navigation object:', rootNav);
      console.log('🧭 Root navigation methods:', Object.getOwnPropertyNames(rootNav || {}));
      
      if (rootNav) {
        (rootNav as any).navigate('MainDrawer', {
          screen: 'HomeStack',
          params: {
            screen: 'BookingConfirmation',
            params: {
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
            }
          }
        });
        console.log('✅ SelectTimeScreen: Navigation called successfully');
      } else {
        console.log('❌ No root navigation found');
        throw new Error('No navigation available');
      }
    } catch (error) {
      console.error('❌ SelectTimeScreen: Navigation error:', error);
      Alert.alert('Error', 'Unable to proceed with booking confirmation. Please try again.');
    }
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
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: 20, paddingVertical: 20, backgroundColor: '#fff', 
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 20) + 20 : 60,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8,
    elevation: 4,
    borderBottomWidth: 0,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a1a', letterSpacing: 0.3 },
  backButton: { 
    padding: 12, backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: 24,
    width: 48, height: 48, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
    elevation: 2,
  },
  content: { flex: 1, paddingHorizontal: 20 },
  center: { alignItems: 'center', marginTop: 80, paddingHorizontal: 20 },
  errorText: { color: '#dc2626', marginBottom: 24, fontSize: 16, textAlign: 'center', fontWeight: '500' },
  retryBtn: { 
    backgroundColor: theme.colors.primary, paddingVertical: 12, paddingHorizontal: 24, 
    borderRadius: 16, shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 
  },
  sectionHeader: { 
    backgroundColor: '#fff', paddingVertical: 16, paddingHorizontal: 20, marginTop: 20,
    borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3, borderWidth: 1, borderColor: '#f0f0f0'
  },
  sectionTitle: { 
    fontWeight: '700', color: '#1a1a1a', fontSize: 18, letterSpacing: 0.2 
  },
  slotItem: { 
    padding: 20, marginHorizontal: 0, marginVertical: 8, borderWidth: 2, borderColor: '#e5e7eb', 
    borderRadius: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  slotSelected: { 
    backgroundColor: 'rgba(79, 70, 229, 0.08)', borderColor: theme.colors.primary, 
    shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.2, shadowRadius: 12, elevation: 4,
  },
  slotText: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  slotTextSelected: { color: theme.colors.primary, fontWeight: '700' },
  durationText: { 
    color: '#6b7280', fontSize: 14, fontWeight: '500', backgroundColor: '#f3f4f6', 
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 
  },
  footer: { 
    position: 'absolute', bottom: 0, left: 0, right: 0, 
    padding: 20, backgroundColor: '#fff', borderTopWidth: 0,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12,
    elevation: 8,
  },
  confirmBtn: { 
    backgroundColor: theme.colors.primary, paddingVertical: 20, paddingHorizontal: 24, borderRadius: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 8 }, 
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 10,
  },
  disabledBtn: { 
    backgroundColor: '#d1d5db', shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, 
    shadowOpacity: 0, shadowRadius: 0, elevation: 0 
  },
  confirmText: { 
    color: '#fff', fontWeight: '700', fontSize: 18, letterSpacing: 0.3 
  },
  priceText: { 
    color: '#fff', fontWeight: '800', fontSize: 20, backgroundColor: 'rgba(255,255,255,0.2)', 
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 
  },
});

export default SelectTimeScreen;
