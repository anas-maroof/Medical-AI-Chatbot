"use client";

import Image from "next/image";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ChatMessage,
  checkHealth,
  deleteSession,
  fetchMessages,
  fetchSession,
  Session,
} from "./lib/api";
import { getUser, isLoggedIn, logout } from "./lib/auth";
import TypingIndicator from "./components/TypingIndicator";
import Message from "./components/Message";

const SUGGESTED_QUESTIONS = [
  "What are the symptoms of malaria?",
  "How is hypertension diagnosed and treated?",
  "What is the difference between Type 1 and Type 2 diabetes?",
];

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<{ full_name: string; email: string } | null>(
    null,
  );
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [healthy, setHealthy] = useState<boolean | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    const u = getUser();
    setUser(u);
    checkHealth().then(setHealthy);
    loadSessions();
  }, []);

  const loadSessions = async () => {
    const data = await fetchSession();
    setSessions(data);
  };

  const handleSelectSession = async (session: Session) => {
    setActiveSession(session);
    const msgs = await fetchMessages(session.id);
    setMessages(msgs);
  };

  const handleDeleteSession = async (
    e: React.MouseEvent,
    sessionId: string,
  ) => {
    e.stopPropagation();
    await deleteSession(sessionId);
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (activeSession?.id === sessionId) {
      setActiveSession(null);
      setMessages([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // handleSend();
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const showWelcome = messages.length === 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className="flex h-screen bg-[#0a0f1e] overflow-hidden ">
      {sidebarOpen && (
        <aside className="w-64 bg-[#0d1b2e] border-r border-[#1e3a5f] flex flex-col shrink-0">
          <div className="p-4 border-b border-[#1e3a5f]">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                M
              </div>
              <span className="text-white font-semibold text-sm">MedBot</span>
            </div>
            <button className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2 px-3 rounded-xl transition-all flex items-center gap-2">
              <span className="text-lg leading-none">+</span>
              New Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sessions.length === 0 && (
              <p className="text-slate-500 text-xs text-center mt-4">
                No Chats yet
              </p>
            )}
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => handleSelectSession(session)}
                className={`group flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all ${
                  activeSession?.id === session.id
                    ? "bg-[#1e3a5f] text-white"
                    : "text-slate-400 hover:bg-[#111827] hover:text-white"
                }`}
              >
                <span className="text-xs truncate flex-1">{session.title}</span>
                <button
                  onClick={(e) => handleDeleteSession(e, session.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 ml-2 text-xs transition-all"
                >
                  x
                </button>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-[#1e3a5f]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-xs font-medium truncate">
                  {user?.full_name}
                </p>
                <p className="text-slate-400 text-xs truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        </aside>
      )}

      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4 border-b border-[#1e3a5f] bg-[#0d1b2e] shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="text-slate-400 hover:text-white transition-all"
            >
              =
            </button>
            <div>
              <h1 className="text-white font-semibold text-base leading-none">
                {activeSession ? activeSession.title : "MedBot"}
              </h1>
              <p className="text-slate-300 text-xs mt-0.5">
                Gale Encyclopedia of Medicine · GPT-4o
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div
                className={`w-2 h-2 rounded-full ${healthy === null ? "bg-yellow-400" : healthy ? "bg-emerald-400" : "bg-red-400"}`}
              />
              <span className="text-xs text-slate-300">
                {healthy === null
                  ? "Connecting..."
                  : healthy
                    ? "Online"
                    : "Offline"}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {showWelcome && (
              <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
                    M
                  </div>
                  <h2 className="text-2xl font-semibold text-white mb-2">
                    Hello, {user?.full_name?.split(" ")[0]} 👋
                  </h2>
                </div>

                <div className="w-full max-w-xl">
                  <p className="text-xs text-slate-400 text-center mb-3">
                    Suggested Questions
                  </p>
                  <div className="flex flex-col gap-2">
                    {SUGGESTED_QUESTIONS?.map((q, i) => (
                      <button
                        key={i}
                        className="text-left px-4 py-3 rounded-xl bg-[#111827] border border-[#1e3a5f] hover:border-blue-500 hover:bg-[#0d1b2e] text-slate-300 hover:text-white text-sm transition-all"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages?.map((msg, id) => {
              const isLastMessage = id == messages.length - 1;
              const isEmptyBot =
                isLastMessage &&
                msg.role == "bot" &&
                msg.content === "" &&
                loading;
              if (isEmptyBot) return <TypingIndicator key={id} />;

              return (
                <Message
                  key={id}
                  role={msg.role}
                  content={msg.content}
                  sources={msg.sources}
                  duration_ms={msg.duration_ms}
                />
              );
            })}
          </div>
        </main>

        <footer className="w-full p-4 border-t border-[#1e3a5f] bg-[#0d1b2e]">
          <div className="max-w-4xl mx-auto flex flex-col gap-2">
            {/* This container aligns the textarea and the button side-by-side */}
            <div className="flex items-end gap-2 bg-[#111827] border border-[#1e3a5f] rounded-xl p-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a medical question... (Enter to send)"
                rows={1}
                className="flex-1 bg-transparent text-slate-200 placeholder-slate-500 text-sm resize-none outline-none max-h-32 leading-relaxed py-1 px-2"
                onInput={(e) => {
                  const t = e.target as HTMLTextAreaElement;
                  t.style.height = "auto";
                  t.style.height = t.scrollHeight + "px";
                }}
              />
              <button
                // onClick={handleSend} // Don't forget to attach your click handler here too!
                disabled={!input.trim() || loading}
                className="w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed flex items-center justify-center shrink-0 transition-all"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4 text-white"
                >
                  <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                </svg>
              </button>
            </div>

            {/* The disclaimer text stays neatly centered underneath the input box */}
            <p className="text-center text-xs text-slate-500 mt-1">
              Medbot can make mistakes. Always verify with clinical judgement
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
