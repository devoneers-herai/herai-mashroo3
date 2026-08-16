"use client";

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  sendChatMessage,
  getConversations,
  getConversationMessages,
  deleteConversation,
  ChatRequest,
  ChatResponse,
  Conversation,
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
    newChat: "New chat",
    profile: "Profile",
    logout: "Log out",
    title: "How can I help with your business?",
    subtitle:
      "Ask about pricing, customers, suppliers, costs, permits, growth, or risks.",
    placeholder: "Ask HerAI a question...",
    send: "Send",
    error: "Something went wrong. Please check your connection and try again.",
    pricing: "How should I price my product?",
    customers: "How can I find more customers?",
    costs: "How do I understand my costs?",
    growth: "How can I grow my business?",
    safety:
      "HerAI is designed to provide practical guidance, not professional legal, financial, or medical advice.",
    online: "Online",
    history: "Chat history",
    loadingHistory: "Loading chats...",
    noHistory: "No previous conversations.",
    newConversation: "New conversation",
    delete: "Delete conversation",
    deleteTitle: "Delete this conversation?",
    deleteDescription:
      "This conversation and its messages will be permanently deleted. This action cannot be undone.",
    cancel: "Cancel",
    deleteConfirm: "Delete",
    deleting: "Deleting...",
    deleteError:
      "Failed to delete the conversation. Please try again.",
    country: {
      LB: "Lebanon",
      EG: "Egypt",
    },
    language: "Language",
  },

  ar: {
    brand: "HerAI Mashroo3",
    newChat: "محادثة جديدة",
    profile: "الملف الشخصي",
    logout: "تسجيل الخروج",
    title: "إزاي ممكن أساعدك في شغلك؟",
    subtitle:
      "اسألي عن التسعير، العملاء، الموردين، المصاريف، التراخيص، النمو أو المخاطر.",
    placeholder: "اكتبي سؤالك لـ HerAI...",
    send: "إرسال",
    error: "حدث خطأ ما. يرجى التحقق من اتصالك والمحاولة مرة أخرى.",
    pricing: "أسعّر المنتج بتاعي بكام؟",
    customers: "أوصل لعملاء أكتر إزاي؟",
    costs: "أفهم مصاريفي وتكلفتي إزاي؟",
    growth: "أكبر مشروعي إزاي؟",
    safety:
      "HerAI مصمم لتقديم إرشاد عملي، وليس بديلاً عن الاستشارة القانونية أو المالية أو الطبية المتخصصة.",
    online: "متصل",
    history: "المحادثات السابقة",
    loadingHistory: "جاري تحميل المحادثات...",
    noHistory: "لا توجد محادثات سابقة.",
    newConversation: "محادثة جديدة",
    delete: "حذف المحادثة",
    deleteTitle: "حذف هذه المحادثة؟",
    deleteDescription:
      "سيتم حذف هذه المحادثة ورسائلها نهائيًا. لا يمكن التراجع عن هذا الإجراء.",
    cancel: "إلغاء",
    deleteConfirm: "حذف",
    deleting: "جاري الحذف...",
    deleteError:
      "تعذر حذف المحادثة. يرجى المحاولة مرة أخرى.",
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

  const [isTyping, setIsTyping] = useState(false);

  const [conversationId, setConversationId] = useState<
    string | undefined
  >();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Delete modal state
  const [conversationToDelete, setConversationToDelete] =
    useState<Conversation | null>(null);

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const t = copy[lang];

  const suggestions = useMemo(
    () => [
      {
        label: t.pricing,
        value: t.pricing,
      },
      {
        label: t.customers,
        value: t.customers,
      },
      {
        label: t.costs,
        value: t.costs,
      },
      {
        label: t.growth,
        value: t.growth,
      },
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
    loadConversationHistory();
  }, []);

  // Close delete modal with Escape
  useEffect(() => {
    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape" && !isDeleting) {
        setConversationToDelete(null);
        setDeleteError(false);
      }
    }

    if (conversationToDelete) {
      window.addEventListener("keydown", handleEscape);
    }

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [conversationToDelete, isDeleting]);

  async function loadConversationHistory() {
    try {
      setLoadingHistory(true);

      const token =
        localStorage.getItem("herai_access_token") ||
        localStorage.getItem("herai_session") ||
        "";

      if (!token) {
        return;
      }

      const history = await getConversations(token);

      setConversations(history);
    } catch (error) {
      console.error("Failed to load chat history:", error);
    } finally {
      setLoadingHistory(false);
    }
  }

  function startNewChat() {
    setMessages([]);
    setInput("");
    setIsTyping(false);
    setConversationId(undefined);

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  }

  function requestDeleteConversation(id: string) {
    const conversation = conversations.find(
      (item) => item.id === id
    );

    if (!conversation) {
      return;
    }

    setDeleteError(false);
    setConversationToDelete(conversation);
  }

  async function confirmDeleteConversation() {
    if (!conversationToDelete || isDeleting) {
      return;
    }

    try {
      setIsDeleting(true);
      setDeleteError(false);

      const token =
        localStorage.getItem("herai_access_token") ||
        localStorage.getItem("herai_session") ||
        "";

      if (!token) {
        throw new Error("No authentication token");
      }

      await deleteConversation(conversationToDelete.id, token);

      // If the deleted conversation is currently open,
      // return to a fresh chat.
      if (conversationId === conversationToDelete.id) {
        setMessages([]);
        setInput("");
        setConversationId(undefined);
        setIsTyping(false);
      }

      // Remove it immediately from the sidebar.
      setConversations((current) =>
        current.filter(
          (conversation) =>
            conversation.id !== conversationToDelete.id
        )
      );

      setConversationToDelete(null);

      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    } catch (error) {
      console.error("Failed to delete conversation:", error);
      setDeleteError(true);
    } finally {
      setIsDeleting(false);
    }
  }

  async function openConversation(id: string) {
    try {
      setIsTyping(true);

      const token =
        localStorage.getItem("herai_access_token") ||
        localStorage.getItem("herai_session") ||
        "";

      if (!token) {
        throw new Error("No authentication token");
      }

      const savedMessages = await getConversationMessages(id, token);

      setConversationId(id);

      setMessages(
        savedMessages.map((message, index) => ({
          id: index + 1,
          role: message.role,
          content: message.content,
        }))
      );
    } catch (error) {
      console.error("Failed to open conversation:", error);
    } finally {
      setIsTyping(false);

      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    }
  }

  function handleLogout() {
    localStorage.removeItem("herai_user");
    localStorage.removeItem("herai_session");
    localStorage.removeItem("herai_access_token");
    localStorage.removeItem("herai_refresh_token");

    window.location.href = "/login";
  }

  async function sendMessage(value?: string) {
    const text = (value ?? input).trim();

    if (!text || isTyping) {
      return;
    }

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
        localStorage.getItem("herai_access_token") ||
        localStorage.getItem("herai_session") ||
        "";

      if (!token) {
        throw new Error("No authentication token");
      }

      const request: ChatRequest = {
        message: text,
        region_code: country,
        language: lang,
        conversation_id: conversationId,
      };

      const response: ChatResponse = await sendChatMessage(
        request,
        token
      );

      if (response.conversation_id) {
        setConversationId(response.conversation_id);
      }

      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: response.response,
      };

      setMessages((current) => [...current, assistantMessage]);

      await loadConversationHistory();
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

  function handleKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>
  ) {
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
          <div className="flex shrink-0 items-center gap-3 text-sm font-semibold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1A1A1A] text-xs text-white">
              H
            </span>

            <span>{t.brand}</span>
          </div>

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

            {/* Profile */}
            <Link
              href="/profile"
              className="hidden h-9 items-center rounded-full border border-[#1A1A1A]/10 bg-white px-4 text-xs font-semibold transition hover:bg-[#1A1A1A]/[0.03] sm:inline-flex"
            >
              {t.profile}
            </Link>

            {/* Logout */}
            <button
              type="button"
              onClick={handleLogout}
              className="h-9 rounded-full bg-[#1A1A1A] px-4 text-xs font-semibold text-white transition hover:bg-[#333]"
            >
              {t.logout}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 border-e border-[#1A1A1A]/10 p-5 lg:flex lg:flex-col">
          {/* New chat */}
          <button
            type="button"
            onClick={startNewChat}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#1A1A1A] px-4 text-sm font-semibold text-white transition hover:bg-[#2B2B2B]"
          >
            <span className="text-base">+</span>
            {t.newChat}
          </button>

          {/* History */}
          <div className="mt-8 min-h-0 flex-1">
            <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1A1A1A]/35">
              {t.history}
            </p>

            <div className="mt-3 max-h-[calc(100vh-15rem)] space-y-2 overflow-y-auto pr-1">
              {loadingHistory ? (
                <div className="rounded-2xl border border-[#1A1A1A]/10 bg-white p-4 text-xs text-[#1A1A1A]/40">
                  {t.loadingHistory}
                </div>
              ) : conversations.length === 0 ? (
                <div className="rounded-2xl border border-[#1A1A1A]/10 bg-white p-4 text-xs leading-5 text-[#1A1A1A]/40">
                  {t.noHistory}
                </div>
              ) : (
                conversations.map((conversation) => {
                  const conversationTitle =
                    conversation.title?.trim() ||
                    conversation.domain_scope?.trim() ||
                    t.newConversation;

                  return (
                    <div
                      key={conversation.id}
                      className={`group relative rounded-2xl border transition ${
                        conversation.id === conversationId
                          ? "border-[#B8860B]/40 bg-[#B8860B]/[0.06]"
                          : "border-[#1A1A1A]/10 bg-white hover:border-[#B8860B]/30 hover:bg-[#B8860B]/[0.02]"
                      }`}
                    >
                      {/* Open conversation */}
                      <button
                        type="button"
                        onClick={() =>
                          openConversation(conversation.id)
                        }
                        className="w-full p-4 text-start"
                      >
                        <div className="flex items-start gap-3 pr-8">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#B8860B]/10 text-xs font-bold text-[#B8860B]">
                            H
                          </div>

                          <div className="min-w-0 flex-1">
                            <p
                              title={conversationTitle}
                              className="truncate text-sm font-semibold text-[#1A1A1A]"
                            >
                              {conversationTitle}
                            </p>

                            <p className="mt-1 text-[10px] text-[#1A1A1A]/40">
                              {conversation.created_at
                                ? new Date(
                                    conversation.created_at
                                  ).toLocaleDateString(
                                    lang === "ar"
                                      ? "ar-EG"
                                      : "en-US",
                                    {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    }
                                  )
                                : ""}
                            </p>
                          </div>
                        </div>
                      </button>

                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          requestDeleteConversation(
                            conversation.id
                          );
                        }}
                        aria-label={`${t.delete}: ${conversationTitle}`}
                        title={t.delete}
                        className={`absolute top-3 flex h-8 w-8 items-center justify-center rounded-xl text-sm transition ${
                          lang === "ar"
                            ? "left-3"
                            : "right-3"
                        } ${
                          conversation.id === conversationId
                            ? "bg-[#1A1A1A]/[0.06] text-[#1A1A1A]/45 hover:bg-red-50 hover:text-red-600"
                            : "bg-[#1A1A1A]/[0.04] text-[#1A1A1A]/35 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
                        }`}
                      >
                        <span aria-hidden="true">🗑</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Sidebar bottom actions */}
          <div className="mt-4 space-y-2">
            <Link
              href="/profile"
              className="flex h-10 w-full items-center justify-center rounded-xl border border-[#1A1A1A]/10 bg-white text-xs font-semibold transition hover:bg-[#1A1A1A]/[0.03]"
            >
              {t.profile}
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="flex h-10 w-full items-center justify-center rounded-xl border border-[#1A1A1A]/10 bg-white text-xs font-semibold text-[#1A1A1A]/70 transition hover:bg-[#1A1A1A]/[0.03]"
            >
              {t.logout}
            </button>
          </div>
        </aside>

        {/* Chat */}
        <section className="flex min-w-0 flex-1 flex-col">
          {/* Mobile controls */}
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
                      onClick={() =>
                        sendMessage(suggestion.value)
                      }
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
                              dir={
                                lang === "ar" ? "rtl" : "ltr"
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
                            lang === "ar" ? "rtl" : "ltr"
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
                    dir={lang === "ar" ? "rtl" : "ltr"}
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
                        lang === "ar" ? "rtl" : "ltr"
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
                      disabled={!input.trim() || isTyping}
                      aria-label={t.send}
                      className={`absolute bottom-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-[#B8860B] text-white transition hover:bg-[#96700A] disabled:cursor-not-allowed disabled:bg-[#B8860B]/25 ${
                        lang === "ar"
                          ? "left-2.5"
                          : "right-2.5"
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

      {/* ========================================================= */}
      {/* CUSTOM DELETE CONFIRMATION MODAL                         */}
      {/* ========================================================= */}
      {conversationToDelete && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1A1A1A]/35 px-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !isDeleting
            ) {
              setConversationToDelete(null);
              setDeleteError(false);
            }
          }}
        >
          <div
            dir={lang === "ar" ? "rtl" : "ltr"}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            className="w-full max-w-md overflow-hidden rounded-3xl border border-[#1A1A1A]/10 bg-[#FBF7EC] shadow-2xl shadow-[#1A1A1A]/20"
          >
            {/* Modal top */}
            <div className="p-6 sm:p-7">
              <div className="flex items-start gap-4">
                {/* Trash icon */}
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-lg">
                  🗑
                </div>

                <div className="min-w-0 flex-1">
                  <h2
                    id="delete-dialog-title"
                    className="text-lg font-semibold tracking-tight text-[#1A1A1A]"
                  >
                    {t.deleteTitle}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-[#1A1A1A]/55">
                    {t.deleteDescription}
                  </p>
                </div>
              </div>

              {/* Conversation being deleted */}
              <div className="mt-5 rounded-2xl border border-[#1A1A1A]/10 bg-white p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#B8860B]/10 text-xs font-bold text-[#B8860B]">
                    H
                  </div>

                  <p className="min-w-0 truncate text-sm font-semibold text-[#1A1A1A]">
                    {conversationToDelete.title?.trim() ||
                      conversationToDelete.domain_scope?.trim() ||
                      t.newConversation}
                  </p>
                </div>
              </div>

              {/* Error */}
              {deleteError && (
                <div
                  role="alert"
                  className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700"
                >
                  {t.deleteError}
                </div>
              )}
            </div>

            {/* Modal actions */}
            <div className="flex flex-col-reverse gap-2 border-t border-[#1A1A1A]/10 bg-white/60 p-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setConversationToDelete(null);
                  setDeleteError(false);
                }}
                className="h-11 rounded-2xl border border-[#1A1A1A]/10 bg-white px-5 text-sm font-semibold text-[#1A1A1A] transition hover:bg-[#1A1A1A]/[0.03] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t.cancel}
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDeleteConversation}
                className="h-11 rounded-2xl bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? t.deleting : t.deleteConfirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}