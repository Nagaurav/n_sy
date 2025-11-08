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
import { colors } from '../theme/colors';
import { makeApiRequest } from '../config/api';
import { useTypedNavigation } from '../hooks/useTypedNavigation';

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
  message?: string;
  data?: FAQ[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const FAQScreen: React.FC = () => {
  const navigation = useTypedNavigation();

  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  /** 🧠 Fetch FAQs from API */
  const fetchFAQs = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
        setPage(1);
      } else {
        setLoading(true);
      }

      try {
        const response: FAQResponse = await makeApiRequest('/faqs', 'GET', {
          page: isRefresh ? 1 : page,
          limit: 20,
        });

        if (response.success && response.data) {
          const newData = response.data;
          setFaqs((prev) => (isRefresh ? newData : [...prev, ...newData]));
          setHasMore(response.pagination?.page! < response.pagination?.pages!);
        } else {
          setError(response.message || 'Failed to load FAQs.');
        }
      } catch (err: any) {
        console.error('FAQ Fetch Error:', err);
        setError(err.message || 'Network error while loading FAQs.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page]
  );

  /** 🧠 Initial Load */
  useEffect(() => {
    fetchFAQs(true);
  }, []);

  /** 🧠 Refresh Handler */
  const onRefresh = () => fetchFAQs(true);

  /** 🧠 Load More */
  const onEndReached = () => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1);
      fetchFAQs();
    }
  };

  /** 🧠 Expand / Collapse */
  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

  /** 🧠 Renderers */
  const renderFAQItem = ({ item }: { item: FAQ }) => {
    const isExpanded = expanded.has(item.id);
    return (
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => toggleExpand(item.id)}
          activeOpacity={0.8}
        >
          <Text style={styles.question}>{item.question}</Text>
          <MaterialCommunityIcons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={22}
            color={colors.primaryGreen}
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.cardBody}>
            <Text style={styles.answer}>{item.answer}</Text>
            <View style={styles.metaRow}>
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

  const renderEmpty = () => (
    <View style={styles.empty}>
      <MaterialCommunityIcons
        name="help-circle-outline"
        size={70}
        color={colors.secondaryText}
      />
      <Text style={styles.emptyTitle}>No FAQs Found</Text>
      <Text style={styles.emptySubtitle}>
        {error || 'We’ll add some FAQs soon!'}
      </Text>
      {error && (
        <TouchableOpacity style={styles.retry} onPress={() => fetchFAQs(true)}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderFooter = () =>
    loading && faqs.length > 0 ? (
      <View style={styles.footer}>
        <ActivityIndicator color={colors.primaryGreen} size="small" />
        <Text style={styles.footerText}>Loading more...</Text>
      </View>
    ) : null;

  /** 🧠 Loader Screen */
  if (loading && faqs.length === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={colors.primaryGreen} />
        <Text style={styles.footerText}>Loading FAQs...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={colors.background} barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FAQs</Text>
        <View style={{ width: 34 }} />
      </View>

      {/* List */}
      <FlatList
        data={faqs}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderFAQItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primaryGreen]}
          />
        }
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.offWhite,
  },
  backBtn: { padding: 6 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.primaryText, textAlign: 'center', flex: 1 },
  list: { padding: 20, paddingBottom: 60 },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.offWhite,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
  },
  question: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.primaryText,
    marginRight: 10,
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: colors.offWhite,
  },
  answer: {
    fontSize: 14,
    color: colors.secondaryText,
    lineHeight: 20,
    marginVertical: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  category: {
    backgroundColor: colors.lightSage,
    color: colors.primaryGreen,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: '500',
  },
  date: { fontSize: 12, color: colors.secondaryText },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.primaryText, marginTop: 12 },
  emptySubtitle: { fontSize: 14, color: colors.secondaryText, textAlign: 'center', marginTop: 6, paddingHorizontal: 40 },
  retry: {
    backgroundColor: colors.primaryGreen,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  retryText: { color: colors.offWhite, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 20 },
  footerText: { fontSize: 14, color: colors.secondaryText, marginLeft: 8 },
});

export default FAQScreen;
