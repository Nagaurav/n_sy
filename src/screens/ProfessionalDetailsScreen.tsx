// ProfessionalDetailsScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { ROUTES } from '../navigation/constants';
import { professionalFilterService } from '../services/professionalFilterService';
import { professionalService } from '../services/professionalService';
import { Professional } from '../services/professionalFilterService';
import { ScreenContainer, ScreenHeader, LoadingState, EmptyState } from '../components/common';
import { useLoadingState } from '../hooks/useCommonState';

interface ProfessionalDetailsScreenProps {
  route: any;
  navigation: any;
}

const ProfessionalDetailsScreen: React.FC<ProfessionalDetailsScreenProps> = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { professional: routeProfessional, professionalId, yogaClass } = route.params as { 
    professional?: Professional; 
    professionalId?: string;
    yogaClass?: any;
  };

  const { loading, refreshing, error, setLoading, setRefreshing, setError } = useLoadingState(false);
  const [professional, setProfessional] = useState<Professional | null>(routeProfessional || null);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Generate dates for the next 7 days
  const generateAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const [availableDates, setAvailableDates] = useState<string[]>([]);

  const fetchProfessionalDetails = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    console.log('🔍 Fetching professional details for ID:', id);
    
    try {
      // Use the available method from professionalFilterService
      const response = await professionalFilterService.getFilteredProfessionals({
        limit: 1,
        is_online: true
      });
      console.log('🔍 Professional details response:', response);
      
      if (response.success && response.data && response.data.length > 0) {
        // Find the professional by ID from the filtered results
        const prof = response.data.find(p => p.id === id);
        if (prof) {
          setProfessional(prof);
          console.log('✅ Professional details loaded successfully');
        } else {
          setError('Professional not found');
        }
      } else {
        console.error('❌ Failed to load professional details:', response.message);
        setError(response.message || 'Failed to load professional details');
      }
    } catch (err: any) {
      console.error('❌ Error fetching professional details:', err);
      setError(err.message || 'Failed to load professional details');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const fetchAvailableSlots = useCallback(async (date: string) => {
    if (!professional) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Use available slots from the professional data or create mock slots
      const mockSlots = [
        { id: '1', start_time: '9:00 AM', is_available: true, price: 500, type: 'online', duration: 60 },
        { id: '2', start_time: '10:00 AM', is_available: true, price: 500, type: 'online', duration: 60 },
        { id: '3', start_time: '2:00 PM', is_available: false, price: 500, type: 'offline', duration: 60 },
        { id: '4', start_time: '3:00 PM', is_available: true, price: 500, type: 'online', duration: 60 },
        { id: '5', start_time: '4:00 PM', is_available: true, price: 500, type: 'offline', duration: 60 },
      ];
      
      setAvailableSlots(mockSlots);
    } catch (err: any) {
      setError(err.message || 'Failed to load available slots');
      console.error('Error fetching available slots:', err);
    } finally {
      setLoading(false);
    }
  }, [professional, setLoading, setError]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAvailableSlots(selectedDate);
  }, [fetchAvailableSlots, selectedDate, setRefreshing]);

  useEffect(() => {
    console.log('🔍 ProfessionalDetailsScreen useEffect - professionalId:', professionalId, 'professional:', professional);
    
    if (professionalId && !professional) {
      console.log('🚀 Fetching professional details...');
      fetchProfessionalDetails(professionalId);
    } else if (professional) {
      console.log('✅ Professional data already available');
    } else {
      console.log('❌ No professional ID or data available');
    }
  }, [professionalId, professional, fetchProfessionalDetails]);

  useEffect(() => {
    if (professional) {
      // Generate available dates when professional is loaded
      const dates = generateAvailableDates();
      setAvailableDates(dates);
      if (dates.length > 0) {
        setSelectedDate(dates[0]);
      }
    }
  }, [professional]);

  useEffect(() => {
    if (professional && selectedDate) {
      fetchAvailableSlots(selectedDate);
    }
  }, [fetchAvailableSlots, selectedDate, professional]);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  const handleSlotSelect = (slotId: string) => {
    setSelectedSlot(slotId);
  };

  const handleBookConsultation = () => {
    if (!selectedSlot || !professional) {
      Alert.alert('Select Slot', 'Please select a time slot to book your consultation.');
      return;
    }
    
    const slot = availableSlots.find(s => s.id === selectedSlot);
    if (!slot) return;
    
    Alert.alert(
      'Book Consultation',
      `Book consultation with ${professional.name} on ${selectedDate} at ${slot.start_time}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Book Now', 
          onPress: () => {
            // TODO: Navigate to booking screen or payment gateway
            Alert.alert('Success', 'Consultation booked successfully!');
          }
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const renderProfessionalInfo = () => {
    if (!professional) return null;
    
    // Check if this is a yoga class context
    const isYogaClass = !!yogaClass;
    
    return (
      <View style={styles.professionalInfoSection}>
        <View style={styles.professionalHeader}>
          <View style={styles.avatarContainer}>
            {professional.avatar ? (
              <Text style={styles.avatarText}>{professional.name.charAt(0)}</Text>
            ) : (
              <MaterialCommunityIcons name="account" size={40} color={colors.primaryGreen} />
            )}
          </View>
          <View style={styles.professionalDetails}>
            <Text style={styles.professionalName}>{professional.name}</Text>
            <Text style={styles.professionalExpertise}>
              {professional.expertise?.join(', ') || 'No specializations listed'}
            </Text>
            <View style={styles.ratingContainer}>
              <MaterialCommunityIcons name="star" size={16} color={colors.accentYellow} />
              <Text style={styles.rating}>
                {professional.rating || 0} ({professional.total_reviews || 0} reviews)
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="map-marker" size={20} color={colors.secondaryText} />
          <Text style={styles.infoText}>{professional.location || 'Location not specified'}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="clock-outline" size={20} color={colors.secondaryText} />
          <Text style={styles.infoText}>{professional.experience_years || 0} years of experience</Text>
        </View>
        
        {isYogaClass ? (
          // Show yoga class specific information
          <>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="yoga" size={20} color={colors.secondaryText} />
              <Text style={styles.infoText}>{yogaClass.title}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="calendar" size={20} color={colors.secondaryText} />
              <Text style={styles.infoText}>{yogaClass.duration} • {yogaClass.days}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="clock" size={20} color={colors.secondaryText} />
              <Text style={styles.infoText}>
                {new Date(yogaClass.start_time).toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })} - {new Date(yogaClass.end_time).toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="currency-inr" size={20} color={colors.secondaryText} />
              <Text style={styles.infoText}>
                ₹{yogaClass.effective_price || yogaClass.price_group_online || yogaClass.price_one_to_one_online || 0} per session
              </Text>
            </View>
            
            {yogaClass.is_disease_specific && (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="medical-bag" size={20} color={colors.secondaryText} />
                <Text style={styles.infoText}>Specialized for: {yogaClass.disease}</Text>
              </View>
            )}
            
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="account-group" size={20} color={colors.secondaryText} />
              <Text style={styles.infoText}>
                Max participants: {yogaClass.max_participants_online || yogaClass.max_participants_offline || 'Unlimited'}
              </Text>
            </View>
            
            {yogaClass.languages && (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="translate" size={20} color={colors.secondaryText} />
                <Text style={styles.infoText}>Languages: {yogaClass.languages}</Text>
              </View>
            )}
          </>
        ) : (
          // Show consultation information
                  <View style={styles.infoRow}>
          <MaterialCommunityIcons name="currency-inr" size={20} color={colors.secondaryText} />
          <Text style={styles.infoText}>₹{professional.consultation_fee || 0} per 60 min session</Text>
        </View>
        )}
        
        <Text style={styles.bioTitle}>About</Text>
        <Text style={styles.bioText}>{professional.bio || 'No bio available'}</Text>
        
        {isYogaClass ? (
          // Show yoga class session types
          <View style={styles.servicesSection}>
            <Text style={styles.sectionTitle}>Available Session Types</Text>
            <View style={styles.serviceTags}>
              {yogaClass.group_online && (
                <View style={styles.serviceTag}>
                  <MaterialCommunityIcons name="video" size={16} color={colors.primaryGreen} />
                  <Text style={styles.serviceTagText}>Group Online</Text>
                </View>
              )}
              {yogaClass.group_offline && (
                <View style={styles.serviceTag}>
                  <MaterialCommunityIcons name="account-group" size={16} color={colors.primaryGreen} />
                  <Text style={styles.serviceTagText}>Group Offline</Text>
                </View>
              )}
              {yogaClass.one_to_one_online && (
                <View style={styles.serviceTag}>
                  <MaterialCommunityIcons name="video" size={16} color={colors.accentBlue} />
                  <Text style={styles.serviceTagText}>One-on-One Online</Text>
                </View>
              )}
              {yogaClass.one_to_one_offline && (
                <View style={styles.serviceTag}>
                  <MaterialCommunityIcons name="account" size={16} color={colors.accentBlue} />
                  <Text style={styles.serviceTagText}>One-on-One Offline</Text>
                </View>
              )}
              {yogaClass.home_visit && (
                <View style={styles.serviceTag}>
                  <MaterialCommunityIcons name="home" size={16} color={colors.accentOrange} />
                  <Text style={styles.serviceTagText}>Home Visit</Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          // Show consultation services
          <View style={styles.servicesSection}>
            <Text style={styles.sectionTitle}>Services Offered</Text>
            <View style={styles.serviceTags}>
              {professional.is_online && (
                <View style={styles.serviceTag}>
                  <MaterialCommunityIcons name="video" size={16} color={colors.primaryGreen} />
                  <Text style={styles.serviceTagText}>Online Consultation</Text>
                </View>
              )}
              {professional.is_offline && (
                <View style={styles.serviceTag}>
                  <MaterialCommunityIcons name="map-marker" size={16} color={colors.primaryGreen} />
                  <Text style={styles.serviceTagText}>In-Person Consultation</Text>
                </View>
              )}
              {professional.is_home_visit && (
                <View style={styles.serviceTag}>
                  <MaterialCommunityIcons name="home" size={16} color={colors.primaryGreen} />
                  <Text style={styles.serviceTagText}>Home Visit</Text>
                </View>
              )}
            </View>
          </View>
        )}
        
        <View style={styles.specializationsSection}>
          <Text style={styles.sectionTitle}>Specializations</Text>
          <View style={styles.specializationTags}>
            {professional.expertise?.map((spec: string, index: number) => (
              <View key={index} style={styles.specializationTag}>
                <Text style={styles.specializationTagText}>{spec}</Text>
              </View>
            )) || <Text style={styles.infoText}>No specializations listed</Text>}
          </View>
        </View>
        
        <View style={styles.languagesSection}>
          <Text style={styles.sectionTitle}>Languages</Text>
          <View style={styles.languageTags}>
            {professional.languages?.map((lang: string, index: number) => (
              <View key={index} style={styles.languageTag}>
                <Text style={styles.languageTagText}>{lang}</Text>
              </View>
            )) || <Text style={styles.infoText}>No languages listed</Text>}
          </View>
        </View>
      </View>
    );
  };

  const renderDateSelector = () => (
    <View style={styles.dateSelectorSection}>
      <Text style={styles.sectionTitle}>Select Date</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dateSelectorContainer}
      >
        {availableDates.map((date) => (
          <TouchableOpacity
            key={date}
            style={[
              styles.dateButton,
              selectedDate === date && styles.selectedDateButton
            ]}
            onPress={() => handleDateSelect(date)}
          >
            <Text style={[
              styles.dateButtonText,
              selectedDate === date && styles.selectedDateButtonText
            ]}>
              {formatDate(date)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderTimeSlots = () => (
    <View style={styles.timeSlotsSection}>
      <Text style={styles.sectionTitle}>Available Time Slots</Text>
      {loading ? (
        <LoadingState message="Loading available slots..." size="small" />
      ) : availableSlots.length === 0 ? (
        <EmptyState
          icon="clock-outline"
          title="No Slots Available"
          subtitle={`No time slots available for ${formatDate(selectedDate)}. Please select a different date.`}
          iconSize={60}
          iconColor={colors.secondaryText}
        />
      ) : (
        <View style={styles.slotsGrid}>
          {availableSlots
            .filter(slot => slot.is_available)
            .map((slot) => (
              <TouchableOpacity
                key={slot.id}
                style={[
                  styles.slotButton,
                  selectedSlot === slot.id && styles.selectedSlotButton
                ]}
                onPress={() => handleSlotSelect(slot.id)}
              >
                <Text style={[
                  styles.slotTimeText,
                  selectedSlot === slot.id && styles.selectedSlotTimeText
                ]}>
                  {formatTime(slot.start_time)}
                </Text>
                <Text style={[
                  styles.slotPriceText,
                  selectedSlot === slot.id && styles.selectedSlotPriceText
                ]}>
                  ₹{slot.price}
                </Text>
                <View style={[
                  styles.slotTypeIndicator,
                  slot.type === 'online' && styles.onlineIndicator,
                  slot.type === 'offline' && styles.offlineIndicator,
                  slot.type === 'home_visit' && styles.homeVisitIndicator,
                ]}>
                  <MaterialCommunityIcons 
                    name={
                      slot.type === 'online' ? 'video' : 
                      slot.type === 'offline' ? 'map-marker' : 'home'
                    } 
                    size={12} 
                    color={colors.white} 
                  />
                </View>
              </TouchableOpacity>
            ))}
        </View>
      )}
    </View>
  );

  const renderBookingSection = () => (
    <View style={styles.bookingSection}>
      <View style={styles.bookingSummary}>
        <Text style={styles.bookingSummaryTitle}>Booking Summary</Text>
        {selectedSlot && (
          <View style={styles.bookingDetails}>
            <Text style={styles.bookingDetailText}>
              Date: {formatDate(selectedDate)}
            </Text>
            <Text style={styles.bookingDetailText}>
              Time: {formatTime(availableSlots.find(s => s.id === selectedSlot)?.start_time || '')}
            </Text>
            <Text style={styles.bookingDetailText}>
              Duration: {availableSlots.find(s => s.id === selectedSlot)?.duration || 0} minutes
            </Text>
            <Text style={styles.bookingDetailText}>
              Price: ₹{availableSlots.find(s => s.id === selectedSlot)?.price || 0}
            </Text>
          </View>
        )}
      </View>
      
      <TouchableOpacity
        style={[
          styles.bookButton,
          !selectedSlot && styles.bookButtonDisabled
        ]}
        onPress={handleBookConsultation}
        disabled={!selectedSlot}
      >
        <Text style={styles.bookButtonText}>
          {selectedSlot ? 'Book Consultation' : 'Select a Time Slot'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (error) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Professional Details" />
        <EmptyState
          icon="alert-circle"
          title="Error Loading Details"
          subtitle={error}
          iconSize={80}
          iconColor={colors.error}
        />
      </ScreenContainer>
    );
  }

  if (!professional) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Professional Details" />
        <LoadingState message="Loading professional details..." />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScreenHeader title="Professional Details" />
      
      {/* Share Button */}
      <View style={styles.shareButtonContainer}>
        <TouchableOpacity 
          style={styles.shareButton}
          onPress={() => Alert.alert('Share', 'Share functionality coming soon!')}
        >
          <MaterialCommunityIcons name="share-variant" size={24} color={colors.primaryGreen} />
        </TouchableOpacity>
      </View>
      
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primaryGreen]}
            tintColor={colors.primaryGreen}
          />
        }
      >
        {renderProfessionalInfo()}
        {renderDateSelector()}
        {renderTimeSlots()}
        {renderBookingSection()}
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  shareButtonContainer: {
    position: 'absolute',
    top: 60,
    right: 16,
    zIndex: 1,
  },
  shareButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.primaryGreen + '20',
  },
  professionalInfoSection: {
    padding: 16,
    backgroundColor: colors.white,
    marginBottom: 16,
  },
  professionalHeader: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: colors.white,
    fontSize: 32,
    fontWeight: '600',
  },
  professionalDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  professionalName: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: 4,
  },
  professionalExpertise: {
    fontSize: 16,
    color: colors.secondaryText,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    color: colors.secondaryText,
    marginLeft: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: colors.secondaryText,
    marginLeft: 8,
    flex: 1,
  },
  bioTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primaryText,
    marginTop: 16,
    marginBottom: 8,
  },
  bioText: {
    fontSize: 14,
    color: colors.secondaryText,
    lineHeight: 20,
    marginBottom: 20,
  },
  servicesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: 12,
  },
  serviceTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  serviceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryGreen + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  serviceTagText: {
    fontSize: 12,
    color: colors.primaryGreen,
    marginLeft: 4,
    fontWeight: '500',
  },
  specializationsSection: {
    marginBottom: 20,
  },
  specializationTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  specializationTag: {
    backgroundColor: colors.accentBlue + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  specializationTagText: {
    fontSize: 12,
    color: colors.accentBlue,
    fontWeight: '500',
  },
  languagesSection: {
    marginBottom: 20,
  },
  languageTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  languageTag: {
    backgroundColor: colors.accentPurple + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  languageTagText: {
    fontSize: 12,
    color: colors.accentPurple,
    fontWeight: '500',
  },
  dateSelectorSection: {
    padding: 16,
    backgroundColor: colors.white,
    marginBottom: 16,
  },
  dateSelectorContainer: {
    paddingRight: 16,
  },
  dateButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.offWhite,
    marginRight: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  selectedDateButton: {
    backgroundColor: colors.primaryGreen,
  },
  dateButtonText: {
    fontSize: 14,
    color: colors.secondaryText,
    fontWeight: '500',
  },
  selectedDateButtonText: {
    color: colors.white,
  },
  timeSlotsSection: {
    padding: 16,
    backgroundColor: colors.white,
    marginBottom: 16,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  slotButton: {
    width: '48%',
    padding: 16,
    borderRadius: 8,
    backgroundColor: colors.offWhite,
    marginBottom: 12,
    alignItems: 'center',
    position: 'relative',
  },
  selectedSlotButton: {
    backgroundColor: colors.primaryGreen,
  },
  slotTimeText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: 4,
  },
  selectedSlotTimeText: {
    color: colors.white,
  },
  slotPriceText: {
    fontSize: 14,
    color: colors.secondaryText,
    marginBottom: 8,
  },
  selectedSlotPriceText: {
    color: colors.white + 'CC',
  },
  slotTypeIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineIndicator: {
    backgroundColor: colors.primaryGreen,
  },
  offlineIndicator: {
    backgroundColor: colors.accentBlue,
  },
  homeVisitIndicator: {
    backgroundColor: colors.accentOrange,
  },
  bookingSection: {
    padding: 16,
    backgroundColor: colors.white,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  bookingSummary: {
    marginBottom: 20,
  },
  bookingSummaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: 12,
  },
  bookingDetails: {
    backgroundColor: colors.offWhite,
    padding: 12,
    borderRadius: 8,
  },
  bookingDetailText: {
    fontSize: 14,
    color: colors.secondaryText,
    marginBottom: 4,
  },
  bookButton: {
    backgroundColor: colors.primaryGreen,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  bookButtonDisabled: {
    backgroundColor: colors.lightGray,
  },
  bookButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfessionalDetailsScreen;
