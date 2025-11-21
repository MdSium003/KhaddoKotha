"use client";

import { useState, useRef, useEffect } from "react";
import { request } from "@/lib/api";

type Message = {
    role: "user" | "assistant";
    content: string;
    timestamp?: number;
};

type ChatSession = {
    messages: Message[];
    sessionStart: number;
    lastActivity: number;
};

const STORAGE_KEY = "khaddokotha_chatbot_session";
const INITIAL_MESSAGE: Message = {
    role: "assistant",
    content: "👋 Hi! I'm KhaddoKotha AI Assistant. I can help you with:\n\n🌱 Food waste reduction advice\n🥗 Nutrition balancing\n💰 Budget meal planning\n♻️ Creative leftover transformations\n🤝 Local food sharing guidance\n🌍 Environmental impact insights\n\nHow can I help you today?",
    timestamp: Date.now(),
};

// Load session from sessionStorage
function loadSession(): ChatSession | null {
    if (typeof window === "undefined") return null;
    try {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored) {
            const session: ChatSession = JSON.parse(stored);
            // Check if session is still valid (within 24 hours)
            const hoursSinceStart = (Date.now() - session.sessionStart) / (1000 * 60 * 60);
            if (hoursSinceStart < 24) {
                return session;
            } else {
                // Session expired, clear it
                sessionStorage.removeItem(STORAGE_KEY);
            }
        }
    } catch (error) {
        console.error("Error loading chat session:", error);
    }
    return null;
}

// Save session to sessionStorage
function saveSession(session: ChatSession) {
    if (typeof window === "undefined") return;
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch (error) {
        console.error("Error saving chat session:", error);
    }
}

// Initialize or restore session
function initializeSession(): ChatSession {
    const existing = loadSession();
    if (existing && existing.messages.length > 0) {
        return existing;
    }
    
    const newSession: ChatSession = {
        messages: [INITIAL_MESSAGE],
        sessionStart: Date.now(),
        lastActivity: Date.now(),
    };
    saveSession(newSession);
    return newSession;
}

