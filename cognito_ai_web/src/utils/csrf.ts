import axios from "axios";
import { HostConfig } from "../../HostConfig";

let csrfToken: string | null = null;

export function getCsrfToken() {
  return csrfToken;
}

export async function initCsrf() {
  console.log("🔥 Fetching CSRF...");

  const response = await axios.get(
    `${HostConfig.BASE_URL}/dashboard/csrfToken()`,
    {
      withCredentials: true,
      headers: {
        "X-CSRF-Token": "Fetch",
      },
    }
  );

  csrfToken = response.headers["x-csrf-token"];

  if (!csrfToken) {
    throw new Error("❌ CSRF token not returned");
  }

  console.log("✅ CSRF Token:", csrfToken);
}