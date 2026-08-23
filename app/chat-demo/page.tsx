"use client";

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type Lang = "en" | "ar";
type Country = "LB" | "EG";

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

const pilotFormUrl =
  "https://docs.google.com/forms/d/e/1FAIpQLSc3VlgXHo7Uohw5n07HXfDxr012KoWiLzkBnLyfkAEWh7xt_g/viewform";

const copy = {
  en: {
    brand: "HerAI Mashroo3",
    back: "Back to website",
    newChat: "New chat",
    title: "How can I help with your business?",
    subtitle:
      "Ask about pricing, customers, suppliers, costs, permits, growth, or risks.",
    placeholder: "Ask HerAI a question...",
    send: "Send",
    welcome:
      "Hi! I’m HerAI. Tell me what you’re working on, and I’ll help you think through the next step.",
    demoReply:
      "Absolutely. For now, I’m a UI-only preview, so the real HerAI intelligence isn’t connected yet. Your question was received successfully.",
    pricing: "How should I price my product?",
    customers: "How can I find more customers?",
    costs: "How do I understand my costs?",
    growth: "How can I grow my business?",
    safety:
      "HerAI is designed to provide practical guidance, not professional legal, financial, or medical advice.",
    online: "Preview mode",
    country: {
      LB: "Lebanon",
      EG: "Egypt",
    },
    language: "Language",
    voiceAnswers: "Voice responses",
    voiceAnswersDesc: "Read AI responses out loud",
    voiceEnabled: "Voice readout ON",
    voiceDisabled: "Voice readout OFF",
    voiceInput: "Voice Input",
    listening: "Listening... speak now",
    stopListening: "Done speaking",
    speechNotSupported: "Speech recognition is not supported in this browser.",
    micPermissionDenied:
      "Microphone access was denied. Please allow microphone permissions in your browser.",
    readMessage: "Read aloud",
    stopReading: "Stop audio",
  },

  ar: {
    brand: "HerAI Mashroo3",
    back: "العودة للموقع",
    newChat: "محادثة جديدة",
    title: "إزاي ممكن أساعدك في شغلك؟",
    subtitle:
      "اسألي عن التسعير، العملاء، الموردين، المصاريف، التراخيص، النمو أو المخاطر.",
    placeholder: "اكتبي سؤالك لـ HerAI...",
    send: "إرسال",
    welcome:
      "أهلاً! أنا HerAI. احكيلي عن شغلك أو المشروع اللي بتشتغلي عليه، ونفكر سوا في الخطوة الجاية.",
    demoReply:
      "أكيد. حالياً دي مجرد معاينة للواجهة، ولسه ذكاء HerAI الحقيقي مش متوصل بالـ backend. سؤالك اتسجل بنجاح.",
    pricing: "أسعّر المنتج بتاعي بكام؟",
    customers: "أوصل لعملاء أكتر إزاي؟",
    costs: "أفهم مصاريفي وتكلفتي إزاي؟",
    growth: "أكبر مشروعي إزاي؟",
    safety:
      "HerAI مصمم لتقديم إرشاد عملي، وليس بديلاً عن الاستشارة القانونية أو المالية أو الطبية المتخصصة.",
    online: "وضع المعاينة",
    country: {
      LB: "لبنان",
      EG: "مصر",
    },
    language: "اللغة",
    voiceAnswers: "الرد الصوتي",
    voiceAnswersDesc: "قراءة إجابات الذكاء الاصطناعي صوتياً",
    voiceEnabled: "القراءة الصوتية مفعلة",
    voiceDisabled: "الردود صامتة (مكتوبة)",
    voiceInput: "إدخال صوتي",
    listening: "جاري الاستماع... تحدث الآن",
    stopListening: "إنهاء التحدث",
    speechNotSupported: "خاصية التعرف الصوتي غير مدعومة في هذا المتصفح.",
    micPermissionDenied:
      "تم رفض إذن الميكروفون. يُرجى السماح بالوصول للميكروفون من إعدادات المتصفح.",
    readMessage: "استماع للإجابة",
    stopReading: "إيقاف الصوت",
  },
} as const;

