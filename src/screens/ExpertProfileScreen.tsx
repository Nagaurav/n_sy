// ExpertProfileScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useRoute } from '@react-navigation/native';
import { ROUTES } from '../navigation/constants';
import { professionalService } from '../services';
import { useTypedNavigation } from '../hooks/useTypedNavigation';
import type { Professional } from '../services/professional/ProfessionalService';

const ExpertProfileScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useTypedNavigation();
  const { professionalId, professional } = route.params as { professionalId?: string; professional?: Professional };

  const [expert, setExpert] = useState<Professional | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [timeSlots, setTimeSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, [professionalId, professional]);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (professional) { // If data is passed via props, use it
        setExpert(professional as Professional);
        await fetchTimeSlots(professional.id);
      } else if (professionalId) { // Otherwise, fetch from API
        const profileResponse = await professionalService.getProfessionalById(professionalId);
        if (profileResponse.success && profileResponse.data) {
          setExpert(profileResponse.data as Professional);
          await fetchTimeSlots(professionalId);
        } else {
          throw new Error(profileResponse.message || 'Failed to load profile.');
        }
      }
      // Keep mock reviews for now
      setReviews([
        {
          id: '1',
          userName: 'Sarah M.',
          rating: 5,
          comment: 'Excellent session! Dr. Anya helped me with my stress management techniques.',
        },
        {
          id: '2',
          userName: 'Mike R.',
          rating: 4,
          comment: 'Very knowledgeable and patient. Highly recommend!',
        },
      ]);
    } catch (e: any) {
      console.error('Error fetching profile:', e);
      setError(e.message || 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  }, [professionalId, professional]);

  const fetchTimeSlots = async (profId: string) => {
    try {
      const slotsResponse = await professionalService.checkSlotAvailability(profId);
      if (slotsResponse.success && slotsResponse.data) {
        // Flatten the slots from all dates into one list
        const allSlots = slotsResponse.data.flatMap((dateEntry: any) => 
          dateEntry.slots
            .filter((slot: any) => slot.isAvailable)
            .map((slot: any) => ({
              id: `${dateEntry.date}-${slot.startTime}`,
              date: dateEntry.date,
              time: slot.startTime.substring(0, 5),
              isAvailable: slot.isAvailable,
              fullSlotData: { ...slot, date: dateEntry.date } 
            }))
        );
        setTimeSlots(allSlots);
      } else {
        throw new Error(slotsResponse.message || 'Failed to load slots.');
      }
    } catch (error) {
      console.error('Error fetching time slots:', error);
      // Fallback to empty array instead of mock data
      setTimeSlots([]);
    }
  };

  // Book a slot
  const handleBookSlot = (slot: any) => {
    if (!expert) return;
    
    // Check if this is a yoga instructor (from yoga flow)
    const isYogaInstructor = expert.specializations?.some(spec => 
      spec.toLowerCase().includes('yoga')
    );
    
    if (isYogaInstructor) {
      // For yoga instructors, navigate to the yoga booking flow
      (navigation as any).navigate(ROUTES.BOOKING_CONFIRMATION, {
        instructor: expert,
        professional: expert,
        mode: 'online', // Default to online, can be updated based on context
        category: 'yoga',
        categoryName: 'Yoga Classes',
        categoryIcon: 'yoga',
        categoryColor: colors.primaryGreen,
        selectedTime: slot.time,
        selectedDate: new Date().toISOString().split('T')[0], // Today's date as default
      });
    } else {
      // For other professionals, use the consultation flow
      (navigation as any).navigate(ROUTES.BOOK_CONSULTATION, { 
        professional: expert, 
        slot 
      });
    }
  };

  // Render time slot
  const renderSlot = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.slot}
      onPress={() => handleBookSlot(item)}
      disabled={!item.isAvailable}
    >
      <Text style={styles.slotText}>{item.time}</Text>
      {!item.isAvailable && (
        <MaterialCommunityIcons name="lock-outline" size={16} color={colors.error} />
      )}
    </TouchableOpacity>
  );

  // Render each review
  const renderReview = ({ item }: { item: any }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewAuthor}>{item.userName}</Text>
        <View style={styles.ratingContainer}>
          {Array(5)
            .fill(null)
            .map((_, i) => (
              <MaterialCommunityIcons
                key={i}
                name={i < item.rating ? 'star' : 'star-outline'}
                size={14}
                color={colors.accentYellow}
              />
            ))}
        </View>
      </View>
      <Text style={styles.reviewText}>{item.comment}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <ActivityIndicator size="large" color={colors.primaryGreen} />
      </SafeAreaView>
    );
  }

  if (error || !expert) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <Text style={styles.errorText}>{error || 'Profile not found.'}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Header with back button */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Expert Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <MaterialCommunityIcons 
              name="account-circle" 
              size={80} 
              color={colors.primaryGreen} 
            />
          </View>
          <Text style={styles.name}>{`${expert.firstName} ${expert.lastName}`}</Text>
          <Text style={styles.specialty}>
            {expert.specializations?.join(', ')}
          </Text>
          <Text style={styles.experience}>
            {expert.experience}+ Years Experience
          </Text>
          
          {/* Rating */}
          <View style={styles.ratingContainer}>
            {Array(5)
              .fill(null)
              .map((_, i) => (
                <MaterialCommunityIcons
                  key={i}
                  name={i < Math.floor(expert.rating || 4) ? 'star' : 'star-outline'}
                  size={16}
                  color={colors.accentYellow}
                />
              ))}
            <Text style={styles.ratingText}>
              {expert.rating?.toFixed(1) || '4.0'} ({expert.totalRatings || 24} reviews)
            </Text>
          </View>
        </View>

        {/* Time Slots */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Time Slots</Text>
          <View style={styles.slotsContainer}>
            {timeSlots.length > 0 ? (
              <FlatList
                horizontal
                data={timeSlots}
                keyExtractor={item => item.id}
                renderItem={renderSlot}
                showsHorizontalScrollIndicator={false}
                style={{ marginVertical: 4 }}
              />
            ) : (
              <View style={styles.mockSlots}>
                {['9:00 AM', '10:00 AM', '2:00 PM', '3:00 PM', '4:00 PM'].map((time, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.slot}
                    onPress={() => handleBookSlot({ id: `mock_${index}`, time, isAvailable: true })}
                  >
                    <Text style={styles.slotText}>{time}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>
            {expert.bio || 'Experienced professional with expertise in wellness and holistic health. Committed to providing personalized care and guidance to help clients achieve their health goals.'}
          </Text>
        </View>

        {/* Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services</Text>
          <View style={styles.servicesContainer}>
            {expert.serviceTypes?.some(st => st.type === 'online') && (
              <View style={styles.serviceItem}>
                <MaterialCommunityIcons name="video" size={20} color={colors.accentGreen} />
                <Text style={styles.serviceText}>Online Consultation</Text>
              </View>
            )}
            {expert.serviceTypes?.some(st => st.type === 'in_person') && (
              <View style={styles.serviceItem}>
                <MaterialCommunityIcons name="map-marker" size={20} color={colors.accentBlue} />
                <Text style={styles.serviceText}>Clinic Visit</Text>
              </View>
            )}
            {expert.serviceTypes?.some(st => st.type === 'home_visit') && (
              <View style={styles.serviceItem}>
                <MaterialCommunityIcons name="home" size={20} color={colors.accentPurple} />
                <Text style={styles.serviceText}>Home Visit</Text>
              </View>
            )}
          </View>
        </View>

        {/* Languages */}
        {expert.languages && expert.languages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Languages</Text>
            <Text style={styles.languagesText}>
              {expert.languages.join(', ')}
            </Text>
          </View>
        )}

        {/* Reviews */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reviews</Text>
          {reviews.length > 0 ? (
            <FlatList
              data={reviews}
              keyExtractor={item => item.id}
              renderItem={renderReview}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.noReviewsText}>No reviews yet</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: colors.background 
  },
  errorContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 16,
    backgroundColor: colors.background 
  },
  errorText: { 
    color: colors.error, 
    fontSize: 16 
  },
  headerContainer: {
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
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.primaryText,
  },
  placeholder: {
    width: 40,
  },
  profileHeader: { 
    marginBottom: 20, 
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  name: { 
    color: colors.primaryGreen,
    marginBottom: 8,
    fontSize: 24,
    fontWeight: '700' as const,
  },
  specialty: { 
    color: colors.secondaryText, 
    marginBottom: 4,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600' as const,
  },
  experience: { 
    fontSize: 14, 
    color: colors.secondaryText, 
    marginBottom: 12,
  },
  ratingContainer: { 
    flexDirection: 'row', 
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.secondaryText,
  },
  section: { 
    marginVertical: 10,
    paddingHorizontal: 20,
  },
  sectionTitle: { 
    color: colors.primaryGreen, 
    marginBottom: 12,
    fontSize: 18,
    fontWeight: '600' as const,
  },
  slotsContainer: {
    marginVertical: 4,
  },
  mockSlots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slot: {
    backgroundColor: colors.lightSage,
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 80,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primaryGreen,
  },
  slotText: { 
    color: colors.primaryGreen, 
    fontWeight: '600', 
    fontSize: 14,
  },
  emptyText: { 
    color: colors.secondaryText, 
    fontSize: 14, 
    marginVertical: 12,
    textAlign: 'center',
  },
  reviewCard: {
    backgroundColor: colors.offWhite,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewAuthor: { 
    fontWeight: '600', 
    color: colors.primaryGreen,
    fontSize: 14,
  },
  reviewText: { 
    color: colors.secondaryText,
    fontSize: 14,
    lineHeight: 20,
  },
  bookButton: {
    backgroundColor: colors.primaryGreen,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 20,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  bookButtonText: { 
    color: colors.offWhite, 
    fontWeight: '700', 
    fontSize: 16,
  },
  aboutText: {
    color: colors.secondaryText,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightSage,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: colors.primaryGreen,
  },
  serviceText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryGreen,
  },
  languagesText: {
    color: colors.secondaryText,
    fontSize: 14,
    textAlign: 'center',
  },
  noReviewsText: {
    color: colors.secondaryText,
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 12,
  },
});

export default ExpertProfileScreen; 