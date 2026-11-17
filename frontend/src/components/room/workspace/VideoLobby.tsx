import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  AlertCircle,
  Radio,
  Sparkles,
} from "lucide-react";
import { DeviceSelect, type DeviceOption } from "./DeviceSelect";

interface InCallUser {
  userId: string;
  username: string;
  peerId?: string;
}

interface VideoLobbyProps {
  roomName: string;
  inCallUsers: InCallUser[];
  isConnecting: boolean;
  speakingPeers?: Set<string>;
  onJoin: (options: {
    startMuted: boolean;
    startVideoOff: boolean;
    audioDeviceId?: string;
    videoDeviceId?: string;
  }) => void;
}

const STORAGE_KEYS = {
  MIC: "audiohive_selected_mic_id",
  CAMERA: "audiohive_selected_cam_id",
  SPEAKER: "audiohive_selected_speaker_id",
};

export const VideoLobby: React.FC<VideoLobbyProps> = ({
  roomName,
  inCallUsers,
  isConnecting,
  speakingPeers,
  onJoin,
}) => {
  const [micActive, setMicActive] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);

  // Permission States
  const [hasAudioPermission, setHasAudioPermission] = useState(false);
  const [hasVideoPermission, setHasVideoPermission] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Device Lists
  const [audioDevices, setAudioDevices] = useState<DeviceOption[]>([]);
  const [videoDevices, setVideoDevices] = useState<DeviceOption[]>([]);
  const [speakerDevices, setSpeakerDevices] = useState<DeviceOption[]>([]);

  // Selected Device IDs (initialized from localStorage)
  const [selectedAudioId, setSelectedAudioId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.MIC) || "";
  });
  const [selectedVideoId, setSelectedVideoId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.CAMERA) || "";
  });
  const [selectedSpeakerId, setSelectedSpeakerId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.SPEAKER) || "";
  });

  // Device Unplugged Notices
  const [audioUnpluggedNotice, setAudioUnpluggedNotice] = useState<string | null>(null);
  const [videoUnpluggedNotice, setVideoUnpluggedNotice] = useState<string | null>(null);

  // Mic level meter
  const [audioLevel, setAudioLevel] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const stopAllTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => {
        t.stop();
        t.enabled = false;
      });
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  // Enumerate real devices after permission is granted
  const enumerateRealDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();

      // Audio inputs
      const aIn = devices
        .filter((d) => d.kind === "audioinput" && d.deviceId)
        .map((d, i) => ({
          deviceId: d.deviceId,
          label: d.label && d.label.trim() ? d.label : `Microphone ${i + 1}`,
        }));

      // Video inputs
      const vIn = devices
        .filter((d) => d.kind === "videoinput" && d.deviceId)
        .map((d, i) => ({
          deviceId: d.deviceId,
          label: d.label && d.label.trim() ? d.label : `Camera ${i + 1}`,
        }));

      // Audio outputs
      const aOut = devices
        .filter((d) => d.kind === "audiooutput" && d.deviceId)
        .map((d, i) => ({
          deviceId: d.deviceId,
          label: d.label && d.label.trim() ? d.label : `Speaker ${i + 1}`,
        }));

      setAudioDevices(aIn);
      setVideoDevices(vIn);
      setSpeakerDevices(aOut);

      // Handle audio device persistence and unplugged detection
      if (aIn.length > 0) {
        setSelectedAudioId((prev) => {
          const match = aIn.find((d) => d.deviceId === prev);
          if (match) return prev;
          if (prev) {
            setAudioUnpluggedNotice("Microphone unplugged");
            setTimeout(() => setAudioUnpluggedNotice(null), 4000);
          }
          const nextId = aIn[0].deviceId;
          localStorage.setItem(STORAGE_KEYS.MIC, nextId);
          return nextId;
        });
      }

      // Handle video device persistence and unplugged detection
      if (vIn.length > 0) {
        setSelectedVideoId((prev) => {
          const match = vIn.find((d) => d.deviceId === prev);
          if (match) return prev;
          if (prev) {
            setVideoUnpluggedNotice("Camera unplugged");
            setTimeout(() => setVideoUnpluggedNotice(null), 4000);
          }
          const nextId = vIn[0].deviceId;
          localStorage.setItem(STORAGE_KEYS.CAMERA, nextId);
          return nextId;
        });
      }

      // Handle speaker persistence
      if (aOut.length > 0) {
        setSelectedSpeakerId((prev) => {
          const match = aOut.find((d) => d.deviceId === prev);
          if (match) return prev;
          const nextId = aOut[0].deviceId;
          localStorage.setItem(STORAGE_KEYS.SPEAKER, nextId);
          return nextId;
        });
      }
    } catch {
      // Ignore enumeration error
    }
  }, []);

  // Listen to devicechange (plugged / unplugged)
  useEffect(() => {
    const handleDeviceChange = () => {
      enumerateRealDevices();
    };

    if (navigator.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);
    }

    return () => {
      if (navigator.mediaDevices?.removeEventListener) {
        navigator.mediaDevices.removeEventListener("devicechange", handleDeviceChange);
      }
    };
  }, [enumerateRealDevices]);

  // Setup live audio level meter
  const setupAudioMeter = (media: MediaStream) => {
    const audioTracks = media.getAudioTracks();
    if (audioTracks.length > 0) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;
        const source = ctx.createMediaStreamSource(media);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const checkMeter = () => {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const avg = sum / dataArray.length;
          setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
          animFrameRef.current = requestAnimationFrame(checkMeter);
        };
        checkMeter();
      } catch {
        // AudioContext initialization error ignored
      }
    }
  };

  // Request permissions and start preview
  const startPreview = useCallback(
    async (wantMic: boolean, wantCam: boolean) => {
      setPermissionError(null);

      if (!wantMic && !wantCam) {
        stopAllTracks();
        setMicActive(false);
        setCameraActive(false);
        return;
      }

      try {
        const constraints: MediaStreamConstraints = {
          audio: wantMic
            ? selectedAudioId
              ? { deviceId: { exact: selectedAudioId } }
              : true
            : false,
          video: wantCam
            ? selectedVideoId
              ? { deviceId: { exact: selectedVideoId } }
              : true
            : false,
        };

        const media = await navigator.mediaDevices.getUserMedia(constraints);
        stopAllTracks();
        streamRef.current = media;

        if (videoRef.current && wantCam) {
          videoRef.current.srcObject = media;
        }

        if (wantMic) {
          setHasAudioPermission(true);
          setupAudioMeter(media);
        }
        if (wantCam) {
          setHasVideoPermission(true);
        }

        setMicActive(wantMic);
        setCameraActive(wantCam);

        // Enumerate real labeled devices only after permission is granted!
        await enumerateRealDevices();
      } catch (err: any) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setPermissionError(
            "Microphone or camera permission was denied. Please allow device access in your browser settings to continue."
          );
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          setPermissionError("No requested device found. Please check your hardware connections.");
        } else {
          setPermissionError("Device is currently unavailable or in use by another application.");
        }
      }
    },
    [selectedAudioId, selectedVideoId, stopAllTracks, enumerateRealDevices]
  );

  useEffect(() => {
    return () => stopAllTracks();
  }, [stopAllTracks]);

  const toggleMic = () => {
    const nextMic = !micActive;
    startPreview(nextMic, cameraActive);
  };

  const toggleCamera = () => {
    const nextCam = !cameraActive;
    startPreview(micActive, nextCam);
  };

  // Device selection handlers that persist in localStorage
  const handleAudioChange = (deviceId: string) => {
    setSelectedAudioId(deviceId);
    localStorage.setItem(STORAGE_KEYS.MIC, deviceId);
    if (micActive) {
      startPreview(true, cameraActive);
    }
  };

  const handleVideoChange = (deviceId: string) => {
    setSelectedVideoId(deviceId);
    localStorage.setItem(STORAGE_KEYS.CAMERA, deviceId);
    if (cameraActive) {
      startPreview(micActive, true);
    }
  };

  const handleSpeakerChange = (deviceId: string) => {
    setSelectedSpeakerId(deviceId);
    localStorage.setItem(STORAGE_KEYS.SPEAKER, deviceId);
  };

  const handleJoinCall = () => {
    stopAllTracks();
    onJoin({
      startMuted: !micActive,
      startVideoOff: !cameraActive,
      audioDeviceId: selectedAudioId,
      videoDeviceId: selectedVideoId,
    });
  };

  const isCallActive = inCallUsers.length > 0;

  return (
    <div className="w-full h-full max-h-full rounded-2xl bg-[#090C15] text-white p-4 sm:p-6 flex flex-col lg:flex-row gap-6 items-stretch overflow-y-auto">
      {/* Left: Camera Preview Box */}
      <div className="flex-1 flex flex-col min-h-[280px] lg:min-h-[400px] bg-slate-950 rounded-2xl border border-slate-800/80 relative overflow-hidden">
        {permissionError ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-full mb-3 border border-rose-500/20">
              <AlertCircle className="w-8 h-8" />
            </div>
            <p className="text-sm font-semibold text-rose-200 mb-1">Device Access Required</p>
            <p className="text-xs text-slate-400 max-w-sm mb-4 leading-relaxed">
              {permissionError}
            </p>
            <button
              type="button"
              onClick={() => startPreview(true, false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            >
              Try Requesting Microphone
            </button>
          </div>
        ) : (
          <div className="relative flex-1 flex items-center justify-center bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover rounded-2xl ${
                cameraActive ? "block" : "hidden"
              }`}
            />
            {!cameraActive && (
              <div className="flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                <div className="p-4 bg-slate-900 rounded-full mb-3 border border-slate-800">
                  <VideoOff className="w-8 h-8 text-slate-500" />
                </div>
                <span className="text-sm font-semibold text-slate-300">Camera is turned off</span>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Camera and mic are OFF by default. Turn on preview to test your devices before
                  entering.
                </p>
                <button
                  type="button"
                  onClick={toggleCamera}
                  className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer"
                >
                  Turn On Camera
                </button>
              </div>
            )}

            {/* Floating Hardware Quick Toggles */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-lg">
              <button
                type="button"
                onClick={toggleMic}
                className={`p-2.5 rounded-full transition-all cursor-pointer ${
                  micActive
                    ? "bg-slate-800 text-emerald-400 hover:bg-slate-700"
                    : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                }`}
                title={micActive ? "Mute mic" : "Unmute mic"}
                aria-label={micActive ? "Mute mic" : "Unmute mic"}
              >
                {micActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={toggleCamera}
                className={`p-2.5 rounded-full transition-all cursor-pointer ${
                  cameraActive
                    ? "bg-slate-800 text-indigo-400 hover:bg-slate-700"
                    : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                }`}
                title={cameraActive ? "Turn off camera" : "Turn on camera"}
                aria-label={cameraActive ? "Turn off camera" : "Turn on camera"}
              >
                {cameraActive ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right: Meeting Info, Call Status, Device Selectors & Join */}
      <div className="lg:w-96 flex flex-col justify-between space-y-5">
        <div className="space-y-4">
          {/* Room Name & Live Status Chip */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                AudioHive Meeting
              </span>
              <h2 className="text-base font-bold text-white tracking-tight truncate max-w-[200px]">
                {roomName}
              </h2>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                isCallActive
                  ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/30"
                  : "bg-slate-800/80 text-slate-400 border-slate-700"
              }`}
            >
              <Radio
                className={`w-3.5 h-3.5 ${
                  isCallActive ? "text-emerald-400 animate-pulse" : "text-slate-500"
                }`}
              />
              <span>
                {isCallActive ? `Call in progress (${inCallUsers.length})` : "No active call"}
              </span>
            </span>
          </div>

          {/* Who is currently in call with avatars and speaking indicators */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <span className="text-[11px] font-semibold text-slate-400 block mb-2">
              In this call now:
            </span>
            {inCallUsers.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No one has joined yet. Be the first!</p>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex items-center -space-x-2">
                  {inCallUsers.slice(0, 5).map((u, i) => {
                    const isSpeaking = speakingPeers?.has(u.peerId || u.userId);
                    return (
                      <div
                        key={u.userId || i}
                        title={`${u.username}${isSpeaking ? " (Speaking)" : ""}`}
                        className={`w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-[10px] flex items-center justify-center ring-2 ring-[#090C15] relative transition-transform ${
                          isSpeaking ? "scale-110 ring-emerald-500 shadow-md shadow-emerald-500/50" : ""
                        }`}
                      >
                        {u.username.substring(0, 2).toUpperCase()}
                        {isSpeaking && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        )}
                      </div>
                    );
                  })}
                </div>
                <span className="text-xs text-slate-300 truncate font-medium">
                  {inCallUsers.map((u) => u.username).slice(0, 2).join(", ")}
                  {inCallUsers.length > 2 ? ` +${inCallUsers.length - 2} more` : ""}
                </span>
              </div>
            )}
          </div>

          {/* Live Mic Level Meter (only shown after permission granted & active) */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Mic input level</span>
              <span>
                {!hasAudioPermission
                  ? "Permission required"
                  : micActive
                  ? `${audioLevel}%`
                  : "Muted"}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-75 ${
                  audioLevel > 70
                    ? "bg-rose-500"
                    : audioLevel > 30
                    ? "bg-emerald-400"
                    : "bg-indigo-500"
                }`}
                style={{
                  width: hasAudioPermission && micActive ? `${audioLevel}%` : "0%",
                }}
              />
            </div>
          </div>

          {/* Real Device Dropdowns (disabled before permission, persistent in localStorage) */}
          <div className="space-y-2 pt-1">
            <DeviceSelect
              label="Microphone"
              type="audioinput"
              devices={audioDevices}
              selectedDeviceId={selectedAudioId}
              onChange={handleAudioChange}
              permissionGranted={hasAudioPermission}
              unpluggedNotice={audioUnpluggedNotice}
            />

            <DeviceSelect
              label="Camera"
              type="videoinput"
              devices={videoDevices}
              selectedDeviceId={selectedVideoId}
              onChange={handleVideoChange}
              permissionGranted={hasVideoPermission}
              unpluggedNotice={videoUnpluggedNotice}
            />

            {speakerDevices.length > 0 && (
              <DeviceSelect
                label="Speaker"
                type="audiooutput"
                devices={speakerDevices}
                selectedDeviceId={selectedSpeakerId}
                onChange={handleSpeakerChange}
                permissionGranted={hasAudioPermission}
              />
            )}
          </div>
        </div>

        {/* Primary Action Button */}
        <button
          type="button"
          onClick={handleJoinCall}
          disabled={isConnecting}
          className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-98 text-white text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isConnecting ? "Connecting..." : "Join Meeting"}</span>
        </button>
      </div>
    </div>
  );
};

export default VideoLobby;
