"use client";

import { useEffect, useState } from "react";

type Lang = "en" | "ar";
type Country = "LB" | "EG";



const content = {
  en: {
    LB: {
      brand: "HerAI Mashroo3",
      country: "Lebanon",

      nav: {
        demo: "Demo",
        voice: "Voice mode",
        safety: "Safety",
        who: "Who it's for",
        org: "Organizations",
      },

      navCta: "Run a pilot",

      badge: "Expansion market — Lebanon",

      heroHeadline: "Business guidance that speaks your language.",
      heroSub:
        "Ask HerAI about pricing, customers, suppliers, cash, permits, growth, and risk — in Arabic, the way you speak it.",

      primaryCta: "Try it now — ask a question",
      secondaryCta: "For cooperatives & NGOs → Run a pilot",

      signals: [
        "✓ Arabic-first",
        "✓ Local context",
        "✓ Safety-aware",
        "✓ Built for real businesses",
        "✓ Voice-enabled",
      ],

      demoHeading: "Ask HerAI a real business question.",
      demoSub:
        "A glimpse of how HerAI can help you think through everyday business decisions.",

      previewLabel: "HerAI — preview",
      exampleTag: "Illustrative example",

      demoTopics: ["Pricing", "Customers", "Costs", "Growth"],

      userMessage: "How much should I charge for jam this season?",
      assistantMessage:
        "It depends on your ingredient costs, local prices, and the profit margin you're aiming for.",

      previewPlaceholder: "Ask your question...",
      send: "Send",

      previewNote: "Preview only — not a live conversation.",

      voiceLabel: "Voice mode",
      voiceHeading: "Speak your question. Let HerAI answer out loud.",
      voiceSub:
        "When typing isn't convenient, just talk. Ask your business question naturally, listen as HerAI responds, and replay the guidance whenever you need it.",

      voiceFeatures: [
        {
          icon: "🎙️",
          title: "Just speak",
          desc: "Ask a question naturally without stopping to type.",
        },
        {
          icon: "🗣️",
          title: "Hear the guidance",
          desc: "HerAI can respond aloud so you can listen while you work.",
        },
        {
          icon: "↻",
          title: "Replay when needed",
          desc: "Listen again to important advice whenever you're ready.",
        },
      ],

      voicePreview: {
        listening: "Listening to your voice...",
        prompt: "Try saying:",
        userSpeech:
          "I have more orders than I can finish this week. What should I do?",
        aiSpeaking: "HerAI is answering aloud",
        aiSpeech:
          "Let's start by looking at your current orders, how much you can realistically produce, and which customers need to be contacted first.",
        stop: "Stop",
        replay: "Replay",
        voiceNote: "Voice preview — speak, listen, replay",
      },

      safetyLabel: "Built differently",
      safetyHeading: "Built with safety in mind.",

      pillars: [
        {
          title: "Safety Brain",
          desc: "Practical safeguards designed to keep advice responsible and useful.",
        },
        {
          title: "Arabic, as you speak it",
          desc: "Designed around real Arabic language use rather than forcing users into formal business language.",
        },
        {
          title: "Governed by women",
          desc: "Guidance and governance are designed around the women the product serves.",
        },
      ],

      whoLabel: "Everyday business",
      whoHeading: "What can HerAI help with?",
      whoSub:
        "Practical guidance for women running projects and businesses, including informal and agricultural work.",

      topics: [
        ["Pricing", "What to charge, and why."],
        ["Customers", "Finding and keeping them."],
        ["Suppliers", "Sourcing more reliably."],
        ["Cash & costs", "Understanding what comes in and out."],
        ["Permits", "Understanding what's required."],
        ["Growth", "Planning the next step."],
        ["Risk", "Knowing what to watch out for."],
      ],

      orgLabel: "Organizations",
      orgHeading: "For cooperatives, NGOs & programs",
      orgSub:
        "Bring HerAI to your cohort, program, or organization through a focused pilot.",
      orgCta: "Run a pilot with your cohort →",

      trust:
        "Built for real-world use with women, organizations, and local contexts in mind.",
    },

    EG: {
      brand: "HerAI Mashroo3",
      country: "Egypt",

      nav: {
        demo: "Demo",
        voice: "Voice mode",
        safety: "Safety",
        who: "Who it's for",
        org: "Organizations",
      },

      navCta: "Run a pilot",

      badge: "Expansion market — Egypt",

      heroHeadline: "Business guidance that speaks your language.",
      heroSub:
        "Ask HerAI about pricing, customers, suppliers, cash, permits, growth, and risk — in Arabic, the way you actually speak it.",

      primaryCta: "Try it now — ask a question",
      secondaryCta: "For organizations → Run a pilot",

      signals: [
        "✓ Arabic-first",
        "✓ Local context",
        "✓ Safety-aware",
        "✓ Built for real businesses",
        "✓ Voice-enabled",
      ],

      demoHeading: "Ask HerAI a real business question.",
      demoSub:
        "A glimpse of how HerAI can help you think through everyday business decisions.",

      previewLabel: "HerAI — preview",
      exampleTag: "Illustrative example",

      demoTopics: ["Pricing", "Customers", "Costs", "Growth"],

      userMessage: "How much should I charge for jam this season?",
      assistantMessage:
        "It depends on your ingredient costs, local prices, and the profit margin you're aiming for.",

      previewPlaceholder: "Ask your question...",
      send: "Send",

      previewNote: "Preview only — not a live conversation.",

      voiceLabel: "Voice mode",
      voiceHeading: "Speak your question. Let HerAI answer out loud.",
      voiceSub:
        "When typing isn't convenient, just talk. Ask your business question naturally, listen as HerAI responds, and replay the guidance whenever you need it.",

      voiceFeatures: [
        {
          icon: "🎙️",
          title: "Just speak",
          desc: "Ask a question naturally without stopping to type.",
        },
        {
          icon: "🗣️",
          title: "Hear the guidance",
          desc: "HerAI can respond aloud so you can listen while you work.",
        },
        {
          icon: "↻",
          title: "Replay when needed",
          desc: "Listen again to important advice whenever you're ready.",
        },
      ],

      voicePreview: {
        listening: "Listening to your voice...",
        prompt: "Try saying:",
        userSpeech:
          "I have more orders than I can finish this week. What should I do?",
        aiSpeaking: "HerAI is answering aloud",
        aiSpeech:
          "Let's start by looking at your current orders, how much you can realistically produce, and which customers need to be contacted first.",
        stop: "Stop",
        replay: "Replay",
        voiceNote: "Voice preview — speak, listen, replay",
      },

      safetyLabel: "Built differently",
      safetyHeading: "Built with safety in mind.",

      pillars: [
        {
          title: "Safety Brain",
          desc: "Practical safeguards designed to keep advice responsible and useful.",
        },
        {
          title: "Arabic, as you speak it",
          desc: "Designed around everyday Arabic rather than forcing users into formal business language.",
        },
        {
          title: "Governed by women",
          desc: "Guidance and governance are designed around the women the product serves.",
        },
      ],

      whoLabel: "Everyday business",
      whoHeading: "What can HerAI help with?",
      whoSub:
        "Practical guidance for women running projects and businesses, including informal, home-based, and agricultural work.",

      topics: [
        ["Pricing", "What to charge, and why."],
        ["Customers", "Finding and keeping them."],
        ["Suppliers", "Sourcing more reliably."],
        ["Cash & costs", "Understanding what comes in and out."],
        ["Permits", "Understanding what's required."],
        ["Growth", "Planning the next step."],
        ["Risk", "Knowing what to watch out for."],
      ],

      orgLabel: "Organizations",
      orgHeading: "For cooperatives, NGOs & programs",
      orgSub:
        "Bring HerAI to your cohort, program, or organization through a focused pilot.",
      orgCta: "Run a pilot with your cohort →",

      trust:
        "Built for real-world use with women, organizations, and local contexts in mind.",
    },
  },

  ar: {
    LB: {
      brand: "HerAI Mashroo3",
      country: "لبنان",

      nav: {
        demo: "التجربة",
        voice: "الوضع الصوتي",
        safety: "الأمان",
        who: "لمين هيدا؟",
        org: "المنظمات",
      },

      navCta: "ابدئي تجربة",

      badge: "المرحلة الأولى — تجربة في لبنان",

      heroHeadline: "إرشاد تجاري بلغتك، متل ما بتحكيها.",
      heroSub:
        "اسألي HerAI عن التسعير، الزباين، الموردين، المصاريف، التراخيص، النمو والمخاطر — بالعربي، متل ما بتحكي.",

      primaryCta: "جرّبيها هلق — اسألي سؤال",
      secondaryCta: "للجمعيات والمنظمات ← ابدئي تجربة",

      signals: [
        "✓ عربي أولاً",
        "✓ سياق محلي",
        "✓ أمان من الأساس",
        "✓ مصمم للأعمال الحقيقية",
        "✓ وضع صوتي",
      ],

      demoHeading: "اسألي HerAI سؤال تجاري حقيقي.",
      demoSub:
        "هي لمحة عن كيف ممكن HerAI يساعدك تفكّري بقراراتك اليومية بالشغل.",

      previewLabel: "HerAI — معاينة",
      exampleTag: "مثال توضيحي",

      demoTopics: ["التسعير", "الزباين", "المصاريف", "النمو"],

      userMessage: "قديش لازم سعّر مربى المشمش هالموسم؟",
      assistantMessage:
        "بيعتمد على تكلفة المكونات، والأسعار بالسوق حواليكي، وهامش الربح يلي بدك ياه.",

      previewPlaceholder: "اكتبي سؤالك هون...",
      send: "إرسال",

      previewNote: "معاينة فقط — مش محادثة حقيقية.",

      voiceLabel: "الوضع الصوتي",
      voiceHeading: "احكي سؤالك. وخلي HerAI يجاوبك بصوت.",
      voiceSub:
        "لما ما يكون مناسب تكتبي، فيكي بس تحكي. اسألي سؤالك بطبيعتك، اسمعي جواب HerAI، وارجعي اسمعي الإرشادات بأي وقت بدك.",

      voiceFeatures: [
        {
          icon: "🎙️",
          title: "بس احكي",
          desc: "اسألي سؤالك بطبيعتك من دون ما توقفي لتكتبي.",
        },
        {
          icon: "🗣️",
          title: "اسمعي الإرشاد",
          desc: "HerAI فيو يجاوبك بصوت لتسمعي الإرشادات وإنتِ عم تشتغلي.",
        },
        {
          icon: "↻",
          title: "اسمعيه من جديد",
          desc: "ارجعي اسمعي النصيحة المهمة بأي وقت تكوني جاهزة.",
        },
      ],

      voicePreview: {
        listening: "عم نسمع لصوتك...",
        prompt: "جرّبي تقولي:",
        userSpeech:
          "عندي طلبات أكتر من اللي بقدر خلّصها هالأسبوع. شو بعمل؟",
        aiSpeaking: "HerAI عم يجاوبك بصوت",
        aiSpeech:
          "خلّينا نبلّش نشوف الطلبات اللي عندك، وقديش فيكي تنتجي بشكل واقعي، وأي زباين لازم تتواصلي معن أول شي.",
        stop: "إيقاف",
        replay: "إعادة",
        voiceNote: "معاينة صوتية — احكي، اسمعي، وكرّري",
      },

      safetyLabel: "مختلفين بالطريقة اللي بنبني فيها",
      safetyHeading: "مصمّم مع الأمان من الأساس.",

      pillars: [
        {
          title: "دماغ الأمان",
          desc: "إجراءات أمان عملية مصممة لتخلي النصائح مسؤولة ومفيدة.",
        },
        {
          title: "عربي متل ما بتحكيه",
          desc: "مصمم على أساس استخدام اللغة العربية بالحياة اليومية، مش اللغة الرسمية بس.",
        },
        {
          title: "بحوكمة نسائية",
          desc: "الإرشاد والحوكمة مصممين حول النساء يلي المنتج موجّه إلهن.",
        },
      ],

      whoLabel: "شغل كل يوم",
      whoHeading: "بشو ممكن HerAI يساعدك؟",
      whoSub:
        "إرشاد عملي للنساء يلي عندهن مشاريع وأعمال، بما فيها الشغل الزراعي وغير الرسمي.",

      topics: [
        ["التسعير", "قديش تسعّري، وليش."],
        ["الزباين", "كيف تلاقيهم وتحافظي عليهم."],
        ["الموردين", "تأمين مصادر موثوقة."],
        ["المصاريف", "شو داخل وشو طالع."],
        ["التراخيص", "شو المطلوب قانونيًا."],
        ["النمو", "كيف تكبّري خطوة خطوة."],
        ["المخاطر", "شو لازم تنتبهي إله."],
      ],

      orgLabel: "المنظمات",
      orgHeading: "للجمعيات والمنظمات والبرامج",
      orgSub:
        "شغّلوا تجربة HerAI مع مجموعتكم أو برنامجكم أو منظمتكم.",
      orgCta: "ابدؤوا تجربة مع مجموعتكم ←",

      trust:
        "مصمم للاستخدام الواقعي مع النساء، المنظمات، والسياقات المحلية.",
    },

    EG: {
      brand: "HerAI Mashroo3",
      country: "مصر",

      nav: {
        demo: "التجربة",
        voice: "الوضع الصوتي",
        safety: "الأمان",
        who: "مين مناسب ليه؟",
        org: "المنظمات",
      },

      navCta: "ابدئي تجربة",

      badge: "سوق التوسع — مصر",

      heroHeadline: "إرشاد للأعمال بلغتك.",
      heroSub:
        "اسألي HerAI عن التسعير، العملاء، الموردين، المصاريف، التراخيص، النمو والمخاطر — بالعربي، بالطريقة اللي بتتكلمي بيها.",

      primaryCta: "جربيها دلوقتي — اسألي سؤال",
      secondaryCta: "للمنظمات والجمعيات ← ابدئي تجربة",

      signals: [
        "✓ عربي أولاً",
        "✓ سياق محلي",
        "✓ أمان من الأساس",
        "✓ مصمم للأعمال الحقيقية",
        "✓ وضع صوتي",
      ],

      demoHeading: "اسألي HerAI سؤال حقيقي عن شغلك.",
      demoSub:
        "دي لمحة عن إزاي HerAI ممكن يساعدك تفكري في قرارات شغلك اليومية.",

      previewLabel: "HerAI — معاينة",
      exampleTag: "مثال توضيحي",

      demoTopics: ["التسعير", "العملاء", "المصاريف", "النمو"],

      userMessage: "أسعّر المربى بكام الموسم ده؟",
      assistantMessage:
        "ممكن نحدد السعر بناءً على تكلفة المكونات، وأسعار السوق حواليكي، وهامش الربح اللي مستهدفاه.",

      previewPlaceholder: "اكتبي سؤالك هنا...",
      send: "إرسال",

      previewNote: "معاينة فقط — دي مش محادثة حقيقية.",

      voiceLabel: "الوضع الصوتي",
      voiceHeading: "قولي سؤالك. وخلي HerAI يرد بصوت.",
      voiceSub:
        "لما الكتابة ما تكونش مناسبة، اتكلمي بس. اسألي سؤالك بطبيعتك، اسمعي رد HerAI، وارجعي للرد تاني في أي وقت تحتاجيه.",

      voiceFeatures: [
        {
          icon: "🎙️",
          title: "اتكلمي بس",
          desc: "اسألي سؤالك بطبيعتك من غير ما توقفي عشان تكتبي.",
        },
        {
          icon: "🗣️",
          title: "اسمعي الإرشاد",
          desc: "HerAI يقدر يرد بصوت علشان تسمعي الإرشادات وإنتِ بتشتغلي.",
        },
        {
          icon: "↻",
          title: "اسمعيه تاني",
          desc: "ارجعي اسمعي النصيحة المهمة في أي وقت تحتاجيها.",
        },
      ],

      voicePreview: {
        listening: "بسمع صوتك...",
        prompt: "جربي تقولي:",
        userSpeech:
          "عندي طلبات أكتر من اللي أقدر أخلصها الأسبوع ده. أعمل إيه؟",
        aiSpeaking: "HerAI بيرد بصوت",
        aiSpeech:
          "تعالي الأول نبص على الطلبات اللي عندك، وقد إيه تقدري تنتجي بشكل واقعي، ومين من العملاء محتاج تتواصلي معاه الأول.",
        stop: "إيقاف",
        replay: "إعادة",
        voiceNote: "معاينة صوتية — اتكلمي، اسمعي، وكرري",
      },

      safetyLabel: "مختلفين بالطريقة اللي بنبني بيها",
      safetyHeading: "الأمان جزء من التصميم من البداية.",

      pillars: [
        {
          title: "Safety Brain",
          desc: "إجراءات أمان عملية تساعد إن النصيحة تفضل مسؤولة ومفيدة.",
        },
        {
          title: "عربي زي ما بتتكلمي",
          desc: "مصمم على أساس استخدام العربي في الحياة اليومية، مش اللغة الرسمية بس.",
        },
        {
          title: "بحوكمة نسائية",
          desc: "الإرشاد والحوكمة مصممين حوالين الستات اللي المنتج معمول عشانهم.",
        },
      ],

      whoLabel: "شغل كل يوم",
      whoHeading: "HerAI ممكن يساعدك في إيه؟",
      whoSub:
        "إرشاد عملي للستات اللي عندهم مشاريع وأعمال، بما فيها الشغل من البيت والشغل الزراعي وغير الرسمي.",

      topics: [
        ["التسعير", "أبيع بكام وليه؟"],
        ["العملاء", "أوصل لعملاء إزاي؟"],
        ["الموردين", "أجيب احتياجاتي منين؟"],
        ["المصاريف", "فلوسي داخلة وخارجة فين؟"],
        ["التراخيص", "إيه المطلوب عشان أشتغل؟"],
        ["النمو", "إزاي أكبر خطوة بخطوة؟"],
        ["المخاطر", "إيه اللي محتاجة أخد بالي منه؟"],
      ],

      orgLabel: "المنظمات",
      orgHeading: "للجمعيات والمنظمات والبرامج",
      orgSub:
        "شغّلوا تجربة HerAI مع مجموعتكم أو برنامجكم أو منظمتكم.",
      orgCta: "ابدؤوا تجربة مع مجموعتكم ←",

      trust:
        "مصمم للاستخدام الحقيقي مع الستات، المنظمات، والسياقات المحلية.",
    },
  },
} as const;

