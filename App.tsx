
import React, { useState, useEffect } from 'react';
import { Search, Youtube, BarChart3, Settings, Loader2, Save, AlertCircle, CheckCircle2, Key, ChevronRight, Filter, Clock } from 'lucide-react';
import { YouTubeVideo, AnalysisResult } from './types';
import { searchVideos, fetchComments } from './services/youtubeService';
import { analyzeVideoContent } from './services/geminiService';
import VideoCard from './components/VideoCard';
import AnalysisPanel from './components/AnalysisPanel';

// Manual declaration of window.aistudio removed to avoid conflict with existing AIStudio type in the environment.

const App: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const [videoType, setVideoType] = useState<'any' | 'short' | 'long'>('any');
  const [minViralScore, setMinViralScore] = useState(0.5);
  
  const [allVideos, setAllVideos] = useState<YouTubeVideo[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<YouTubeVideo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [youtubeKey, setYoutubeKey] = useState<string>(localStorage.getItem('YT_API_KEY') || '');
  const [hasGeminiKey, setHasGeminiKey] = useState(false);
  
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const checkGeminiStatus = async () => {
    try {
      // @ts-ignore: aistudio is assumed to be globally available as per guidelines
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setHasGeminiKey(hasKey);
    } catch (e) {
      console.error("Failed to check Gemini key status");
    }
  };

  useEffect(() => {
    checkGeminiStatus();
  }, []);

  // Filter videos locally whenever minViralScore or allVideos changes
  useEffect(() => {
    const filtered = allVideos.filter(v => (v.viralScore || 0) >= minViralScore);
    setFilteredVideos(filtered);
  }, [minViralScore, allVideos]);

  const handleOpenGeminiKeySelector = async () => {
    // @ts-ignore: aistudio is assumed to be globally available as per guidelines
    await window.aistudio.openSelectKey();
    // Proceed assuming selection was successful to mitigate race condition between key selection and verification
    setHasGeminiKey(true);
  };

  const handleSaveYTKey = () => {
    localStorage.setItem('YT_API_KEY', youtubeKey);
    alert('YouTube API 키가 저장되었습니다.');
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    if (!youtubeKey) {
      alert('상단에서 YouTube API 키를 먼저 입력해주세요.');
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchVideos(keyword, youtubeKey, videoType);
      const sortedResults = results.sort((a, b) => (b.viralScore || 0) - (a.viralScore || 0));
      setAllVideos(sortedResults);
    } catch (error: any) {
      console.error('Search failed:', error);
      alert(`검색 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAnalyze = async (video: YouTubeVideo) => {
    if (!youtubeKey) {
      alert('YouTube API 키가 필요합니다.');
      return;
    }
    
    // @ts-ignore: aistudio is assumed to be globally available as per guidelines
    const hasGemini = await window.aistudio.hasSelectedApiKey();
    if (!hasGemini) {
      alert('분석을 위해 Gemini API 키 선택이 필요합니다.');
      return;
    }
    
    setSelectedVideo(video);
    setAnalysisLoading(true);
    setAnalysisResult(null);

    try {
      const comments = await fetchComments(video.id, youtubeKey);
      if (comments.length === 0) {
        alert('이 영상에는 분석할 수 있는 댓글이 없습니다.');
        setAnalysisLoading(false);
        return;
      }
      const result = await analyzeVideoContent(video.title, comments);
      setAnalysisResult(result);
    } catch (error: any) {
      console.error('Analysis failed:', error);
      // If error indicates key issues, reset the key state to prompt re-selection
      if (error.message?.includes("Requested entity was not found")) {
        alert("Gemini API 키가 유효하지 않습니다. 다시 선택해주세요.");
        setHasGeminiKey(false);
      } else {
        alert(`AI 분석 중 오류가 발생했습니다: ${error.message}`);
      }
    } finally {
      setAnalysisLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-red-600 p-1.5 rounded-lg">
              <Youtube className="text-white" size={24} />
            </div>
            <h1 className="text-xl font-bold text-slate-900 hidden sm:block">
              Insight Creator
            </h1>
          </div>

          <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-4 sm:mx-8 relative">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="콘텐츠 키워드로 트렌드 분석하기..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent rounded-full text-sm transition-all"
            />
            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
          </form>

          <div className="flex items-center gap-2">
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
              <Settings size={22} />
            </button>
          </div>
        </div>

        {/* API Key Input Bar */}
        <div className="bg-slate-900 text-white border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center gap-4 lg:gap-8">
            <div className="flex items-center gap-3 flex-1 min-w-[280px]">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">YouTube API Key</label>
              <div className="relative flex-1">
                <input
                  type="password"
                  value={youtubeKey}
                  onChange={(e) => setYoutubeKey(e.target.value)}
                  onBlur={handleSaveYTKey}
                  placeholder="유튜브 API 키 입력..."
                  className="w-full bg-slate-800 border border-slate-700 text-white text-xs px-3 py-1.5 rounded focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 flex-1 min-w-[280px]">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Gemini Connection</label>
              <button
                onClick={handleOpenGeminiKeySelector}
                className={`flex-1 flex items-center justify-between px-3 py-1.5 rounded text-xs font-medium transition-all border ${
                  hasGeminiKey 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' 
                  : 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  {hasGeminiKey ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                  <span>{hasGeminiKey ? 'Gemini 연결됨' : 'Gemini 키 선택하기'}</span>
                </div>
                <ChevronRight size={14} className="opacity-50" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <Clock size={16} className="text-slate-400" />
              <div className="flex bg-slate-100 p-1 rounded-lg">
                {[
                  { id: 'any', label: '전체' },
                  { id: 'short', label: '쇼츠' },
                  { id: 'long', label: '롱폼' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setVideoType(t.id as any)}
                    className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                      videoType === t.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4 flex-1 max-w-sm">
              <Filter size={16} className="text-slate-400" />
              <div className="flex-1 flex flex-col gap-1">
                <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                  <span>Viral Score 기준</span>
                  <span className="text-indigo-600">{minViralScore.toFixed(1)}x 이상</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.1"
                  value={minViralScore}
                  onChange={(e) => setMinViralScore(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        {isSearching ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            <p className="text-slate-500 font-medium">유튜브 알고리즘을 분석하는 중...</p>
          </div>
        ) : filteredVideos.length > 0 ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">추천 타겟 리스트</h2>
                <p className="text-slate-500 text-sm">설정하신 기준에 부합하는 고효율 영상들입니다.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredVideos.map((video) => (
                <VideoCard key={video.id} video={video} onAnalyze={handleAnalyze} />
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto text-center py-24">
            <div className="bg-white w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm border border-slate-100">
              <BarChart3 size={48} className="text-indigo-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-4">데이터 기반 콘텐츠 전략</h2>
            <p className="text-slate-500 text-lg leading-relaxed mb-8">
              키워드를 검색하고 영상의 성과를 필터링해보세요.<br />
              AI가 시청자의 숨은 니즈를 분석하여 다음 영상 소재와 목차를 추천해 드립니다.
            </p>
          </div>
        )}
      </main>

      {/* Analysis Side Panel */}
      {selectedVideo && (
        <>
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => !analysisLoading && setSelectedVideo(null)}
          />
          <AnalysisPanel 
            video={selectedVideo} 
            result={analysisResult} 
            loading={analysisLoading} 
            onClose={() => setSelectedVideo(null)} 
          />
        </>
      )}
    </div>
  );
};

export default App;
