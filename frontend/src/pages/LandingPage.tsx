import type { FC } from "react";
import { useNavigate } from "react-router-dom";
import {
  Radio,
  Video,
  PenTool,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Headphones,
  Users,
} from "lucide-react";
import { API_ROUTES } from "../constants/Api_Routes";
import { DashboardPreview } from "../components/landing/DashboardPreview";

const LandingPage: FC = () => {
  const navigate = useNavigate();

  const handleLogin = (): void => {
    void navigate(API_ROUTES.PUBLIC.NAV.LOGIN);
  };
  const handleCreateOrganization = (): void => {
    void navigate(API_ROUTES.ORGANIZATION.NAV.CREATE_ORGANIZATION);
  };
  const handleAccessOrganization = (): void => {
    void navigate(API_ROUTES.PUBLIC.NAV.LOGIN);
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-brand-border bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 shadow-md shadow-indigo-500/20">
              <span className="text-base font-extrabold text-white">A</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">AudioHive</span>
          </div>

          <div className="hidden items-center gap-8 md:flex">
            <a href="#preview" className="text-sm font-medium text-slate-600 transition hover:text-indigo-600">
              Preview
            </a>
            <a href="#features" className="text-sm font-medium text-slate-600 transition hover:text-indigo-600">
              Features
            </a>
            <a href={API_ROUTES.PUBLIC.NAV.PRICING} className="text-sm font-medium text-slate-600 transition hover:text-indigo-600">
              Pricing Plans
            </a>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleLogin}
              className="text-sm font-semibold text-slate-700 transition hover:text-indigo-600 px-3 py-2"
            >
              Log In
            </button>
            <button
              type="button"
              onClick={handleCreateOrganization}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-300/40 transition hover:opacity-95 hover:shadow-indigo-300/60"
            >
              Create Organization
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-36 pb-20 lg:pt-40 lg:pb-28">
        {/* Glow Effects */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[650px] w-[1000px] -translate-x-1/2 rounded-full bg-gradient-to-b from-indigo-200/50 via-purple-100/40 to-transparent blur-[120px]" />
        </div>

        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/80 px-4 py-1.5 text-xs font-semibold text-indigo-700 shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            <span>The New Standard for Remote Virtual Offices</span>
          </div>

          <h1 className="mt-6 text-4xl font-extrabold leading-[1.15] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Your Ultimate Virtual
            <br />
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
              Office Platform
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base text-slate-600 sm:text-lg leading-relaxed">
            Bring your team together in a dynamic, high-fidelity spatial audio
            environment. Drop into live voice rooms, brainstorm on shared whiteboards,
            and recreate spontaneous workplace magic.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              type="button"
              onClick={handleCreateOrganization}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-300/50 transition-all hover:shadow-indigo-300/80 hover:-translate-y-0.5 sm:w-auto"
            >
              <span>Create Your Workspace</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleAccessOrganization}
              className="w-full rounded-xl border border-slate-200 bg-white px-7 py-3.5 text-sm font-semibold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 hover:border-slate-300 sm:w-auto"
            >
              Access Existing Workspace
            </button>
          </div>
        </div>

        {/* Live Interactive Dashboard Preview */}
        <div id="preview" className="mt-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <DashboardPreview />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative border-t border-slate-200/80 bg-white py-24 px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1 text-xs font-semibold text-indigo-700">
              <Headphones className="h-3.5 w-3.5" />
              <span>Designed for Real-Time Presence</span>
            </div>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Everything your remote team needs to feel like you&apos;re side by side
            </h2>
            <p className="mt-4 text-base text-slate-600">
              Forget rigid video links and sterile scheduling. AudioHive gives your distributed team
              natural presence with casual audio rooms, video meetings, and instant visual collaboration.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6 transition-all hover:-translate-y-1 hover:shadow-lg hover:border-indigo-200 hover:bg-white">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 mb-5">
                <Radio className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Drop-In Audio Rooms</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Hop into team rooms without scheduling invites. 48kHz crystal audio with spatial presence lets you talk effortlessly.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6 transition-all hover:-translate-y-1 hover:shadow-lg hover:border-indigo-200 hover:bg-white">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600 mb-5">
                <Video className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">HD Video & Stage Calls</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Seamlessly upgrade any voice channel to face-to-face video, screen sharing, and interactive audience stage rooms.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6 transition-all hover:-translate-y-1 hover:shadow-lg hover:border-indigo-200 hover:bg-white">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-600 mb-5">
                <PenTool className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Real-Time Whiteboards</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Sketch architecture, plan sprints, and ideate simultaneously on multiplayer canvases directly inside your active rooms.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6 transition-all hover:-translate-y-1 hover:shadow-lg hover:border-indigo-200 hover:bg-white">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 mb-5">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Enterprise Workspaces</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Manage organizations, distinct team workspaces, granular role-based permissions, and real-time activity auditing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 py-16 px-6 text-white text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-indigo-200 backdrop-blur-md mb-6">
            <Users className="h-3.5 w-3.5" />
            <span>Over 10,000+ teams collaborate smoothly</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to bring your remote team closer?
          </h2>
          <p className="mt-4 text-base text-indigo-200 max-w-xl mx-auto">
            Set up your organization's digital workspace in seconds. Free trial included with all subscription tiers.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={handleCreateOrganization}
              className="w-full sm:w-auto rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-indigo-900 shadow-xl hover:bg-indigo-50 transition-all hover:-translate-y-0.5"
            >
              Get Started Free
            </button>
            <button
              type="button"
              onClick={() => navigate(API_ROUTES.PUBLIC.NAV.PRICING)}
              className="w-full sm:w-auto rounded-xl border border-white/20 bg-white/10 px-8 py-3.5 text-sm font-semibold text-white hover:bg-white/20 transition-all"
            >
              Explore Pricing Plans
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xs">
              A
            </div>
            <span className="font-semibold text-slate-800">AudioHive</span>
            <span>— The Virtual Office Platform</span>
          </div>
          <div>
            © {new Date().getFullYear()} AudioHive, Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
