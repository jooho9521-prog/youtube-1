
import { YouTubeVideo, CommentData } from '../types';

export type VideoType = 'all' | 'short' | 'any'; // any is used for longform in combined logic

export async function searchVideos(
  keyword: string, 
  apiKey: string, 
  duration: 'any' | 'short' | 'long' = 'any'
): Promise<YouTubeVideo[]> {
  if (!apiKey) throw new Error('YouTube API Key is missing');

  // videoDuration: 'short' (under 4m), 'medium' (4m-20m), 'long' (over 20m)
  const durationParam = duration === 'short' ? '&videoDuration=short' : (duration === 'long' ? '&videoDuration=medium' : '');
  const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${encodeURIComponent(keyword)}&type=video${durationParam}&key=${apiKey}`;
  
  const searchResponse = await fetch(searchUrl);
  const searchData = await searchResponse.json();
  
  if (searchData.error) {
    throw new Error(searchData.error.message || 'YouTube Search API Error');
  }
  
  if (!searchData.items || searchData.items.length === 0) return [];

  const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');
  const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${apiKey}`;
  
  const statsResponse = await fetch(statsUrl);
  const statsData = await statsResponse.json();

  const channelIds = Array.from(new Set(searchData.items.map((item: any) => item.snippet.channelId))).join(',');
  const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelIds}&key=${apiKey}`;
  
  const channelResponse = await fetch(channelUrl);
  const channelData = await channelResponse.json();

  const channelSubMap = new Map();
  if (channelData.items) {
    channelData.items.forEach((item: any) => {
      channelSubMap.set(item.id, parseInt(item.statistics.subscriberCount) || 0);
    });
  }

  return searchData.items.map((item: any) => {
    const videoId = item.id.videoId;
    const stats = statsData.items?.find((s: any) => s.id === videoId)?.statistics;
    const views = parseInt(stats?.viewCount) || 0;
    const subs = channelSubMap.get(item.snippet.channelId) || 0;
    
    return {
      id: videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.high.url,
      channelTitle: item.snippet.channelTitle,
      channelId: item.snippet.channelId,
      publishedAt: item.snippet.publishedAt,
      viewCount: views,
      likeCount: parseInt(stats?.likeCount) || 0,
      commentCount: parseInt(stats?.commentCount) || 0,
      subscriberCount: subs,
      viralScore: subs > 0 ? (views / subs) : (views > 0 ? 1 : 0),
    };
  });
}

export async function fetchComments(videoId: string, apiKey: string): Promise<CommentData[]> {
  if (!apiKey) throw new Error('YouTube API Key is missing');
  
  const url = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=50&order=relevance&key=${apiKey}`;
  
  const response = await fetch(url);
  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || 'YouTube Comments API Error');
  }

  if (!data.items) return [];

  return data.items.map((item: any) => ({
    author: item.snippet.topLevelComment.snippet.authorDisplayName,
    text: item.snippet.topLevelComment.snippet.textDisplay,
    likeCount: item.snippet.topLevelComment.snippet.likeCount,
  }));
}
