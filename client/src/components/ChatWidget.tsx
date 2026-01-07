import { useState, useEffect, useRef } from "react";
import { useChat } from "@/hooks/use-chat";
import { MessageCircle, X, Send, Bot, User, CheckCircle2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, sendMessage, isTyping } = useChat();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-[360px] md:w-[400px] h-[600px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-border flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-primary text-primary-foreground flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Sparkles className="w-3 h-3" />
                    Golf AI Assistant
                  </h3>
                  <p className="text-xs text-primary-foreground/80">Book via GolfNow</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-2 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary/20">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground py-8 space-y-3">
                  <div className="flex justify-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Bot className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <p className="text-sm font-medium">Hi! I'm your golf booking assistant.</p>
                  <p className="text-xs">I can help you find courses, check availability, and book tee times instantly!</p>
                  <div className="pt-2 space-y-1 text-xs">
                    <p className="font-semibold">Try asking:</p>
                    <p>"Show me courses in Costa del Sol"</p>
                    <p>"I want to book Valderrama for next Saturday"</p>
                  </div>
                </div>
              )}
              
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3 max-w-[85%]",
                    msg.role === "user" ? "ml-auto flex-row-reverse" : ""
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    msg.role === "user" ? "bg-gray-200" : "bg-primary text-white"
                  )}>
                    {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={cn(
                    "p-3 rounded-2xl text-sm leading-relaxed",
                    msg.role === "user" 
                      ? "bg-gray-100 text-gray-900 rounded-tr-sm" 
                      : msg.content.includes("✅") || msg.content.includes("Booking Confirmed")
                        ? "bg-green-50 border-2 border-green-200 shadow-sm text-gray-800 rounded-tl-sm"
                        : "bg-white border border-border shadow-sm text-gray-800 rounded-tl-sm"
                  )}>
                    {msg.content.split("\n").map((line, idx) => {
                      // Highlight booking confirmations
                      if (line.includes("✅") || line.includes("**Confirmation Number:**")) {
                        return (
                          <div key={idx} className="space-y-1">
                            {line.includes("**") ? (
                              <div className="font-semibold text-green-700 flex items-center gap-2 my-2">
                                <CheckCircle2 className="w-4 h-4" />
                                {line.replace(/\*\*/g, "")}
                              </div>
                            ) : (
                              <p className={line.includes("✅") ? "font-bold text-green-700 mb-2" : ""}>{line}</p>
                            )}
                          </div>
                        );
                      }
                      return <p key={idx}>{line || "\u00A0"}</p>;
                    })}
                    {msg.isStreaming && (
                      <span className="inline-block w-2 h-4 bg-primary/50 ml-1 animate-pulse" />
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-border">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about golf..."
                  className="flex-1 px-4 py-2 rounded-xl border border-input focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-secondary/30"
                />
                <button
                  type="submit"
                  disabled={isTyping || !input.trim()}
                  className="bg-primary text-white p-2.5 rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-xl shadow-primary/30 flex items-center justify-center z-50 hover:bg-primary/90 transition-colors"
      >
        <MessageCircle className="w-7 h-7" />
      </motion.button>
    </>
  );
}
