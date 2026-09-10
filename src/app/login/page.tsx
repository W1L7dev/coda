import type { Metadata } from "next";
import AuthForm from "../auth-form";

export const metadata: Metadata = {
  title: "Log in — Coda",
  description: "Return to your musical life with Coda.",
};

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