export function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>(() => {
        const session = initializeSession();
        return session.messages;
    });
    const [sessionStart, setSessionStart] = useState<number>(() => {
        const session = initializeSession();
        return session.sessionStart;
    });
    const [inputMessage, setInputMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const quickActions = [
        { label: "Reduce Food Waste", query: "How can I reduce food waste based on my inventory?" },
        { label: "Nutrition Balance", query: "Analyze my nutrition balance and suggest improvements" },
        { label: "Budget Meals", query: "Suggest budget-friendly meal plans using my inventory" },
        { label: "Transform Leftovers", query: "Give me creative ideas to transform my leftovers" },
        { label: "Food Sharing", query: "How can I share food with my local community?" },
        { label: "Environmental Impact", query: "Explain the environmental impact of food waste" },
    ];

    const handleQuickAction = async (query: string) => {
        const userMessage: Message = {
            role: "user",
            content: query,
            timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setIsLoading(true);

        try {
            // Send last 20 messages for better context (excluding the initial greeting if it's the only message)
            const contextMessages = messages.length > 1 
                ? messages.slice(1).slice(-20) // Skip initial message and take last 20
                : [];
            
            const response = await request<{ reply: string }>("/api/chatbot", {
                method: "POST",
                body: JSON.stringify({
                    message: query,
                    conversationHistory: contextMessages.map(msg => ({
                        role: msg.role,
                        content: msg.content,
                    })),
                    sessionContext: {
                        sessionStart,
                        messageCount: messages.length,
                        sessionDuration: Date.now() - sessionStart,
                    },
                }),
            });

            const assistantMessage: Message = {
                role: "assistant",
                content: response.reply,
                timestamp: Date.now(),
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            console.error("Chatbot error:", error);
            const errorMessage: Message = {
                role: "assistant",
                content: "Sorry, I'm having trouble connecting. Please try again!",
                timestamp: Date.now(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Save messages to sessionStorage whenever they change
    useEffect(() => {
        if (messages.length > 0) {
            const session: ChatSession = {
                messages,
                sessionStart,
                lastActivity: Date.now(),
            };
            saveSession(session);
        }
    }, [messages, sessionStart]);

    const handleSendMessage = async (customMessage?: string) => {
        const messageToSend = customMessage || inputMessage;
        if (!messageToSend.trim() || isLoading) return;

        const userMessage: Message = {
            role: "user",
            content: messageToSend.trim(),
            timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputMessage("");
        setIsLoading(true);

        try {
            // Send last 20 messages for better context (excluding the initial greeting if it's the only message)
            const contextMessages = messages.length > 1 
                ? messages.slice(1).slice(-20) // Skip initial message and take last 20
                : [];

            const response = await request<{ reply: string }>("/api/chatbot", {
                method: "POST",
                body: JSON.stringify({
                    message: userMessage.content,
                    conversationHistory: contextMessages.map(msg => ({
                        role: msg.role,
                        content: msg.content,
                    })),
                    sessionContext: {
                        sessionStart,
                        messageCount: messages.length,
                        sessionDuration: Date.now() - sessionStart,
                    },
                }),
            });

            const assistantMessage: Message = {
                role: "assistant",
                content: response.reply,
                timestamp: Date.now(),
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            console.error("Chatbot error:", error);
            const errorMessage: Message = {
                role: "assistant",
                content: "Sorry, I'm having trouble connecting. Please try again!",
                timestamp: Date.now(),
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
        const clearedMessage: Message = {
            role: "assistant",
            content: "Chat cleared! How can I help you?",
            timestamp: Date.now(),
        };
        const newSession: ChatSession = {
            messages: [clearedMessage],
            sessionStart: Date.now(),
            lastActivity: Date.now(),
        };
        setSessionStart(newSession.sessionStart);
        setMessages([clearedMessage]);
        saveSession(newSession);
    };

    // Format session duration
    const getSessionDuration = () => {
        const duration = Date.now() - sessionStart;
        const minutes = Math.floor(duration / (1000 * 60));
        const hours = Math.floor(minutes / 60);
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        }
        return `${minutes}m`;
    };

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-96 h-[600px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-emerald-600 to-green-600 p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-white text-sm">AI Help Center</h3>
                                <div className="flex items-center gap-2">
                                    <p className="text-xs text-emerald-100">Powered by Gemini</p>
                                    {messages.length > 1 && (
                                        <>
                                            <span className="text-xs text-emerald-200">•</span>
                                            <p className="text-xs text-emerald-100 truncate">
                                                💾 Session: {getSessionDuration()} • {messages.length - 1} messages
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={clearChat}
                            className="text-white/80 hover:text-white transition-colors p-1 flex-shrink-0"
                            title="Clear chat"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>

                    {/* Quick Actions */}
                    {messages.length === 1 && (
                        <div className="px-3 pt-3 pb-2 bg-slate-50 border-b border-slate-200">
                            <p className="text-xs font-semibold text-slate-600 mb-2">Quick Actions:</p>
                            <div className="flex flex-wrap gap-1.5">
                                {quickActions.map((action, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleQuickAction(action.query)}
                                        className="text-xs px-2 py-1 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-colors"
                                    >
                                        {action.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

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
                                            : "bg-white shadow-sm border border-slate-200 rounded-tl-sm"
                                        }`}
                                >
                                    <p className={`text-xs whitespace-pre-wrap leading-relaxed ${message.role === "user" ? "text-white" : "text-black"}`}>
                                        {message.content}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white text-black rounded-xl rounded-tl-sm px-3 py-2 shadow-sm border border-slate-200">
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
                                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs text-black placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                disabled={isLoading}
                            />
                            <button
                                onClick={() => handleSendMessage()}
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
