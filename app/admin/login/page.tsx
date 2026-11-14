import { LoginForm } from "@/components/admin/LoginForm";

export default function AdminLogin() {
  return (
    <div className="admin-login">
      <span className="pill pill--rosa">Painel</span>
      <h1 className="display h2">Entrar</h1>
      <LoginForm />
    </div>
  );
}
