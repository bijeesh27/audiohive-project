import React from "react";
import { Mic, Video, Volume2 } from "lucide-react";

export interface DeviceOption {
  deviceId: string;
  label: string;
}

interface DeviceSelectProps {
  label: string;
  type: "audioinput" | "videoinput" | "audiooutput";
  devices: DeviceOption[];
  selectedDeviceId: string;
  onChange: (deviceId: string) => void;
  disabled?: boolean;
  permissionGranted?: boolean;
  unpluggedNotice?: string | null;
}

export const DeviceSelect: React.FC<DeviceSelectProps> = ({
  label,
  type,
  devices,
  selectedDeviceId,
  onChange,
  disabled = false,
  permissionGranted = false,
  unpluggedNotice = null,
}) => {
  const Icon = type === "audioinput" ? Mic : type === "videoinput" ? Video : Volume2;
  const deviceTypeWord =
    type === "audioinput" ? "microphone" : type === "videoinput" ? "camera" : "speaker";

  const isDisabled = disabled || !permissionGranted || devices.length === 0;

  return (
    <div className="space-y-1 text-left">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
          <Icon className="w-3.5 h-3.5 text-indigo-400" />
          <span>{label}</span>
        </label>
        {unpluggedNotice && (
          <span className="text-[10px] text-amber-400 font-medium animate-pulse">
            {unpluggedNotice}
          </span>
        )}
      </div>

      <div className="relative">
        <select
          value={permissionGranted ? selectedDeviceId : ""}
          disabled={isDisabled}
          onChange={(e) => onChange(e.target.value)}
          className="w-full text-xs font-medium rounded-xl bg-slate-900/90 border border-slate-700/80 px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer truncate pr-7"
          aria-label={label}
        >
          {!permissionGranted ? (
            <option value="" disabled>
              Allow access to choose a {deviceTypeWord}
            </option>
          ) : devices.length === 0 ? (
            <option value="" disabled>
              No {deviceTypeWord} found
            </option>
          ) : (
            devices.map((d, i) => (
              <option key={d.deviceId || i} value={d.deviceId}>
                {d.label && d.label.trim().length > 0
                  ? d.label
                  : `${label} ${i + 1}`}
              </option>
            ))
          )}
        </select>

        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default DeviceSelect;
