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
import { getUser, isLoggedIn } from "./lib/auth";

const SUGGESTED_QUESTIONS = [
  "What are the symptoms of malaria?",
  "How is hypertension diagnosed and treated?",
  "What is the difference between Type 1 and Type 2 diabetes?",
  "What are the causes and treatment of kidney failure?",
  "What is myocardial infarction and how is it treated?",
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

        <main>

        </main>

        
      </div>
    </div>
  );
}
