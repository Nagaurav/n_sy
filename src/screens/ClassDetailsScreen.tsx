import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../theme';
import { YogaClass } from '../types/yogaClasses';

// Define params locally or import from your navigation types
type ClassDetailsRouteProp = RouteProp<{ params: { classData: YogaClass } }, 'params'>;

const ClassDetailsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<ClassDetailsRouteProp>();
  const { classData } = route.params;

  const handleBookPress = () => {
    // 🚀 DIRECT NAVIGATION to Booking Confirmation
    // We pass "yoga_class" specific data, bypassing SelectTimeScreen
    navigation.navigate('BookingConfirmation', {
      bookingData: {
        professionalId: classData.professional_id.toString(),
        professionalName: "Yoga Instructor", // You might want to fetch the real name
        
        // Service Info
        serviceType: 'yoga_class',
        yogaPlanId: classData.id,
        serviceName: classData.title,
        
        // Pricing
        price: classData.effective_price || classData.price_group_online || 0,
        
        // Schedule Info (Static, since classes have fixed times)
        date: new Date().toISOString(), // Booking is for "Now/Upcoming"
        time: `${classData.start_time} - ${classData.end_time}`,
        days: classData.days,
        duration: classData.duration, // e.g. "ONE_MONTH"
        
        // 🟢 MAGIC FIX: Pass a placeholder slot_id to satisfy the next screen's validation
        // The backend knows to ignore this for classes
        slot_id: "CLASS_ENROLLMENT", 
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Class Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>{classData.title}</Text>
          <Text style={styles.price}>₹{classData.effective_price || classData.price_group_online}/month</Text>
          
          <View style={styles.tagContainer}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{classData.duration.replace('_', ' ')}</Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{classData.group_online ? 'Online Group' : 'Offline'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Schedule</Text>
          <View style={styles.row}>
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <Text style={styles.rowText}>{classData.days}</Text>
          </View>
          <View style={styles.row}>
            <Ionicons name="time-outline" size={20} color="#666" />
            <Text style={styles.rowText}>
              {new Date(classData.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
              {' - '}
              {new Date(classData.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>About this Class</Text>
          <Text style={styles.description}>{classData.description}</Text>
          
          {classData.disease && (
             <Text style={styles.specialNote}>✨ Specialized for: {classData.disease}</Text>
          )}
        </View>
      </ScrollView>

      {/* Footer Action */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.bookBtn} onPress={handleBookPress}>
          <Text style={styles.bookBtnText}>Enroll Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff' },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  backBtn: { padding: 8 },
  content: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 8 },
  price: { fontSize: 20, fontWeight: '700', color: theme.colors.primary, marginBottom: 16 },
  tagContainer: { flexDirection: 'row', marginBottom: 20 },
  tag: { backgroundColor: '#f0f9ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 8 },
  tagText: { color: theme.colors.primary, fontSize: 12, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12, color: '#333' },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  rowText: { marginLeft: 10, fontSize: 15, color: '#555' },
  description: { fontSize: 15, lineHeight: 24, color: '#666' },
  specialNote: { marginTop: 12, color: '#d97706', fontWeight: '500', backgroundColor: '#fffbeb', padding: 10, borderRadius: 8 },
  footer: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  bookBtn: { backgroundColor: theme.colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  bookBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});

export default ClassDetailsScreen;
