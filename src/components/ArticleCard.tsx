// ArticleCard.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { Article } from '../services/articleService';
import { colors } from '../theme/colors';

interface ArticleCardProps {
  article: Article;
  onPress: () => void;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, onPress }) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No date';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getCategoryColor = (category: string) => {
    const categoryColors = {
      'Programming': '#FF6B6B',
      'JavaScript': '#4ECDC4',
      'React': '#45B7D1',
      'Wellness': '#96CEB4',
      'Health': '#FFEAA7',
      'Mental Health': '#DDA0DD',
      'Lifestyle': '#98D8C8',
      'Nutrition': '#F7DC6F',
      'Digital Wellness': '#BB8FCE',
      'default': '#95A5A6',
    };
    return categoryColors[category as keyof typeof categoryColors] || categoryColors.default;
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {/* Featured Image */}
      {article.featured_image && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: article.featured_image }}
            style={styles.image}
            resizeMode="cover"
          />
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        {/* Category and Date */}
        <View style={styles.metaRow}>
          {article.category && article.category.trim() !== '' && (
            <View style={[styles.category, { backgroundColor: getCategoryColor(article.category) }]}>
              <Text style={styles.categoryText}>{article.category}</Text>
            </View>
          )}
          <Text style={styles.date}>{formatDate(article.publish_date)}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {article.title}
        </Text>

        {/* Excerpt */}
        {article.excerpt && article.excerpt.trim() !== '' && (
          <Text style={styles.excerpt} numberOfLines={3}>
            {article.excerpt}
          </Text>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.authorRow}>
            <MaterialCommunityIcons name="account" size={16} color={colors.secondaryText} />
            <Text style={styles.author}>{article.author}</Text>
          </View>

          <View style={styles.statsRow}>
            {article.reading_time && (
              <View style={styles.stat}>
                <MaterialCommunityIcons name="clock-outline" size={14} color={colors.secondaryText} />
                <Text style={styles.statText}>{article.reading_time} min</Text>
              </View>
            )}
            
            <View style={styles.stat}>
              <MaterialCommunityIcons name="eye" size={14} color={colors.secondaryText} />
              <Text style={styles.statText}>{article.views}</Text>
            </View>
          </View>
        </View>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && article.tags.some(tag => tag && tag.trim() !== '') && (
          <View style={styles.tagsContainer}>
            {article.tags.filter(tag => tag && tag.trim() !== '').slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
            {article.tags.filter(tag => tag && tag.trim() !== '').length > 3 && (
              <Text style={styles.moreTags}>+{article.tags.filter(tag => tag && tag.trim() !== '').length - 3} more</Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: 16,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  category: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  date: {
    fontSize: 12,
    color: colors.secondaryText,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: 8,
    lineHeight: 24,
  },
  excerpt: {
    fontSize: 14,
    color: colors.secondaryText,
    lineHeight: 20,
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  author: {
    fontSize: 14,
    color: colors.secondaryText,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: colors.secondaryText,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: colors.lightGreen,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: colors.primaryGreen,
    fontWeight: '500',
  },
  moreTags: {
    fontSize: 12,
    color: colors.secondaryText,
    fontStyle: 'italic',
    alignSelf: 'center',
  },
});

export default ArticleCard;
