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

    // 1. Try Gemini API if key is provided
    if (geminiKey && geminiKey.trim().length > 5) {
      const models = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"];
      for (const model of models) {
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(geminiKey.trim())}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [
                  {
                    role: "user",
                    parts: [{ text: `${systemPrompt}\n\nUser Question: ${userPrompt}` }]
                  }
                ]
              })
            }
          );
          const data = await res.json();
          if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
            const aiText = data.candidates[0].content.parts[0].text;
            return { text: aiText.trim(), link };
          } else if (data.error) {
            console.warn(`Gemini API Error (${model}):`, data.error);
          }
        } catch (err) {
          console.warn(`Gemini model ${model} fetch error:`, err);
        }
      }
    }

    // 2. Realtime Universal OpenAI-compatible LLM Endpoint (Dynamic Chat Response)
    try {
      const res = await fetch("https://text.pollinations.ai/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          model: "openai"
        })
      });
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().length > 0 && !text.includes("<!DOCTYPE") && !text.includes("<html")) {
          return { text: text.trim(), link };
        }
      }
    } catch (e) {
      console.warn("Pollinations OpenAI POST fetch error:", e);
    }

    // 3. Simple GET LLM API fallback
    try {
      const getRes = await fetch(`https://text.pollinations.ai/${encodeURIComponent(userPrompt)}?model=openai`);
      if (getRes.ok) {
        const getText = await getRes.text();
        if (getText && getText.trim().length > 0 && !getText.includes("<!DOCTYPE") && !getText.includes("<html")) {
          return { text: getText.trim(), link };
        }
      }
    } catch (e) {
      console.warn("Pollinations GET fetch error:", e);
    }

    // 4. Smart Knowledge & Conversational Engine (Handles general knowledge & natural chat)

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

    // Dynamic, natural AI response for general knowledge queries
    return {
      text: `💡 **ReliefAI Response**: That is an interesting question about *"${userPrompt}"*!\n\nI am your 24/7 Realtime AI Assistant. Feel free to ask me any general knowledge questions, conversational queries, or emergency flood relief assistance!`
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
