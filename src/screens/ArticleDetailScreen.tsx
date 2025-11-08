import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { ScreenContainer } from '../components/common/ScreenContainer';
import { useTypedNavigation } from '../hooks/useTypedNavigation';
import { articleService, Article } from '../services/articleService';
import { colors } from '../theme/colors';

interface RouteParams {
  articleId: number;
}

const ArticleDetailScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useTypedNavigation();
  const { articleId } = route.params as RouteParams;

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** ✅ Fetch article by ID (with retry & view count update) */
  const fetchArticle = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await articleService.getArticleById(articleId);
      if (!response?.success || !response.data) {
        throw new Error(response?.message || 'Article not found.');
      }

      setArticle(response.data);
      // Increment views asynchronously (no blocking)
      articleService.incrementViews(articleId).catch(console.warn);
    } catch (err: any) {
      console.error('Article fetch failed:', err);
      setError(err.message || 'Failed to load article. Please try again.');
      setArticle(null);
    } finally {
      setLoading(false);
    }
  }, [articleId]);

  React.useEffect(() => {
    fetchArticle();
  }, [fetchArticle]);

  /** ✅ Share article link via native Share API */
  const handleShare = async () => {
    if (!article) return;
    try {
      await Share.share({
        title: article.title,
        message: `Check out this article: ${article.title}\n\nRead more in our app.`,
      });
    } catch (error) {
      console.error('Error sharing article:', error);
    }
  };

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primaryGreen} />
          <Text style={styles.loadingText}>Loading article...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (error || !article) {
    return (
      <ScreenContainer>
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={60} color={colors.error} />
          <Text style={styles.errorTitle}>Oops!</Text>
          <Text style={styles.errorText}>{error || 'Article not found.'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchArticle}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primaryText} />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleShare} style={styles.iconButton}>
          <MaterialCommunityIcons name="share-variant" size={24} color={colors.primaryText} />
        </TouchableOpacity>
      </View>

      {/* Article Content */}
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Article Header */}
        <View style={styles.articleHeader}>
          {!!article.category && <Text style={styles.category}>{article.category}</Text>}

          <Text style={styles.title}>{article.title}</Text>

          {!!article.excerpt && <Text style={styles.excerpt}>{article.excerpt}</Text>}

          {/* Meta Info */}
          <View style={styles.metaInfo}>
            {article.author && (
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="account" size={16} color={colors.secondaryText} />
                <Text style={styles.metaText}>{article.author}</Text>
              </View>
            )}
            {article.publish_date && (
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="calendar" size={16} color={colors.secondaryText} />
                <Text style={styles.metaText}>
                  {new Date(article.publish_date).toLocaleDateString()}
                </Text>
              </View>
            )}
            {article.reading_time && (
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="clock-outline" size={16} color={colors.secondaryText} />
                <Text style={styles.metaText}>{article.reading_time} min read</Text>
              </View>
            )}
            {article.views !== undefined && (
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="eye" size={16} color={colors.secondaryText} />
                <Text style={styles.metaText}>{article.views} views</Text>
              </View>
            )}
          </View>
        </View>

        {/* Body Content */}
        <View style={styles.contentContainer}>
          <Text style={styles.content}>
            {article.content.replace(/<[^>]*>/g, '').trim()}
          </Text>
        </View>

        {/* Tags */}
        {Array.isArray(article.tags) && article.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            <Text style={styles.tagsTitle}>Tags:</Text>
            <View style={styles.tagsList}>
              {article.tags
                .filter((tag) => tag && tag.trim() !== '')
                .map((tag, idx) => (
                  <View key={idx} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.background,
  },
  iconButton: { padding: 8 },
  articleHeader: { paddingHorizontal: 20, paddingBottom: 24 },
  category: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryGreen,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: 12,
    lineHeight: 34,
  },
  excerpt: {
    fontSize: 16,
    color: colors.secondaryText,
    lineHeight: 24,
    marginBottom: 16,
  },
  metaInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 4,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 14, color: colors.secondaryText },
  contentContainer: { paddingHorizontal: 20, marginBottom: 24 },
  content: { fontSize: 16, lineHeight: 26, color: colors.primaryText },
  tagsContainer: { paddingHorizontal: 20, paddingBottom: 24 },
  tagsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: 12,
  },
  tagsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    backgroundColor: colors.lightSage,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: { fontSize: 14, color: colors.primaryGreen, fontWeight: '500' },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 24,
  },
  loadingText: { marginTop: 16, fontSize: 16, color: colors.secondaryText },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primaryText,
    marginTop: 12,
    marginBottom: 6,
  },
  errorText: {
    fontSize: 16,
    color: colors.secondaryText,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: colors.primaryGreen,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: { color: colors.offWhite, fontWeight: '600', fontSize: 16 },
});

export default ArticleDetailScreen;
