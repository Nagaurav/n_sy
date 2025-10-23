import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { apiService } from '../services/api';
import { FAQ } from '../types/support';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FaqScreen = () => {
  const navigation = useNavigation();
  const [faqData, setFaqData] = useState<Record<string, FAQ[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch FAQs from API
  const fetchFaqs = async () => {
    try {
      setError(null);
      const response = await apiService.getFaqs();
      
      if (response.success && response.data?.data) {
        // Group FAQs by category
        const grouped = response.data.data.reduce((acc: Record<string, FAQ[]>, faq: FAQ) => {
          const category = faq.category || 'General';
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(faq);
          return acc;
        }, {});
        
        setFaqData(grouped);
      } else {
        throw new Error('Failed to fetch FAQs');
      }
    } catch (err: any) {
      console.error('Error fetching FAQs:', err);
      setError(err.message || 'Failed to load FAQs. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Load FAQs on component mount
  useEffect(() => {
    fetchFaqs();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFaqs();
  };

  const toggleExpand = (id: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  const openDrawer = () => {
    console.log('🔵 Opening drawer from FAQ...');
    navigation.dispatch(DrawerActions.openDrawer());
  };

  // Reusable FAQ Item Component
  const renderFaqItem = (faq: FAQ) => (
    <TouchableOpacity
      key={faq.id}
      style={styles.faqCard}
      onPress={() => toggleExpand(faq.id)}
      activeOpacity={0.7}
    >
      <View style={styles.faqHeader}>
        <Text style={styles.faqQuestion}>{faq.question}</Text>
        <Ionicons
          name={expandedId === faq.id ? 'chevron-up' : 'chevron-down'}
          size={24}
          color="#1E88E5"
        />
      </View>
      {expandedId === faq.id && (
        <View style={styles.answerContainer}>
          <Text style={styles.faqAnswer}>{faq.answer}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#1E88E5" barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.menuButton} onPress={openDrawer}>
            <Ionicons name="menu" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Frequently Asked Questions</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E88E5" />
          <Text style={styles.loadingText}>Loading FAQs...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#1E88E5" barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={openDrawer}>
          <Ionicons name="menu" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Frequently Asked Questions</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1E88E5']}
          />
        }
      >
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchFaqs}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : Object.keys(faqData).length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="help-circle-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No FAQs available</Text>
          </View>
        ) : (
          Object.entries(faqData).map(([category, faqs]) => (
            <View key={category} style={styles.categorySection}>
              <Text style={styles.categoryTitle}>{category}</Text>
              {faqs.map(renderFaqItem)}
            </View>
          ))
        )}
      </ScrollView>
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
    paddingTop: StatusBar.currentHeight || 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#1E88E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  categorySection: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#1E88E5',
  },
  faqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  answerContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  faqAnswer: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
});

export default FaqScreen;
