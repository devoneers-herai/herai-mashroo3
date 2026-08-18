"use client";

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  sendChatMessage,
  getConversations,
  deleteConversation,
  ChatRequest,
  ChatResponse,
  ConversationSummary,
} from "@/lib/api";

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
    error: "Something went wrong. Please check your connection and try again.",
    pricing: "How should I price my product?",
    customers: "How can I find more customers?",
    costs: "How do I understand my costs?",
    growth: "How can I grow my business?",
    safety:
      "HerAI is designed to provide practical guidance, not professional legal, financial, or medical advice.",
    online: "Online",
    recentChats: "Recent Chats",
    noChats: "No previous chats yet",
    country: {
      LB: "Lebanon",
      EG: "Egypt",
    },
    language: "Language",
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
    error: "حدث خطأ ما. يرجى التحقق من اتصالك والمحاولة مرة أخرى.",
    pricing: "أسعّر المنتج بتاعي بكام؟",
    customers: "أوصل لعملاء أكتر إزاي؟",
    costs: "أفهم مصاريفي وتكلفتي إزاي؟",
    growth: "أكبر مشروعي إزاي؟",
    safety:
      "HerAI مصمم لتقديم إرشاد عملي، وليس بديلاً عن الاستشارة القانونية أو المالية أو الطبية المتخصصة.",
    online: "متصل",
    recentChats: "المحادثات السابقة",
    noChats: "لا توجد محادثات سابقة",
    country: {
      LB: "لبنان",
      EG: "مصر",
    },
    language: "اللغة",
  },
} as const;

