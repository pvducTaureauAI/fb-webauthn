import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";
import { api } from "../api/api";

export async function registerPasskey() {
  const options = await api("/auth/webauthn/register/options");

  const attResp = await startRegistration(options);

  await api("/auth/webauthn/register/verify", {
    method: "POST",
    body: JSON.stringify(attResp),
  });

  alert("Passkey registered!");
}

export const loginWithPasskey = async (username: string) => {
  const options = await api(
    "/auth/webauthn/login/options?username=" + encodeURIComponent(username),
  );
  console.log("Login options:", options);
  const assertionResp = await startAuthentication({
    optionsJSON: options,
  });
  console.log("Assertion response:", assertionResp);

  await api("/auth/webauthn/login/verify", {
    method: "POST",
    body: JSON.stringify({ ...assertionResp, username }),
  });

  alert("Passkey login successful!");
};
