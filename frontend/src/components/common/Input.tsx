import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface inputPurpose {
  type?: string;
  placeHolder: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readOnly?: boolean;
  hasError?: boolean;
  className?: string;
}

const Input = ({
  type = "text",
  placeHolder,
  value,
  onChange,
  readOnly,
  hasError,
  className = "",
}: inputPurpose) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className={`w-full max-w-sm min-w-50 ${className}`}>
      <div className="relative flex items-center">
        <input
          type={inputType}
          placeholder={placeHolder}
          value={value}
          onChange={onChange}
          readOnly={readOnly}
          className={`w-full bg-transparent placeholder:text-slate-400 text-slate-700 text-sm border rounded-md px-3 py-2 ${isPassword ? "pr-10" : ""
            } transition duration-300 ease-collapse focus:outline-none focus:border-slate-400 hover:border-slate-300 shadow-sm focus:shadow-md ${hasError ? "border-red-400" : "border-slate-200"
            } ${readOnly ? "bg-slate-100 cursor-not-allowed opacity-70" : ""}`}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors cursor-pointer"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default Input;
