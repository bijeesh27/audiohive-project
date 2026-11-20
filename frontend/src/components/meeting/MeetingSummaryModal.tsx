import React, { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  X,
  Copy,
  Check,
  Download,
  RefreshCw,
  CheckCircle2,
  Circle,
  FileText,
  Clock,
  Users,
  AlertCircle,
  Cpu,
  Smile,
  ListTodo,
  CheckSquare,
  MessageSquareQuote,
  Search,
} from "lucide-react";
import {
  getMeetingSummary,
  generateMeetingSummary,
  toggleSummaryActionItem,
  getMeetingTranscript,
} from "../../services/meetingServices";
import type { MeetingItem, MeetingSummary, MeetingSummaryActionItem } from "../../types/meetings";

interface MeetingSummaryModalProps {
  isOpen: boolean;
  meeting: MeetingItem | null;
  onClose: () => void;
}

type ModalTab = "summary" | "actions" | "decisions" | "transcript";

export const MeetingSummaryModal: React.FC<MeetingSummaryModalProps> = ({
  isOpen,
  meeting,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<ModalTab>("summary");
  const [summary, setSummary] = useState<MeetingSummary | null>(null);
  const [transcriptTurns, setTranscriptTurns] = useState<
    Array<{ id: string; speakerName: string; text: string; timestamp: number }>
  >([]);
  const [transcriptSearch, setTranscriptSearch] = useState("");
  const [customNotes, setCustomNotes] = useState("");
  const [showNotesInput, setShowNotesInput] = useState(false);

  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const meetingId = meeting?._id || meeting?.id || meeting?.meetingCode || "";

  // Fetch initial summary and transcript
  const loadData = useCallback(async () => {
    if (!meetingId) return;
    setLoading(true);
    setError(null);

    try {
      // Load summary
      const summaryRes = await getMeetingSummary(meetingId);
      if (summaryRes?.data?.data) {
        setSummary(summaryRes.data.data);
      } else {
        setSummary(null);
      }

      // Load transcript turns
      try {
        const transcriptRes = await getMeetingTranscript(meetingId);
        const turns = transcriptRes?.data?.data?.turns || [];
        setTranscriptTurns(turns);
      } catch {
        // Transcript might not exist yet
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        "Failed to load meeting summary. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [meetingId]);

  useEffect(() => {
    if (isOpen && meetingId) {
      loadData();
    } else {
      setSummary(null);
      setTranscriptTurns([]);
      setShowNotesInput(false);
      setCustomNotes("");
      setError(null);
    }
  }, [isOpen, meetingId, loadData]);

  // Handle generation of AI Summary
  const handleGenerate = async () => {
    if (!meetingId) return;
    setIsGenerating(true);
    setError(null);

    try {
      const res = await generateMeetingSummary(
        meetingId,
        customNotes.trim() ? customNotes.trim() : undefined
      );
      if (res?.data?.data) {
        setSummary(res.data.data);
        setShowNotesInput(false);
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        "Failed to generate AI meeting summary. Ensure GROQ_API_KEY is configured."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Toggle action item completed status
  const handleToggleAction = async (index: number, currentCompleted: boolean) => {
    if (!summary || !meetingId) return;

    // Optimistic UI update
    const nextCompleted = !currentCompleted;
    setSummary((prev: MeetingSummary | null) => {
      if (!prev) return null;
      const updatedActions = [...prev.actionItems];
      if (updatedActions[index]) {
        updatedActions[index] = {
          ...updatedActions[index],
          completed: nextCompleted,
        };
      }
      return { ...prev, actionItems: updatedActions };
    });

    try {
      await toggleSummaryActionItem(meetingId, index, nextCompleted);
    } catch {
      // Revert on error
      setSummary((prev: MeetingSummary | null) => {
        if (!prev) return null;
        const revertedActions = [...prev.actionItems];
        if (revertedActions[index]) {
          revertedActions[index] = {
            ...revertedActions[index],
            completed: currentCompleted,
          };
        }
        return { ...prev, actionItems: revertedActions };
      });
    }
  };

  // Copy full summary formatted as Markdown
  const handleCopyMarkdown = () => {
    if (!summary) return;

    let md = `# AI Meeting Summary: ${summary.title}\n\n`;
    md += `**Date:** ${new Date(summary.generatedAt).toLocaleDateString()} | **Sentiment:** ${summary.sentiment} | **Turns:** ${summary.totalTurns}\n\n`;
    md += `## Executive Overview\n${summary.overview}\n\n`;

    if (summary.keyPoints?.length > 0) {
      md += `## Key Discussion Points\n`;
      summary.keyPoints.forEach((point: string) => {
        md += `- ${point}\n`;
      });
      md += `\n`;
    }

    if (summary.actionItems?.length > 0) {
      md += `## Action Items\n`;
      summary.actionItems.forEach((action: MeetingSummaryActionItem) => {
        const check = action.completed ? "[x]" : "[ ]";
        const assignee = action.assignee ? ` (@${action.assignee})` : "";
        const due = action.dueDate ? ` - Due: ${action.dueDate}` : "";
        md += `- ${check} ${action.task}${assignee}${due}\n`;
      });
      md += `\n`;
    }

    if (summary.decisions?.length > 0) {
      md += `## Decisions Made\n`;
      summary.decisions.forEach((dec: string) => {
        md += `- ${dec}\n`;
      });
      md += `\n`;
    }

    if (summary.keywords?.length > 0) {
      md += `**Keywords:** ${summary.keywords.join(", ")}\n`;
    }

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download markdown file
  const handleDownload = () => {
    if (!summary) return;

    let md = `# AI Meeting Summary: ${summary.title}\n\n`;
    md += `**Meeting:** ${meeting?.title || summary.title}\n`;
    md += `**Generated:** ${new Date(summary.generatedAt).toLocaleString()}\n`;
    md += `**Sentiment:** ${summary.sentiment}\n\n`;
    md += `## Executive Overview\n${summary.overview}\n\n`;

    if (summary.keyPoints?.length > 0) {
      md += `## Key Discussion Points\n`;
      summary.keyPoints.forEach((point: string) => {
        md += `- ${point}\n`;
      });
      md += `\n`;
    }

    if (summary.actionItems?.length > 0) {
      md += `## Action Items\n`;
      summary.actionItems.forEach((item: MeetingSummaryActionItem) => {
        md += `- [${item.completed ? "x" : " "}] ${item.task}${item.assignee ? ` (Assigned: ${item.assignee})` : ""
          }${item.dueDate ? ` (Due: ${item.dueDate})` : ""}\n`;
      });
      md += `\n`;
    }

    if (summary.decisions?.length > 0) {
      md += `## Decisions Made\n`;
      summary.decisions.forEach((d: string) => {
        md += `- ${d}\n`;
      });
      md += `\n`;
    }

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `${(meeting?.title || "meeting-summary").toLowerCase().replace(/[^a-z0-9]/g, "-")}-summary.md`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  // Sentiment style helper
  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      case "productive":
        return "bg-violet-500/15 text-violet-300 border-violet-500/30";
      case "urgent":
        return "bg-rose-500/15 text-rose-400 border-rose-500/30";
      case "mixed":
        return "bg-amber-500/15 text-amber-300 border-amber-500/30";
      default:
        return "bg-slate-700/50 text-slate-300 border-slate-600/50";
    }
  };

  const filteredTurns = transcriptTurns.filter(
    (turn) =>
      turn.text.toLowerCase().includes(transcriptSearch.toLowerCase()) ||
      turn.speakerName.toLowerCase().includes(transcriptSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-slate-900 border border-violet-500/30 rounded-2xl shadow-2xl shadow-violet-950/50 overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-violet-500/20 bg-gradient-to-r from-violet-950/40 via-slate-900 to-indigo-950/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30 shadow-inner">
              <Sparkles className="w-5 h-5 text-violet-400 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 tracking-wide uppercase">
                  AI Meeting Intelligence
                </span>
                {summary && (
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full border capitalize flex items-center gap-1 ${getSentimentBadge(
                      summary.sentiment
                    )}`}
                  >
                    <Smile className="w-3 h-3" />
                    {summary.sentiment}
                  </span>
                )}
                {summary?.modelUsed && (
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Cpu className="w-3 h-3 text-slate-500" />
                    {summary.modelUsed.replace("openai/", "").replace("meta-llama/", "")}
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white truncate mt-0.5">
                {summary?.title || meeting?.title || "Meeting Summary"}
              </h2>
            </div>
          </div>

          {/* Action buttons & Close */}
          <div className="flex items-center gap-2">
            {summary && (
              <>
                <button
                  type="button"
                  onClick={handleCopyMarkdown}
                  title="Copy formatted markdown"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-violet-500/20 transition-all cursor-pointer"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">
                    {copied ? "Copied!" : "Copy"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleDownload}
                  title="Download .md report"
                  className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-violet-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export</span>
                </button>

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  title="Regenerate summary with AI"
                  className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-violet-600/30 hover:bg-violet-600/50 text-violet-300 hover:text-white text-xs font-medium border border-violet-500/30 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin text-violet-400" : ""
                      }`}
                  />
                  <span className="hidden sm:inline">Regenerate</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Tabs Navigation ── */}
        {summary && (
          <div className="flex items-center gap-1 px-6 pt-3 border-b border-violet-500/15 bg-slate-900/60 overflow-x-auto text-sm">
            <button
              type="button"
              onClick={() => setActiveTab("summary")}
              className={`flex items-center gap-2 px-3.5 py-2 font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${activeTab === "summary"
                ? "border-violet-500 text-violet-300 font-semibold bg-violet-500/10 rounded-t-lg"
                : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
            >
              <FileText className="w-4 h-4" />
              Executive Overview
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("actions")}
              className={`flex items-center gap-2 px-3.5 py-2 font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${activeTab === "actions"
                ? "border-violet-500 text-violet-300 font-semibold bg-violet-500/10 rounded-t-lg"
                : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
            >
              <ListTodo className="w-4 h-4" />
              Action Items
              {summary.actionItems?.length > 0 && (
                <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-violet-500/20 text-violet-300 font-bold">
                  {summary.actionItems.filter((a: MeetingSummaryActionItem) => a.completed).length}/
                  {summary.actionItems.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("decisions")}
              className={`flex items-center gap-2 px-3.5 py-2 font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${activeTab === "decisions"
                ? "border-violet-500 text-violet-300 font-semibold bg-violet-500/10 rounded-t-lg"
                : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
            >
              <CheckSquare className="w-4 h-4" />
              Decisions ({summary.decisions?.length || 0})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("transcript")}
              className={`flex items-center gap-2 px-3.5 py-2 font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${activeTab === "transcript"
                ? "border-violet-500 text-violet-300 font-semibold bg-violet-500/10 rounded-t-lg"
                : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
            >
              <MessageSquareQuote className="w-4 h-4" />
              Full Transcript ({transcriptTurns.length})
            </button>
          </div>
        )}

        {/* ── Modal Content Area ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-red-200">Summary Notice</p>
                <p className="text-xs text-red-300/90">{error}</p>
              </div>
            </div>
          )}

          {/* Loading Skeleton */}
          {loading && (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
                <Sparkles className="w-6 h-6 text-violet-400 absolute inset-0 m-auto animate-pulse" />
              </div>
              <p className="text-sm font-medium text-slate-300">
                Loading AI meeting insights...
              </p>
            </div>
          )}

          {/* Generating Animation State */}
          {isGenerating && (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-4 bg-violet-950/10 rounded-2xl border border-violet-500/20 p-8">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-violet-500/20 border-t-violet-400 animate-spin" />
                <Sparkles className="w-6 h-6 text-violet-400 absolute inset-0 m-auto animate-bounce" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">
                  Groq 120B AI is analyzing your meeting
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Extracting key discussion points, calculating sentiment,
                  cataloging action items, and drafting an executive summary...
                </p>
              </div>
            </div>
          )}

          {/* Empty State: Summary Not Generated Yet */}
          {!loading && !isGenerating && !summary && (
            <div className="py-10 flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-5">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/10 border border-violet-500/30 text-violet-400 shadow-xl shadow-violet-950/40">
                <Sparkles className="w-10 h-10 text-violet-400" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">
                  Ready to Generate AI Meeting Summary
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  AudioHive uses ultra-fast Groq LLMs to automatically synthesize
                  the conversation, identify decisions made, and create assigned
                  action items with deadlines.
                </p>
              </div>

              {/* Live Transcript Stats pill */}
              <div className="flex items-center gap-3 text-xs text-slate-400 bg-slate-800/80 px-4 py-2 rounded-xl border border-violet-500/20">
                <span className="flex items-center gap-1.5">
                  <MessageSquareQuote className="w-3.5 h-3.5 text-violet-400" />
                  <strong>{transcriptTurns.length}</strong> speech turns recorded
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-600" />
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  {meeting?.startTime
                    ? new Date(meeting.startTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                    : "Live Call"}
                </span>
              </div>

              {/* Optional custom notes toggle */}
              <div className="w-full text-left">
                {!showNotesInput ? (
                  <button
                    type="button"
                    onClick={() => setShowNotesInput(true)}
                    className="text-xs text-violet-400 hover:text-violet-300 font-medium underline underline-offset-4 cursor-pointer"
                  >
                    + Add manual meeting notes or agenda context
                  </button>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Additional Context / Manual Notes (Optional):
                    </label>
                    <textarea
                      value={customNotes}
                      onChange={(e) => setCustomNotes(e.target.value)}
                      placeholder="e.g. Discussed Q3 migration roadmap, agreed on Postgres schema changes..."
                      rows={3}
                      className="w-full text-xs bg-slate-950/80 border border-violet-500/30 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-violet-500 placeholder:text-slate-600"
                    />
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-violet-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Generate AI Summary Now
              </button>
            </div>
          )}

          {/* ── Tab 1: Executive Overview & Key Points ── */}
          {!loading && !isGenerating && summary && activeTab === "summary" && (
            <div className="space-y-6">
              {/* Executive Overview Card */}
              <div className="bg-slate-800/40 border border-violet-500/20 rounded-2xl p-5 sm:p-6 space-y-3">
                <div className="flex items-center gap-2 text-violet-400 text-xs font-bold uppercase tracking-wider">
                  <FileText className="w-4 h-4" />
                  Executive Overview
                </div>
                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                  {summary.overview}
                </p>
              </div>

              {/* Key Discussion Points */}
              <div className="bg-slate-800/40 border border-violet-500/20 rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4" />
                  Key Discussion Points
                </div>
                {summary.keyPoints && summary.keyPoints.length > 0 ? (
                  <ul className="space-y-2.5">
                    {summary.keyPoints.map((point: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-slate-300">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-violet-600/20 text-violet-300 text-xs font-bold shrink-0 mt-0.5 border border-violet-500/30">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{point}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-400 italic">No key points listed.</p>
                )}
              </div>

              {/* Key Topics & Attendees */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Keywords Chips */}
                <div className="bg-slate-800/30 border border-violet-500/15 rounded-xl p-4 space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Core Topics & Keywords
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {summary.keywords && summary.keywords.length > 0 ? (
                      summary.keywords.map((kw: string, i: number) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 text-slate-300 border border-violet-500/20 font-medium"
                        >
                          #{kw}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500">General Discussion</span>
                    )}
                  </div>
                </div>

                {/* Speakers Identified */}
                <div className="bg-slate-800/30 border border-violet-500/15 rounded-xl p-4 space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    Identified Speakers & Participants
                  </span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {summary.speakers && summary.speakers.length > 0 ? (
                      summary.speakers.map((spk: string, i: number) => (
                        <span
                          key={i}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-indigo-950/60 text-indigo-300 border border-indigo-500/30 font-medium"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          {spk}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500">Participants</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Tab 2: Action Items ── */}
          {!loading && !isGenerating && summary && activeTab === "actions" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-violet-500/20">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <ListTodo className="w-4 h-4 text-violet-400" />
                    Interactive Action Items
                  </h4>
                  <p className="text-xs text-slate-400">
                    Click any checkbox to mark items completed. Status is synchronized in real time.
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-violet-600/20 text-violet-300 border border-violet-500/30">
                  {summary.actionItems.filter((a: MeetingSummaryActionItem) => a.completed).length} of{" "}
                  {summary.actionItems.length} Done
                </span>
              </div>

              {summary.actionItems && summary.actionItems.length > 0 ? (
                <div className="space-y-2.5">
                  {summary.actionItems.map((action: MeetingSummaryActionItem, idx: number) => (
                    <div
                      key={idx}
                      onClick={() => handleToggleAction(idx, action.completed)}
                      className={`group flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${action.completed
                        ? "bg-slate-900/60 border-slate-800 text-slate-500 opacity-70"
                        : "bg-slate-800/50 border-violet-500/20 hover:border-violet-500/50 text-slate-200"
                        }`}
                    >
                      <button
                        type="button"
                        className="mt-0.5 text-violet-400 group-hover:text-violet-300 transition-colors"
                      >
                        {action.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-500 group-hover:text-violet-400" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium ${action.completed ? "line-through text-slate-500" : "text-white"
                            }`}
                        >
                          {action.task}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                          {action.assignee && (
                            <span className="flex items-center gap-1 text-violet-300">
                              <span className="font-semibold text-slate-500">Assignee:</span>
                              {action.assignee}
                            </span>
                          )}
                          {action.dueDate && (
                            <span className="flex items-center gap-1 text-amber-300">
                              <Clock className="w-3 h-3" />
                              {action.dueDate}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No action items were identified in this meeting.
                </div>
              )}
            </div>
          )}

          {/* ── Tab 3: Decisions Made ── */}
          {!loading && !isGenerating && summary && activeTab === "decisions" && (
            <div className="space-y-4">
              <div className="pb-2 border-b border-violet-500/20">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                  Agreed Decisions & Consensus
                </h4>
                <p className="text-xs text-slate-400">
                  Definitive conclusions and approved proposals documented by the AI model.
                </p>
              </div>

              {summary.decisions && summary.decisions.length > 0 ? (
                <div className="space-y-3">
                  {summary.decisions.map((decision: string, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-4 rounded-xl bg-slate-800/40 border border-emerald-500/20 text-slate-200"
                    >
                      <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <p className="text-sm leading-relaxed">{decision}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No explicit decisions were recorded for this session.
                </div>
              )}
            </div>
          )}

          {/* ── Tab 4: Full Transcript ── */}
          {!loading && !isGenerating && summary && activeTab === "transcript" && (
            <div className="space-y-4">
              {/* Search bar inside transcript */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={transcriptSearch}
                  onChange={(e) => setTranscriptSearch(e.target.value)}
                  placeholder="Search spoken dialogue or speaker name..."
                  className="w-full pl-10 pr-4 py-2 text-xs bg-slate-800/80 border border-violet-500/20 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>

              {filteredTurns.length > 0 ? (
                <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                  {filteredTurns.map((turn, i) => (
                    <div
                      key={turn.id || i}
                      className="p-3 rounded-xl bg-slate-800/40 border border-slate-800/80 hover:border-violet-500/30 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-bold text-violet-300">
                          {turn.speakerName || "Speaker"}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(turn.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed select-text">
                        {turn.text}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs">
                  {transcriptSearch
                    ? "No matching transcript turns found for this query."
                    : "No full transcript turns were recorded for this meeting."}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Modal Footer ── */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-violet-500/20 bg-slate-900/90 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>AudioHive AI Meeting Intelligence</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
