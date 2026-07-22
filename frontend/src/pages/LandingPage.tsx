import {  NavLink } from "react-router-dom";

const LandingPage: React.FC = () => {
  return (
    <div className="relative min-h-screen w-full bg-slate-50">
      <nav className="absolute top-0 left-0 p-6 z-10">
        <NavLink className='text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors' to="/login">login</NavLink>
      </nav>
      <h1 className="min-h-screen w-full flex items-center justify-center bg-slate-50">this the landing page</h1>
    </div>
  );
};

export default LandingPage;
