import type { LucideIcon } from "lucide-react";
interface ActionButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  colorClasses?: string;
  disabled?: boolean;
}
const iconButtonBase =
  "flex h-8 w-8 items-center justify-center rounded-md transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50";
const ActionButton = ({
  icon: Icon,
  label,
  onClick,
  colorClasses = "",
  disabled = false,
}: ActionButtonProps) => {
  return (
    <div className="relative inline-flex group">
      {" "}
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        title={label}
        disabled={disabled}
        className={`${iconButtonBase} ${colorClasses}`}
      >
        {" "}
        <Icon className="h-4 w-4" />{" "}
      </button>{" "}
      {/* Tooltip */}{" "}
      <span
        role="tooltip"
        className=" pointer-events-none absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 invisible transition-all duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 "
      >
        {" "}
        {label}{" "}
      </span>{" "}
    </div>
  );
};
export default ActionButton;
