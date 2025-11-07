// articleService.ts
import { API_CONFIG, makeApiRequest } from '../config/api';

// Load local articles dataset as fallback
const articlesData = require('../data/articles.json');

export interface Article {
  id: number;
  title: string;
  slug: string;
  meta_description: string | null;
  keywords: string[];
  content: string;
  author: string;
  publish_date: string | null;
  category: string;
  tags: string[];
  featured_image: string | number | null;
  excerpt: string;
  reading_time: number | null;
  status: string;
  views: number;
  canonical_url: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  og_url: string | null;
  schema_markup: any;
  updated_at: string;
}

export interface ArticleResponse {
  data: Article[];
  count: number;
  page: number;
  limit: number;
}

export interface ArticleFilters {
  status?: string;
  category?: string;
  author?: string;
  search?: string;
}

/**
 * Article Service
 * Handles all article-related operations
 */
class ArticleService {
  /**
   * Fetch all articles with optional filtering
   */
  async getArticles(filters: ArticleFilters = {}, page: number = 1, limit: number = 10): Promise<ArticleResponse> {
    try {
      const response = await makeApiRequest(
        API_CONFIG.ENDPOINTS.ARTICLE.LIST,
        'GET',
        undefined,
        {
          page,
          limit,
          status: filters.status,
          category: filters.category,
          author: filters.author,
          search: filters.search,
        }
      );

      if (response.success && response.data) {
        // Transform API response to match our interface
        const articles: Article[] = response.data.blogs || response.data.map((article: any) => ({
          id: article.id,
          title: article.title,
          slug: article.slug,
          meta_description: article.meta_description,
          keywords: article.keywords || [],
          content: article.content,
          author: article.author,
          publish_date: article.publish_date,
          category: article.category,
          tags: article.tags || [],
          featured_image: article.featured_image,
          excerpt: article.excerpt,
          reading_time: article.reading_time,
          status: article.status,
          views: article.views,
          canonical_url: article.canonical_url,
          og_title: article.og_title,
          og_description: article.og_description,
          og_image: article.og_image,
          og_url: article.og_url,
          schema_markup: article.schema_markup,
          updated_at: article.updated_at,
        }));

        // Apply client-side filtering for additional filters
        let filteredArticles = articles.filter(article => {
          if (filters.status && article.status !== filters.status) return false;
          if (filters.category && article.category !== filters.category) return false;
          if (filters.author && article.author !== filters.author) return false;
          
          if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            return (
              article.title.toLowerCase().includes(searchLower) ||
              (article.excerpt || '').toLowerCase().includes(searchLower) ||
              article.tags.some(tag => tag.toLowerCase().includes(searchLower))
            );
          }
          
          return true;
        });

        // Apply pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedArticles = filteredArticles.slice(startIndex, endIndex);

        return {
          data: paginatedArticles,
          count: filteredArticles.length,
          page,
          limit
        };
      } else {
        // Fallback to mock data if API fails
        return this.getArticlesMock(filters, page, limit);
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
      
      // Return mock data as fallback
      return this.getArticlesMock(filters, page, limit);
    }
  }

  /**
   * Fetch a single article by ID
   */
  async getArticleById(id: number): Promise<Article | null> {
    try {
      const response = await makeApiRequest(
        `${API_CONFIG.ENDPOINTS.ARTICLE.DETAIL.replace(':id', id.toString())}`,
        'GET'
      );

      if (response.success && response.data) {
        const article = response.data;
        return {
          id: article.id,
          title: article.title,
          slug: article.slug,
          meta_description: article.meta_description,
          keywords: article.keywords || [],
          content: article.content,
          author: article.author,
          publish_date: article.publish_date,
          category: article.category,
          tags: article.tags || [],
          featured_image: article.featured_image,
          excerpt: article.excerpt,
          reading_time: article.reading_time,
          status: article.status,
          views: article.views,
          canonical_url: article.canonical_url,
          og_title: article.og_title,
          og_description: article.og_description,
          og_image: article.og_image,
          og_url: article.og_url,
          schema_markup: article.schema_markup,
          updated_at: article.updated_at,
        };
      } else {
        // Fallback to mock data if API fails
        return this.getArticleByIdMock(id);
      }
    } catch (error) {
      console.error('Error fetching article by ID:', error);
      
      // Return mock data as fallback
      return this.getArticleByIdMock(id);
    }
  }

  /**
   * Fetch articles by category
   */
  async getArticlesByCategory(category: string): Promise<Article[]> {
    try {
      const articlesResponse = await this.getArticles({ category });
      return articlesResponse.data;
    } catch (error) {
      console.error('Error fetching articles by category:', error);
      throw new Error('Failed to fetch articles by category');
    }
  }

  /**
   * Search articles
   */
  async searchArticles(query: string): Promise<Article[]> {
    try {
      const articlesResponse = await this.getArticles({ search: query });
      return articlesResponse.data;
    } catch (error) {
      console.error('Error searching articles:', error);
      throw new Error('Failed to search articles');
    }
  }

  /**
   * Get all available categories
   */
  async getCategories(): Promise<string[]> {
    try {
      const articlesResponse = await this.getArticles();
      const categories = [...new Set(articlesResponse.data.map(article => article.category))];
      return categories.filter(category => category && category.trim() !== '');
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw new Error('Failed to fetch categories');
    }
  }

  /**
   * Get all available tags
   */
  async getTags(): Promise<string[]> {
    try {
      const articlesResponse = await this.getArticles();
      const allTags = articlesResponse.data.flatMap(article => article.tags);
      const uniqueTags = [...new Set(allTags)];
      return uniqueTags.filter(tag => tag && tag.trim() !== '');
    } catch (error) {
      console.error('Error fetching tags:', error);
      throw new Error('Failed to fetch tags');
    }
  }

