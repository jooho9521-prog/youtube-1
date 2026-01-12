
export interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  channelId: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  subscriberCount?: number;
  viralScore?: number; // Views / Subscriber Ratio
}

export interface AnalysisResult {
  sentiment: string;
  positivePoints: string[];
  negativePoints: string[];
  userNeeds: string[];
  contentIdeas: string[];
  recommendedKeywords: string[]; // 새로 추가된 필드: 5개 추천 키워드
}

export interface CommentData {
  author: string;
  text: string;
  likeCount: number;
}
