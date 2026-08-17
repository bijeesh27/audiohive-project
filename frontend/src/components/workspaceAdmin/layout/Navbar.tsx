import { Search, Bell } from "lucide-react";

export default function Navbar() {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex-1 max-w-lg">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            
          </div>
         
        </div>
      </div>

      <div className="flex items-center gap-4 pl-4">
        <button className="relative p-2 text-gray-400 hover:text-gray-500 transition-colors">
          <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
          <Bell className="h-5 w-5" />
        </button>
        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium cursor-pointer">
          WA
        </div>
      </div>
    </header>
  );
}