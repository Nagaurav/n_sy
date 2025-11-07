# Blog Feature

This feature provides a comprehensive blog system for the Samyā Yog app, allowing users to discover and read wellness-related articles.

## Features

- **Blog List Screen**: Displays all published blog posts with search and filtering capabilities
- **Blog Detail Screen**: Shows the full content of a selected blog post
- **Search & Filtering**: Users can search blogs by title, content, or tags, and filter by category
- **Responsive Design**: Beautiful card-based layout that works on all screen sizes
- **Real Data Integration**: Uses the actual blog data structure from your API

## Components

### BlogCard
- Displays individual blog posts in a card format
- Shows featured image, title, excerpt, author, date, reading time, and tags
- Handles missing images gracefully with placeholders
- Color-coded category badges

### BlogScreen
- Main blog listing screen with search and filtering
- Collapsible filter panel for categories and tags
- Pull-to-refresh functionality
- Empty state handling

### BlogDetailScreen
- Full blog post display
- Share functionality
- Bookmark option (UI only for now)
- Responsive layout with proper typography

## Services

### BlogService
- Handles all blog-related API calls
- Currently uses mock data (can be easily replaced with real API calls)
- Provides methods for fetching, filtering, and searching blogs
- Includes view tracking functionality

## Navigation

- Added as a new tab in the bottom tab navigator
- Integrated with the main navigation stack
- Blog detail screen accessible from blog list

## Data Structure

The blog system uses the following data structure:

```typescript
interface Blog {
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
  featured_image: number | null;
  excerpt: string;
  reading_time: number | null;
  status: 'published' | 'draft';
  views: number;
  // ... other metadata fields
}
```

## Integration Points

- **HomeScreen**: Added blog section with "See All" button
- **Navigation**: Integrated into main app navigation
- **Theme**: Uses consistent colors and typography from the app theme
- **Common Components**: Leverages existing UI components (ScreenContainer, SearchBar, etc.)

## Future Enhancements

- **Real API Integration**: Replace mock data with actual API calls
- **Rich Text Rendering**: Better HTML content rendering
- **Offline Support**: Cache blogs for offline reading
- **User Preferences**: Save user reading preferences and bookmarks
- **Analytics**: Track reading patterns and engagement
- **Social Features**: Comments, likes, and sharing

## Usage

1. Navigate to the Blog tab in the bottom navigation
2. Use search to find specific topics
3. Apply filters by category or tags
4. Tap on any blog card to read the full article
5. Use the share button to share articles with others

## Styling

The blog feature follows the app's design system:
- Uses consistent color palette from `src/theme/colors.ts`
- Follows typography guidelines from `src/theme/typography.ts`
- Maintains consistent spacing and layout patterns
- Responsive design that works on all screen sizes
