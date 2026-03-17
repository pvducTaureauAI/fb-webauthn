export async function api(url: string, options: RequestInit = {}) {
  const res = await fetch("http://localhost:3300" + url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    throw new Error("API error");
  }

  return res.json();
}