export default function Home() {
  const [lang, setLang] = useState<Lang>("en");
  const [country, setCountry] = useState<Country>("LB");

  const t = content[lang][country];

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  return (
    <div className="min-h-screen bg-[#FBF7EC] text-[#1A1A1A]">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-[#1A1A1A]/10 bg-[#FBF7EC]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-8">
          <a
            href="#top"
            className="shrink-0 text-lg font-semibold tracking-tight"
          >
            {t.brand}
          </a>

          <nav
            aria-label={lang === "ar" ? "التنقل" : "Section navigation"}
            className="hidden items-center gap-7 text-sm font-medium text-[#1A1A1A]/70 xl:flex"
          >
            <a href="#demo" className="transition hover:text-[#1A1A1A]">
              {t.nav.demo}
            </a>
            <a href="#voice" className="transition hover:text-[#1A1A1A]">
              {t.nav.voice}
            </a>
            <a href="#safety" className="transition hover:text-[#1A1A1A]">
              {t.nav.safety}
            </a>
            <a href="#who" className="transition hover:text-[#1A1A1A]">
              {t.nav.who}
            </a>
            <a href="#pilot" className="transition hover:text-[#1A1A1A]">
              {t.nav.org}
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <label className="relative">
              <span className="sr-only">
                {lang === "ar" ? "اختيار الدولة" : "Select country"}
              </span>

              <select
                value={country}
                onChange={(e) => setCountry(e.target.value as Country)}
                className="h-9 cursor-pointer appearance-none rounded-full border border-[#1A1A1A]/15 bg-white py-1 pl-3 pr-8 text-xs font-medium outline-none transition hover:border-[#B8860B]/50 focus:border-[#B8860B]"
              >
                <option value="LB">
                  {lang === "ar" ? "🇱🇧 لبنان" : "🇱🇧 Lebanon"}
                </option>
                <option value="EG">
                  {lang === "ar" ? "🇪🇬 مصر" : "🇪🇬 Egypt"}
                </option>
              </select>
            </label>

            <div
              role="group"
              aria-label={lang === "ar" ? "اللغة" : "Language"}
              className="inline-flex overflow-hidden rounded-full border border-[#1A1A1A]/15 bg-white text-xs font-medium"
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

            <a
              href="/login"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden h-9 items-center justify-center rounded-full bg-[#B8860B] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#96700A] sm:inline-flex"
            >
              {t.navCta}
            </a>
          </div>
        </div>
      </header>

      <main id="top">
        {/* HERO */}
        <section className="relative overflow-hidden border-b border-[#1A1A1A]/10 px-4 py-24 sm:px-8 sm:py-32">
          <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-[#B8860B]/[0.07] blur-3xl" />

          <div className="relative mx-auto max-w-4xl text-center">
            <span className="inline-flex rounded-full border border-[#B8860B]/30 bg-[#B8860B]/10 px-4 py-2 text-xs font-semibold text-[#96700A]">
              {t.badge}
            </span>

            <h1 className="mx-auto mt-7 max-w-4xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
              {t.heroHeadline}
            </h1>

            <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-[#1A1A1A]/65 sm:text-lg">
              {t.heroSub}
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="/chat-demo"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#B8860B] px-7 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#96700A]"
              >
                {t.primaryCta}
              </a>

              <a
                href="/login"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#1A1A1A]/15 bg-white px-7 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 hover:bg-[#1A1A1A]/[0.03]"
              >
                {t.secondaryCta}
              </a>
            </div>

            <div
              dir={lang === "ar" ? "rtl" : "ltr"}
              className="mt-14 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-xs font-medium text-[#1A1A1A]/45"
            >
              {t.signals.map((signal) => (
                <span key={signal}>{signal}</span>
              ))}
            </div>
          </div>
        </section>

        {/* DEMO */}
        <section
          id="demo"
          className="scroll-mt-24 border-b border-[#1A1A1A]/10 px-4 py-24 sm:px-8"
        >
          <div className="mx-auto max-w-6xl">
            <div className="grid items-center gap-14 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B8860B]">
                  HerAI
                </span>

                <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                  {t.demoHeading}
                </h2>

                <p className="mt-5 max-w-lg leading-8 text-[#1A1A1A]/65">
                  {t.demoSub}
                </p>

                <div
                  dir={lang === "ar" ? "rtl" : "ltr"}
                  className="mt-7 flex flex-wrap gap-2"
                >
                  {t.demoTopics.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-[#1A1A1A]/10 bg-white px-3 py-1.5 text-xs text-[#1A1A1A]/60"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="overflow-hidden rounded-3xl border border-[#1A1A1A]/10 bg-white shadow-xl shadow-[#1A1A1A]/5">
                <div
                  dir="ltr"
                  className="flex items-center border-b border-[#1A1A1A]/10 px-5 py-4"
                >
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#1A1A1A]/15" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#1A1A1A]/15" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#1A1A1A]/15" />
                  </div>

                  <span className="ms-3 text-xs font-semibold text-[#1A1A1A]/50">
                    {t.previewLabel}
                  </span>

                  <span className="ms-auto rounded-full bg-[#B8860B]/10 px-2.5 py-1 text-[10px] font-semibold text-[#96700A]">
                    {t.exampleTag}
                  </span>
                </div>

                <div dir="ltr" className="space-y-5 p-6 sm:p-8">
                  <div className="flex w-full justify-end">
                    <div
                      dir={lang === "ar" ? "rtl" : "ltr"}
                      className="max-w-[78%] rounded-2xl rounded-br-sm bg-[#1A1A1A] px-4 py-3 text-sm leading-6 text-white"
                    >
                      {t.userMessage}
                    </div>
                  </div>

                  <div className="flex w-full justify-start">
                    <div
                      dir={lang === "ar" ? "rtl" : "ltr"}
                      className="max-w-[82%] rounded-2xl rounded-bl-sm bg-[#F3F0E8] px-4 py-3 text-sm leading-6 text-[#1A1A1A]/80"
                    >
                      {t.assistantMessage}
                    </div>
                  </div>

                  <p
                    dir={lang === "ar" ? "rtl" : "ltr"}
                    className="pt-2 text-center text-[11px] text-[#1A1A1A]/35"
                  >
                    {t.previewNote}
                  </p>
                </div>

                <div dir="ltr" className="border-t border-[#1A1A1A]/10 p-4">
                  <div className="flex items-center gap-2 rounded-full border border-[#1A1A1A]/10 bg-[#1A1A1A]/[0.02] px-4 py-2.5">
                    <span
                      dir={lang === "ar" ? "rtl" : "ltr"}
                      className="flex-1 text-xs text-[#1A1A1A]/30"
                    >
                      {t.previewPlaceholder}
                    </span>

                    <span
                      aria-label="Voice mode"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#B8860B]/15 text-sm"
                    >
                      🎙️
                    </span>

                    <span
                      dir={lang === "ar" ? "rtl" : "ltr"}
                      className="shrink-0 rounded-full bg-[#B8860B] px-4 py-1.5 text-[10px] font-semibold text-white"
                    >
                      {t.send}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* VOICE MODE */}
        <section
          id="voice"
          className="relative scroll-mt-24 overflow-hidden border-b border-[#1A1A1A]/10 bg-[#B8860B]/[0.035] px-4 py-24 sm:px-8"
        >
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#B8860B]/[0.08] blur-3xl" />

          <div className="relative mx-auto max-w-6xl">
            <div className="grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B8860B]">
                  {t.voiceLabel}
                </span>

                <h2 className="mt-4 max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
                  {t.voiceHeading}
                </h2>

                <p className="mt-5 max-w-xl leading-8 text-[#1A1A1A]/65">
                  {t.voiceSub}
                </p>

                <div className="mt-10 space-y-4">
                  {t.voiceFeatures.map((feature) => (
                    <div
                      key={feature.title}
                      dir={lang === "ar" ? "rtl" : "ltr"}
                      className="flex gap-4 rounded-2xl border border-[#B8860B]/15 bg-white/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#B8860B]/30 hover:shadow-md"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#B8860B]/10 text-xl">
                        {feature.icon}
                      </div>

                      <div>
                        <h3 className="font-semibold">{feature.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-[#1A1A1A]/55">
                          {feature.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative overflow-hidden rounded-[2rem] border border-[#B8860B]/20 bg-white p-6 shadow-xl shadow-[#B8860B]/10 sm:p-8">
                <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#B8860B]/15 blur-3xl" />

                <div className="relative">
                  <div
                    dir={lang === "ar" ? "rtl" : "ltr"}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#B8860B] text-lg text-white shadow-md">
                        <span className="absolute inset-0 animate-ping rounded-full bg-[#B8860B]/25" />
                        <span className="relative">🎙️</span>
                      </div>

                      <div>
                        <p className="text-sm font-semibold">HerAI</p>
                        <p className="text-xs font-medium text-[#B8860B]">
                          {t.voicePreview.listening}
                        </p>
                      </div>
                    </div>

                    <div className="flex h-9 items-end gap-1">
                      <span className="h-3 w-1 animate-pulse rounded-full bg-[#B8860B]" />
                      <span className="h-6 w-1 animate-pulse rounded-full bg-[#B8860B]" />
                      <span className="h-9 w-1 animate-pulse rounded-full bg-[#B8860B]" />
                      <span className="h-5 w-1 animate-pulse rounded-full bg-[#B8860B]" />
                      <span className="h-7 w-1 animate-pulse rounded-full bg-[#B8860B]" />
                      <span className="h-3 w-1 animate-pulse rounded-full bg-[#B8860B]" />
                    </div>
                  </div>

                  <div
                    dir={lang === "ar" ? "rtl" : "ltr"}
                    className="mt-8 rounded-2xl border border-[#B8860B]/15 bg-[#B8860B]/[0.05] p-4"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#B8860B]">
                      {t.voicePreview.prompt}
                    </p>

                    <p className="mt-2 text-sm leading-7 text-[#1A1A1A]/75">
                      “{t.voicePreview.userSpeech}”
                    </p>
                  </div>

                  <div className="mt-6">
                    <div
                      dir={lang === "ar" ? "rtl" : "ltr"}
                      className="flex items-center gap-2"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#B8860B]/10 text-xs">
                        🔊
                      </div>

                      <span className="text-xs font-semibold text-[#B8860B]">
                        {t.voicePreview.aiSpeaking}
                      </span>
                    </div>

                    <div
                      dir={lang === "ar" ? "rtl" : "ltr"}
                      className="mt-3 rounded-2xl bg-[#F3F0E8] px-5 py-5 text-sm leading-7 text-[#1A1A1A]/80"
                    >
                      {t.voicePreview.aiSpeech}
                    </div>

                    <div
                      dir={lang === "ar" ? "rtl" : "ltr"}
                      className="mt-5 flex items-center gap-3"
                    >
                      <button
                        type="button"
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#B8860B] text-sm text-white shadow-md transition hover:bg-[#96700A]"
                        aria-label={t.voicePreview.stop}
                      >
                        ■
                      </button>

                      <div className="flex flex-1 items-center gap-1">
                        <span className="h-1.5 flex-[0.65] rounded-full bg-[#B8860B]" />
                        <span className="h-1.5 flex-[0.35] rounded-full bg-[#1A1A1A]/10" />
                      </div>

                      <button
                        type="button"
                        className="inline-flex h-9 shrink-0 items-center gap-1 rounded-full border border-[#1A1A1A]/10 bg-white px-3 text-[10px] font-semibold text-[#1A1A1A]/60 transition hover:border-[#B8860B]/40"
                      >
                        ↻ {t.voicePreview.replay}
                      </button>
                    </div>

                    <p
                      dir={lang === "ar" ? "rtl" : "ltr"}
                      className="mt-5 text-center text-[10px] font-medium text-[#1A1A1A]/35"
                    >
                      {t.voicePreview.voiceNote}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SAFETY */}
        <section
          id="safety"
          className="scroll-mt-24 border-b border-[#1A1A1A]/10 px-4 py-24 sm:px-8"
        >
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B8860B]">
                {t.safetyLabel}
              </span>

              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                {t.safetyHeading}
              </h2>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {t.pillars.map((pillar, index) => (
                <div
                  key={pillar.title}
                  className="rounded-3xl border border-[#1A1A1A]/10 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#B8860B]/10 text-lg font-semibold text-[#B8860B]">
                    0{index + 1}
                  </div>

                  <h3 className="mt-6 text-lg font-semibold">
                    {pillar.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-[#1A1A1A]/60">
                    {pillar.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WHO IT'S FOR */}
        <section
          id="who"
          className="scroll-mt-24 border-b border-[#1A1A1A]/10 px-4 py-24 sm:px-8"
        >
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B8860B]">
                {t.whoLabel}
              </span>

              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                {t.whoHeading}
              </h2>

              <p className="mt-4 leading-8 text-[#1A1A1A]/65">
                {t.whoSub}
              </p>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {t.topics.map(([topic, note], index) => (
                <div
                  key={topic}
                  dir={lang === "ar" ? "rtl" : "ltr"}
                  className="group rounded-2xl border border-[#1A1A1A]/10 bg-white p-5 transition hover:-translate-y-1 hover:border-[#B8860B]/30 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#B8860B]">
                      0{index + 1}
                    </span>

                    <span className="text-[#1A1A1A]/15 transition group-hover:text-[#B8860B]">
                      {lang === "ar" ? "←" : "→"}
                    </span>
                  </div>

                  <h3 className="mt-6 font-semibold">{topic}</h3>

                  <p className="mt-2 text-sm leading-6 text-[#1A1A1A]/55">
                    {note}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ORGANIZATIONS */}
        <section
          id="pilot"
          className="scroll-mt-24 px-4 py-24 sm:px-8"
        >
          <div className="mx-auto max-w-6xl">
            <div className="relative overflow-hidden rounded-[2rem] bg-[#1A1A1A] px-7 py-14 text-white sm:px-12 sm:py-16">
              <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#B8860B]/20 blur-3xl" />

              <div className="relative grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="max-w-2xl">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D5A928]">
                    {t.orgLabel}
                  </span>

                  <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                    {t.orgHeading}
                  </h2>

                  <p className="mt-5 max-w-xl leading-8 text-white/60">
                    {t.orgSub}
                  </p>
                </div>

                <a
                  href="/login"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#B8860B] px-7 text-sm font-semibold text-white transition hover:bg-[#D09B17]"
                >
                  {t.orgCta}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* TRUST */}
        <section className="border-t border-[#1A1A1A]/10 px-4 py-10 sm:px-8">
          <div
            className={`mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 text-center sm:flex-row ${
              lang === "ar" ? "sm:text-right" : "sm:text-left"
            }`}
          >
            <p className="max-w-xl text-sm leading-6 text-[#1A1A1A]/50">
              {t.trust}
            </p>

            <div
              dir="ltr"
              className="flex items-center gap-4 text-xs font-medium text-[#1A1A1A]/35"
            >
              <span>HerAI</span>
              <span>•</span>
              <span>DEVONEERS</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}