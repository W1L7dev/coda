import type { Metadata } from "next";
import AuthForm from "../auth-form";

export const metadata: Metadata = {
  title: "Create an account — Coda",
  description: "Begin your musical practice with Coda.",
};

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}