  /**
   * Increment article views (for analytics)
   */
  async incrementViews(articleId: number): Promise<void> {
    try {
      // In a real app, this would update the database
      console.log(`Incrementing views for article ${articleId}`);
    } catch (error) {
      console.error('Error incrementing article views:', error);
    }
  }

  /**
   * Mock implementation as fallback
   */
  private async getArticlesMock(filters: ArticleFilters = {}, page: number = 1, limit: number = 10): Promise<ArticleResponse> {
    // Use the provided real data as fallback
    const mockArticles: Article[] = [
      {
        id: 6,
        title: "Mastering JavaScript: Tips and Best Practices",
        slug: "mastering-best-practices",
        meta_description: "Discover advanced JavaScript techniques...",
        keywords: ["JavaScript", "Best Practices", "Programming"],
        content: "<p>JavaScript is a powerful language...</p>",
        author: "Jane Doe",
        publish_date: "2024-03-16T12:00:00.000Z",
        category: "Programming",
        tags: ["JavaScript", "Best Practices"],
        featured_image: null,
        excerpt: "Improve your JavaScript coding skills...",
        reading_time: 7,
        status: "published",
        views: 320,
        canonical_url: "https://example.com/blog/mastering-javascript-tips-best-practices",
        og_title: "Mastering JavaScript: Tips and Best Practices",
        og_description: "Learn essential JavaScript best practices...",
        og_image: "https://example.com/images/javascript-tips.jpg",
        og_url: "https://example.com/blog/mastering-javascript-tips-best-practices",
        schema_markup: {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "headline": "Mastering JavaScript: Tips and Best Practices",
          "author": {
            "@type": "Person",
            "name": "Jane Doe"
          }
        },
        updated_at: "2025-03-17T02:16:32.000Z"
      },
      {
        id: 8,
        title: "Understanding JavaScript Closures with Love Babber",
        slug: "beginners-guide-to-react",
        meta_description: null,
        keywords: ["React", "JavaScript", "Frontendnnnnnnnnncccccccc"],
        content: "<p>React is a JavaScript library for building user interfaces...</p>",
        author: "Jane Smith",
        publish_date: null,
        category: "React",
        tags: ["React", "JavaScript"],
        featured_image: null,
        excerpt: "A complete guide to getting started with React.",
        reading_time: null,
        status: "published",
        views: 200,
        canonical_url: null,
        og_title: null,
        og_description: null,
        og_image: null,
        og_url: null,
        schema_markup: {},
        updated_at: "2025-03-17T02:29:17.000Z"
      },
      {
        id: 27,
        title: "Understanding JavaScript Closures with Love Babber",
        slug: "beginreact",
        meta_description: "A complete guide for beginners to learn React.",
        keywords: ["React", "JavaScript", "Frontendnnnnnnnnncccccccc"],
        content: "<p>React is a JavaScript library for building user interfaces...</p>",
        author: "Jane Smith",
        publish_date: null,
        category: "React",
        tags: ["React", "JavaScript"],
        featured_image: 15,
        excerpt: "A complete guide to getting started with React.",
        reading_time: 8,
        status: "published",
        views: 200,
        canonical_url: "https://example.com/beginners-guide-to-react",
        og_title: "Beginner's Guide to React",
        og_description: "A complete guide for beginners to learn React.",
        og_image: "https://example.com/react-guide.jpg",
        og_url: "https://example.com/beginners-guide-to-react",
        schema_markup: {},
        updated_at: "2025-03-17T03:52:46.000Z"
      }
    ];
    
    // Apply filters
    let filteredArticles = mockArticles.filter(article => {
      if (filters.status && article.status !== filters.status) return false;
      if (filters.category && article.category !== filters.category) return false;
      if (filters.author && article.author !== filters.author) return false;
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return (
          article.title.toLowerCase().includes(searchLower) ||
          (article.excerpt || '').toLowerCase().includes(searchLower) ||
          article.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }
      
      return true;
    });

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedArticles = filteredArticles.slice(startIndex, endIndex);

    return {
      data: paginatedArticles,
      count: filteredArticles.length,
      page,
      limit
    };
  }

  /**
   * Mock implementation for single article as fallback
   */
  private async getArticleByIdMock(id: number): Promise<Article | null> {
    const mockArticles = [
      {
        id: 6,
        title: "Mastering JavaScript: Tips and Best Practices",
        slug: "mastering-best-practices",
        meta_description: "Discover advanced JavaScript techniques...",
        keywords: ["JavaScript", "Best Practices", "Programming"],
        content: "<p>JavaScript is a powerful language...</p>",
        author: "Jane Doe",
        publish_date: "2024-03-16T12:00:00.000Z",
        category: "Programming",
        tags: ["JavaScript", "Best Practices"],
        featured_image: null,
        excerpt: "Improve your JavaScript coding skills...",
        reading_time: 7,
        status: "published",
        views: 320,
        canonical_url: "https://example.com/blog/mastering-javascript-tips-best-practices",
        og_title: "Mastering JavaScript: Tips and Best Practices",
        og_description: "Learn essential JavaScript best practices...",
        og_image: "https://example.com/images/javascript-tips.jpg",
        og_url: "https://example.com/blog/mastering-javascript-tips-best-practices",
        schema_markup: {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "headline": "Mastering JavaScript: Tips and Best Practices",
          "author": {
            "@type": "Person",
            "name": "Jane Doe"
          }
        },
        updated_at: "2025-03-17T02:16:32.000Z"
      }
    ];

    return mockArticles.find(article => article.id === id) || null;
  }
}

export default new ArticleService();