export default function ChatPage() {
  const [lang, setLang] = useState<Lang>("ar");
  const [country, setCountry] = useState<Country>("EG");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  /*
   * Voice settings and state
   */
  const [isVoiceOutputEnabled, setIsVoiceOutputEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<number | null>(
    null
  );
  const [speechError, setSpeechError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const t = copy[lang];

  // Load saved voice preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem("herai_voice_output");
      if (saved !== null) {
        setIsVoiceOutputEnabled(saved === "true");
      }
    } catch {
      // ignore
    }
  }, []);

  function toggleVoiceOutput() {
    setIsVoiceOutputEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("herai_voice_output", String(next));
      } catch {
        // ignore
      }
      if (!next && typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        setSpeakingMessageId(null);
      }
      return next;
    });
  }

  function cleanTextForSpeech(text: string): string {
    return text
      .replace(/[*#_~`>\[\]\(\)]/g, " ")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function speakMessage(messageId: number, text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    if (speakingMessageId === messageId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();

    const clean = cleanTextForSpeech(text);
    if (!clean) return;

    const utterance = new SpeechSynthesisUtterance(clean);
    const targetLang =
      lang === "ar" ? (country === "EG" ? "ar-EG" : "ar-SA") : "en-US";
    utterance.lang = targetLang;

    try {
      const voices = window.speechSynthesis.getVoices();
      const matchedVoice = voices.find((v) =>
        v.lang.toLowerCase().startsWith(lang === "ar" ? "ar" : "en")
      );
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }
    } catch {
      // ignore
    }

    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setSpeakingMessageId(messageId);
    };
    utterance.onend = () => {
      setSpeakingMessageId(null);
    };
    utterance.onerror = () => {
      setSpeakingMessageId(null);
    };

    window.speechSynthesis.speak(utterance);
  }

  function stopSpeaking() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMessageId(null);
  }

  function toggleListening() {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError(t.speechNotSupported);
      setTimeout(() => setSpeechError(null), 4000);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang =
        lang === "ar"
          ? country === "EG"
            ? "ar-EG"
            : "ar-LB"
          : "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setInput((prev) => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${transcript}` : transcript;
          });
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (
          event.error === "not-allowed" ||
          event.error === "service-not-allowed"
        ) {
          setSpeechError(t.micPermissionDenied);
          setTimeout(() => setSpeechError(null), 5000);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error("Error starting speech recognition:", err);
      setIsListening(false);
    }
  }

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const suggestions = useMemo(
    () => [
      { label: t.pricing, value: t.pricing },
      { label: t.customers, value: t.customers },
      { label: t.costs, value: t.costs },
      { label: t.growth, value: t.growth },
    ],
    [t]
  );

  /*
   * Keep the document direction correct for the overall UI.
   *
   * Chat message rows are explicitly LTR below. This is intentional:
   * the user bubble must remain physically on the RIGHT and HerAI's
   * bubble must remain physically on the LEFT in both languages.
   */
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  function startNewChat() {
    stopSpeaking();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);

    setMessages([]);
    setInput("");
    setIsTyping(false);

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  }

  function sendMessage(value?: string) {
    const text = (value ?? input).trim();

    if (!text || isTyping) return;

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: text,
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setIsTyping(true);

    window.setTimeout(() => {
      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: t.demoReply,
      };

      setMessages((current) => [...current, assistantMessage]);
      setIsTyping(false);

      if (isVoiceOutputEnabled) {
        speakMessage(assistantMessage.id, t.demoReply);
      }
    }, 850);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendMessage();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  const hasMessages = messages.length > 0;

  return (
    <main className="min-h-screen bg-[#FBF7EC] text-[#1A1A1A]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#1A1A1A]/10 bg-[#FBF7EC]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <a
            href="/"
            className="flex shrink-0 items-center gap-3 text-sm font-semibold tracking-tight"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1A1A1A] text-xs text-white">
              H
            </span>
            <span>{t.brand}</span>
          </a>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Country */}
            <label className="relative">
              <span className="sr-only">Select country</span>
              <select
                value={country}
                onChange={(event) =>
                  setCountry(event.target.value as Country)
                }
                className="h-9 cursor-pointer appearance-none rounded-full border border-[#1A1A1A]/10 bg-white py-1 pl-3 pr-7 text-xs font-medium outline-none transition hover:border-[#B8860B]/50 focus:border-[#B8860B]"
              >
                <option value="LB">🇱🇧 {t.country.LB}</option>
                <option value="EG">🇪🇬 {t.country.EG}</option>
              </select>
            </label>

            {/* Language */}
            <div
              role="group"
              aria-label={t.language}
              className="inline-flex overflow-hidden rounded-full border border-[#1A1A1A]/10 bg-white text-xs font-medium"
            >
              <button
                type="button"
                onClick={() => setLang("en")}
                aria-pressed={lang === "en"}
                className={`px-3 py-1.5 transition ${lang === "en"
                  ? "bg-[#1A1A1A] text-white"
                  : "text-[#1A1A1A]/55 hover:text-[#1A1A1A]"
                  }`}
              >
                EN
              </button>

              <button
                type="button"
                onClick={() => setLang("ar")}
                aria-pressed={lang === "ar"}
                className={`px-3 py-1.5 transition ${lang === "ar"
                  ? "bg-[#1A1A1A] text-white"
                  : "text-[#1A1A1A]/55 hover:text-[#1A1A1A]"
                  }`}
              >
                عربي
              </button>
            </div>

            {/* Back */}
            <a
              href="/"
              className="hidden h-9 items-center rounded-full border border-[#1A1A1A]/10 bg-white px-4 text-xs font-semibold transition hover:bg-[#1A1A1A]/[0.03] sm:inline-flex"
            >
              {t.back}
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 border-e border-[#1A1A1A]/10 p-5 lg:flex lg:flex-col">
          <button
            type="button"
            onClick={startNewChat}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#1A1A1A] px-4 text-sm font-semibold text-white transition hover:bg-[#2B2B2B]"
          >
            <span className="text-base">+</span>
            {t.newChat}
          </button>

          {/* Voice Response Toggle under New Chat */}
          <div className="mt-3 rounded-2xl border border-[#1A1A1A]/10 bg-white/80 p-3 shadow-sm backdrop-blur-sm transition-all hover:bg-white">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors ${isVoiceOutputEnabled
                      ? "bg-[#B8860B]/15 text-[#B8860B]"
                      : "bg-[#1A1A1A]/5 text-[#1A1A1A]/40"
                    }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-4 w-4"
                  >
                    {isVoiceOutputEnabled ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.414 0-.75-.336-.75-.75V9c0-.414.336-.75.75-.75h2.24Z"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-3.75 4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.414 0-.75-.336-.75-.75V9c0-.414.336-.75.75-.75h2.24Z"
                      />
                    )}
                  </svg>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-[#1A1A1A]">
                    {t.voiceAnswers}
                  </p>
                  <p className="truncate text-[10px] text-[#1A1A1A]/45">
                    {isVoiceOutputEnabled
                      ? t.voiceEnabled
                      : t.voiceDisabled}
                  </p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={isVoiceOutputEnabled}
                onClick={toggleVoiceOutput}
                title={t.voiceAnswers}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isVoiceOutputEnabled
                    ? "bg-[#B8860B]"
                    : "bg-[#1A1A1A]/20"
                  }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${isVoiceOutputEnabled
                      ? lang === "ar"
                        ? "-translate-x-5"
                        : "translate-x-5"
                      : "translate-x-0"
                    }`}
                />
              </button>
            </div>
          </div>

          <div className="mt-8">
            <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1A1A1A]/35">
              HerAI
            </p>

            <div className="mt-3 rounded-2xl border border-[#1A1A1A]/10 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#B8860B]/10 text-sm font-bold text-[#B8860B]">
                  H
                </div>

                <div>
                  <p className="text-sm font-semibold">HerAI</p>
                  <p className="mt-0.5 text-[11px] text-[#1A1A1A]/45">
                    {t.online}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto rounded-2xl border border-[#B8860B]/20 bg-[#B8860B]/[0.06] p-4">
            <p className="text-xs font-semibold text-[#96700A]">
              Pilot program
            </p>

            <p className="mt-2 text-xs leading-5 text-[#1A1A1A]/55">
              Bring HerAI to your organization or cohort.
            </p>

            <a
              href="/login"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex text-xs font-semibold text-[#96700A] hover:underline"
            >
              Run a pilot →
            </a>
          </div>
        </aside>

        {/* Chat */}
        <section className="flex min-w-0 flex-1 flex-col">
          {/* Mobile new chat */}
          <div className="flex items-center justify-between border-b border-[#1A1A1A]/10 px-4 py-3 lg:hidden">
            <span className="text-xs font-medium text-[#1A1A1A]/45">
              HerAI · {t.country[country]}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleVoiceOutput}
                title={t.voiceAnswers}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-medium transition ${isVoiceOutputEnabled
                    ? "border-[#B8860B]/40 bg-[#B8860B]/10 text-[#B8860B]"
                    : "border-[#1A1A1A]/10 bg-white text-[#1A1A1A]/60"
                  }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-3.5 w-3.5"
                >
                  {isVoiceOutputEnabled ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.414 0-.75-.336-.75-.75V9c0-.414.336-.75.75-.75h2.24Z"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-3.75 4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.414 0-.75-.336-.75-.75V9c0-.414.336-.75.75-.75h2.24Z"
                    />
                  )}
                </svg>
                <span className="text-[11px]">
                  {isVoiceOutputEnabled ? t.voiceEnabled : t.voiceAnswers}
                </span>
              </button>

              <button
                type="button"
                onClick={startNewChat}
                className="rounded-full border border-[#1A1A1A]/10 bg-white px-3 py-1.5 text-xs font-semibold"
              >
                + {t.newChat}
              </button>
            </div>
          </div>

          <div className="flex flex-1 flex-col">
            {/* Empty state */}
            {!hasMessages ? (
              <div className="flex flex-1 flex-col items-center justify-center px-4 pb-10 pt-12 sm:px-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1A1A1A] text-xl font-semibold text-white shadow-lg shadow-[#1A1A1A]/10">
                  H
                </div>

                <h1 className="mt-7 max-w-2xl text-center text-3xl font-semibold tracking-tight sm:text-4xl">
                  {t.title}
                </h1>

                <p className="mt-4 max-w-xl text-center text-sm leading-7 text-[#1A1A1A]/55 sm:text-base">
                  {t.subtitle}
                </p>

                <div className="mt-9 grid w-full max-w-2xl gap-3 sm:grid-cols-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.label}
                      type="button"
                      onClick={() => sendMessage(suggestion.value)}
                      dir={lang === "ar" ? "rtl" : "ltr"}
                      className="group rounded-2xl border border-[#1A1A1A]/10 bg-white p-4 text-start transition hover:-translate-y-0.5 hover:border-[#B8860B]/35 hover:shadow-md"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium">
                          {suggestion.label}
                        </span>

                        <span className="text-[#1A1A1A]/20 transition group-hover:text-[#B8860B]">
                          {lang === "ar" ? "←" : "→"}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Messages */
              <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-8">
                <div className="mx-auto max-w-3xl space-y-7">
                  {messages.map((message) => (
                    /*
                     * Message ROW is always LTR.
                     * This controls physical placement only:
                     * user = right, HerAI = left.
                     *
                     * The actual message bubbles below get their own
                     * direction so Arabic text itself still renders RTL.
                     */
                    <div
                      key={message.id}
                      dir="ltr"
                      className={`flex ${message.role === "user"
                        ? "justify-end"
                        : "justify-start"
                        }`}
                    >
                      {message.role === "assistant" ? (
                        <div className="flex max-w-[88%] items-start gap-3 sm:max-w-[80%]">
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#1A1A1A] text-[11px] font-bold text-white">
                            H
                          </div>

                          <div>
                            <div
                              dir={lang === "ar" ? "rtl" : "ltr"}
                              className={`rounded-2xl border border-[#1A1A1A]/10 bg-white px-4 py-3.5 text-sm leading-7 shadow-sm ${lang === "ar"
                                ? "rounded-bl-sm text-right"
                                : "rounded-bl-sm text-left"
                                }`}
                            >
                              {message.content}
                            </div>

                            <div className="mt-2 flex items-center gap-2 px-1">
                              <span
                                dir="ltr"
                                className="text-[10px] text-[#1A1A1A]/30"
                              >
                                HerAI
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  speakMessage(
                                    message.id,
                                    message.content
                                  )
                                }
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-medium transition ${speakingMessageId === message.id
                                    ? "bg-[#B8860B] text-white shadow-sm"
                                    : "bg-[#1A1A1A]/5 text-[#1A1A1A]/60 hover:bg-[#1A1A1A]/10 hover:text-[#1A1A1A]"
                                  }`}
                                title={
                                  speakingMessageId === message.id
                                    ? t.stopReading
                                    : t.readMessage
                                }
                              >
                                {speakingMessageId === message.id ? (
                                  <>
                                    <span className="flex h-2 items-center gap-0.5">
                                      <span className="h-1.5 w-0.5 animate-pulse bg-white" />
                                      <span className="h-3 w-0.5 animate-pulse bg-white [animation-delay:150ms]" />
                                      <span className="h-2 w-0.5 animate-pulse bg-white [animation-delay:300ms]" />
                                    </span>
                                    <span>{t.stopReading}</span>
                                  </>
                                ) : (
                                  <>
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                      className="h-3 w-3"
                                    >
                                      <path d="M10 3.75a.75.75 0 0 0-1.264-.546L4.703 7H3.167C2.457 7 2 7.55 2 8.25v3.5c0 .7.457 1.25 1.167 1.25h1.536l4.033 3.796A.75.75 0 0 0 10 16.25V3.75ZM14.78 7.22a.75.75 0 0 1 1.06 0 6.75 6.75 0 0 1 0 9.56.75.75 0 1 1-1.06-1.06 5.25 5.25 0 0 0 0-7.44.75.75 0 0 1 0-1.06Zm-2.12 2.12a.75.75 0 0 1 1.06 0 3.75 3.75 0 0 1 0 5.31.75.75 0 1 1-1.06-1.06 2.25 2.25 0 0 0 0-3.19.75.75 0 0 1 0-1.06Z" />
                                    </svg>
                                    <span>{t.readMessage}</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          dir={lang === "ar" ? "rtl" : "ltr"}
                          className={`max-w-[82%] rounded-2xl bg-[#1A1A1A] px-4 py-3.5 text-sm leading-7 text-white shadow-sm sm:max-w-[72%] ${lang === "ar"
                            ? "rounded-br-sm text-right"
                            : "rounded-br-sm text-left"
                            }`}
                        >
                          {message.content}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Typing indicator */}
                  {isTyping && (
                    <div
                      dir="ltr"
                      className="flex items-start justify-start gap-3"
                    >
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#1A1A1A] text-[11px] font-bold text-white">
                        H
                      </div>

                      <div className="rounded-2xl rounded-bl-sm border border-[#1A1A1A]/10 bg-white px-5 py-4 shadow-sm">
                        <div className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#1A1A1A]/35" />
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#1A1A1A]/35 [animation-delay:150ms]" />
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#1A1A1A]/35 [animation-delay:300ms]" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={bottomRef} />
                </div>
              </div>
            )}

            {/* Composer */}
            <div className="border-t border-[#1A1A1A]/10 bg-[#FBF7EC]/95 px-4 pb-4 pt-4 backdrop-blur-xl sm:px-8 sm:pb-6">
              <div className="mx-auto max-w-3xl">
                {/* Speech Error Banner */}
                {speechError && (
                  <div className="mb-2.5 flex items-center justify-between rounded-2xl border border-red-200 bg-red-50/90 px-3.5 py-2 text-xs text-red-700 backdrop-blur-sm animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <svg
                        className="h-4 w-4 shrink-0 text-red-500"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{speechError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSpeechError(null)}
                      className="text-red-500 hover:text-red-700 text-sm font-semibold"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Active Listening Indicator */}
                {isListening && (
                  <div className="mb-2.5 flex items-center justify-between rounded-2xl border border-[#B8860B]/30 bg-[#B8860B]/10 px-4 py-2 text-xs font-medium text-[#B8860B] backdrop-blur-sm">
                    <div className="flex items-center gap-2.5">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500"></span>
                      </span>
                      <span>{t.listening}</span>
                    </div>
                    <button
                      type="button"
                      onClick={toggleListening}
                      className="text-xs font-semibold underline underline-offset-2 hover:text-[#96700A]"
                    >
                      {t.stopListening}
                    </button>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  {/* IMPORTANT:
                      The composer itself has an explicit direction.
                      This prevents RTL from changing the physical
                      positioning of the send-button/padding logic.
                  */}
                  <div
                    dir={lang === "ar" ? "rtl" : "ltr"}
                    className="relative rounded-3xl border border-[#1A1A1A]/15 bg-white p-2 shadow-lg shadow-[#1A1A1A]/5 focus-within:border-[#B8860B]/50"
                  >
                    {/* Reserve space for the send button on the same side
                        as its physical position for the active language. */}
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      onKeyDown={handleKeyDown}
                      rows={1}
                      dir={lang === "ar" ? "rtl" : "ltr"}
                      placeholder={t.placeholder}
                      disabled={isTyping}
                      className={`max-h-40 min-h-12 w-full resize-none bg-transparent py-3 text-sm leading-6 outline-none placeholder:text-[#1A1A1A]/30 disabled:cursor-not-allowed ${lang === "ar"
                        ? "pl-24 pr-3 text-right"
                        : "pl-3 pr-24 text-left"
                        }`}
                    />

                    {/* Action buttons (Mic + Send) */}
                    <div
                      className={`absolute bottom-2.5 flex items-center gap-1.5 ${lang === "ar"
                          ? "left-2.5"
                          : "right-2.5"
                        }`}
                    >
                      {/* Voice input button */}
                      <button
                        type="button"
                        onClick={toggleListening}
                        disabled={isTyping}
                        aria-label={
                          isListening
                            ? t.stopListening
                            : t.voiceInput
                        }
                        title={
                          isListening
                            ? t.stopListening
                            : t.voiceInput
                        }
                        className={`flex h-9 w-9 items-center justify-center rounded-full transition ${isListening
                            ? "bg-red-500 text-white shadow-md shadow-red-500/30 animate-pulse"
                            : "bg-[#1A1A1A]/5 text-[#1A1A1A]/70 hover:bg-[#1A1A1A]/10 hover:text-[#1A1A1A]"
                          } disabled:cursor-not-allowed disabled:opacity-40`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          className="h-4 w-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0V12a3 3 0 0 1-3 3Z"
                          />
                        </svg>
                      </button>

                      {/* Send button */}
                      <button
                        type="submit"
                        disabled={!input.trim() || isTyping}
                        aria-label={t.send}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-[#B8860B] text-white transition hover:bg-[#96700A] disabled:cursor-not-allowed disabled:bg-[#B8860B]/25"
                      >
                        <span className="text-sm">↑</span>
                      </button>
                    </div>
                  </div>
                </form>

                <div className="mt-3 flex flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-start">
                  <p
                    dir={lang === "ar" ? "rtl" : "ltr"}
                    className="text-[10px] leading-5 text-[#1A1A1A]/35"
                  >
                    {t.safety}
                  </p>

                  <p
                    dir="ltr"
                    className="shrink-0 text-[10px] text-[#1A1A1A]/30"
                  >
                    Enter ↵ · Shift + Enter ↵
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}