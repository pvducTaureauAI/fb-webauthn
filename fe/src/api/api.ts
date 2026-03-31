export async function api(url: string, options: RequestInit = {}) {
  const res = await fetch(import.meta.env.VITE_BASE_URL + url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData?.message || "API error");
  }

  return res.json();
}
