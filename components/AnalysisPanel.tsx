
import React, { useState } from 'react';
import { AnalysisResult, YouTubeVideo } from '../types';
import { X, Sparkles, ThumbsUp, ThumbsDown, Target, Lightbulb, Hash, FileText, Loader2, BookOpen } from 'lucide-react';
import { generateScriptOutline } from '../services/geminiService';

interface AnalysisPanelProps {
  video: YouTubeVideo | null;
  result: AnalysisResult | null;
  loading: boolean;
  onClose: () => void;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ video, result, loading, onClose }) => {
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [outline, setOutline] = useState<string | null>(null);
  const [outlineLoading, setOutlineLoading] = useState(false);

  if (!video) return null;

  const handleKeywordClick = async (keyword: string) => {
    setSelectedKeyword(keyword);
    setOutlineLoading(true);
    setOutline(null);
    try {
      const generatedOutline = await generateScriptOutline(keyword, video.title);
      setOutline(generatedOutline);
    } catch (error) {
      console.error('Failed to generate outline:', error);
      alert('목차 생성에 실패했습니다.');
    } finally {
      setOutlineLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-50 transform transition-transform duration-300 overflow-y-auto">
      <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Sparkles className="text-white" size={20} />
          </div>
          <h2 className="font-bold text-slate-800">데이터 통합 분석 리포트</h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <X size={24} className="text-slate-400" />
        </button>
      </div>

      <div className="p-8">
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded uppercase">Target Video</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2 leading-tight" dangerouslySetInnerHTML={{ __html: video.title }} />
          <p className="text-slate-500 font-medium">{video.channelTitle}</p>
        </div>

        {loading ? (
          <div className="space-y-8">
            <div className="h-32 bg-slate-50 animate-pulse rounded-2xl border border-slate-100"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-40 bg-slate-50 animate-pulse rounded-2xl border border-slate-100"></div>
              <div className="h-40 bg-slate-50 animate-pulse rounded-2xl border border-slate-100"></div>
            </div>
            <div className="h-60 bg-slate-50 animate-pulse rounded-2xl border border-slate-100"></div>
          </div>
        ) : result ? (
          <div className="space-y-12 pb-20">
            {/* Sentiment Section */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Target size={20} className="text-indigo-600" />
                <h4 className="font-bold text-slate-800 text-lg">시청자 반응 요약</h4>
              </div>
              <div className="p-5 bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-2xl shadow-sm">
                <p className="text-indigo-900 leading-relaxed font-medium">{result.sentiment}</p>
              </div>
            </section>

            {/* Pros/Cons Section */}
            <div className="grid grid-cols-2 gap-6">
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <ThumbsUp size={18} className="text-emerald-500" />
                  <h4 className="font-bold text-slate-800">긍정적인 반응</h4>
                </div>
                <div className="space-y-2">
                  {result.positivePoints.map((item, i) => (
                    <div key={i} className="flex gap-2 text-sm text-slate-600 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-50">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      {item}
                    </div>
                  ))}
                </div>
              </section>
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <ThumbsDown size={18} className="text-rose-500" />
                  <h4 className="font-bold text-slate-800">아쉬운/궁금한 점</h4>
                </div>
                <div className="space-y-2">
                  {result.negativePoints.map((item, i) => (
                    <div key={i} className="flex gap-2 text-sm text-slate-600 bg-rose-50/50 p-2.5 rounded-lg border border-rose-50">
                      <span className="text-rose-400 font-bold shrink-0">!</span>
                      {item}
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Recommended Keywords - USER SELECTION START */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Hash size={20} className="text-indigo-600" />
                  <h4 className="font-bold text-slate-800 text-lg">추천 핵심 키워드 (선택 시 목차 생성)</h4>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {result.recommendedKeywords.map((keyword, i) => (
                  <button
                    key={i}
                    onClick={() => handleKeywordClick(keyword)}
                    className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${
                      selectedKeyword === keyword 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md scale-105' 
                      : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-400 hover:text-indigo-600'
                    }`}
                  >
                    #{keyword}
                  </button>
                ))}
              </div>
            </section>

            {/* Script Outline View */}
            {(outlineLoading || outline) && (
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen size={20} className="text-indigo-600" />
                  <h4 className="font-bold text-slate-800 text-lg">
                    "{selectedKeyword}" 맞춤 콘텐츠 목차
                  </h4>
                </div>
                <div className="p-8 bg-slate-900 rounded-3xl text-slate-300 relative overflow-hidden shadow-xl border border-slate-800">
                  {outlineLoading ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                      <p className="text-sm font-medium animate-pulse">AI가 최적의 구성을 설계하고 있습니다...</p>
                    </div>
                  ) : outline ? (
                    <div className="prose prose-invert max-w-none prose-sm leading-relaxed whitespace-pre-wrap">
                      {outline}
                    </div>
                  ) : null}
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <FileText size={100} />
                  </div>
                </div>
              </section>
            )}

            {/* Content Ideas */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb size={20} className="text-indigo-600" />
                <h4 className="font-bold text-slate-800 text-lg">확장 콘텐츠 소재 제안</h4>
              </div>
              <div className="grid gap-4">
                {result.contentIdeas.map((item, i) => (
                  <div key={i} className="group p-5 bg-white border border-slate-200 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50/30 transition-all cursor-default">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-[10px] flex items-center justify-center font-bold group-hover:bg-indigo-600 group-hover:text-white transition-colors">0{i+1}</span>
                    </div>
                    <p className="text-slate-800 font-bold leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <div className="text-center py-20 text-slate-400">
            데이터를 불러올 수 없습니다.
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisPanel;
