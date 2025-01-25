import { useState, useEffect } from "react";
import { Clock, Moon, Sun } from "lucide-react";
import { signIn } from "../lib/api/auth";
import { retryRequest } from "../lib/supabase";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === "undefined") return false;
    const savedMode = localStorage.getItem("darkMode");
    return (
      savedMode === "true" ||
      (!savedMode && window.matchMedia("(prefers-color-scheme: dark)").matches)
    );
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("darkMode", "true");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("darkMode", "false");
    }
  }, [darkMode]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      const { user, token } = await retryRequest(() => signIn(email, password));
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      window.location.reload();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message === "Invalid login credentials"
            ? "Credenciales inválidas"
            : err.message
          : "Error durante el inicio de sesión"
      );
    } finally {
      setLoading(false);
    }
  };

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get("email") as string;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      setResetEmailSent(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error al enviar el email de recuperación"
      );
    } finally {
      setLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="flex justify-center">
              <Clock className="w-12 h-12 text-blue-500" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
              Recuperar Contraseña
            </h2>
            {!resetEmailSent ? (
              <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                Ingresa tu email para recibir el enlace de recuperación
              </p>
            ) : (
              <p className="mt-2 text-center text-sm text-green-600 dark:text-green-400">
                Se ha enviado un email con las instrucciones para recuperar tu
                contraseña
              </p>
            )}
          </div>

          {!resetEmailSent && (
            <form className="mt-8 space-y-6" onSubmit={handleForgotPassword}>
              <div>
                <label htmlFor="email" className="sr-only">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400"
                  placeholder="Email"
                />
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md dark:bg-red-900/50 dark:text-red-400">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Volver al inicio de sesión
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-600"
                >
                  {loading ? "Enviando..." : "Enviar enlace"}
                </button>
              </div>
            </form>
          )}

          {resetEmailSent && (
            <div className="flex justify-center">
              <button
                onClick={() => setShowForgotPassword(false)}
                className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Volver al inicio de sesión
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <Clock className="w-12 h-12 text-blue-500" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            G6T-Assistance
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Inicia sesión para continuar
          </p>
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              title={
                darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
              }
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>
          </div>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400"
                placeholder="Email"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400"
                placeholder="Contraseña"
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md dark:bg-red-900/50 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-600"
            >
              {loading ? "Iniciando sesión..." : "Iniciar sesión"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
