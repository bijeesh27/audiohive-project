import type { FC } from "react";
import { useNavigate } from "react-router-dom";

const LandingPage: FC = () => {
  const navigate = useNavigate();

  const handleLogin = (): void => navigate("/login");
  const handleCreateWorkspace = (): void => navigate("/create-workspace");
  const handleAccessWorkspace = (): void => navigate("/login");

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-brand-border bg-brand-bg/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
              <span className="text-sm font-bold text-white">A</span>
            </div>
            <span className="text-lg font-semibold text-brand-text">AudioHive</span>
          </div>

          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-brand-text-muted transition hover:text-brand-text">
              Features
            </a>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleLogin}
              className="text-sm font-medium text-brand-text-muted transition hover:text-brand-text"
            >
              Log In
            </button>
            <button
              type="button"
              onClick={handleCreateWorkspace}
              className="rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:opacity-90"
            >
              Create Workspace
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-40 pb-24">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-indigo-200/50 blur-[120px]" />
        </div>

        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-xs font-medium text-indigo-700">
            The New Standard for Remote Work
          </div>

          <h1 className="mt-6 text-4xl font-bold leading-tight text-brand-text sm:text-5xl lg:text-6xl">
            Your Ultimate Virtual
            <br />
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
              Office Platform
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base text-brand-text-muted sm:text-lg">
            Bring your team together in a dynamic, high-fidelity audio
            environment. Create your custom workspace in seconds and
            revolutionize how you collaborate.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              type="button"
              onClick={handleCreateWorkspace}
              className="w-full rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:opacity-90 sm:w-auto"
            >
              Create Your Workspace
            </button>
            <button
              type="button"
              onClick={handleAccessWorkspace}
              className="w-full rounded-lg border border-brand-border bg-white px-6 py-3 text-sm font-semibold text-brand-text shadow-sm transition hover:bg-slate-50 sm:w-auto"
            >
              Access Existing Workspace
            </button>
          </div>

          {/* Dashboard preview mockup */}
          <div className="relative mx-auto mt-16 w-full max-w-5xl">
            <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-r from-indigo-200 via-violet-200 to-fuchsia-200 blur-3xl" />
            <div className="overflow-hidden rounded-2xl border border-brand-border bg-brand-surface shadow-2xl shadow-slate-200/50">
              <div className="flex items-center gap-2 border-b border-brand-border bg-brand-surface-header px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-red-400" />
                <span className="h-3 w-3 rounded-full bg-yellow-400" />
                <span className="h-3 w-3 rounded-full bg-green-400" />
              </div>
              <div className="flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-brand-gradient-start to-brand-bg">
                <span className="text-sm font-medium text-brand-text-muted">
                  AudioHive Dashboard Preview
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;