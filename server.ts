import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Body parsing middleware
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// API route: health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// SYSTEM INSTRUCTIONS常數：設定 AI 的行為與輸出格式
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

// API: summarize
app.post("/api/summarize", async (req, res) => {
  const { transcript, mode = "standard", targetLanguage = "none", userContext = "" } = req.body;

  if (!transcript || typeof transcript !== "string" || transcript.trim().length === 0) {
    return res.status(400).json({ error: "會議逐字稿內容不得為空。" });
  }

  // 檢查 API 金鑰
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "尚未在系統中設定 GEMINI_API_KEY。請前往 Settings > Secrets 分頁新增此金鑰，以啟用 AI 服務功能。"
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

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

    // 呼叫 Gemini AI
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.25, // 低溫度使會議記錄更嚴謹客觀
        topP: 0.95,
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("AI 回傳了空的結果。請稍後重試。");
    }

    return res.json({
      success: true,
      resultText: resultText,
      mode: mode,
      targetLanguage: targetLanguage,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("Gemini API call failed:", error);
    return res.status(500).json({
      error: error.message || "呼叫 AI 模組時發生意外錯誤，請稍後再試。"
    });
  }
});

// Vite & Static assets mounting
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Running and listening on http://localhost:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error("Failed to bootstrap fullstack server:", err);
});
