import Link from "next/link";
import { sendMagicLink } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Fantasy Playbook
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Enter your email to get started — no password needed.
          </p>
        </div>

        {params.error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {params.error}
          </div>
        )}

        {params.message && (
          <div className="rounded-md bg-emerald-50 p-4 text-center">
            <p className="text-sm font-semibold text-emerald-800">
              {params.message}
            </p>
            <p className="mt-1 text-xs text-emerald-600">
              The link will expire in 24 hours.
            </p>
          </div>
        )}

        <form className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700"
            >
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="you@example.com"
            />
          </div>

          <button
            formAction={sendMagicLink}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
          >
            Send me a login link
          </button>
        </form>

        <p className="text-center text-xs text-slate-400">
          We&apos;ll email you a magic link to sign in.
          <br />
          New here? This will create your account automatically.
        </p>

        <div className="text-center">
          <Link
            href="/"
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            &larr; Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
