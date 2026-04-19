/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { 
  Rocket, 
  Target, 
  CircleDollarSign, 
  MapPin, 
  Zap, 
  BarChart3, 
  LayoutDashboard, 
  Megaphone, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  Send,
  Loader2,
  Sparkles,
  Facebook,
  Search,
  Youtube,
  Smartphone,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GoogleGenAI } from "@google/genai";

// Standard AdsGuru AI Persona Rules
const RULES = {
  MIN_GOOGLE_BUDGET: 2000,
  MIN_FB_BUDGET: 600,
  RECOMMENDED_FB_BUDGET: 1000,
};

type BusinessInfo = {
  name: string;
  product: string;
  location: string;
  budget: number | null;
  platform: "Google" | "Facebook" | "Both" | "";
  goal: string;
};

type Message = {
  id: string;
  role: "bot" | "user";
  text: string;
  type?: "text" | "choice" | "error" | "plan";
  choices?: string[];
};

export default function App() {
  const [step, setStep] = useState(0);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "bot",
      text: "Assalam-o-Alaikum! AdsGuru AI mein khush-amdeed! 👋\n\nMain Pakistan ka #1 AI Advertising Assistant hoon. Main aapka target aur budget dekh kar perfect ads strategy banaon ga.",
    },
    {
      id: "2",
      role: "bot",
      text: "Shuru karte hain! Pehle kuch basic info chahiye 😊\n\nAapke business ka naam kya hai?",
    }
  ]);
  const [input, setInput] = useState("");
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    name: "",
    product: "",
    location: "",
    budget: null,
    platform: "",
    goal: "",
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMessage = (msg: Omit<Message, "id">) => {
    setMessages(prev => [...prev, { ...msg, id: Math.random().toString(36).substr(2, 9) }]);
  };

  const handleSend = async () => {
    if (!input.trim() && step !== 4 && step !== 5) return;

    const userText = input.trim();
    if (userText) {
      addMessage({ role: "user", text: userText });
    }
    setInput("");

    // Step Logic
    if (step === 0) {
      setBusinessInfo(prev => ({ ...prev, name: userText }));
      setStep(1);
      setTimeout(() => {
        addMessage({ role: "bot", text: "Aap kya bechte hain ya kya service dete hain?" });
      }, 500);
    } else if (step === 1) {
      setBusinessInfo(prev => ({ ...prev, product: userText }));
      setStep(2);
      setTimeout(() => {
        addMessage({ role: "bot", text: "Aap kahan ke customers target karna chahte hain? (Sirf apna shehar ya poora Pakistan?)" });
      }, 500);
    } else if (step === 2) {
      setBusinessInfo(prev => ({ ...prev, location: userText }));
      setStep(3);
      setTimeout(() => {
        addMessage({ role: "bot", text: "Aapka monthly ads budget kitna hai PKR mein?" });
      }, 500);
    } else if (step === 3) {
      const budgetNum = parseInt(userText.replace(/[^0-9]/g, ""));
      if (isNaN(budgetNum)) {
        addMessage({ role: "bot", text: "Bhai, sirf numbers mein budget batayein (e.g., 5000)." });
        return;
      }
      setBusinessInfo(prev => ({ ...prev, budget: budgetNum }));
      setStep(4);
      setTimeout(() => {
        addMessage({ 
          role: "bot", 
          text: "Aap konsa platform use karna chahte hain?",
          type: "choice",
          choices: ["Google Ads", "Facebook/Instagram Ads", "Dono (Google + Facebook)"]
        });
      }, 500);
    } else if (step === 6) {
      setBusinessInfo(prev => ({ ...prev, goal: userText }));
      generatePlan(userText);
    }
  };

  const handleChoice = (choice: string) => {
    addMessage({ role: "user", text: choice });
    
    if (step === 4) {
      // Platform choice & Budget Validation
      const budget = businessInfo.budget || 0;
      if (choice.includes("Google") && !choice.includes("Dono") && budget < RULES.MIN_GOOGLE_BUDGET) {
        addMessage({ 
          role: "bot", 
          text: `⛔ BUDGET ERROR — Google Ads\n\nBhai/Behen, Google Ads ke liye minimum PKR ${RULES.MIN_GOOGLE_BUDGET}/month chahiye.\nAapka budget kam hai isliye Google Ads abhi suit nahi karega.\n\nAap ye karein:\n✅ Option 1: Budget PKR 2000+ karein phir Google Ads chalayein\n✅ Option 2: Abhi Facebook Ads se shuru karein — sirf PKR 600/month mein!\n✅ Option 3: Free mein Google My Business setup karein\n\nKaunsa option pasand hai?`,
          type: "choice",
          choices: ["Budget Barhaon Ga", "Facebook Ads Kar Lein", "Google My Business Help"]
        });
        setStep(10); // Special Error state
        return;
      }

      const isDono = choice.includes("Dono");
      if (choice.includes("Facebook") || isDono) {
        if (budget < RULES.MIN_FB_BUDGET) {
          addMessage({
            role: "bot",
            text: `⛔ BUDGET ERROR — Facebook/Instagram Ads\n\nBhai/Behen, Facebook Ads ke liye minimum PKR ${RULES.MIN_FB_BUDGET}/month chahiye.\nRecommended PKR 1,000/month se shuru karein behtar results ke liye.\n\n✅ Agar budget nahi hai toh Free alternatives batata hoon!\nBudget kitna kar sakte hain?`,
          });
          setStep(3); // Go back to budget
          return;
        }
      }

      setBusinessInfo(prev => ({ ...prev, platform: choice as any }));
      setStep(5);
      setTimeout(() => {
        addMessage({
          role: "bot",
          text: "Aapka main goal kya hai? Choose karein:",
          type: "choice",
          choices: [
            "Brand Awareness",
            "Lead Generation (Calls/WhatsApp)",
            "Sales (Store Sales)",
            "Website Traffic",
            "App Downloads"
          ]
        });
      }, 500);
    } else if (step === 5) {
      setBusinessInfo(prev => ({ ...prev, goal: choice }));
      generatePlan(choice);
    } else if (step === 10) {
      if (choice === "Budget Barhaon Ga") {
        setStep(3);
        addMessage({ role: "bot", text: "Bohat khoob! Naya budget kitna rakhen ge? (Min PKR 2000)" });
      } else if (choice === "Facebook Ads Kar Lein") {
         setBusinessInfo(prev => ({ ...prev, platform: "Facebook" }));
         setStep(5);
         setTimeout(() => {
           addMessage({
             role: "bot",
             text: "Theek hai! Facebook Ads ke liye goals choose karein:",
             type: "choice",
             choices: ["Brand Awareness", "Lead Generation (Calls/WhatsApp)", "Sales (Store Sales)"]
           });
         }, 500);
      } else {
        addMessage({ role: "bot", text: "Google My Business (GMB) ek free tool hai. Aap business.google.com par jayen aur account bnayein. Is se aap Google Maps par free nazar aayenge." });
      }
    }
  };

  const generatePlan = async (finalGoal: string) => {
    setIsGenerating(true);
    setStep(100); // Plan phase
    
    try {
      const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const model = genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Generate the complete ads plan for my business.",
        config: {
          systemInstruction: `You are AdsGuru AI, an expert digital advertiser for Pakistan.
          User Business Info:
          Name: ${businessInfo.name}
          Product: ${businessInfo.product}
          Location: ${businessInfo.location}
          Budget: PKR ${businessInfo.budget}/month
          Platform: ${businessInfo.platform}
          Goal: ${finalGoal}

          Create a complete advertising blueprint in Urdu/Hinglish as per provided guidelines.
          Ensure it includes:
          - Campaign Type recommendation
          - Step-by-step setup (Account, Billing, Campaign)
          - Specific Keywords (for search)
          - Ad Headlines & Descriptions (Copy)
          - 30-Day Action Plan
          
          Keep it very professional and encouraging.`,
        }
      });

      const response = await model;
      setGeneratedPlan(response.text || "Sorry, error generating plan.");
    } catch (error) {
      console.error(error);
      addMessage({ role: "bot", text: "Maazrat khwah hoon, system mein kuch masla aa gaya hai. Dubara koshish karein." });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto font-sans overflow-x-hidden">
      {/* Header */}
      <nav className="flex justify-between items-center bg-slate-800/50 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-500/20">
            <Rocket className="text-white w-6 h-6" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xl font-bold tracking-tight">AdsGuru <span className="text-indigo-400 font-black">AI</span></span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Pakistan's #1 Ads Tool</span>
          </div>
        </div>
        <div className="hidden md:flex gap-6 items-center text-sm font-medium text-slate-400">
          <a href="#" className="hover:text-white transition-colors flex items-center gap-2"><LayoutDashboard className="w-4 h-4"/> Dashboard</a>
          <a href="#" className="hover:text-white transition-colors flex items-center gap-2"><Megaphone className="w-4 h-4"/> Campaigns</a>
          <div className="w-10 h-10 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center overflow-hidden shadow-inner">
             <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${businessInfo.name || "AI"}`} alt="User" referrerPolicy="no-referrer" />
          </div>
        </div>
      </nav>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 md:grid-rows-6 gap-4 flex-1">
        
        {/* Card 1: Chat Interaction */}
        <div className="col-span-1 md:col-span-8 md:row-span-4 bento-card flex flex-col h-[500px] md:h-auto overflow-hidden">
          <div className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-800/30">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">AdsGuru Intelligence</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase">AI Active</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[85%] p-4 rounded-2xl ${
                    msg.role === "user" 
                      ? "bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-900/20" 
                      : "bg-slate-700/50 border border-white/5 rounded-tl-none"
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    
                    {msg.choices && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {msg.choices.map((choice) => (
                          <button
                            key={choice}
                            onClick={() => handleChoice(choice)}
                            className="text-xs bg-slate-900/60 hover:bg-indigo-500 hover:text-white border border-white/10 px-3 py-2 rounded-lg transition-all font-medium"
                          >
                            {choice}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 bg-slate-800/50 border-t border-white/5">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Apne business ke baare mein likhein..."
                disabled={step === 100 || (messages[messages.length-1].type === "choice")}
                className="flex-1 glass-input px-4 py-3 text-sm text-white"
              />
              <button
                onClick={handleSend}
                disabled={step === 100 || (messages[messages.length-1].type === "choice")}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white p-3 rounded-xl transition-colors shadow-lg shadow-indigo-900/40"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="mt-2 text-[10px] text-slate-500 text-center font-bold uppercase tracking-tighter">
              Press Enter for fast response • 100% Secure Campaign Planning
            </p>
          </div>
        </div>

        {/* Card 2: Creative Preview / Output */}
        <div className="col-span-1 md:col-span-4 md:row-span-4 bento-card gradient-border flex flex-col gap-4 overflow-hidden relative group">
          <div className="p-4 border-b border-white/5 flex justify-between items-center">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">Draft Preview</h2>
            <Zap className="w-4 h-4 text-indigo-400" />
          </div>

          <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto">
            {isGenerating ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <div className="text-center">
                  <p className="text-sm font-bold text-white">Generating Your Ads Plan...</p>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-black">AI is thinking in Urdu & English</p>
                </div>
              </div>
            ) : generatedPlan ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="prose prose-invert prose-sm max-w-none text-slate-300 whitespace-pre-wrap h-full overflow-y-auto"
              >
                <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                  {generatedPlan}
                </div>
              </motion.div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center opacity-40 grayscale group-hover:grayscale-0 transition-all duration-700">
                <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mb-4 border-2 border-dashed border-slate-600">
                  <Sparkles className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-xs text-center font-bold px-8 leading-relaxed uppercase tracking-widest">
                  Complete information provide karein phir aapka plan yahan dikhega
                </p>
              </div>
            )}
          </div>
          
          <button 
            disabled={!generatedPlan}
            className={`m-4 py-3 font-bold rounded-xl transition-all shadow-xl ${
              generatedPlan 
                ? "bg-white text-indigo-950 hover:bg-slate-100" 
                : "bg-slate-700 text-slate-500 cursor-not-allowed"
            }`}
          >
            Launch Campaign
          </button>
        </div>

        {/* Card 3: Platform Settings */}
        <div className="col-span-1 md:col-span-4 md:row-span-2 bento-card flex flex-col p-4 bg-slate-800/40 relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="flex flex-col">
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Platform Status</span>
              <span className="text-lg font-bold text-white uppercase">{businessInfo.platform || "Checking..."}</span>
            </div>
            {businessInfo.platform?.includes("Google") ? <Search className="w-5 h-5 text-indigo-400" /> : <Facebook className="w-5 h-5 text-blue-400" />}
          </div>
          
          <div className="mt-auto space-y-2">
            <div className="flex justify-between items-center text-[10px] font-bold uppercase text-slate-500">
              <span>Goal</span>
              <span className="text-indigo-300">{businessInfo.goal || "Not Set"}</span>
            </div>
            <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <motion.div 
                className="bg-indigo-500 h-full"
                animate={{ width: `${(Math.min(step, 6) / 6) * 100}%` }}
                transition={{ type: "spring", stiffness: 100 }}
              />
            </div>
          </div>
        </div>

        {/* Card 4: Budget Stats */}
        <div className="col-span-1 md:col-span-4 md:row-span-2 bento-card flex flex-col p-4 bg-emerald-500/5 border-emerald-500/10">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Monthly Budget</span>
              <div className="flex items-center gap-1">
                <span className="text-2xl font-black text-white">PKR {businessInfo.budget?.toLocaleString() || "0"}</span>
                <span className="text-sm text-slate-500 mt-1">/mo</span>
              </div>
            </div>
            <CircleDollarSign className="w-5 h-5 text-emerald-400" />
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
             <div className="bg-slate-800/80 p-2 rounded-xl border border-white/5">
                <p className="text-[9px] text-slate-500 uppercase font-black">Daily Spend</p>
                <p className="text-sm font-bold">PKR {businessInfo.budget ? Math.round(businessInfo.budget / 30) : 0}</p>
             </div>
             <div className="bg-slate-800/80 p-2 rounded-xl border border-white/5">
                <p className="text-[9px] text-slate-500 uppercase font-black">Reach Est.</p>
                <p className="text-sm font-bold text-emerald-400">~{businessInfo.budget ? (businessInfo.budget * 0.5).toLocaleString() : 0}</p>
             </div>
          </div>
        </div>

        {/* Card 5: Optimization AI */}
        <div className="col-span-1 md:col-span-4 md:row-span-2 bento-card flex items-center justify-between p-6 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border-indigo-500/30">
          <div className="flex flex-col">
            <span className="text-xs text-indigo-300 font-bold uppercase tracking-tighter flex items-center gap-1">
              <Zap className="w-3 h-3 fill-indigo-300" /> Optimization Active
            </span>
            <span className="text-xl font-bold text-white mt-1">Predictive ROAS</span>
          </div>
          <motion.div 
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 4 }}
            className="text-4xl font-black accent-glow text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400"
          >
            {businessInfo.budget ? (businessInfo.budget > 10000 ? "3.2x" : "2.4x") : "0x"}
          </motion.div>
        </div>

      </div>

      {/* Footer Info Mobile Only */}
      <div className="md:hidden bento-card p-4 flex items-center gap-4 bg-slate-800/80">
        <Info className="w-5 h-5 text-indigo-400 flex-shrink-0" />
        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest leading-relaxed">
          AdsGuru AI uses machine learning to optimize Pakistani local marketplaces and consumer behavior.
        </p>
      </div>
    </div>
  );
}
