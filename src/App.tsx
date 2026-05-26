import { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  FileText, 
  Copy, 
  Check, 
  Download, 
  Trash2, 
  History, 
  Languages, 
  Clock, 
  ArrowRight, 
  Plus, 
  AlertCircle, 
  ChevronRight, 
  BookOpen, 
  Info,
  Calendar,
  Share2,
  FileDown
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Markdown from "react-markdown";

// 歷史紀錄資料結構
interface HistoryItem {
  id: string;
  title: string;
  transcript: string;
  result: string;
  mode: string;
  targetLanguage: string;
  userContext: string;
  timestamp: string;
}

// 焦點模式常數
const FOCUS_MODES = [
  {
    id: "standard",
    name: "標準會議記錄",
    description: "全方位、結構完整的會議紀要。包含主旨、核心摘要、各議題詳細討論與指派的 Action Items。",
    color: "bg-indigo-50/80 border-indigo-200 text-indigo-700 ring-4 ring-indigo-500/5 shadow-2xs"
  },
  {
    id: "concise",
    name: "高階精簡摘要",
    description: "極度精煉，專為高階主管或快捷瀏覽設計。僅保留最核心主旨、高階結論與前三大重點事項。",
    color: "bg-emerald-50/80 border-emerald-250 text-emerald-800 ring-4 ring-emerald-500/5 shadow-2xs"
  },
  {
    id: "action_only",
    name: "行動項目優先",
    description: "以任務執行為核心。優先將 Action Items 排版於最前端，細化執行目標、責任人及預計完成時程。",
    color: "bg-amber-50/80 border-amber-250 text-amber-800 ring-4 ring-amber-500/5 shadow-2xs"
  },
  {
    id: "qa_format",
    name: "問答與決策對齊",
    description: "將發言梳理成問答模式。記錄「何人提出了何種問題、各方如何解答與最終決議成果」，適合檢討會。",
    color: "bg-fuchsia-50/80 border-fuchsia-250 text-fuchsia-800 ring-4 ring-fuchsia-500/5 shadow-2xs"
  }
];

// 翻譯語言常數
const LANGUAGES = [
  { code: "none", name: "不需額外翻譯 (僅繁體中文總結)", native: "中文" },
  { code: "en", name: "延伸英文翻譯 (English Translation)", native: "English" },
  { code: "ja", name: "延伸日文翻譯 (日本語翻訳)", native: "日本語" },
  { code: "ko", name: "延伸韓文翻譯 (한국어 번역)", native: "한국어" },
  { code: "es", name: "延伸西班牙文翻譯 (Traducción en Español)", native: "Español" }
];

// Helper: 取得翻譯語言的中文標籤
const getLanguageLabel = (langCode: string): string => {
  switch (langCode) {
    case "en": return "英文 (English)";
    case "ja": return "日文 (Japanese)";
    case "ko": return "韓文 (Korean)";
    case "es": return "西班牙文 (Spanish)";
    default: return "不翻譯";
  }
};

// 範例會議逐字稿
const SAMPLES = [
  {
    title: "範例一：產品核心功能優化與時程對齊會議",
    description: "包含項目經理、前後端工程師對新版登入與 React 19 升級的時程爭論",
    context: "重點关注登入 API 安全性與前後端預計整合日期",
    transcript: `Mark (PM): 大家早。今天主要是來對齊一下 3.0 版本升級中有關「無密碼登入新功能」的整合進度，還有 React 19 兼容性測試。Emily，妳那邊 UI 設計和元件重構完成了嗎？

Emily (前端設計): PM 早。前台的 WebAuthn 密碼學元件還有行動裝置的指紋辨識介面、動畫都做完了，這次我用了 React 19 的新 Hook，整體渲染效率提升很多。目前在 Vercel 測試站看起來沒有漏幀的狀況。不過，我還在等 Ken 把 API endpoints 對接上。特別是實作安全挑戰碼（Challenge String）驗證的那一段 API，如果他沒給我，我沒辦法在前端生成憑證。

Ken (後端工程師): 我插播一下，Challenge 這快我今天下午就會合併進 Main 分支。因為要遵守 FIDO2 規範，我必須在後端用 Redis 存半小時過期的 Challenge 以防止重放攻擊。我這邊資料庫的 Schema 遷移程式碼也寫好了，預計下週五（6月5日）之前會部署至 Staging 測試環境。

Mark (PM): 太好了，下週五部署。那我們前後端聯合整合測試可以排在什麼時間？

Emily (前端設計): 只要 Ken 下週五（6月5日）準時上線 Staging API，我和他可以排在再下週一，也就是 6 月 8 日下午開始聯調，預估需要兩到三天來解決 CORS 或是憑證網域的安全問題。

Mark (PM): 好的。Emily 負責 6 月 8 日開始和 Ken 聯調。另外，Emily 妳還要對一下 React 19 升級後的打包大小，確認 Bundle size 沒有爆炸。

Emily (前端設計): 沒問題，這個我會在 6 月 10 日前產出分析報告。

Ken (後端工程師): 補一下，後台這次因為安全升級，我們需要全面拉高 HTTPS 的加密強度，所以舊版 TLS 1.0 的 API 存取我們會預設關閉，這件事我會放在這次的遷移備忘錄中。

Mark (PM): 很好，安全第一。那今天會議就到這。Emily 負責前端 React 19 優化和 6/10 打包報告、6/8 與 Ken 聯調。Ken 負責下週五（6/5）前上線 Staging API 並合併 FIDO2 Redis 機制。謝謝大家！`
  },
  {
    title: "範例二：夏季品牌社群行銷宣傳腦力激盪",
    description: "行銷總監與小編討論預算、IG Reels、Threads 文案以及網紅合作目標",
    context: "預算限制最高 5 萬元台幣，期望達到 20 萬以上的觸及數",
    transcript: `Joyce (行銷總監): Leo，我們夏季促銷（Summer Holiday Campaign）的預算最終批下來了，是新台幣 5 萬元整。雖然錢不多，但我們必須在 7 月 1 日活動開跑前，把社群的流量先炒熱。你手邊有哪些想法？

Leo (社群小編): 總監好，這次預算 5 萬，我的規劃是拿 3 萬出來找 3 到 5 位奈米級（粉絲數一萬左右）的潮流美食、生活風格 KOL 進行短影音（IG Reels / TikTok）的置入。他們通常合作費在一萬以下，甚至有些可以接受產品互惠。剩下的 2 萬元，我打算拿來做為 Meta 廣告（IG / FB）的投放，主攻 18-28 歲在北部的大學和年輕上班族群。

Joyce (行銷總監): 網紅部分我同意，但你要怎麼確保這些網紅的受眾精準？

Leo (社群小編): 我會在 6 月 15 日前整理出一份包含 10 個候選網紅的名單和他們過去的 Reels 觸及數據給妳審核。一旦妳通過，我會在 6 月 20 日前完成所有簽約和產品寄送。

Joyce (行銷總監): 時程沒問題。那在我們自有的社群媒體（Threads 和 IG 貼文）上，妳有規劃哪些互動機制嗎？

Leo (社群小編): 有的！我們這次會在 Threads 上玩一個「爛藉口放暑假」的主題討論。我們不發死板板的促銷，而是讓大家在留言區抱怨想請假的搞笑理由。最多讚的人，我們直接送價值 2000 元的夏季聯名大禮包。這部分不需要網紅費用，但需要有人把大禮包的產品挑出來並拍照。

Joyce (行銷總監): 好的。禮包這事我叫倉庫那邊在下禮拜三（6月3日）前把實品準備好給你。Leo 你收到後，必須在 6 月 5 日前把視覺拍照和文案排程準備好。

Leo (社群小編): 收到！觸及率部分，只要 KOL 的 Reels 開箱能夠帶動社群一波二創，搭配 2 萬元的廣告，我有信心在 7 月中旬之前觸及率達到 20 萬人以上。

Joyce (行銷總監): 信心可嘉。那我們就以 20 萬觸及為 KPI。總結一下：我 6/3 前幫你張羅大禮包，你 6/5 完成自媒拍照文案，6/15 提供 KOL 提案名單、6/20 完成簽約。加油了！`
  }
];

export default function App() {
  // 輸入與輸出狀態
  const [transcript, setTranscript] = useState("");
  const [selectedMode, setSelectedMode] = useState("standard");
  const [targetLanguage, setTargetLanguage] = useState("none");
  const [userContext, setUserContext] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [resultText, setResultText] = useState("");
  const [activeTab, setActiveTab] = useState<"render" | "raw">("render");
  const [errorMsg, setErrorMsg] = useState("");
  
  // 歷史紀錄狀態
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);

  // 當前即時時間 (每秒更新)
  const [currentTime, setCurrentTime] = useState("");

  const resultContainerRef = useRef<HTMLDivElement>(null);

  // 初始化與載入歷史紀錄
  useEffect(() => {
    // 讀取 LocalStorage
    const stored = localStorage.getItem("ai_meeting_history");
    if (stored) {
      try {
        setHistoryList(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }

    // 動態更新本地時間
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleString("zh-TW", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 儲存歷史紀錄到 LocalStorage
  const saveHistory = (newList: HistoryItem[]) => {
    setHistoryList(newList);
    localStorage.setItem("ai_meeting_history", JSON.stringify(newList));
  };

  // 匯入範例
  const handleImportSample = (sampleText: string, sampleContext: string) => {
    setTranscript(sampleText);
    setUserContext(sampleContext);
    setErrorMsg("");
    // 震動或輕微提示一項
  };

  // 生成總結與翻譯
  const handleGenerate = async () => {
    if (!transcript.trim()) {
      setErrorMsg("請輸入或貼上會議逐字稿內容，再行生成！");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");
    setResultText("");

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcript: transcript,
          mode: selectedMode,
          targetLanguage: targetLanguage,
          userContext: userContext
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "生成失敗，請稍候重試。");
      }

      setResultText(data.resultText);
      setActiveTab("render");

      // 產生一筆歷史紀錄
      const firstLine = transcript.trim().split("\n")[0];
      const titleProposal = firstLine.length > 22 
        ? firstLine.substring(0, 22) + "..." 
        : firstLine || "未命名的會議摘要";

      const newItem: HistoryItem = {
        id: Date.now().toString(),
        title: `會議紀錄 - ${titleProposal}`,
        transcript: transcript,
        result: data.resultText,
        mode: selectedMode,
        targetLanguage: targetLanguage,
        userContext: userContext,
        timestamp: new Date().toLocaleString("zh-TW")
      };

      const updatedHistory = [newItem, ...historyList].slice(0, 15); // 最多保留15筆
      saveHistory(updatedHistory);

      // 自動滾動到結果顯示區
      setTimeout(() => {
        resultContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "發生連線錯誤，無法聯絡 AI 伺服器，請檢查 API 金鑰設定。");
    } finally {
      setIsLoading(false);
    }
  };

  // 清空輸入
  const handleClear = () => {
    setTranscript("");
    setUserContext("");
    setErrorMsg("");
  };

  // 複製結果
  const handleCopy = async () => {
    if (!resultText) return;
    try {
      await navigator.clipboard.writeText(resultText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("複製失敗", err);
    }
  };

  // 下載 Markdown 檔案
  const handleDownloadFile = () => {
    if (!resultText) return;
    try {
      const blob = new Blob([resultText], { type: "text/markdown;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      // 用時間做檔名
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      link.setAttribute("download", `AI會議記錄總結_${dateStr}.md`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setIsDownloaded(true);
      setTimeout(() => setIsDownloaded(false), 2000);
    } catch (err) {
      console.error("下載失敗", err);
    }
  };

  // 載入歷史檔案
  const handleLoadHistory = (item: HistoryItem) => {
    setTranscript(item.transcript);
    setSelectedMode(item.mode);
    setTargetLanguage(item.targetLanguage);
    setUserContext(item.userContext);
    setResultText(item.result);
    setErrorMsg("");
    setActiveTab("render");
    
    // 滾動到結果
    setTimeout(() => {
      resultContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  // 移除單一歷史
  const handleRemoveHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止載入動作
    const filtered = historyList.filter(item => item.id !== id);
    saveHistory(filtered);
  };

  // 清除全部歷史
  const handleClearAllHistory = () => {
    if (window.confirm("確定要清除所有存放在這台瀏覽器中的會議記錄歷史嗎？此操作無法變更。")) {
      saveHistory([]);
    }
  };

  return (
    <div id="app_root" className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans select-text">
      
      {/* 頂部導覽列 Header */}
      <header id="app_header" className="border-b border-slate-200/80 bg-white sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-indigo-650 to-violet-650 p-2 rounded-xl shadow-md">
              <Sparkles className="h-5 w-5 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-950 font-display flex items-center gap-2">
                AI 會議記錄生成與翻譯助手
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                繁體中文專業商業對齊 · 智慧 Action Items 追蹤 · 多國語言無縫同聲翻譯
              </p>
            </div>
          </div>

          {/* 右邊狀態與時間 */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/60">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              <span className="font-mono font-medium">{currentTime}</span>
            </div>
            <div className="flex items-center space-x-1.5 bg-indigo-50 border border-indigo-150 px-2.5 py-1 rounded-full text-[11px] text-indigo-700 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></span>
              <span>API 狀態：已連線</span>
            </div>
          </div>

        </div>
      </header>

      {/* 主體區塊 */}
      <main id="app_main" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* 用於提示說明 */}
        <section className="bg-gradient-to-r from-slate-100/40 via-indigo-50/20 to-slate-200/10 border border-slate-200 rounded-2xl p-5 md:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-indigo-500" /> 什麼是會議記錄 AI 助手？
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-4xl">
                這款全棧應用程式能將各種
                <strong className="text-slate-950 font-semibold"> 口語化、雜亂不完整、高度重述 </strong>
                的會議逐字稿，過濾贅詞並精煉結構，生成具備基本資訊、精準段落摘要、條列重點及標準
                <span className="text-indigo-600 font-semibold"> Action Items 專案表格 </span> 
                的商業紀錄，更可同時轉譯為多種國際商務語言。
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5 shrink-0">
              <div className="text-[11px] font-mono bg-white px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-600 font-semibold leading-none shadow-3xs">
                Model: gemini-3.5-flash
              </div>
              <div className="text-[11px] font-mono bg-white px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-600 font-semibold leading-none shadow-3xs">
                Format: Output Markdown
              </div>
            </div>
          </div>
        </section>

        {/* 雙欄核心操作 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* 左欄：輸入與控制區 (占5欄 5/12) */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  原始會議逐字稿 / 筆記
                </span>
                <div className="flex space-x-2">
                  <button 
                    onClick={handleClear} 
                    className="text-xs text-slate-500 hover:text-red-500 hover:bg-red-50 px-2.5 py-1 rounded transition duration-200 font-medium"
                  >
                    清除內容
                  </button>
                </div>
              </div>

              {/* 逐字稿 textarea */}
              <div className="relative group">
                <textarea
                  id="transcript_textarea"
                  rows={10}
                  className="w-full bg-slate-50/50 focus:bg-white border border-slate-250/70 rounded-xl px-4 py-3.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all font-sans leading-relaxed resize-y"
                  placeholder="請在此貼上您的會議逐字稿內容，或使用下方「匯入範例」功能來一鍵生成體驗對比成果..."
                  value={transcript}
                  onChange={(e) => {
                    setTranscript(e.target.value);
                    if (e.target.value) setErrorMsg("");
                  }}
                />
                <div className="absolute bottom-3 right-3 text-[11px] text-slate-400 font-mono font-medium select-none bg-white px-2 py-0.5 rounded border border-slate-100">
                  字數統計：{transcript.length}
                </div>
              </div>

              {/* 範例匯入按鈕 */}
              <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
                <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-500" /> 點擊下方快速匯入擬真範例：
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SAMPLES.map((sample, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleImportSample(sample.transcript, sample.context)}
                      className="text-left text-xs bg-white hover:bg-indigo-50/40 border border-slate-200 hover:border-indigo-300 p-2.5 rounded-xl shadow-3xs transition-all duration-150 group cursor-pointer"
                    >
                      <div className="font-bold text-slate-700 group-hover:text-indigo-600 flex items-center gap-1 truncate">
                        <Plus className="w-3 h-3 text-indigo-500 shrink-0" />
                        <span className="truncate">{sample.title}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 truncate">
                        {sample.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 焦點整理模式選擇 */}
              <div className="space-y-2.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <span>1. 選擇 AI 焦點整理模式</span>
                  <span className="text-[10px] text-slate-405 font-normal">(不同模式會優化其結構輸出)</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {FOCUS_MODES.map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setSelectedMode(mode.id)}
                      className={`text-left p-3 rounded-xl border transition-all duration-150 relative cursor-pointer ${
                        selectedMode === mode.id
                          ? `${mode.color} border-transparent`
                          : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50/80 hover:border-slate-350"
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center justify-between">
                        <span className={selectedMode === mode.id ? "text-slate-900 font-extrabold" : "text-slate-700"}>{mode.name}</span>
                        {selectedMode === mode.id && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>}
                      </div>
                      <p className="text-[10px] text-slate-450 mt-1 line-clamp-2">
                        {mode.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 語言翻譯設定 */}
              <div className="space-y-2.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Languages className="w-3.5 h-3.5 text-indigo-500" />
                  <span>2. 選擇指定國際語言翻譯</span>
                </label>
                <div className="relative">
                  <select
                    id="language_select"
                    value={targetLanguage}
                    onChange={(e) => setTargetLanguage(e.target.value)}
                    className="w-full bg-white border border-slate-250/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 appearance-none cursor-pointer shadow-3xs"
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name} — ({lang.native})
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                    <ChevronRight className="w-4 h-4 transform rotate-90" />
                  </div>
                </div>
              </div>

              {/* 額外特定上下文指示 */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <span>3. 額外特定指示 / 上下文備註</span>
                  <span className="text-[10px] text-slate-400 font-normal">(選填)</span>
                </label>
                <input
                  type="text"
                  id="context_input"
                  className="w-full bg-white border border-slate-250/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 shadow-3xs"
                  placeholder="例如：「特別著重 Ken 在安全性上討論出的共識」"
                  value={userContext}
                  onChange={(e) => setUserContext(e.target.value)}
                />
              </div>

              {/* 錯漏警示區 */}
              {errorMsg && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start space-x-2.5 text-red-600 text-xs shadow-3xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* 核心送出按鈕 */}
              <button
                type="button"
                id="generate_record_button"
                onClick={handleGenerate}
                disabled={isLoading}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center space-x-2.5 transition-all duration-200 shadow-md ${
                  isLoading
                    ? "bg-slate-150 text-slate-400 cursor-not-allowed border border-slate-200"
                    : "bg-gradient-to-r from-indigo-650 to-violet-650 hover:from-indigo-600 hover:to-violet-600 text-white cursor-pointer hover:shadow-lg active:scale-[0.99] shadow-indigo-650/10"
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>智慧 AI 深度編譯中... 請稍候</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 animate-bounce text-yellow-300" />
                    <span>生成總結與翻譯</span>
                  </>
                )}
              </button>

            </div>

            {/* 本地端歷史紀錄 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <History className="w-3.5 h-3.5 text-indigo-500" />
                  本機歷史紀錄區 ({historyList.length})
                </span>
                {historyList.length > 0 && (
                  <button 
                    onClick={handleClearAllHistory}
                    className="text-[11px] text-slate-400 hover:text-red-500 transition font-medium cursor-pointer"
                  >
                    清空歷史
                  </button>
                )}
              </div>

              {historyList.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400 font-medium">
                  尚未存有本機歷史，完成一次 AI 生成後將自動備份於此。
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {historyList.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleLoadHistory(item)}
                      className="w-full text-left bg-slate-50/50 hover:bg-indigo-50/30 border border-slate-200/70 hover:border-indigo-200 rounded-xl p-3 transition duration-150 cursor-pointer flex items-center justify-between group shadow-3xs"
                    >
                      <div className="space-y-1 min-w-0 pr-2">
                        <div className="text-xs font-bold text-slate-800 truncate">
                          {item.title}
                        </div>
                        <div className="flex items-center space-x-2 text-[10px]">
                          <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded uppercase font-bold text-[9px] border border-indigo-100">
                            {item.mode}
                          </span>
                          <span className="text-slate-400">{item.timestamp}</span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleRemoveHistory(item.id, e)}
                        className="p-1 px-1.5 rounded bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all duration-200 shrink-0 cursor-pointer"
                        title="刪除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* 右欄：AI 結果輸出顯示區 (占7欄 7/12) */}
          <div ref={resultContainerRef} className="lg:col-span-7 space-y-6">
            
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md space-y-5 flex flex-col min-h-[620px]">
              
              {/* 控制與功能分頁 */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    AI 生成結果 (Markdown)
                  </h3>
                  <p className="text-[11.5px] text-slate-500">
                    輸出內容以極致高階排版，支援 Markdown 渲染，方便直接複製套用。
                  </p>
                </div>
                
                {/* 預覽模式標籤 */}
                {resultText && (
                  <div className="flex bg-slate-100 border border-slate-200 p-1 rounded-xl shrink-0 shadow-3xs">
                    <button
                      onClick={() => setActiveTab("render")}
                      className={`px-3 py-1 text-xs rounded-lg transition duration-150 cursor-pointer ${
                        activeTab === "render"
                          ? "bg-white text-indigo-700 font-extrabold shadow-sm border border-slate-150"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      標準渲染
                    </button>
                    <button
                      onClick={() => setActiveTab("raw")}
                      className={`px-3 py-1 text-xs rounded-lg transition duration-150 cursor-pointer ${
                        activeTab === "raw"
                          ? "bg-white text-indigo-700 font-extrabold shadow-sm border border-slate-150"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      原始碼 (MD)
                    </button>
                  </div>
                )}
              </div>

              {/* 內容主區塊 */}
              <div className="flex-1 flex flex-col">
                {isLoading ? (
                  /* 載入中骨架畫面 */
                  <div className="flex-1 flex flex-col justify-center py-10 space-y-6">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-indigo-600 border-r-violet-600 animate-spin"></div>
                        <Sparkles className="w-6 h-6 text-yellow-500 absolute top-5 left-5 animate-pulse" />
                      </div>
                      <div className="space-y-1 block text-center">
                        <p className="text-sm text-slate-800 font-bold animate-pulse">正在精析會議上下文，過濾囉唆並編譯中...</p>
                        <p className="text-xs text-slate-400">本階段由 Gemini 3.5 核心進行高階譯析及多語翻譯同步整合</p>
                      </div>
                    </div>
                    {/* 骨架模擬條 */}
                    <div className="space-y-3 max-w-lg mx-auto w-full px-4">
                      <div className="h-4 bg-slate-100 rounded animate-pulse w-3/4"></div>
                      <div className="h-4 bg-slate-100 rounded animate-pulse w-full"></div>
                      <div className="h-4 bg-slate-150 rounded animate-pulse w-5/6"></div>
                      <div className="h-4 bg-slate-100 rounded animate-pulse w-2/3"></div>
                    </div>
                  </div>
                ) : resultText ? (
                  /* 真正的結果顯示 */
                  <div className="flex-1 flex flex-col justify-between">
                    
                    {/* 操作一鍵複製/下載 */}
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between mb-4 shadow-3xs">
                      <div className="flex items-center space-x-2 text-xs text-slate-500">
                        <span className="font-mono text-indigo-700 font-bold text-[10px] bg-indigo-50 px-2.5 py-1.5 rounded-md border border-indigo-200/50">
                          {getLanguageLabel(targetLanguage)}
                        </span>
                        <span>產生完成 ➔ 已完成排版</span>
                      </div>
                      
                      <div className="flex space-x-2">
                        {/* 一鍵複製 */}
                        <button
                          onClick={handleCopy}
                          className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold select-none cursor-pointer border transition-all duration-200 ${
                            isCopied 
                              ? "bg-emerald-50 text-emerald-800 border-emerald-250 shadow-sm" 
                              : "bg-white text-slate-650 hover:text-slate-900 hover:bg-slate-50 border-slate-200 shadow-3xs"
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" />
                              <span>已複製成果</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-400" />
                              <span>一鍵複製結果</span>
                            </>
                          )}
                        </button>

                        {/* 下載 MD */}
                        <button
                          onClick={handleDownloadFile}
                          className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold select-none cursor-pointer border transition-all duration-200 ${
                            isDownloaded
                              ? "bg-indigo-50 text-indigo-800 border-indigo-250 shadow-sm"
                              : "bg-white text-slate-650 hover:text-slate-900 hover:bg-slate-50 border-slate-200 shadow-3xs"
                          }`}
                        >
                          {isDownloaded ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-indigo-600 font-bold" />
                              <span>已下載</span>
                            </>
                          ) : (
                            <>
                              <FileDown className="w-3.5 h-3.5 text-slate-400" />
                              <span>下載 .md 檔</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Markdown 預覽 or Raw */}
                    <div className="bg-slate-50/30 border border-slate-200 rounded-xl p-6 min-h-[420px] overflow-x-auto text-slate-700 font-sans shadow-3xs">
                      {activeTab === "render" ? (
                        <div className="markdown-body prose prose-slate max-w-none text-slate-700 font-normal leading-relaxed">
                          <Markdown>{resultText}</Markdown>
                        </div>
                      ) : (
                        <pre className="text-xs text-slate-600 font-mono whitespace-pre-wrap select-all selection:bg-indigo-100 bg-white border border-slate-105 p-4 rounded-lg">
                          {resultText}
                        </pre>
                      )}
                    </div>

                  </div>
                ) : (
                  /* 空空如也畫面 */
                  <div className="flex-1 flex flex-col items-center justify-center py-16 text-center select-none bg-slate-50/50 rounded-2xl border border-slate-100">
                    <div className="bg-slate-100 border border-slate-200 p-5 rounded-full mb-4 shadow-3xs">
                      <Sparkles className="w-8 h-8 text-indigo-500/70" />
                    </div>
                    <h4 className="text-slate-800 font-bold text-sm mb-2 font-display">會議記錄 AI 智能化系統</h4>
                    <p className="text-xs text-slate-500 max-w-md leading-relaxed px-4">
                      請在左側貼上您的會議記錄或逐字稿。您也可以直接點擊「快速匯入」擬真範例進行預覽與對焦。點擊「生成總結」一鍵享受智能化高階排版。
                    </p>
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>

      </main>

      {/* 頁尾 */}
      <footer id="app_footer" className="border-t border-slate-200 bg-white py-6 mt-12 text-xs text-slate-500 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-2">
          <p>© 2026 會議記錄 AI 智能化生成與多語翻譯大師 - 繁體中文商業級全棧整合工具</p>
          <p className="font-mono text-[10px] text-slate-400">
            基於 Node.js Express 頂級後端與 Google Gemini 3.5 精準語境模型技術構建
          </p>
        </div>
      </footer>

    </div>
  );
}
