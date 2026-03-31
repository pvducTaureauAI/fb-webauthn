export async function api(url: string, options: RequestInit = {}) {
  const res = await fetch(import.meta.env.VITE_BASE_URL + url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  console.log("API response:", res);
  if (!res.ok) {
    const errorData = await res.json();
    console.error("API error data:", errorData);
    throw new Error(errorData?.message || "API error");
  }

  return res.json();
}