export default function ChatPage() {
  const [lang, setLang] = useState<Lang>("ar");
  const [country, setCountry] = useState<Country>("EG");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const t = copy[lang];

  const suggestions = useMemo(
    () => [
      { label: t.pricing, value: t.pricing },
      { label: t.customers, value: t.customers },
      { label: t.costs, value: t.costs },
      { label: t.growth, value: t.growth },
    ],
    [t]
  );

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    textareaRef.current?.focus();
    loadConversations();
  }, []);

  async function loadConversations() {
    const token = localStorage.getItem("herai_access_token");
    if (!token) return;

    try {
      const convList = await getConversations(token);
      setConversations(convList);
    } catch (err) {
      console.error("Failed to load conversations:", err);
    }
  }

  async function handleDeleteConversation(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    const token = localStorage.getItem("herai_access_token");
    if (!token) return;
    const ok = await deleteConversation(id, token);
    if (ok) {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConvId === id) {
        setActiveConvId(null);
        setMessages([]);
      }
    }
  }

  function startNewChat() {
    setMessages([]);
    setActiveConvId(null);
    setInput("");
    setIsTyping(false);

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  }

  function selectConversation(conv: ConversationSummary) {
    setActiveConvId(conv.id);
    const msgs: Message[] = [];
    const baseId = new Date(conv.created_at).getTime() || Date.now();

    if (conv.user_message) {
      msgs.push({
        id: baseId,
        role: "user",
        content: conv.user_message,
      });
    }

    if (conv.assistant_message) {
      msgs.push({
        id: baseId + 1,
        role: "assistant",
        content: conv.assistant_message,
      });
    }

    setMessages(msgs);
  }

  async function sendMessage(value?: string) {
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

    try {
      const token =
        localStorage.getItem("herai_access_token") || "dummy_token";

      const request: ChatRequest = {
        message: text,
        region_code: country,
        language: lang,
      };

      const response: ChatResponse = await sendChatMessage(request, token);

      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: response.response,
      };

      setMessages((current) => [...current, assistantMessage]);

      // Refresh sidebar list after sending
      loadConversations();
    } catch (err: any) {
      console.error("Chat error:", err);
      const errorMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: t.error,
      };
      setMessages((current) => [...current, errorMessage]);
    } finally {
      setIsTyping(false);
    }
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
                className={`px-3 py-1.5 transition ${
                  lang === "en"
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
                className={`px-3 py-1.5 transition ${
                  lang === "ar"
                    ? "bg-[#1A1A1A] text-white"
                    : "text-[#1A1A1A]/55 hover:text-[#1A1A1A]"
                }`}
              >
                عربي
              </button>
            </div>

            {/* Profile Link */}
            <a
              href="/profile"
              className="hidden h-9 items-center rounded-full border border-[#1A1A1A]/10 bg-white px-4 text-xs font-semibold transition hover:bg-[#1A1A1A]/[0.03] sm:inline-flex"
            >
              Profile
            </a>

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
        {/* Desktop ChatGPT-Style Sidebar */}
        <aside className="hidden w-72 shrink-0 border-e border-[#1A1A1A]/10 p-5 lg:flex lg:flex-col">
          <button
            type="button"
            onClick={startNewChat}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#1A1A1A] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2B2B2B]"
          >
            <span className="text-base">+</span>
            {t.newChat}
          </button>

          {/* ChatGPT-style History List */}
          <div className="mt-6 flex-1 overflow-y-auto">
            <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1A1A1A]/40">
              {t.recentChats}
            </p>

            <div className="mt-2 space-y-1.5">
              {conversations.length === 0 ? (
                <p className="px-2 py-4 text-xs text-[#1A1A1A]/35">
                  {t.noChats}
                </p>
              ) : (
                conversations.map((conv) => {
                  const isActive = activeConvId === conv.id;
                  return (
                    <div
                      key={conv.id}
                      className={`group relative flex w-full items-center rounded-xl transition ${
                        isActive
                          ? "bg-[#B8860B]/15"
                          : "hover:bg-[#1A1A1A]/5"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => selectConversation(conv)}
                        className={`flex flex-1 flex-col px-3 py-2.5 text-start ${
                          isActive ? "text-[#B8860B] font-semibold" : "text-[#1A1A1A]/75"
                        }`}
                      >
                        <span className="truncate text-xs font-medium pr-6">
                          {conv.title}
                        </span>
                        <span className="mt-0.5 text-[10px] text-[#1A1A1A]/35">
                          {new Date(conv.created_at).toLocaleDateString()}
                        </span>
                      </button>

                      {/* Delete button — visible on hover */}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteConversation(e, conv.id)}
                        title="Delete chat"
                        className="absolute right-2 top-1/2 -translate-y-1/2 hidden h-6 w-6 items-center justify-center rounded-md text-[#1A1A1A]/30 transition hover:bg-red-100 hover:text-red-600 group-hover:flex"
                      >
                        🗑
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 border-t border-[#1A1A1A]/10 pt-4">
            <div className="rounded-2xl border border-[#B8860B]/20 bg-[#B8860B]/[0.06] p-4">
              <p className="text-xs font-semibold text-[#96700A]">
                Pilot program
              </p>

              <p className="mt-1.5 text-xs leading-5 text-[#1A1A1A]/55">
                Bring HerAI to your organization or cohort.
              </p>

              <a
                href={pilotFormUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2.5 inline-flex text-xs font-semibold text-[#96700A] hover:underline"
              >
                Run a pilot →
              </a>
            </div>
          </div>
        </aside>

        {/* Chat Area */}
        <section className="flex min-w-0 flex-1 flex-col">
          {/* Mobile history / new chat bar */}
          <div className="flex items-center justify-between border-b border-[#1A1A1A]/10 px-4 py-3 lg:hidden">
            <span className="text-xs font-medium text-[#1A1A1A]/45">
              HerAI · {t.country[country]}
            </span>

            <button
              type="button"
              onClick={startNewChat}
              className="rounded-full border border-[#1A1A1A]/10 bg-white px-3 py-1.5 text-xs font-semibold"
            >
              + {t.newChat}
            </button>
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
                    <div
                      key={message.id}
                      dir="ltr"
                      className={`flex ${
                        message.role === "user"
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
                              className={`rounded-2xl border border-[#1A1A1A]/10 bg-white px-4 py-3.5 text-sm leading-7 shadow-sm whitespace-pre-wrap ${
                                lang === "ar"
                                  ? "rounded-bl-sm text-right"
                                  : "rounded-bl-sm text-left"
                              }`}
                            >
                              {message.content}
                            </div>

                            <span
                              dir="ltr"
                              className="mt-2 block px-1 text-[10px] text-[#1A1A1A]/30"
                            >
                              HerAI
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div
                          dir={lang === "ar" ? "rtl" : "ltr"}
                          className={`max-w-[82%] rounded-2xl bg-[#1A1A1A] px-4 py-3.5 text-sm leading-7 text-white shadow-sm sm:max-w-[72%] whitespace-pre-wrap ${
                            lang === "ar"
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
                <form onSubmit={handleSubmit}>
                  <div
                    dir={lang === "ar" ? "rtl" : "ltr"}
                    className="relative rounded-3xl border border-[#1A1A1A]/15 bg-white p-2 shadow-lg shadow-[#1A1A1A]/5 focus-within:border-[#B8860B]/50"
                  >
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      onKeyDown={handleKeyDown}
                      rows={1}
                      dir={lang === "ar" ? "rtl" : "ltr"}
                      placeholder={t.placeholder}
                      disabled={isTyping}
                      className={`max-h-40 min-h-12 w-full resize-none bg-transparent py-3 text-sm leading-6 outline-none placeholder:text-[#1A1A1A]/30 disabled:cursor-not-allowed ${
                        lang === "ar"
                          ? "pl-14 pr-3 text-right"
                          : "pl-3 pr-14 text-left"
                      }`}
                    />

                    <button
                      type="submit"
                      disabled={!input.trim() || isTyping}
                      aria-label={t.send}
                      className={`absolute bottom-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-[#B8860B] text-white transition hover:bg-[#96700A] disabled:cursor-not-allowed disabled:bg-[#B8860B]/25 ${
                        lang === "ar" ? "left-2.5" : "right-2.5"
                      }`}
                    >
                      <span className="text-sm">↑</span>
                    </button>
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