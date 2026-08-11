import LoginFrom from "../../components/auth/LoginFrom";

const LoginPage = () => {
   return (
    <div className="min-h-screen w-full flex bg-slate-50">
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between bg-slate-950 text-white px-12 py-10 overflow-hidden">
        <div className="pointer-events-none absolute -top-20 right-0 h-96 w-96 rounded-full bg-indigo-600/30 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-purple-700/20 blur-3xl" />
 
        <a href="/" className="relative font-semibold text-lg">AudioHive</a>
 
        <div className="relative max-w-md">
          <h1 className="text-4xl font-bold leading-tight">
            Welcome back to <br />
            your <span className="text-indigo-400">workspace.</span>
          </h1>
          <p className="mt-4 text-slate-300 text-sm leading-relaxed">
            Connect with your team, manage your meetings, and experience the
            next generation of virtual collaboration.
          </p>
        </div>
 
        <div className="relative text-xs text-slate-500">
          © 2026 AudioHive. All rights reserved.
        </div>
      </div>
 
      <div className="flex-1 flex items-center justify-center p-4">
        <LoginFrom/>
      </div>
    </div>
  );
};

export default LoginPage;
