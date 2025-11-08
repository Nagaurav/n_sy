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
import { ROUTES } from '../navigation/constants';
import { professionalService } from '../services';
import { useTypedNavigation } from '../hooks/useTypedNavigation';
import type { Professional } from '../services/professional/ProfessionalService';

interface Slot {
  id: string;
  date: string;
  time: string;
  isAvailable: boolean;
  fullSlotData?: any;
}

interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
}

const MOCK_REVIEWS: Review[] = [
  {
    id: '1',
    userName: 'Sarah M.',
    rating: 5,
    comment: 'Excellent session! Helped me manage stress better.',
  },
  {
    id: '2',
    userName: 'Mike R.',
    rating: 4,
    comment: 'Very patient and knowledgeable. Great experience!',
  },
];

const ExpertProfileScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useTypedNavigation();
  const { professionalId, professional } = route.params as {
    professionalId?: string;
    professional?: Professional;
  };

  const [expert, setExpert] = useState<Professional | null>(null);
  const [timeSlots, setTimeSlots] = useState<Slot[]>([]);
  const [reviews, setReviews] = useState<Review[]>(MOCK_REVIEWS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Fetch profile and slots */
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let profileData: Professional | null = professional || null;

      if (!profileData && professionalId) {
        const profileResponse = await professionalService.getProfessionalById(professionalId);
        if (profileResponse.success && profileResponse.data) {
          profileData = profileResponse.data as Professional;
        } else {
          throw new Error(profileResponse.message || 'Unable to fetch profile data.');
        }
      }

      if (profileData) {
        setExpert(profileData);
        await fetchTimeSlots(profileData.id);
      } else {
        setError('Profile not found.');
      }
    } catch (err: any) {
      console.error('Profile fetch error:', err);
      setError(err.message || 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  }, [professionalId, professional]);

  /** Fetch available slots */
  const fetchTimeSlots = async (profId: string) => {
    try {
      const slotsResponse = await professionalService.checkSlotAvailability(profId);
      if (slotsResponse.success && slotsResponse.data) {
        const allSlots: Slot[] = slotsResponse.data.flatMap((dateEntry: any) =>
          dateEntry.slots
            .filter((s: any) => s.isAvailable)
            .map((s: any) => ({
              id: `${dateEntry.date}-${s.startTime}`,
              date: dateEntry.date,
              time: s.startTime.slice(0, 5),
              isAvailable: s.isAvailable,
              fullSlotData: { ...s, date: dateEntry.date },
            }))
        );
        setTimeSlots(allSlots);
      } else {
        setTimeSlots([]);
      }
    } catch (err) {
      console.error('Slot fetch error:', err);
      setTimeSlots([]);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  /** Booking handler */
  const handleBookSlot = (slot: Slot) => {
    if (!expert) return;

    const isYogaExpert = expert.specializations?.some((spec) =>
      spec.toLowerCase().includes('yoga')
    );

    if (isYogaExpert) {
      navigation.navigate(ROUTES.BOOKING_CONFIRMATION, {
        professional: expert,
        selectedTime: slot.time,
        selectedDate: slot.date,
        mode: 'online',
        category: 'yoga',
        categoryName: 'Yoga Classes',
        categoryIcon: 'yoga',
        categoryColor: colors.primaryGreen,
      });
    } else {
      navigation.navigate(ROUTES.BOOK_CONSULTATION, {
        professional: expert,
        slot,
      });
    }
  };

  const renderSlot = ({ item }: { item: Slot }) => (
    <TouchableOpacity
      style={[styles.slot, !item.isAvailable && styles.slotDisabled]}
      onPress={() => handleBookSlot(item)}
      disabled={!item.isAvailable}
    >
      <Text
        style={[
          styles.slotText,
          !item.isAvailable && { color: colors.secondaryText },
        ]}
      >
        {item.time}
      </Text>
    </TouchableOpacity>
  );

  const renderReview = ({ item }: { item: Review }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewAuthor}>{item.userName}</Text>
        <View style={styles.ratingContainer}>
          {Array.from({ length: 5 }).map((_, i) => (
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

  /** Loader / Error States */
  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primaryGreen} />
      </SafeAreaView>
    );
  }

  if (error || !expert) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || 'Expert not found.'}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={colors.background} barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Expert Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile */}
        <View style={styles.profileHeader}>
          <MaterialCommunityIcons name="account-circle" size={80} color={colors.primaryGreen} />
          <Text style={styles.name}>{`${expert.firstName} ${expert.lastName}`}</Text>
          <Text style={styles.specialty}>{expert.specializations?.join(', ')}</Text>
          <Text style={styles.experience}>{expert.experience}+ Years Experience</Text>

          {/* Rating */}
          <View style={styles.ratingContainer}>
            {Array.from({ length: 5 }).map((_, i) => (
              <MaterialCommunityIcons
                key={i}
                name={i < Math.floor(expert.rating || 4) ? 'star' : 'star-outline'}
                size={16}
                color={colors.accentYellow}
              />
            ))}
            <Text style={styles.ratingText}>
              {expert.rating?.toFixed(1) || '4.0'} ({expert.totalRatings || 24})
            </Text>
          </View>
        </View>

        {/* Slots */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Time Slots</Text>
          {timeSlots.length > 0 ? (
            <FlatList
              horizontal
              data={timeSlots}
              keyExtractor={(item) => item.id}
              renderItem={renderSlot}
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: 8 }}
            />
          ) : (
            <Text style={styles.emptyText}>No available slots currently</Text>
          )}
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>
            {expert.bio ||
              'Experienced wellness expert providing holistic and personalized guidance for better living.'}
          </Text>
        </View>

        {/* Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services</Text>
          <View style={styles.servicesContainer}>
            {expert.serviceTypes?.map((s, i) => (
              <View key={i} style={styles.serviceItem}>
                <MaterialCommunityIcons
                  name={
                    s.type === 'online'
                      ? 'video'
                      : s.type === 'home_visit'
                      ? 'home'
                      : 'map-marker'
                  }
                  size={20}
                  color={colors.primaryGreen}
                />
                <Text style={styles.serviceText}>
                  {s.type.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Languages */}
        {expert.languages && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Languages</Text>
            <Text style={styles.languagesText}>{expert.languages.join(', ')}</Text>
          </View>
        )}

        {/* Reviews */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reviews</Text>
          {reviews.length ? (
            <FlatList data={reviews} keyExtractor={(r) => r.id} renderItem={renderReview} scrollEnabled={false} />
          ) : (
            <Text style={styles.emptyText}>No reviews available</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// 💅 Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  backButton: { padding: 6 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.primaryText },
  profileHeader: { alignItems: 'center', paddingVertical: 20 },
  name: { color: colors.primaryGreen, fontSize: 22, fontWeight: '700', marginTop: 8 },
  specialty: { color: colors.secondaryText, fontSize: 16, textAlign: 'center', marginVertical: 4 },
  experience: { fontSize: 14, color: colors.secondaryText },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  ratingText: { marginLeft: 8, color: colors.secondaryText },
  section: { marginVertical: 12, paddingHorizontal: 20 },
  sectionTitle: { color: colors.primaryGreen, fontSize: 18, fontWeight: '600', marginBottom: 10 },
  slot: {
    backgroundColor: colors.lightSage,
    borderRadius: 12,
    padding: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: colors.primaryGreen,
  },
  slotDisabled: { opacity: 0.5 },
  slotText: { color: colors.primaryGreen, fontWeight: '600' },
  aboutText: { color: colors.secondaryText, fontSize: 14, lineHeight: 22 },
  emptyText: { textAlign: 'center', color: colors.secondaryText, marginTop: 10 },
  servicesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightSage,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  serviceText: { marginLeft: 6, fontWeight: '600', color: colors.primaryGreen },
  languagesText: { textAlign: 'center', color: colors.secondaryText },
  reviewCard: { backgroundColor: colors.offWhite, padding: 14, borderRadius: 10, marginBottom: 12 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  reviewAuthor: { color: colors.primaryGreen, fontWeight: '600' },
  reviewText: { color: colors.secondaryText },
  errorText: { color: colors.error, fontSize: 16 },
});

export default ExpertProfileScreen;
