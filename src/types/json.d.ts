declare module '*.json' {
  const value: any;
  export default value;
}

declare module '../data/blogData.json' {
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

  interface BlogData {
    blogs: Blog[];
  }

  const data: BlogData;
  export default data;
}
