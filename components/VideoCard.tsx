
import React from 'react';
import { YouTubeVideo } from '../types';
import { Play, TrendingUp, Users, MessageSquare } from 'lucide-react';

interface VideoCardProps {
  video: YouTubeVideo;
  onAnalyze: (video: YouTubeVideo) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onAnalyze }) => {
  // Determine color based on viral score (ratio of views to subscribers)
  const getViralBadgeColor = (score: number) => {
    if (score >= 2) return 'bg-red-100 text-red-700 border-red-200';
    if (score >= 1) return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-blue-100 text-blue-700 border-blue-200';
  };

  const formattedViews = new Intl.NumberFormat('ko-KR', { notation: 'compact' }).format(video.viewCount);
  const formattedSubs = new Intl.NumberFormat('ko-KR', { notation: 'compact' }).format(video.subscriberCount || 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative group cursor-pointer" onClick={() => onAnalyze(video)}>
        <img src={video.thumbnail} alt={video.title} className="w-full aspect-video object-cover" />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Play className="text-white w-12 h-12 fill-white" />
        </div>
        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 text-white text-xs font-medium rounded">
          {video.viralScore?.toFixed(2)}x Viral
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-bold text-slate-800 line-clamp-2 h-12 mb-2 leading-tight" dangerouslySetInnerHTML={{ __html: video.title }} />
        <p className="text-sm text-slate-500 mb-4">{video.channelTitle}</p>
        
        <div className="grid grid-cols-2 gap-2 text-xs font-medium">
          <div className="flex items-center gap-1.5 text-slate-600">
            <TrendingUp size={14} className="text-slate-400" />
            <span>조회수 {formattedViews}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600">
            <Users size={14} className="text-slate-400" />
            <span>구독자 {formattedSubs}</span>
          </div>
        </div>

        <button 
          onClick={() => onAnalyze(video)}
          className="w-full mt-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-semibold hover:bg-indigo-600 hover:text-white transition-colors flex items-center justify-center gap-2"
        >
          <MessageSquare size={16} />
          AI 분석하기
        </button>
      </div>
    </div>
  );
};

export default VideoCard;
