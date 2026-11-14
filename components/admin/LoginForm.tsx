"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ApiError, adminRequest } from "@/lib/admin";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setSending(true);
    setError("");
    try {
      await adminRequest("POST", "/v1/admin/login", {
        email: form.get("email")?.toString() ?? "",
        password: form.get("password")?.toString() ?? "",
      });
      router.replace("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Algo deu errado. Tente novamente.");
      setSending(false);
    }
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit} noValidate={false}>
      <div className="field">
        <label htmlFor="email">E-mail</label>
        <input id="email" name="email" type="email" required autoComplete="username" />
      </div>
      <div className="field">
        <label htmlFor="password">Senha</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" />
      </div>
      <button type="submit" className="btn btn--lg btn--tinta" disabled={sending}>
        {sending ? "Entrando…" : "Entrar"}
      </button>
      <p role="alert" className="admin-error">
        {error}
      </p>
    </form>
  );
}
