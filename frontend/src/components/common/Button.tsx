
interface ButtonProps {
  label: string;
  buttonType?: "submit" | "reset" | "button";
  disabled?: boolean;
  loading?: boolean;
}

const Button = ({ label, buttonType, disabled, loading }: ButtonProps) => {
  return (
    <button
      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm py-2.5 rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
      type={buttonType}
      disabled={disabled || loading}
    >
      {loading ? "Please wait..." : label}
    </button>
  );
};

export default Button;
