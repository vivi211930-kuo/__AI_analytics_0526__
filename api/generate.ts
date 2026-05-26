import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import path from "path";

// 優先載入本地開發的 .env.local，若無則回退載入 .env
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// SYSTEM INSTRUCTIONS: 設定 AI 的行為與輸出格式
const SYSTEM_INSTRUCTION = `
你是一位專業的會議記錄助理。請根據使用者提供的會議逐字稿，整理出結構化的會議紀錄。
請務必遵守以下輸出格式要求：

1. **會議主題與時間**：擷取會議的主題與時間。若未提及時間，請標註「未提供」。
2. **與會者**：列出參與會議的人員。若未提及與會人，請標註「未提供」。
3. **會議重點總結**：用 3 到 5 個重點總結會議內容。
4. **Action Items (待辦事項)**：明確列出接下來的待辦事項與負責人。
5. **英文翻譯版**：將上述 1~4 點的內容完整翻譯成專業的英文。如果使用者在介面上指定了其他翻譯語言（如日文、韓文、西班牙文等），請一同提供該語言的翻譯，或者將此翻譯版調整為對應語言的專屬翻譯。

請以 Markdown 格式輸出，所有繁體中文部分必須使用**繁體中文**回覆，不要包含任何額外的問候語或結語。

【補充與焦點模式調整】
- **standard (標準會議記錄)**：完整保持上述 1-5 點格式。
- **concise (高階精簡摘要)**：字句更加精練，但仍嚴格保留這 5 大項結構。
- **action_only (行動項目優先)**：將第 4 點待辦事項的描述更深入細化，包含具體成果、預計期限等。
- **qa_format (問答與決策對齊)**：在第 3 點「會議重點總結」中，儘量融入問題與答覆、決策背景等脈絡。
- 除去贅詞，保持商業、中立、客觀、高質感的專業文書口吻。
- 專有名詞（如技術詞彙、公司產品等）請保持正確形式（例如：Vite、API、Redis、React、CORS 等）。
`;

// Helper: 取得翻譯語言的中文名稱
const getLanguageLabel = (langCode: string): string => {
  switch (langCode) {
    case "en": return "英文 (English)";
    case "ja": return "日文 (Japanese)";
    case "ko": return "韓文 (Korean)";
    case "es": return "西班牙文 (Spanish)";
    default: return "不翻譯";
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 處理 CORS 預檢請求
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(455).json({ error: "Method Not Allowed. 請使用 POST 請求。" });
  }

  const { transcript, mode = "standard", targetLanguage = "none", userContext = "", provider = "gemini" } = req.body;

  if (!transcript || typeof transcript !== "string" || transcript.trim().length === 0) {
    return res.status(400).json({ error: "會議逐字稿內容不得為空。" });
  }

  // 建立 User Prompt
  let userPrompt = "【會議逐字稿內容如下】\n";
  userPrompt += "----------------------------------------\n";
  userPrompt += transcript.trim() + "\n";
  userPrompt += "----------------------------------------\n\n";
  
  userPrompt += "【處理設定參數】\n";
  userPrompt += `- **焦點整理模式**：${mode}\n`;
  userPrompt += `- **目標翻譯語言**：${getLanguageLabel(targetLanguage)}\n`;
  
  if (userContext && userContext.trim().length > 0) {
    userPrompt += `- **額外特定指示**：${userContext.trim()}\n`;
  }

  userPrompt += "\n請嚴格遵照 System Instructions 的格式和口吻為我生成最完美、精緻的會議記錄與翻譯！";

  try {
    if (provider === "gemini") {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "你的_Gemini_API_Key") {
        return res.status(500).json({
          error: "尚未在系統中設定有效的 GEMINI_API_KEY。請在本地的 .env.local 檔案或 Vercel 後台的 Environment Variables 設定此金鑰。"
        });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: userPrompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.25,
          topP: 0.95,
        },
      });

      const resultText = response.text;
      if (!resultText) {
        throw new Error("Gemini AI 回傳了空的結果。請稍後重試。");
      }

      return res.status(200).json({
        success: true,
        resultText: resultText,
        mode: mode,
        targetLanguage: targetLanguage,
        provider: "gemini",
        timestamp: new Date().toISOString()
      });

    } else if (provider === "nvidia") {
      const apiKey = process.env.NVIDIA_API_KEY;
      if (!apiKey || apiKey === "你的_NVIDIA_API_Key") {
        return res.status(500).json({
          error: "尚未在系統中設定有效的 NVIDIA_API_KEY。請在本地的 .env.local 檔案或 Vercel 後台的 Environment Variables 設定此金鑰。"
        });
      }

      // NVIDIA API 使用標準 OpenAI 相容格式
      const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "nvidia/nemotron-mini-4b-instruct",
          messages: [
            { role: "system", content: SYSTEM_INSTRUCTION },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.25,
          top_p: 0.95
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `NVIDIA API 呼叫失敗，HTTP 狀態碼: ${response.status}`);
      }

      const data = await response.json();
      const resultText = data.choices?.[0]?.message?.content;

      if (!resultText) {
        throw new Error("NVIDIA AI 回傳了空的結果。請稍後重試。");
      }

      return res.status(200).json({
        success: true,
        resultText: resultText,
        mode: mode,
        targetLanguage: targetLanguage,
        provider: "nvidia",
        timestamp: new Date().toISOString()
      });

    } else {
      return res.status(400).json({ error: `不支援的 AI 服務提供商: ${provider}` });
    }

  } catch (error: any) {
    console.error("AI API 呼叫錯誤:", error);
    return res.status(500).json({
      error: error.message || "呼叫 AI 服務時發生意外錯誤，請稍後再試。"
    });
  }
}
