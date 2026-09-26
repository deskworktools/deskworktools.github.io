/**
 * Core Data Models & Repository Interfaces
 *
 * NOTE: Designed to decouple the Admin UI and API layer from underlying physical storage.
 * In Phase 1, the Storage Driver writes to atomic JSON files for development/initial testing.
 * The repository abstraction allows seamless future migration to durable Cloud databases
 * (e.g. PostgreSQL, SQLite, or Cloud Datastore) without changing any Admin UI or API code.
 */

export interface BlogPostMeta {
  slug: string;
  revision?: number; // Monotonically increasing revision for optimistic concurrency control (HTTP 409)
  title: string;
  excerpt: string;
  category: string;
  date: string;
  author: string;
  image: string;
  url?: string;
  readTime?: string;
  status: 'published' | 'draft' | 'scheduled';
  publishAt?: string;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  content?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MediaItem {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  inUse: boolean;
  usedInPosts: string[];
}

export interface CustomBannerConfig {
  imageUrl: string;
  destinationUrl: string;
  altText: string;
  title?: string;
  width?: number;
  height?: number;
}

export interface AdPlacement {
  id: string;
  name: string;
  location: 'header' | 'homepage' | 'content' | 'blog' | 'tools' | 'sidebar' | 'footer' | 'mobile';
  provider: 'adsense' | 'adsterra' | 'custom';
  enabled: boolean;
  device: 'all' | 'desktop' | 'mobile';
  adUnitId?: string;
  format?: 'auto' | 'horizontal' | 'rectangle' | 'banner';
  customBanner?: CustomBannerConfig;
  notes?: string;
  updatedAt?: string;
}

export interface AdSenseProviderConfig {
  enabled: boolean;
  publisherId: string;
  autoAdsEnabled: boolean;
  notes?: string;
}

export interface AdsterraProviderConfig {
  enabled: boolean;
  placementKey: string;
  notes?: string;
}

export interface CustomProviderConfig {
  enabled: boolean;
  notes?: string;
}

export interface AdProvidersConfig {
  adsense: AdSenseProviderConfig;
  adsterra: AdsterraProviderConfig;
  custom: CustomProviderConfig;
}

export interface AdGlobalSettings {
  globalEnabled: boolean;
  updatedAt: string;
}

export interface AdminAdsConfigResponse {
  global: AdGlobalSettings;
  providers: AdProvidersConfig;
  slots: AdPlacement[];
  storageNotice: string;
}

export interface PublicActiveAdsResponse {
  globalEnabled: boolean;
  providers: {
    adsense?: {
      publisherId: string;
      autoAdsEnabled: boolean;
    };
    adsterra?: {
      placementKey: string;
    };
  };
  placements: Array<{
    id: string;
    location: string;
    provider: 'adsense' | 'adsterra' | 'custom';
    device: 'all' | 'desktop' | 'mobile';
    adUnitId?: string;
    format?: string;
    customBanner?: CustomBannerConfig;
  }>;
}

export interface SiteConfig {
  siteName: string;
  siteUrl: string;
  defaultTitle: string;
  defaultDescription: string;
  robotsEnabled: boolean;
  sitemapEnabled: boolean;
  updatedAt: string;
}

export interface ActivityLogEntry {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  ipHash?: string;
}

export interface DashboardOverview {
  siteName: string;
  environment: string;
  serverTime: string;
  storageDriver: string;
  publishedPostsCount: number;
  draftPostsCount: number;
  adPlacementsCount: number;
  activeAdPlacementsCount: number;
  analyticsStatus: 'not_connected' | 'collecting';
  analyticsSummary?: {
    todayPageViews: number;
    todayVisitors: number;
    todayToolUses: number;
    todayExports: number;
  };
  message: string;
}

export type AnalyticsEventType =
  | 'page_view'
  | 'tool_opened'
  | 'tool_used'
  | 'blog_view'
  | 'export_completed';

export interface AnalyticsIngestPayload {
  type: AnalyticsEventType;
  path?: string;
  tool?: string;
  slug?: string;
  template?: string;
}

export interface DailyAnalyticsBucket {
  date: string; // YYYY-MM-DD (UTC)
  pageViews: number;
  uniqueVisitors: number;
  uniqueHashes: string[]; // Ephemeral daily HMAC hashes (truncated, non-reversible, salt rotates daily)
  toolOpens: Record<string, number>;
  toolUses: Record<string, number>;
  blogViews: Record<string, number>;
  exports: Record<string, number>;
}

export interface RecentAnalyticsEvent {
  id: string;
  eventType: AnalyticsEventType;
  target: string;
  timestamp: string;
}

export interface AnalyticsStorageDocument {
  dailyStats: Record<string, DailyAnalyticsBucket>;
  recentEvents: RecentAnalyticsEvent[];
  totals: {
    pageViews: number;
    uniqueVisitors: number;
    toolOpens: number;
    toolUses: number;
    blogViews: number;
    exports: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsReport {
  storageType: string;
  isDurable: boolean;
  storageNotice: string;
  rangeDays: number;
  dateRange: {
    start: string;
    end: string;
  };
  totals: {
    pageViews: number;
    uniqueVisitors: number;
    toolOpens: number;
    toolUses: number;
    blogViews: number;
    exports: number;
  };
  topTools: Array<{
    name: string;
    opens: number;
    uses: number;
    total: number;
  }>;
  topPages: Array<{
    path: string;
    views: number;
  }>;
  topTemplates: Array<{
    name: string;
    exports: number;
  }>;
  topArticles: Array<{
    slug: string;
    views: number;
  }>;
  dailyTrends: Array<{
    date: string;
    pageViews: number;
    uniqueVisitors: number;
    toolUses: number;
    exports: number;
    blogViews: number;
  }>;
  recentEvents: RecentAnalyticsEvent[];
}

