"use client";

import { useState, useRef, useEffect } from "react";
import { request } from "@/lib/api";

type Message = {
    role: "user" | "assistant";
    content: string;
};

export function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content: "👋 Hi! I'm KhaddoKotha AI Assistant. I can help you reduce food waste, suggest recipes, and answer questions about food preservation. How can I help you today?",
        },
    ]);
    const [inputMessage, setInputMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || isLoading) return;

        const userMessage: Message = {
            role: "user",
            content: inputMessage.trim(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputMessage("");
        setIsLoading(true);

        try {
            const response = await request<{ reply: string }>("/api/chatbot", {
                method: "POST",
                body: JSON.stringify({
                    message: userMessage.content,
                    conversationHistory: messages.slice(-6),
                }),
            });

            const assistantMessage: Message = {
                role: "assistant",
                content: response.reply,
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            console.error("Chatbot error:", error);
            const errorMessage: Message = {
                role: "assistant",
                content: "Sorry, I'm having trouble connecting. Please try again!",
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const clearChat = () => {
        setMessages([
            {
                role: "assistant",
                content: "Chat cleared! How can I help you?",
            },
        ]);
    };

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-80 h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-emerald-600 to-green-600 p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-sm">AI Help Center</h3>
                                <p className="text-xs text-emerald-100">Powered by Gemini</p>
                            </div>
                        </div>
                        <button
                            onClick={clearChat}
                            className="text-white/80 hover:text-white transition-colors p-1"
                            title="Clear chat"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50">
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-xl px-3 py-2 ${message.role === "user"
                                            ? "bg-emerald-600 text-white rounded-tr-sm"
                                            : "bg-white text-slate-800 shadow-sm border border-slate-200 rounded-tl-sm"
                                        }`}
                                >
                                    <p className="text-xs whitespace-pre-wrap leading-relaxed">
                                        {message.content}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white text-slate-800 rounded-xl rounded-tl-sm px-3 py-2 shadow-sm border border-slate-200">
                                    <div className="flex gap-1">
                                        <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce"></div>
                                        <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                                        <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 bg-white border-t border-slate-200">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Ask me anything..."
                                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={!inputMessage.trim() || isLoading}
                                className="bg-emerald-600 text-white rounded-lg px-3 py-2 hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-14 h-14 bg-gradient-to-br from-emerald-600 to-green-600 text-white rounded-full shadow-xl hover:scale-105 transition-transform flex items-center justify-center group"
            >
                {isOpen ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                        {/* Robot head circle */}
                        <circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />

                        {/* Left headphone */}
                        <path d="M5 10 C4 10, 3 11, 3 12 C3 13, 4 14, 5 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />

                        {/* Right headphone */}
                        <path d="M19 10 C20 10, 21 11, 21 12 C21 13, 20 14, 19 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />

                        {/* Left eye */}
                        <circle cx="9.5" cy="11" r="1.2" fill="currentColor" />

                        {/* Right eye */}
                        <circle cx="14.5" cy="11" r="1.2" fill="currentColor" />

                        {/* Smile/mouth */}
                        <path d="M9 14 Q12 16, 15 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />

                        {/* Antenna */}
                        <line x1="12" y1="5" x2="12" y2="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        <circle cx="12" cy="2.5" r="0.8" fill="currentColor" />
                    </svg>
                )}
            </button>
        </div>
    );
}
