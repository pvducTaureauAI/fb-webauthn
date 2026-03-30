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
  const assertionResp = await startAuthentication(options);

  await api("/auth/webauthn/login/verify", {
    method: "POST",
    body: JSON.stringify(assertionResp),
  });

  alert("Passkey login successful!");
};
