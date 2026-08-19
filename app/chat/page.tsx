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

const copy = {
  en: {
    brand: "HerAI Mashroo3",
    profile: "Profile",
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
    deleteTitle: "Delete this chat?",
    deleteMessage:
      "Are you sure you want to delete this conversation? This action cannot be undone.",
    cancel: "Cancel",
    delete: "Delete",
    deleting: "Deleting...",
  },

  ar: {
    brand: "HerAI Mashroo3",
    profile: "الملف الشخصي",
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
    deleteTitle: "حذف المحادثة؟",
    deleteMessage:
      "هل أنتِ متأكدة من حذف هذه المحادثة؟ لا يمكن التراجع عن هذا الإجراء.",
    cancel: "إلغاء",
    delete: "حذف",
    deleting: "جاري الحذف...",
  },
} as const;

export default function ChatPage() {
  const [lang, setLang] = useState<Lang>("ar");
  const [country, setCountry] = useState<Country>("EG");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<
    ConversationSummary[]
  >([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

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
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isTyping]);

  useEffect(() => {
    textareaRef.current?.focus();
    loadConversations();
  }, []);

  useEffect(() => {
    if (!deleteTargetId) return;

    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape" && !isDeleting) {
        setDeleteTargetId(null);
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [deleteTargetId, isDeleting]);

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

  function requestDeleteConversation(
    e: React.MouseEvent,
    id: string
  ) {
    e.stopPropagation();

    if (isDeleting) return;

    setDeleteTargetId(id);
  }

  function cancelDelete() {
    if (isDeleting) return;

    setDeleteTargetId(null);
  }

  async function confirmDeleteConversation() {
    if (!deleteTargetId || isDeleting) return;

    const token = localStorage.getItem("herai_access_token");

    if (!token) {
      setDeleteTargetId(null);
      return;
    }

    setIsDeleting(true);

    try {
      const ok = await deleteConversation(
        deleteTargetId,
        token
      );

      if (ok) {
        setConversations((prev) =>
          prev.filter(
            (conversation) =>
              conversation.id !== deleteTargetId
          )
        );

        if (activeConvId === deleteTargetId) {
          setActiveConvId(null);
          setMessages([]);
        }

        setDeleteTargetId(null);
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    } finally {
      setIsDeleting(false);
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

  function selectConversation(
    conv: ConversationSummary
  ) {
    setActiveConvId(conv.id);

    const msgs: Message[] = [];
    const baseId =
      new Date(conv.created_at).getTime() || Date.now();

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

    setMessages((current) => [
      ...current,
      userMessage,
    ]);

    setInput("");
    setIsTyping(true);

    try {
      const token =
        localStorage.getItem("herai_access_token") ||
        "dummy_token";

      const request: ChatRequest = {
        message: text,
        region_code: country,
        language: lang,
      };

      const response: ChatResponse =
        await sendChatMessage(request, token);

      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: response.response,
      };

      setMessages((current) => [
        ...current,
        assistantMessage,
      ]);

      loadConversations();
    } catch (err: unknown) {
      console.error("Chat error:", err);

      const errorMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: t.error,
      };

      setMessages((current) => [
        ...current,
        errorMessage,
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    sendMessage();
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
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
          <div className="flex shrink-0 items-center gap-3 text-sm font-semibold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1A1A1A] text-xs text-white">
              H
            </span>

            <span>{t.brand}</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Country */}
            <label className="relative">
              <span className="sr-only">
                Select country
              </span>

              <select
                value={country}
                onChange={(event) =>
                  setCountry(
                    event.target.value as Country
                  )
                }
                className="h-9 cursor-pointer appearance-none rounded-full border border-[#1A1A1A]/10 bg-white py-1 pl-3 pr-7 text-xs font-medium outline-none transition hover:border-[#B8860B]/50 focus:border-[#B8860B]"
              >
                <option value="LB">
                  🇱🇧 {t.country.LB}
                </option>

                <option value="EG">
                  🇪🇬 {t.country.EG}
                </option>
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

            {/* Single Profile Button */}
            <a
              href="/profile"
              className="h-9 items-center rounded-full border border-[#1A1A1A]/10 bg-white px-4 text-xs font-semibold transition hover:bg-[#1A1A1A]/[0.03]"
            >
              {t.profile}
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl">
        {/* Desktop Sidebar */}
        <aside className="hidden w-72 shrink-0 border-e border-[#1A1A1A]/10 p-5 lg:flex lg:flex-col">
          <button
            type="button"
            onClick={startNewChat}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#1A1A1A] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2B2B2B]"
          >
            <span className="text-base">+</span>
            {t.newChat}
          </button>

          {/* Chat History */}
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
                  const isActive =
                    activeConvId === conv.id;

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
                        onClick={() =>
                          selectConversation(conv)
                        }
                        className={`flex flex-1 flex-col px-3 py-2.5 text-start ${
                          isActive
                            ? "font-semibold text-[#B8860B]"
                            : "text-[#1A1A1A]/75"
                        }`}
                      >
                        <span className="truncate pr-6 text-xs font-medium">
                          {conv.title}
                        </span>

                        <span className="mt-0.5 text-[10px] text-[#1A1A1A]/35">
                          {new Date(
                            conv.created_at
                          ).toLocaleDateString()}
                        </span>
                      </button>

                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={(e) =>
                          requestDeleteConversation(
                            e,
                            conv.id
                          )
                        }
                        title={t.delete}
                        aria-label={t.delete}
                        className="absolute right-2 top-1/2 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-[#1A1A1A]/30 transition hover:bg-red-100 hover:text-red-600 group-hover:flex"
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
                            d="M3 6h18"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8 6V4.5A1.5 1.5 0 0 1 9.5 3h5A1.5 1.5 0 0 1 16 4.5V6"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 6l-.7 13.1A2 2 0 0 1 16.3 21H7.7a2 2 0 0 1-2-1.9L5 6"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M10 10v7M14 10v7"
                          />
                        </svg>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </aside>

        {/* Chat Area */}
        <section className="flex min-w-0 flex-1 flex-col">
          {/* Mobile New Chat Bar */}
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
            {/* Empty State */}
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
                  {suggestions.map(
                    (suggestion) => (
                      <button
                        key={suggestion.label}
                        type="button"
                        onClick={() =>
                          sendMessage(
                            suggestion.value
                          )
                        }
                        dir={
                          lang === "ar"
                            ? "rtl"
                            : "ltr"
                        }
                        className="group rounded-2xl border border-[#1A1A1A]/10 bg-white p-4 text-start transition hover:-translate-y-0.5 hover:border-[#B8860B]/35 hover:shadow-md"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-medium">
                            {suggestion.label}
                          </span>

                          <span className="text-[#1A1A1A]/20 transition group-hover:text-[#B8860B]">
                            {lang === "ar"
                              ? "←"
                              : "→"}
                          </span>
                        </div>
                      </button>
                    )
                  )}
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
                      {message.role ===
                      "assistant" ? (
                        <div className="flex max-w-[88%] items-start gap-3 sm:max-w-[80%]">
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#1A1A1A] text-[11px] font-bold text-white">
                            H
                          </div>

                          <div>
                            <div
                              dir={
                                lang === "ar"
                                  ? "rtl"
                                  : "ltr"
                              }
                              className={`whitespace-pre-wrap rounded-2xl border border-[#1A1A1A]/10 bg-white px-4 py-3.5 text-sm leading-7 shadow-sm ${
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
                          dir={
                            lang === "ar"
                              ? "rtl"
                              : "ltr"
                          }
                          className={`max-w-[82%] whitespace-pre-wrap rounded-2xl bg-[#1A1A1A] px-4 py-3.5 text-sm leading-7 text-white shadow-sm sm:max-w-[72%] ${
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
                    dir={
                      lang === "ar"
                        ? "rtl"
                        : "ltr"
                    }
                    className="relative rounded-3xl border border-[#1A1A1A]/15 bg-white p-2 shadow-lg shadow-[#1A1A1A]/5 focus-within:border-[#B8860B]/50"
                  >
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(event) =>
                        setInput(event.target.value)
                      }
                      onKeyDown={handleKeyDown}
                      rows={1}
                      dir={
                        lang === "ar"
                          ? "rtl"
                          : "ltr"
                      }
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
                      disabled={
                        !input.trim() ||
                        isTyping
                      }
                      aria-label={t.send}
                      className={`absolute bottom-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-[#B8860B] text-white transition hover:bg-[#96700A] disabled:cursor-not-allowed disabled:bg-[#B8860B]/25 ${
                        lang === "ar"
                          ? "left-2.5"
                          : "right-2.5"
                      }`}
                    >
                      <span className="text-sm">
                        ↑
                      </span>
                    </button>
                  </div>
                </form>

                <div className="mt-3 flex flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-start">
                  <p
                    dir={
                      lang === "ar"
                        ? "rtl"
                        : "ltr"
                    }
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

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1A1A1A]/40 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !isDeleting
            ) {
              setDeleteTargetId(null);
            }
          }}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-3xl border border-[#1A1A1A]/10 bg-[#FBF7EC] shadow-2xl"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="p-6 sm:p-7">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v4"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 17h.01"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10.3 4.6 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 4.6a2 2 0 0 0-3.4 0Z"
                    />
                  </svg>
                </div>

                <div className="min-w-0">
                  <h2
                    id="delete-dialog-title"
                    className="text-lg font-semibold tracking-tight"
                  >
                    {t.deleteTitle}
                  </h2>

                  <p
                    dir={
                      lang === "ar"
                        ? "rtl"
                        : "ltr"
                    }
                    className="mt-2 text-sm leading-6 text-[#1A1A1A]/55"
                  >
                    {t.deleteMessage}
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`flex gap-3 border-t border-[#1A1A1A]/10 bg-white/60 p-4 ${
                lang === "ar"
                  ? "flex-row-reverse"
                  : "flex-row justify-end"
              }`}
            >
              <button
                type="button"
                onClick={cancelDelete}
                disabled={isDeleting}
                className="rounded-xl border border-[#1A1A1A]/10 bg-white px-5 py-2.5 text-sm font-semibold text-[#1A1A1A]/70 transition hover:bg-[#1A1A1A]/5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t.cancel}
              </button>

              <button
                type="button"
                onClick={confirmDeleteConversation}
                disabled={isDeleting}
                className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting
                  ? t.deleting
                  : t.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}