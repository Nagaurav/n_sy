import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

// TypeScript Interface for Article
interface Article {
  id: number;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  publish_date: string | null;
  reading_time: number | null;
  og_image: string | null;
}

// Import blog data from separate JSON file
const mockApiResponse: { blogs: any[] } = require('../data/blogData.json');

const ArticlesScreen = () => {
  const navigation = useNavigation();
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Simulate network request with 500ms delay
      setTimeout(() => {
        try {
          // Filter only published articles
          const publishedBlogs = mockApiResponse.blogs.filter(
            (blog: any) => blog.status === 'published'
          );

          // Map to Article interface
          const processedArticles: Article[] = publishedBlogs.map((blog: any) => ({
            id: blog.id,
            title: blog.title,
            excerpt: blog.excerpt,
            category: blog.category,
            author: blog.author,
            publish_date: blog.publish_date,
            reading_time: blog.reading_time,
            og_image: blog.og_image, // Prioritize og_image for featured image
          }));

          setArticles(processedArticles);
          setIsLoading(false);
        } catch (innerError) {
          console.error('Error processing articles:', innerError);
          setError('Failed to load articles');
          setIsLoading(false);
        }
      }, 500); // 500ms delay to simulate network request
    } catch (err) {
      console.error('Error fetching articles:', err);
      setError('Failed to load articles. Please try again.');
      setIsLoading(false);
    }
  };

  const openDrawer = () => {
    console.log('🔵 Opening drawer from Articles...');
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleArticlePress = (article: Article) => {
    // TODO: Navigate to article detail screen
    console.log('Article pressed:', article.title);
  };

  // Reusable Article Card Component
  const renderArticleCard = ({ item }: { item: Article }) => {
    const imageUrl = item.og_image || 'https://placehold.co/400x200/1E88E5/FFFFFF/png?text=Wellness+Article';
    
    return (
      <TouchableOpacity
        style={styles.articleCard}
        onPress={() => handleArticlePress(item)}
        activeOpacity={0.7}
      >
        {/* Featured Image */}
        <Image 
          source={{ uri: imageUrl }} 
          style={styles.articleImage}
          resizeMode="cover"
        />
        
        {/* Content View */}
        <View style={styles.articleContent}>
          {/* Category */}
          <Text style={styles.categoryText}>{item.category.toUpperCase()}</Text>
          
          {/* Title */}
          <Text style={styles.articleTitle} numberOfLines={2}>
            {item.title}
          </Text>
          
          {/* Excerpt */}
          <Text style={styles.articleExcerpt} numberOfLines={3}>
            {item.excerpt}
          </Text>
          
          {/* Footer */}
          <View style={styles.articleFooter}>
            <View style={styles.footerLeft}>
              <Text style={styles.authorText}>{item.author}</Text>
              <Text style={styles.dateText}>{formatDate(item.publish_date)}</Text>
            </View>
            <View style={styles.footerRight}>
              <Text style={styles.readingTimeText}>
                {item.reading_time ? `${item.reading_time} min read` : 'N/A'}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#1E88E5" barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E88E5" />
          <Text style={styles.loadingText}>Loading articles...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#1E88E5" barStyle="light-content" />
      
      {/* Fixed Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={openDrawer}>
          <Ionicons name="menu" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wellness Articles</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content Area with FlatList */}
      <FlatList
        data={articles}
        renderItem={renderArticleCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>No articles found</Text>
            </View>
          )
        }
      />
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
  listContent: {
    padding: 16,
  },
  articleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  articleImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  articleContent: {
    padding: 16,
  },
  categoryText: {
    fontSize: 12,
    color: '#1E88E5',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  articleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  articleExcerpt: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  articleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  footerLeft: {
    flex: 1,
  },
  authorText: {
    fontSize: 12,
    color: '#1F2937',
    fontWeight: '500',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 11,
    color: '#6B7280',
  },
  footerRight: {
    marginLeft: 8,
  },
  readingTimeText: {
    fontSize: 12,
    color: '#1E88E5',
    fontWeight: '600',
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
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
});

export default ArticlesScreen;
