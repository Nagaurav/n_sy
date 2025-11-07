// ArticleDetailScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { ScreenContainer } from '../components/common/ScreenContainer';
import articleService, { Article } from '../services/articleService';
import { colors } from '../theme/colors';

type RouteParams = {
  articleId: number;
};

const ArticleDetailScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { articleId } = route.params as RouteParams;
  
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const articleData = await articleService.getArticleById(articleId);
      
      if (articleData) {
        setArticle(articleData);
        // Increment view count
        await articleService.incrementViews(articleId);
      } else {
        setError('Article not found');
      }
    } catch (err) {
      console.error('Error fetching article:', err);
      setError('Failed to load article. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchArticle();
    }, [articleId])
  );

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleShare = () => {
    // Implement share functionality
    Alert.alert('Share', 'Share functionality coming soon!');
  };

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryGreen} />
          <Text style={styles.loadingText}>Loading article...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (error || !article) {
    return (
      <ScreenContainer>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons 
            name="alert-circle-outline" 
            size={64} 
            color={colors.error} 
          />
          <Text style={styles.errorTitle}>Oops!</Text>
          <Text style={styles.errorText}>
            {error || 'Article not found'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchArticle}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <MaterialCommunityIcons name="share-variant" size={24} color={colors.primaryText} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Article Header */}
        <View style={styles.articleHeader}>
          {article.category && article.category.trim() !== '' && (
            <Text style={styles.category}>{article.category}</Text>
          )}
          <Text style={styles.title}>{article.title}</Text>
          {article.excerpt && article.excerpt.trim() !== '' && (
            <Text style={styles.excerpt}>{article.excerpt}</Text>
          )}
          
          <View style={styles.metaInfo}>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="account" size={16} color={colors.secondaryText} />
              <Text style={styles.metaText}>{article.author}</Text>
            </View>
            
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
            
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="eye" size={16} color={colors.secondaryText} />
              <Text style={styles.metaText}>{article.views} views</Text>
            </View>
          </View>
        </View>

        {/* Article Content */}
        <View style={styles.contentContainer}>
          <Text style={styles.content}>
            {article.content.replace(/<[^>]*>/g, '')}
          </Text>
        </View>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && article.tags.some(tag => tag && tag.trim() !== '') && (
          <View style={styles.tagsContainer}>
            <Text style={styles.tagsTitle}>Tags:</Text>
            <View style={styles.tagsList}>
              {article.tags.filter(tag => tag && tag.trim() !== '').map((tag, index) => (
                <View key={index} style={styles.tag}>
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
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.background,
  },
  backButton: {
    padding: 8,
  },
  shareButton: {
    padding: 8,
  },
  articleHeader: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  category: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryGreen,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: 16,
    lineHeight: 36,
  },
  excerpt: {
    fontSize: 16,
    color: colors.secondaryText,
    lineHeight: 24,
    marginBottom: 20,
  },
  metaInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: colors.secondaryText,
  },
  contentContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  content: {
    lineHeight: 24,
  },
  tagsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  tagsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: 12,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: colors.lightSage,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 14,
    color: colors.primaryGreen,
    fontWeight: '500',
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
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primaryText,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: colors.secondaryText,
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
});

export default ArticleDetailScreen;
