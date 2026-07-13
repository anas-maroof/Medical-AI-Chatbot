const BACKEND_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

export interface Source {
    page: number;
    preview: string;
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