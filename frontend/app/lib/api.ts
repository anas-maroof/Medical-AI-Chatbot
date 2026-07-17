import { getToken } from "./auth";

const BACKEND_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

export interface Source {
    page: number;
    preview: string;
}

export interface ChatMessage {
    id?:string
    role:"user" | "bot";
    content:string;
    sources?:Source[];
    duration_ms?:number;
}

export interface Session {
    id:string;
    title:string;
    created_at:string;
    updated_at:string;
}

function authHeaders(): Record<string, string> {
    const token = getToken();
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

export async function apiRegister(email: string, password: string, full_name: string) {
    const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({email, password, full_name})
    });

    return res.json();
}

export async function apiLogin(email: string, password: string) {
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });

    return res.json();
}

export async function fetchSession(): Promise<Session[]> {
    const res = await fetch(`${BACKEND_URL}/api/sessions`, {
        headers: authHeaders(),
    })
    const data = await res.json();
    return data.sessions
}

export async function createSession(title = "New Chat"): Promise<Session> {
    const res = await fetch(`${BACKEND_URL}/api/sessions`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ title }),
    });
    return res.json();
}

export async function deleteSession(sessionId: string): Promise<void> {
    await fetch(`${BACKEND_URL}/api/sessions/${sessionId}`, {
        method: "DELETE",
        headers: authHeaders(),
    })
}

export async function fetchMessages(sessionId: string): Promise<ChatMessage[]> {
    const res = await fetch(`${BACKEND_URL}/api/sessions/${sessionId}/messages`, {
        headers: authHeaders(),
    });
    const data = await res.json();
    return (data.messages || []).map((m: ChatMessage) => ({
        role: m.role,
        content: m.content,
        sources: m.sources,
        duration_ms: m.duration_ms,
    }));
}

export async function checkHealth(): Promise<boolean> {
    try {
        const res = await fetch(`${BACKEND_URL}/api/health`);
        const data = await res.json();
        return data.ready === true;
    } catch {
        return false;
    }
}

export async function streamMessage(
  question: string,
  sessionId: string,
  onToken: (token: string) => void,
  onSources: (sources: Source[]) => void,
  onDone: () => void,
  onError: (err: string) => void
): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/api/chat/stream`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ question, sessionId: sessionId })
  })

  if (!res.ok) {
    onError("Failed to connect to the server")
    return
  }

  const reader = res?.body?.getReader();
  const decoder = new TextDecoder();
  if (!reader) {
    onError("No response body");
    return;
  }

  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const data = JSON.parse(line.slice(6));
        if (data.type == "token") onToken(data.content);
        else if (data.type == "sources") onSources(data.sources);
        else if (data.type == "done") onDone();
        else if (data.type === "error") onError(data.content);
      } catch {}
    }
  }
}

