import { createAuthClient } from "better-auth/react";

export const getAuthBaseURL = () => {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://localhost:4000";
    }
    if (host.includes("qixolabs.com")) {
      return "https://samvad-api.qixolabs.com";
    }
    return window.location.origin;
  }
  return "https://samvad-api.qixolabs.com";
};

export const authClient = createAuthClient({
  baseURL: getAuthBaseURL(),
  fetchOptions: {
    credentials: "include",
  },
});

export const { signIn, signUp, signOut, useSession } = authClient;


