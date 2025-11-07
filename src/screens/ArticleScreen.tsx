// ArticleScreen.tsx
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';

import { ScreenContainer } from '../components/common/ScreenContainer';
import ArticleCard from '../components/ArticleCard';
import articleService, { Article, ArticleFilters } from '../services/articleService';
import { ROUTES } from '../navigation/constants';
import { colors } from '../theme/colors';

const ArticleScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const [articles, setArticles] = useState<Article[]>([]);
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchArticles = useCallback(async (isRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      const filters: ArticleFilters = {
        // Show all articles for now, including drafts
        // status: 'published', // Only show published articles
      };

      const response = await articleService.getArticles(filters);
      
      if (isRefresh) {
        setRefreshing(false);
      }
      
      setAllArticles(response.data);
      setArticles(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching articles:', err);
      setError('Failed to load articles. Please try again.');
      setLoading(false);
      if (isRefresh) {
        setRefreshing(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchArticles();
    }, [fetchArticles])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchArticles(true);
  };

  const handleArticlePress = (article: Article) => {
    navigation.navigate(ROUTES.ARTICLE_DETAIL, { articleId: article.id });
  };

  const renderArticle = ({ item }: { item: Article }) => (
    <ArticleCard
      article={item}
      onPress={() => handleArticlePress(item)}
    />
  );

  if (loading && !refreshing) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryGreen} />
          <Text style={styles.loadingText}>Loading articles...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (error && !loading) {
    return (
      <ScreenContainer>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchArticles()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Articles</Text>
        <Text style={styles.subtitle}>Discover articles and insights</Text>
      </View>

      <FlatList
        data={articles}
        renderItem={renderArticle}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading && !error ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No Articles Found</Text>
              <Text style={styles.emptySubtitle}>
                Check back later for new articles and insights.
              </Text>
            </View>
          ) : null
        }
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.secondaryText,
    lineHeight: 22,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.secondaryText,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: colors.primaryGreen,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.offWhite,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.primaryText,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.secondaryText,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default ArticleScreen;
