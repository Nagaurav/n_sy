// FAQScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { makeApiRequest } from '../config/api';

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
  created_at: string;
  updated_at: string;
}

interface FAQResponse {
  success: boolean;
  message: string;
  data: FAQ[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const FAQScreen: React.FC = () => {
  const navigation = useNavigation();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  const fetchFAQs = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
      setPagination(prev => ({ ...prev, page: 1 }));
    } else {
      setLoading(true);
    }
    
    setError(null);
    
    try {
      const response = await makeApiRequest('/faqs', 'GET', {
        page: isRefresh ? 1 : pagination.page,
        limit: pagination.limit,
      });
      
      if (response.success && response.data) {
        if (isRefresh) {
          setFaqs(response.data);
        } else {
          setFaqs(prev => [...prev, ...response.data]);
        }
        
        setPagination({
          page: response.pagination.page,
          limit: response.pagination.limit,
          total: response.pagination.total,
          pages: response.pagination.pages,
        });
      } else {
        setError(response.message || 'Failed to load FAQs');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load FAQs');
      console.error('Error fetching FAQs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    fetchFAQs();
  }, [fetchFAQs]);

  const onRefresh = useCallback(() => {
    fetchFAQs(true);
  }, [fetchFAQs]);

  const loadMore = useCallback(() => {
    if (pagination.page < pagination.pages && !loading) {
      setPagination(prev => ({ ...prev, page: prev.page + 1 }));
    }
  }, [pagination.page, pagination.pages, loading]);

  const toggleExpanded = (faqId: number) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(faqId)) {
        newSet.delete(faqId);
      } else {
        newSet.add(faqId);
      }
      return newSet;
    });
  };

  const renderFAQ = ({ item }: { item: FAQ }) => {
    const isExpanded = expandedItems.has(item.id);
    
    return (
      <View style={styles.faqCard}>
        <TouchableOpacity
          style={styles.faqHeader}
          onPress={() => toggleExpanded(item.id)}
          activeOpacity={0.7}
        >
          <Text style={styles.question} numberOfLines={isExpanded ? undefined : 2}>
            {item.question}
          </Text>
          <MaterialCommunityIcons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={24}
            color={colors.primaryGreen}
          />
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.answerContainer}>
            <Text style={styles.answer}>{item.answer}</Text>
            <View style={styles.faqMeta}>
              <Text style={styles.category}>{item.category}</Text>
              <Text style={styles.date}>
                {new Date(item.updated_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="help-circle" size={80} color={colors.secondaryText} />
      <Text style={styles.emptyTitle}>No FAQs Found</Text>
      <Text style={styles.emptySubtitle}>
        {error || 'Check back later for frequently asked questions'}
      </Text>
      {error && (
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchFAQs(true)}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primaryGreen} />
        <Text style={styles.loadingText}>Loading more...</Text>
      </View>
    );
  };

  if (loading && faqs.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor={colors.background} barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryGreen} />
          <Text style={styles.loadingText}>Loading FAQs...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={colors.background} barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Frequently Asked Questions</Text>
        <View style={styles.headerRight} />
      </View>

      <FlatList
        data={faqs}
        renderItem={renderFAQ}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primaryGreen]}
            tintColor={colors.primaryGreen}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.offWhite,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primaryText,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 34,
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  faqCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 16,
  },
  question: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.primaryText,
    flex: 1,
    marginRight: 12,
    lineHeight: 22,
  },
  answerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: colors.offWhite,
  },
  answer: {
    fontSize: 14,
    color: colors.secondaryText,
    lineHeight: 20,
    marginBottom: 12,
  },
  faqMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  category: {
    fontSize: 12,
    color: colors.primaryGreen,
    fontWeight: '500',
    backgroundColor: colors.offWhite,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  date: {
    fontSize: 12,
    color: colors.secondaryText,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primaryText,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.secondaryText,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: colors.primaryGreen,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.offWhite,
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    color: colors.secondaryText,
    marginLeft: 8,
  },
});

export default FAQScreen;
