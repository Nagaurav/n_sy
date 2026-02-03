import React, { useState, useEffect, useCallback } from 'react';
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
  RefreshControl,
  Animated,
  Dimensions,
  TextInput,
} from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';
import { theme } from '../theme';

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
  const { theme: themeHook } = useTheme();
  const appTheme = themeHook || theme;
  
  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(30)).current;
  
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  useEffect(() => {
    fetchArticles();
  }, []);

  // Start entrance animation when data loads
  useEffect(() => {
    if (!isLoading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isLoading, fadeAnim, slideAnim]);

  // Filter articles based on search and category
  useEffect(() => {
    let filtered = articles;
    
    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(article => 
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.author.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(article => 
        article.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }
    
    setFilteredArticles(filtered);
  }, [articles, searchQuery, selectedCategory]);

  const fetchArticles = async (isRefresh: boolean = false) => {
    try {
      if (!isRefresh) {
        setIsLoading(true);
      }
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
            og_image: blog.og_image,
          }));

          setArticles(processedArticles);
          setIsLoading(false);
          setIsRefreshing(false);
        } catch (innerError) {
          console.error('Error processing articles:', innerError);
          setError('Failed to load articles');
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }, 500);
    } catch (err) {
      console.error('Error fetching articles:', err);
      setError('Failed to load articles. Please try again.');
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchArticles(true);
  }, []);

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

  // Get unique categories from articles
  const categories = ['all', ...Array.from(new Set(articles.map(article => article.category.toLowerCase())))];

  const clearSearch = () => {
    setSearchQuery('');
  };

  const handleArticlePress = (article: Article) => {
    // TODO: Navigate to article detail screen
    console.log('Article pressed:', article.title);
  };

  // Reusable Article Card Component
  const renderArticleCard = ({ item, index }: { item: Article; index: number }) => {
    const imageUrl = item.og_image || 'https://placehold.co/400x200/1E88E5/FFFFFF/png?text=Wellness+Article';
    
    return (
      <Animated.View
        style={[
          styles.articleCardWrapper,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.articleCard}
          onPress={() => handleArticlePress(item)}
          activeOpacity={0.7}
        >
          {/* Featured Image */}
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: imageUrl }} 
              style={styles.articleImage}
              resizeMode="cover"
            />
            <View style={styles.imageOverlay} />
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{item.category.toUpperCase()}</Text>
            </View>
            {item.reading_time && (
              <View style={styles.readingTimeBadge}>
                <Ionicons name="time-outline" size={12} color="#FFFFFF" />
                <Text style={styles.readingTimeBadgeText}>{item.reading_time} min</Text>
              </View>
            )}
          </View>
          
          {/* Content View */}
          <View style={styles.articleContent}>
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
              <View style={styles.authorSection}>
                <View style={styles.authorAvatar}>
                  <Ionicons name="person-circle" size={20} color={appTheme.colors.primary} />
                </View>
                <View style={styles.authorInfo}>
                  <Text style={styles.authorText}>{item.author}</Text>
                  <Text style={styles.dateText}>{formatDate(item.publish_date)}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.readMoreButton}>
                <Ionicons name="arrow-forward" size={16} color={appTheme.colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading articles...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={appTheme.colors.primary} barStyle="light-content" />
      
      {/* Modern Header with Gradient */}
      <Animated.View
        style={[
          styles.headerWrapper,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={[appTheme.colors.primary, appTheme.colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <StatusBar backgroundColor={appTheme.colors.primary} barStyle="light-content" />
          
          <View style={styles.headerContent}>
            <TouchableOpacity 
              onPress={openDrawer}
              style={styles.menuButton}
              activeOpacity={0.7}
            >
              <Ionicons name="menu" size={24} color={appTheme.colors.background.surface} />
            </TouchableOpacity>
            
            <View style={styles.titleContainer}>
              <Text style={styles.headerTitle}>Wellness Articles</Text>
            </View>
            
            <View style={styles.placeholder} />
          </View>
          
          {/* Decorative elements */}
          <View style={styles.topCircle} />
          <View style={styles.bottomWave} />
        </LinearGradient>
      </Animated.View>

      {/* Search and Filter Section */}
      <Animated.View style={[styles.searchSection, { opacity: fadeAnim }]}>
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={appTheme.colors.text.secondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search articles..."
              placeholderTextColor={appTheme.colors.text.secondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                <Ionicons name="close-circle" size={18} color={appTheme.colors.text.secondary} />
              </TouchableOpacity>
            )}
          </View>
          
          {/* Category Filter Dropdown */}
          <TouchableOpacity 
            style={styles.categoryDropdownButton}
            onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
            activeOpacity={0.7}
          >
            <Ionicons name="filter" size={16} color={appTheme.colors.text.secondary} />
            <Text style={styles.categoryDropdownText}>
              {selectedCategory === 'all' ? 'All Categories' : selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
            </Text>
            <Ionicons 
              name={showCategoryDropdown ? "chevron-up" : "chevron-down"} 
              size={14} 
              color={appTheme.colors.text.secondary} 
            />
          </TouchableOpacity>
          
          {showCategoryDropdown && (
            <View style={styles.categoryDropdownMenu}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryDropdownItem,
                    selectedCategory === category && styles.categoryDropdownItemActive
                  ]}
                  onPress={() => {
                    setSelectedCategory(category);
                    setShowCategoryDropdown(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.categoryDropdownItemText,
                    selectedCategory === category && styles.categoryDropdownItemTextActive
                  ]}>
                    {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </Animated.View>

      {/* Content Area with FlatList */}
      {error ? (
        <View style={styles.errorContainer}>
          <View style={styles.errorIconContainer}>
            <Ionicons name="alert-circle" size={48} color={appTheme.colors.feedback.error} />
          </View>
          <Text style={styles.errorTitle}>Oops!</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.retryButton}>
            <Ionicons name="refresh" size={20} color={appTheme.colors.background.surface} />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Animated.FlatList
          data={filteredArticles}
          renderItem={renderArticleCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={filteredArticles.length === 0 ? styles.emptyListContainer : styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[appTheme.colors.primary]}
              tintColor={appTheme.colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="document-text-outline" size={64} color={appTheme.colors.text.secondary} />
              </View>
              <Text style={styles.emptyTitle}>
                {searchQuery || selectedCategory !== 'all' ? 'No Articles Found' : 'No Articles Yet'}
              </Text>
              <Text style={styles.emptySubtext}>
                {searchQuery || selectedCategory !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Wellness articles will appear here once published.'
                }
              </Text>
              {(searchQuery || selectedCategory !== 'all') && (
                <TouchableOpacity 
                  style={styles.clearFiltersButton}
                  onPress={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                >
                  <Ionicons name="refresh" size={16} color={appTheme.colors.background.surface} />
                  <Text style={styles.clearFiltersText}>Clear Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  
  // Header Styles
  headerWrapper: {
    position: 'relative',
    overflow: 'hidden',
  },
  header: {
    paddingTop: 40,
    paddingBottom: theme.spacing.l,
    paddingHorizontal: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: 44,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  // Decorative elements
  topCircle: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    top: -60,
    left: -40,
  },
  bottomWave: {
    position: 'absolute',
    bottom: -30,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
  },
  
  // Search Section
  searchSection: {
    backgroundColor: theme.colors.background.surface,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background.secondary,
  },
  searchContainer: {
    position: 'relative',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.l,
    paddingHorizontal: theme.spacing.m,
    marginBottom: theme.spacing.s,
    ...theme.shadows.card,
  },
  searchIcon: {
    marginRight: theme.spacing.s,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text.primary,
    paddingVertical: theme.spacing.s,
  },
  clearButton: {
    padding: theme.spacing.xs,
  },
  
  // Category Dropdown
  categoryDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.m,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    gap: theme.spacing.xs,
    ...theme.shadows.card,
  },
  categoryDropdownText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  categoryDropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.m,
    marginTop: theme.spacing.xs,
    ...theme.shadows.float,
    zIndex: 1000,
  },
  categoryDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background.secondary,
  },
  categoryDropdownItemActive: {
    backgroundColor: theme.colors.primary + '10',
  },
  categoryDropdownItemText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text.primary,
  },
  categoryDropdownItemTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  
  // List Content
  listContent: {
    padding: theme.spacing.m,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  
  // Article Card Styles
  articleCardWrapper: {
    marginBottom: theme.spacing.l,
  },
  articleCard: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.l,
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  imageContainer: {
    position: 'relative',
    height: 200,
  },
  articleImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
  },
  categoryBadge: {
    position: 'absolute',
    top: theme.spacing.m,
    left: theme.spacing.m,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.s,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.xl,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  readingTimeBadge: {
    position: 'absolute',
    top: theme.spacing.m,
    right: theme.spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: theme.spacing.s,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.xl,
    gap: 4,
  },
  readingTimeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  articleContent: {
    padding: theme.spacing.m,
  },
  articleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.s,
    lineHeight: 24,
  },
  articleExcerpt: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: theme.spacing.m,
  },
  articleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  authorAvatar: {
    marginRight: theme.spacing.s,
  },
  authorInfo: {
    flex: 1,
  },
  authorText: {
    fontSize: 12,
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
  readMoreButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Loading States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.m,
    fontSize: 16,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  
  // Error States
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  errorIconContainer: {
    marginBottom: theme.spacing.m,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.s,
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.l,
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    gap: theme.spacing.s,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.background.surface,
  },
  
  // Empty States
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyIconContainer: {
    marginBottom: theme.spacing.m,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.s,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.l,
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    gap: theme.spacing.s,
  },
  clearFiltersText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.background.surface,
  },
});

export default ArticlesScreen;
