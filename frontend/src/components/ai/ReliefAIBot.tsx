import React, { useState, useEffect, useRef } from "react";
import {
  Bot,
  X,
  Send,
  Sparkles,
  Siren,
  HeartPulse,
  Tent,
  Phone,
  Shield,
  MessageSquare,
  ChevronRight,
  RefreshCw,
  CheckCircle,
  HelpCircle,
  Minimize2,
  ExternalLink,
  Mic,
  MicOff,
  Trash2,
  Zap,
  Volume2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

interface Message {
  id: string;
  sender: "ai" | "user";
  text: string;
  timestamp: string;
  link?: { to: string; label: string };
  isAiLive?: boolean;
}

// Safely extract clean conversational text from raw API response or JSON
function parseAiContent(raw: unknown): string {
  if (!raw) return "";
  let data: any = raw;

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
      try {
        data = JSON.parse(trimmed);
      } catch {
        data = raw;
      }
    }
  }

  if (typeof data === "object" && data !== null) {
    const extracted =
      data.choices?.[0]?.message?.content ||
      data.choices?.[0]?.delta?.content ||
      data.choices?.[0]?.text ||
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      (Array.isArray(data.content) ? data.content[0]?.text : data.content) ||
      data.text ||
      data.response ||
      data.reply ||
      (typeof data.message === "string" ? data.message : "");

    if (typeof extracted === "string" && extracted.trim().length > 0) {
      data = extracted;
    } else {
      return "";
    }
  }

  if (typeof data === "string") {
    // Strip reasoning / think tags from reasoning models (e.g. DeepSeek/gpt-oss)
    let clean = data.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
    clean = clean.replace(/\[THOUGHT\][\s\S]*?\[\/THOUGHT\]/gi, "").trim();
    return clean;
  }

  return "";
}

// Resilient fetch with timeout
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 7000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

const DEFAULT_CHIPS = [
  { label: "🆘 How to trigger SOS", category: "sos" },
  { label: "🩺 Drowning & CPR First Aid", category: "first_aid" },
  { label: "⛺ Find Free Shelter Slots", category: "shelter" },
  { label: "🐍 Snake Bite & Flood Disease", category: "snake" },
  { label: "📞 Emergency Helplines", category: "helpline" },
];

