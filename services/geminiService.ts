
import { GoogleGenAI, Type } from "@google/genai";
import { CommentData, AnalysisResult } from "../types";

export async function analyzeVideoContent(
  title: string, 
  comments: CommentData[]
): Promise<AnalysisResult> {
  // Always create a new GoogleGenAI instance right before the API call to ensure latest API key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const commentText = comments.map(c => `- ${c.text}`).join('\n');
  
  const prompt = `
    유튜브 영상 제목: "${title}"
    위 영상의 댓글들:
    ${commentText}

    이 영상의 댓글을 분석하여 다음 정보를 추출해줘:
    1. 전반적인 시청자 반응(긍정/부정/중립)
    2. 시청자들이 특히 좋게 평가한 부분들
    3. 시청자들이 아쉽게 느낀 부분들
    4. 시청자들이 궁금해하는 잠재적 요구(needs)
    5. 이 분석을 토대로 만들 수 있는 새로운 3가지 이상의 구체적인 영상 소재 추천
    6. 이 영상의 핵심 주제와 시청자 관심사를 관통하는 5개의 핵심 키워드 추천

    결과는 반드시 지정된 JSON 형식으로 응답해줘.
  `;

  // Using gemini-3-pro-preview for complex reasoning and content analysis tasks
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          sentiment: { type: Type.STRING },
          positivePoints: { type: Type.ARRAY, items: { type: Type.STRING } },
          negativePoints: { type: Type.ARRAY, items: { type: Type.STRING } },
          userNeeds: { type: Type.ARRAY, items: { type: Type.STRING } },
          contentIdeas: { type: Type.ARRAY, items: { type: Type.STRING } },
          recommendedKeywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "5 core keywords for new content" },
        },
        required: ["sentiment", "positivePoints", "negativePoints", "userNeeds", "contentIdeas", "recommendedKeywords"]
      },
    },
  });

  // Directly access the .text property (do not call as a method)
  const resultText = response.text || "{}";
  return JSON.parse(resultText.trim());
}

export async function generateScriptOutline(keyword: string, originalTitle: string): Promise<string> {
  // Always create a new GoogleGenAI instance right before the API call
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    기존 영상 제목: "${originalTitle}"
    선택된 새로운 키워드: "${keyword}"

    위 키워드를 주제로 하여 유튜브 영상을 제작하려고 합니다. 
    시청자의 흥미를 끌 수 있는 구체적이고 체계적인 대본 목차(Outline)를 작성해줘.
    
    구성 요소:
    1. 후킹 영상 도입부 (0-30초)
    2. 문제 제기 및 공감 포인트
    3. 핵심 정보/솔루션 전달 (단계별)
    4. 반전 또는 꿀팁 제공
    5. 아웃트로 및 구독 유도

    마크다운 형식으로 보기 좋게 작성해줘.
  `;

  // Using gemini-3-pro-preview for creative content generation tasks
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
  });

  // Access the string output using .text property
  return response.text || "";
}
