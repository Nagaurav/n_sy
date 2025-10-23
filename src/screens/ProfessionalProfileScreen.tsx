import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Image,
  StatusBar,
  Dimensions,
  Share,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { HomeStackParamList } from '../types/navigation';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';

const { width } = Dimensions.get('window');

type ProfessionalProfileRouteProp = RouteProp<HomeStackParamList, 'ProfessionalProfile'>;

interface Service {
  service_id: number;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
}

interface Review {
  review_id: number;
  user_name: string;
  rating: number;
  comment: string;
  review_date: string;
}

interface ProfessionalDetails {
  professional_id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  speciality: string;
  profile_picture_url?: string;
  average_rating: number;
  total_reviews: number;
  is_online: boolean;
  city: string;
  bio: string;
  qualifications: string[];
  experience_years: number;
  languages_spoken: string[];
  services: Service[];
  reviews: Review[];
}

type ProfessionalProfileScreenNavigationProp = StackNavigationProp<HomeStackParamList>;

const ProfessionalProfileScreen = () => {
  const navigation = useNavigation<ProfessionalProfileScreenNavigationProp>();
  const route = useRoute<ProfessionalProfileRouteProp>();
  const { professionalId } = route.params || {};
  const { user } = useAuth();

  // State management
  const [professionalDetails, setProfessionalDetails] = useState<ProfessionalDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // Refs for section navigation
  const aboutRef = useRef<View>(null);
  const servicesRef = useRef<View>(null);
  const reviewsRef = useRef<View>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Memoize the professional details to prevent unnecessary re-renders
  const memoizedProfessionalDetails = useRef<ProfessionalDetails | null>(null);

  useEffect(() => {
    console.log('🔵 Professional ID from route params:', professionalId);
    if (!professionalId) {
      const errorMsg = '❌ Professional ID is required';
      console.error(errorMsg);
      setError(errorMsg);
      setIsLoading(false);
      return;
    }
    fetchProfessionalDetails();
  }, [professionalId]);

  const fetchProfessionalDetails = useCallback(async () => {
    console.log('🔄 Starting to fetch professional details...');
    
    // Check if we already have the data
    if (memoizedProfessionalDetails.current?.professional_id.toString() === professionalId) {
      console.log('📦 Using cached professional details');
      setProfessionalDetails(memoizedProfessionalDetails.current);
      setIsLoading(false);
      return;
    }
    
    console.log('ℹ️ Fetching public professional profile');
    
    setIsLoading(true);
    setError('');
    
    // Add a small delay to prevent rapid state updates
    await new Promise(resolve => setTimeout(resolve, 300));

    // State is already set above

    try {
      console.log('🔍 Fetching professional details for ID:', professionalId);
      
      const professional = await apiService.getProfessionalProfile(professionalId);
      console.log('✅ Professional details loaded:', professional);
      
      if (!professional) {
        throw new Error('No professional data returned from API');
      }
      
      // Transform Professional to ProfessionalDetails format
      const professionalDetails: ProfessionalDetails = {
        professional_id: professional.id || 0,
        first_name: professional.first_name || '',
        last_name: professional.last_name || '',
        full_name: `${professional.first_name || ''} ${professional.last_name || ''}`.trim() || 'Professional',
        speciality: professional.specialization || 'Wellness Professional',
        profile_picture_url: professional.profile_picture || '',
        average_rating: professional.rating || 0,
        total_reviews: professional.review_count || 0,
        is_online: professional.is_available !== undefined ? professional.is_available : true,
        city: 'Remote', // Default value since city is not in the Professional type
        bio: professional.bio || 'Experienced wellness professional dedicated to helping you achieve your health goals.',
        qualifications: ['Certified Professional'], // Default value
        experience_years: professional.experience_years || 0,
        languages_spoken: professional.languages || ['English'],
          services: [
            {
              service_id: 1,
              name: '30-Min Consultation',
              description: 'Personal consultation session',
              price: 50, // Default price
              duration_minutes: 30,
            },
            {
              service_id: 2,
              name: '60-Min Session',
              description: 'Extended consultation session',
              price: 90, // Default price
              duration_minutes: 60,
            },
          ],
          reviews: [
            {
              review_id: 1,
              user_name: 'Anonymous User',
              rating: professional.rating || 5,
              comment: 'Great professional, highly recommended!',
              review_date: new Date().toISOString()
            }
          ]
        };
        
        // Update the ref and state
        memoizedProfessionalDetails.current = professionalDetails;
        setProfessionalDetails(professionalDetails);
        setError('');
      } catch (error) {
        let errorMessage = 'Failed to load professional details';
        
        if (error instanceof Error) {
          console.error('❌ Error fetching professional details:', error.message);
          errorMessage = error.message;
          
          // Handle specific error cases
          if (error.message.includes('network')) {
            errorMessage = 'Network error. Please check your internet connection.';
          } else if (error.message.includes('timeout')) {
            errorMessage = 'Request timed out. The server is taking too long to respond.';
          } else if (error.message.includes('404')) {
            errorMessage = 'Professional not found. The requested profile does not exist.';
          }
        } else {
          console.error('❌ Unknown error:', error);
        }
        
        setError(errorMessage);
        
        // Show a more detailed error in development
        if (__DEV__) {
          console.error('Detailed error:', error);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [professionalId]
  );

  const handleShare = async () => {
    if (!professionalDetails) return;

    try {
      await Share.share({
        message: `Check out ${professionalDetails.full_name}, ${professionalDetails.speciality} on Samyayog!`,
        title: `${professionalDetails.full_name} - Samyayog`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleServiceSelect = useCallback((service: Service) => {
    if (!professionalDetails) {
      console.error('No professional details available');
      return;
    }
    
    setSelectedService(service);
    
    // Prepare navigation params
    const navigationParams = {
      professionalId: professionalDetails.professional_id.toString(),
      professionalName: professionalDetails.full_name,
      serviceId: service.service_id.toString(),
      serviceName: service.name,
      price: service.price,
      duration: service.duration_minutes,
      serviceDetails: {
        id: service.service_id.toString(),
        name: service.name,
        duration: service.duration_minutes,
        price: service.price
      }
    };
    
    console.log('Navigating to DateTimeSelection with params:', navigationParams);
    navigation.navigate('DateTimeSelection', navigationParams);
  }, [professionalDetails, navigation]);

  const handleBookNow = useCallback(() => {
    if (!professionalDetails) {
      console.error('No professional details available');
      return;
    }

    if (selectedService) {
      handleServiceSelect(selectedService);
    } else {
      // Prepare default service details
      const defaultService = {
        service_id: 0,
        name: 'Consultation',
        description: 'Default consultation service',
        price: 0,
        duration_minutes: 30
      };
      
      handleServiceSelect(defaultService);
    }
  }, [professionalDetails, selectedService, handleServiceSelect]);

  const scrollToSection = (ref: React.RefObject<View | null>) => {
    if (ref.current && scrollViewRef.current) {
      ref.current.measureLayout(
        scrollViewRef.current.getInnerViewNode(),
        (x, y) => {
          scrollViewRef.current?.scrollTo({ y: y - 100, animated: true });
        },
        () => {}
      );
    }
  };

  const renderStars = (rating: number, size: number = 16) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons key={i} name="star" size={size} color="#FCD34D" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Ionicons key="half" name="star-half" size={size} color="#FCD34D" />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons key={`empty-${i}`} name="star-outline" size={size} color="#D1D5DB" />
      );
    }

    return stars;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#1E88E5" barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E88E5" />
          <Text style={styles.loadingText}>Loading professional details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !professionalDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#1E88E5" barStyle="light-content" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Professional Profile</Text>
        </View>

        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorText}>{error || 'Professional not found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchProfessionalDetails()}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#1E88E5" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{professionalDetails.full_name}</Text>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Professional Header Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileImageContainer}>
            {professionalDetails.profile_picture_url ? (
              <Image
                source={{ uri: professionalDetails.profile_picture_url }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.defaultProfileImage}>
                <Ionicons name="person" size={40} color="#6B7280" />
              </View>
            )}
          </View>

          <Text style={styles.professionalName}>{professionalDetails.full_name}</Text>
          <Text style={styles.speciality}>{professionalDetails.speciality}</Text>

          <View style={styles.ratingContainer}>
            <View style={styles.starsContainer}>
              {renderStars(professionalDetails.average_rating, 20)}
            </View>
            <Text style={styles.ratingText}>{professionalDetails.average_rating}</Text>
            <TouchableOpacity onPress={() => scrollToSection(reviewsRef)}>
              <Text style={styles.reviewsLink}>({professionalDetails.total_reviews} reviews)</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statusContainer}>
            <View style={[
              styles.statusBadge,
              { backgroundColor: professionalDetails.is_online ? '#10B981' : '#6B7280' }
            ]}>
              <Text style={styles.statusText}>
                {professionalDetails.is_online ? 'Online' : `Available in ${professionalDetails.city}`}
              </Text>
            </View>
          </View>
        </View>

        {/* Section Navigation Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={styles.tab}
            onPress={() => scrollToSection(aboutRef)}
          >
            <Text style={styles.tabText}>About</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tab}
            onPress={() => scrollToSection(servicesRef)}
          >
            <Text style={styles.tabText}>Services</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tab}
            onPress={() => scrollToSection(reviewsRef)}
          >
            <Text style={styles.tabText}>Reviews</Text>
          </TouchableOpacity>
        </View>

        {/* About Me Section */}
        <View ref={aboutRef} style={styles.section}>
          <Text style={styles.sectionTitle}>About {professionalDetails.first_name}</Text>
          <View style={styles.sectionCard}>
            <Text style={styles.bioText}>{professionalDetails.bio}</Text>

            {professionalDetails.qualifications.length > 0 && (
              <View style={styles.qualificationsContainer}>
                <Text style={styles.subSectionTitle}>Qualifications & Certifications</Text>
                {professionalDetails.qualifications.map((qualification, index) => (
                  <View key={index} style={styles.qualificationItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                    <Text style={styles.qualificationText}>{qualification}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Experience</Text>
                <Text style={styles.detailValue}>{professionalDetails.experience_years} years</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Languages</Text>
                <Text style={styles.detailValue}>{professionalDetails.languages_spoken.join(', ')}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Services & Plans Section */}
        <View ref={servicesRef} style={styles.section}>
          <Text style={styles.sectionTitle}>Services & Plans</Text>
          {professionalDetails.services.map((service) => (
            <View key={service.service_id} style={styles.serviceCard}>
              <View style={styles.serviceHeader}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.servicePrice}>${service.price}</Text>
              </View>
              <Text style={styles.serviceDuration}>{service.duration_minutes} minutes</Text>
              <Text style={styles.serviceDescription}>{service.description}</Text>
              <TouchableOpacity
                style={styles.selectServiceButton}
                onPress={() => handleServiceSelect(service)}
              >
                <Text style={styles.selectServiceButtonText}>Select Plan</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Client Reviews Section */}
        <View ref={reviewsRef} style={styles.section}>
          <Text style={styles.sectionTitle}>Client Reviews</Text>
          
          <View style={styles.reviewsSummary}>
            <View style={styles.ratingContainer}>
              <View style={styles.starsContainer}>
                {renderStars(professionalDetails.average_rating, 24)}
              </View>
              <Text style={styles.averageRatingText}>{professionalDetails.average_rating}</Text>
            </View>
            <Text style={styles.totalReviewsText}>
              Based on {professionalDetails.total_reviews} reviews
            </Text>
          </View>

          {professionalDetails.reviews.map((review) => (
            <View key={review.review_id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewerName}>{review.user_name}</Text>
                <Text style={styles.reviewDate}>{formatDate(review.review_date)}</Text>
              </View>
              <View style={styles.reviewRating}>
                {renderStars(review.rating, 14)}
              </View>
              <Text style={styles.reviewComment}>{review.comment}</Text>
            </View>
          ))}
        </View>

        {/* Bottom spacing for sticky button */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Sticky Book Now Button */}
      <View style={styles.stickyButtonContainer}>
        <TouchableOpacity style={styles.bookNowButton} onPress={handleBookNow}>
          <Text style={styles.bookNowButtonText}>
            {selectedService ? 'Proceed to Booking' : 'Book Now'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: '#1E88E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: StatusBar.currentHeight || 40,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  shareButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginVertical: 16,
  },
  retryButton: {
    backgroundColor: '#1E88E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginTop: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileImageContainer: {
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  defaultProfileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  professionalName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  speciality: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 8,
  },
  reviewsLink: {
    fontSize: 14,
    color: '#1E88E5',
    fontWeight: '500',
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E88E5',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bioText: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 20,
  },
  qualificationsContainer: {
    marginBottom: 20,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  qualificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  qualificationText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  servicePrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E88E5',
  },
  serviceDuration: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  selectServiceButton: {
    backgroundColor: '#1E88E5',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  selectServiceButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  reviewsSummary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  averageRatingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 12,
  },
  totalReviewsText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  reviewDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  reviewRating: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  reviewComment: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 100,
  },
  stickyButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  bookNowButton: {
    backgroundColor: '#1E88E5',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  bookNowButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ProfessionalProfileScreen;