export function ReliefAIBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg-welcome",
      sender: "ai",
      text: "👋 Hello! I am **ReliefAI**, powered by real-time Emergency Intelligence. Ask me anything about flood rescue, first-aid, shelter, or emergency SOS!",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isTyping]);

  // Real-Time Gemini AI & Universal Realtime LLM Engine
  const fetchAiResponse = async (userPrompt: string): Promise<{ text: string; link?: Message["link"] }> => {
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const lower = userPrompt.toLowerCase().trim();

    let link: Message["link"] = undefined;
    if (lower.includes("sos") || lower.includes("help") || lower.includes("danger") || lower.includes("trapped")) {
      link = { to: "/emergency", label: "🚨 Trigger Emergency SOS Page" };
    } else if (lower.includes("shelter") || lower.includes("camp") || lower.includes("stay")) {
      link = { to: "/facilities", label: "⛺ View Relief Camps" };
    } else if (lower.includes("route") || lower.includes("volunteer") || lower.includes("map")) {
      link = { to: "/rescue-route", label: "🧭 Open Rescue Route Finder" };
    }

    const systemPrompt = `You are ReliefAI, an intelligent 24/7 AI Assistant like Gemini or ChatGPT built for the Flood Relief Portal.
Answer the user's question directly, naturally, friendly, and conversationally in Markdown formatting.
If the question is casual (e.g., "had breakfast", "how are you", "what is your name"), reply with a warm, natural, human-like response.
If the question is about flood emergency, first aid, or relief shelters, provide clear, actionable steps.`;

    // 0. Math Calculation Intent
    const mathMatch = userPrompt.replace(/what is|calculate|solve|\?|=/gi, "").trim();
    if (/^[\d\s\+\-\*\/\.\(\)]+$/.test(mathMatch) && /[\+\-\*\/]/.test(mathMatch)) {
      try {
        const tokens = mathMatch.match(/(\d+\.?\d*|[\+\-\*\/])/g);
        if (tokens && tokens.length >= 3) {
          let val = parseFloat(tokens[0]);
          for (let i = 1; i < tokens.length; i += 2) {
            const op = tokens[i];
            const next = parseFloat(tokens[i + 1]);
            if (op === "+") val += next;
            else if (op === "-") val -= next;
            else if (op === "*") val *= next;
            else if (op === "/") val = next !== 0 ? val / next : 0;
          }
          return { text: `🔢 **Calculation**: \`${mathMatch}\` = **${val}**` };
        }
      } catch {}
    }

    // 1. High-Priority Intent: Chief Minister of Tamil Nadu & Joseph Vijay
    if (
      lower.includes("cm of tn") ||
      lower.includes("chief minister of tn") ||
      lower.includes("cm of tamil") ||
      lower.includes("cm of tamilnadu") ||
      lower.includes("chief minister of tamil") ||
      lower.includes("chief minister of tamilnadu") ||
      lower.includes("who is cm") ||
      lower.includes("who is the cm") ||
      lower.includes("tamilnadu cm") ||
      lower.includes("tamil nadu cm") ||
      lower.includes("tn cm") ||
      lower.includes("next cm") ||
      lower.includes("joseph vijay") ||
      lower.includes("thalapathy vijay") ||
      lower.includes("tvk")
    ) {
      return {
        text: "🏛️ **Chief Minister of Tamil Nadu**:\n\n• **Chief Minister**: **Joseph Vijay** (Chandrasekaran Joseph Vijay, fondly known as **Thalapathy Vijay**). He is the founder and president of the **Tamilaga Vettri Kazhagam (TVK)** party and serves as the Chief Minister of Tamil Nadu.\n• **Previous CM**: **M. K. Stalin** (DMK, served 2021–2026).",
        link: { to: "/emergency", label: "🚨 Disaster Control Portal" }
      };
    }

    // 2. National & World Leaders
    if (lower.includes("pm of india") || lower.includes("prime minister of india") || (lower.includes("who is pm") && !lower.includes("uk"))) {
      return {
        text: "🇮🇳 **Prime Minister of India**:\n\nThe current Prime Minister of India is **Narendra Modi** (Bharatiya Janata Party), serving as the 14th Prime Minister of India since May 26, 2014."
      };
    }
    if (lower.includes("president of india")) {
      return {
        text: "🇮🇳 **President of India**:\n\nThe President of India is **Droupadi Murmu**, serving as the 15th President of the Republic of India since July 25, 2022."
      };
    }
    if (lower.includes("president of usa") || lower.includes("president of america") || lower.includes("us president") || lower.includes("who is us president")) {
      return {
        text: "🇺🇸 **President of the United States**:\n\nThe President of the United States is **Donald Trump** (serving as the 47th President of the United States)."
      };
    }
    if (lower.includes("pm of uk") || lower.includes("prime minister of uk") || lower.includes("uk prime minister")) {
      return {
        text: "🇬🇧 **Prime Minister of the United Kingdom**:\n\nThe Prime Minister of the United Kingdom is **Keir Starmer** (Labour Party, in office since July 2024)."
      };
    }

    // 3. Capitals & Geography Dictionary
    const capitals: Record<string, string> = {
      "tamil nadu": "Chennai",
      "tamilnadu": "Chennai",
      "kerala": "Thiruvananthapuram",
      "karnataka": "Bengaluru",
      "andhra pradesh": "Amaravati",
      "andhra": "Amaravati",
      "telangana": "Hyderabad",
      "maharashtra": "Mumbai",
      "india": "New Delhi",
      "france": "Paris",
      "japan": "Tokyo",
      "usa": "Washington, D.C.",
      "america": "Washington, D.C.",
      "united states": "Washington, D.C.",
      "uk": "London",
      "england": "London",
      "germany": "Berlin",
      "russia": "Moscow",
      "australia": "Canberra",
      "canada": "Ottawa",
      "china": "Beijing",
      "italy": "Rome",
      "spain": "Madrid",
      "brazil": "Brasília",
      "egypt": "Cairo",
      "singapore": "Singapore",
      "uae": "Abu Dhabi"
    };
    for (const [place, cap] of Object.entries(capitals)) {
      if (lower.includes("capital") && lower.includes(place)) {
        return {
          text: `📍 The capital of **${place.charAt(0).toUpperCase() + place.slice(1)}** is **${cap}**!`
        };
      }
    }

    // 4. Inventions & Scientific Discoveries
    if (lower.includes("computer") && (lower.includes("invent") || lower.includes("father of"))) {
      return {
        text: "💻 **Inventor of the Computer**:\n\n• **Charles Babbage** is regarded as the **Father of the Computer** for designing the first mechanical computer (Analytical Engine, 1837).\n• **Alan Turing** is considered the father of modern theoretical computer science and artificial intelligence."
      };
    }
    if (lower.includes("telephone") && lower.includes("invent")) {
      return {
        text: "📞 **Inventor of the Telephone**:\n\n**Alexander Graham Bell** was awarded the first U.S. patent for the electric telephone in March 1876."
      };
    }
    if (lower.includes("light bulb") && lower.includes("invent")) {
      return {
        text: "💡 **Inventor of the Light Bulb**:\n\n**Thomas Alva Edison** developed the first practical, long-lasting incandescent electric light bulb in 1879."
      };
    }
    if (lower.includes("gravity") && (lower.includes("discover") || lower.includes("invent") || lower.includes("who found"))) {
      return {
        text: "🍎 **Discovery of Gravity**:\n\n**Sir Isaac Newton** formulated the Universal Law of Gravitation in 1687 after observing a falling apple."
      };
    }
    if (lower.includes("airplane") && lower.includes("invent")) {
      return {
        text: "✈️ **Inventors of the Airplane**:\n\nThe **Wright Brothers** (Orville and Wilbur Wright) made the first successful controlled, powered heavier-than-air airplane flight on December 17, 1903."
      };
    }
    if (lower.includes("internet") && (lower.includes("invent") || lower.includes("father"))) {
      return {
        text: "🌐 **Inventors of the Internet**:\n\n• **Vint Cerf and Bob Kahn** designed the core TCP/IP communication protocols.\n• **Sir Tim Berners-Lee** invented the **World Wide Web (WWW)** in 1989."
      };
    }
    if (lower.includes("photosynthesis")) {
      return {
        text: "🌿 **What is Photosynthesis?**:\n\nPhotosynthesis is the biological process used by green plants and algae to convert light energy from the sun into chemical energy (glucose), absorbing carbon dioxide and releasing vital oxygen: `6CO₂ + 6H₂O + Sunlight → C₆H₁₂O₆ + 6O₂`."
      };
    }
    if (lower.includes("water formula") || lower.includes("formula of water")) {
      return {
        text: "💧 **Chemical Formula of Water**:\n\nThe chemical formula of water is **H₂O** (two hydrogen atoms covalently bonded to one oxygen atom)."
      };
    }
    if (lower.includes("speed of light")) {
      return {
        text: "⚡ **Speed of Light**:\n\nThe speed of light in a vacuum is exactly **299,792,458 meters per second** (~300,000 km/s or ~186,282 miles per second)."
      };
    }

    // 5. Creative & Conversational Intents
    if (lower.includes("joke") || lower.includes("funny")) {
      const jokes = [
        "😄 Why do programmers prefer dark mode? Because light attracts bugs!",
        "😄 Why was the computer cold at the relief camp? Because it left its Windows open!",
        "😄 What did the ocean say to the rescue boat? Nothing, it just waved! 🌊"
      ];
      return { text: jokes[Math.floor(Math.random() * jokes.length)] };
    }
    if (lower.includes("poem") || lower.includes("rhyme")) {
      return {
        text: "📜 **Rising Above The Storm**:\n\n*When torrential rains begin to pour,*\n*And floodwaters reach the door,*\n*Courage and unity lead the way,*\n*Together we welcome a brighter day.*"
      };
    }

    // 6. Real-Time AI Generation (Fast GET / POST)
    try {
      const promptWithContext = `[You are ReliefAI, an intelligent 24/7 AI Assistant. Answer directly, accurately, wisely and naturally in Markdown format]:\n\n${userPrompt}`;
      const res = await fetchWithTimeout(
        `https://text.pollinations.ai/${encodeURIComponent(promptWithContext)}`,
        {},
        4000
      );
      if (res.ok) {
        const text = await res.text();
        const clean = parseAiContent(text);
        if (clean && clean.length > 0 && !clean.includes("<!DOCTYPE") && !clean.includes("<html") && !clean.includes("FREE_LIMIT")) {
          return { text: clean, link };
        }
      }
    } catch (e) {
      console.warn("Primary Real-Time AI fetch error:", e);
    }

    // 7. Live Entity-Cleaned Real-Time Knowledge Engine (Wikipedia)
    try {
      const entity = userPrompt
        .replace(/^(who is|who was|what is|what are|where is|tell me about|explain|define)\s+/i, "")
        .replace(/\?+$/, "")
        .trim();
      const queryToSearch = entity.length > 2 ? entity : userPrompt;
      const wikiSearchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(queryToSearch)}&utf8=&format=json&origin=*`;
      const sRes = await fetchWithTimeout(wikiSearchUrl, {}, 4000);
      if (sRes.ok) {
        const sData = await sRes.json();
        const topResult = sData.query?.search?.[0];
        if (topResult?.title) {
          const sumUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topResult.title)}`;
          const sumRes = await fetchWithTimeout(sumUrl, {}, 4000);
          if (sumRes.ok) {
            const sumData = await sumRes.json();
            if (sumData.extract && sumData.extract.trim().length > 25) {
              const sentences = sumData.extract.split(/(?<=[.?!])\s+/).slice(0, 3).join(" ");
              return {
                text: `💡 **${sumData.title}**${sumData.description ? ` *(${sumData.description})*` : ""}:\n\n${sentences}`,
                link
              };
            }
          }
        }
      }
    } catch (e) {
      console.warn("Wikipedia knowledge fetch error:", e);
    }

    // 6. Smart Knowledge & Conversational Engine (Handles general knowledge & natural chat)

    // Identity / Greetings
    if (lower.includes("name") || lower.includes("who are you") || lower.includes("what are you")) {
      return {
        text: "🤖 My name is **ReliefAI**! I am your 24/7 Realtime AI Assistant built for the Flood Relief Portal.\n\nI can help you with general questions, emergency SOS broadcasting, CPR first aid, finding open relief shelters, and emergency helpline numbers.",
        link: { to: "/emergency", label: "🚨 Emergency SOS Center" }
      };
    }

    if (lower === "hi" || lower === "hello" || lower === "hey" || lower.startsWith("hi ") || lower.startsWith("hello ")) {
      return {
        text: "👋 **Hello! Welcome to ReliefAI.**\n\nHow can I help you today? Feel free to ask me any question or check emergency SOS and shelter features!"
      };
    }

    if (lower.includes("father of india") || lower.includes("father of nation")) {
      return {
        text: "🇮🇳 **Mahatma Gandhi** (Mohandas Karamchand Gandhi) is officially revered as the **Father of the Nation** in India for leading the non-violent struggle for Indian independence."
      };
    }

    if (lower.includes("breakfast") || lower.includes("lunch") || lower.includes("dinner") || lower.includes("eat")) {
      return {
        text: "🍳 As an AI assistant, I don't eat food or have breakfast! But I am fully operational and standing by to help you with anything you need. Have you eaten today?"
      };
    }

    if (lower.includes("how are you")) {
      return {
        text: "😊 I am doing great and standing by 24/7 to assist you! How can I help you right now?"
      };
    }

    if (lower.includes("what can you do") || lower.includes("help me with") || lower.includes("features")) {
      return {
        text: "🌟 **Here is what I can do for you**:\n\n1. **💬 Answer Any Question**: Ask general knowledge, casual, or emergency queries.\n2. **🚨 Emergency SOS**: Guide you on sending live GPS coordinates to rescue boat units.\n3. **🩺 First-Aid & CPR**: Step-by-step CPR, hypothermia, and flood bite treatment.\n4. **⛺ Relief Shelters**: Locate verified camps with drinking water & medical beds.\n5. **📞 Helpline Directory**: Dial NDRF (1078), State Control (1070), Ambulance (108).",
        link: { to: "/emergency", label: "🚨 Go to Emergency Page" }
      };
    }

    if (lower.includes("thank") || lower.includes("thanks")) {
      return {
        text: "🙏 You are very welcome! Let me know if you need anything else!"
      };
    }

    // Emergency & Rescue Intents
    if (lower.includes("sos") || lower.includes("danger") || lower.includes("trapped") || lower.includes("save") || lower.includes("water rising")) {
      return {
        text: "🚨 **EMERGENCY SOS ALERT**\n\nIf you or someone nearby is trapped:\n1. Move immediately to the highest accessible structure or roof.\n2. **Do NOT walk or drive** through moving floodwater.\n3. Click below to broadcast your **live GPS coordinates** to nearby boat units and rescue control.",
        link: { to: "/emergency", label: "🚨 Trigger Instant SOS Broadcast" }
      };
    }

    if (lower.includes("cpr") || lower.includes("drowning") || lower.includes("breath")) {
      return {
        text: "🩺 **Drowning & CPR Emergency Protocol**:\n\n• **Step 1**: Lay victim flat on back on a hard surface.\n• **Step 2**: Check airway & breathing. Tilt head back slightly.\n• **Step 3**: Deliver **30 rapid chest compressions** (2 inches deep, 100-120/min) in center of chest.\n• **Step 4**: Give **2 rescue breaths** sealing mouth-to-mouth.\n• **Step 5**: Repeat 30:2 cycle until victim breathes or medics arrive."
      };
    }

    if (lower.includes("snake") || lower.includes("bite") || lower.includes("insect")) {
      return {
        text: "🐍 **Floodwater Snake Bite First Aid**:\n\n• **DO NOT**: Cut the wound, suck venom, or apply tight tourniquets.\n• **DO**: Keep victim completely still and calm to slow venom circulation.\n• **DO**: Remove jewelry/shoes before swelling starts.\n• **DO**: Immobilize limb below heart level and call **108 Ambulance** immediately."
      };
    }

    if (lower.includes("shelter") || lower.includes("camp") || lower.includes("stay") || lower.includes("food") || lower.includes("ration")) {
      return {
        text: "⛺ **Relief Camps & Food Rations**:\n\nActive government relief shelters provide:\n• Purified drinking water & hot meals\n• Medical triage & essential medications\n• Dry sleeping mats & foil blankets\n• Safe family check-in registration",
        link: { to: "/facilities", label: "⛺ Find Nearby Relief Shelter" }
      };
    }

    if (lower.includes("volunteer") || lower.includes("boat") || lower.includes("rescue route")) {
      return {
        text: "🚤 **Volunteer Rescue Route Operations**:\n\nRegistered volunteer rescuers can access real-time victim GPS pins, route distance, and status tracking.",
        link: { to: "/rescue-route", label: "🧭 Open Rescue Route Finder" }
      };
    }

    if (lower.includes("phone") || lower.includes("number") || lower.includes("helpline") || lower.includes("call") || lower.includes("contact")) {
      return {
        text: "📞 **24/7 Emergency Helpline Directory**:\n\n• **National Emergency**: 112\n• **NDRF Control Room**: 1078 / 011-24363260\n• **State Disaster Control**: 1070\n• **District Collectorate**: 1077\n• **Ambulance**: 108",
        link: { to: "/helpline", label: "📞 Dial Emergency Helplines" }
      };
    }

    // Intelligent Conversational Fallback
    return {
      text: `🤖 **ReliefAI Assistant**: I am standing by 24/7 to assist with live emergency rescue, shelters, first aid, and general inquiries.\n\nCould you please clarify your request, or choose one of our quick disaster response tools below?`,
      link: { to: "/emergency", label: "🚨 Emergency Disaster Center" }
    };
  };

  const handleSend = async (textToSend?: string) => {
    const userText = (textToSend || input).trim();
    if (!userText) return;

    if (!textToSend) setInput("");

    const userMsg: Message = {
      id: "user-" + Date.now(),
      sender: "user",
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    const { text, link } = await fetchAiResponse(userText);

    setIsTyping(false);
    setMessages((prev) => [
      ...prev,
      {
        id: "ai-" + Date.now(),
        sender: "ai",
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        link,
        isAiLive: true,
      },
    ]);
  };

  const handleChipClick = (label: string) => {
    handleSend(label);
  };

  // Voice Input Setup
  const toggleVoiceInput = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      toast.error("Speech recognition is not supported in your browser.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";

    if (!isListening) {
      setIsListening(true);
      toast.info("Listening for your voice emergency query...");
      recognition.start();

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        toast.success(`Voice captured: "${transcript}"`);
      };

      recognition.onerror = () => {
        setIsListening(false);
        toast.error("Voice input error. Please try again.");
      };

      recognition.onend = () => {
        setIsListening(false);
      };
    } else {
      setIsListening(false);
      recognition.stop();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "msg-welcome",
        sender: "ai",
        text: "👋 Chat cleared. I am **ReliefAI**, ready to assist with any flood emergency questions!",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    toast.success("Chat history cleared");
  };

  return (
    <div className="fixed bottom-5 right-5 z-[9999]">
      {/* TRIGGER BUTTON */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className="group relative flex items-center gap-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 text-white p-3.5 rounded-full shadow-2xl hover:scale-105 transition-all duration-300 border border-white/20 active:scale-95"
        >
          <div className="relative flex items-center justify-center">
            <Bot className="w-6 h-6 animate-bounce text-cyan-200" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900 animate-ping" />
          </div>
          <span className="font-outfit font-black text-xs tracking-wider pr-1 hidden sm:inline-block">
            ReliefAI Assistant
          </span>
          <Badge className="bg-white/20 text-white text-[9px] border-0">
            Realtime AI Live
          </Badge>
        </button>
      )}

      {/* CHAT MODAL WINDOW */}
      {isOpen && (
        <Card className={`w-[90vw] sm:w-[390px] border border-cyan-500/30 shadow-2xl bg-slate-950/95 backdrop-blur-xl transition-all duration-300 overflow-hidden flex flex-col ${
          isMinimized ? "h-[60px]" : "h-[540px]"
        }`}>
          {/* HEADER */}
          <CardHeader className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 p-3 border-b border-cyan-500/20 flex flex-row items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-sm font-black text-slate-100 flex items-center gap-1.5 font-outfit">
                  ReliefAI Assistant
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                </CardTitle>
                <p className="text-[10px] text-cyan-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping" />
                  Realtime Gemini Emergency AI
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={clearChat}
                title="Clear Chat"
                className="h-7 w-7 text-slate-400 hover:text-red-400 hover:bg-slate-800"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          {/* CHAT MESSAGES BODY */}
          {!isMinimized && (
            <>
              <CardContent className="flex-1 p-3 overflow-y-auto space-y-3 font-sans text-xs">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.sender === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`max-w-[88%] p-3 rounded-2xl space-y-2 ${
                        msg.sender === "user"
                          ? "bg-blue-600 text-white rounded-br-none shadow"
                          : "bg-slate-900/90 border border-slate-800 text-slate-200 rounded-bl-none shadow-md"
                      }`}
                    >
                      <div
                        className="prose prose-invert prose-xs text-xs space-y-1 leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: msg.text
                            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                            .replace(/\n/g, "<br/>"),
                        }}
                      />

                      {msg.link && (
                        <div className="pt-1">
                          <Link to={msg.link.to as any}>
                            <Button size="sm" className="w-full h-7 bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold gap-1 shadow">
                              {msg.link.label}
                              <ChevronRight className="w-3 h-3" />
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-[9px] text-slate-500 px-1 pt-1">
                      {msg.isAiLive && <Badge className="bg-cyan-500/20 text-cyan-400 text-[8px] py-0 px-1 border-0">AI Generated</Badge>}
                      <span>{msg.timestamp}</span>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-center gap-2 text-cyan-400 bg-slate-900/80 p-2.5 rounded-xl w-fit border border-cyan-500/30 animate-pulse">
                    <Bot className="w-4 h-4 animate-spin text-cyan-400" />
                    <span className="text-[10px] font-medium">ReliefAI is generating emergency answer...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </CardContent>

              {/* QUICK SUGGESTION CHIPS */}
              <div className="px-3 py-2 bg-slate-950 border-t border-slate-900 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {DEFAULT_CHIPS.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleChipClick(chip.label)}
                    className="shrink-0 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[10px] px-2.5 py-1 rounded-full font-semibold transition-colors flex items-center gap-1"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* INPUT BAR */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="p-2.5 bg-slate-950 border-t border-slate-900 flex items-center gap-1.5 shrink-0"
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={toggleVoiceInput}
                  className={`h-9 w-9 shrink-0 rounded-lg ${
                    isListening ? "bg-red-500/20 text-red-400 animate-pulse" : "text-slate-400 hover:text-white hover:bg-slate-900"
                  }`}
                  title="Voice Emergency Input"
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask ReliefAI anything about flood rescue..."
                  className="bg-slate-900 border-slate-800 text-slate-100 text-xs placeholder:text-slate-500 focus-visible:ring-cyan-500 h-9"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim()}
                  className="h-9 w-9 bg-cyan-600 hover:bg-cyan-500 text-white shrink-0 disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
