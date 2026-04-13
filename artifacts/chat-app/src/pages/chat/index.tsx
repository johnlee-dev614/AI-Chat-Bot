import { useRoute } from "wouter";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  useGetCharacter,
  useGetChatHistory,
  useSendMessage,
  Message,
} from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, ArrowLeft, ShieldAlert, Volume2, VolumeX, RefreshCw, Flame, ChevronDown } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useEmbers } from "@/lib/ember-context";

// ── Static character profile data ─────────────────────────────────────────────
const CHARACTER_PROFILES: Record<string, {
  dateOfBirth?: string; gender?: string; language?: string;
  height?: string; weight?: string; ethnicity?: string;
  horoscope?: string; jobTitle?: string;
}> = {
  isabella: {
    dateOfBirth: "March 15, 2000",
    gender: "Female",
    language: "Spanish, English",
    height: "5'5\" (165 cm)",
    weight: "125 lbs (57 kg)",
    ethnicity: "Latina / Hispanic",
    horoscope: "Pisces ♓",
    jobTitle: "Marketing Coordinator",
  },
};

// ── Chat state machine ────────────────────────────────────────────────────────
type SendState = "idle" | "sending" | "thinking" | "speaking";

// ── Audio helper ──────────────────────────────────────────────────────────────
function playAudioBase64(base64: string, onEnd?: () => void): HTMLAudioElement | null {
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: "audio/mpeg" });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.onended = () => {
      URL.revokeObjectURL(url);
      onEnd?.();
    };
    audio.play().catch(() => onEnd?.());
    return audio;
  } catch {
    onEnd?.();
    return null;
  }
}

// ── Typing dots ───────────────────────────────────────────────────────────────
function ThinkingDots({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex gap-1">
        {[0, 0.18, 0.36].map((delay, i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce"
            style={{ animationDelay: `${delay}s`, animationDuration: "0.9s" }}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground/70 font-light italic">{label}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export function ChatView() {
  const [, params] = useRoute("/chat/:slug");
  const slug = params?.slug || "";

  const { isAuthenticated, isLoading: authLoading, login } = useAuth();
  const { embers, updateEmbers, setShowPaywall } = useEmbers();
  const queryClient = useQueryClient();

  const { data: character, refetch: refetchCharacter } = useGetCharacter(slug, {
    query: { enabled: !!slug && isAuthenticated, staleTime: 0, refetchOnMount: "always" },
    request: { cache: "no-store" },
  });
  const profile = CHARACTER_PROFILES[slug] ?? {};

  useEffect(() => {
    if (slug && isAuthenticated) {
      queryClient.removeQueries({ queryKey: [`/api/characters/${slug}`] });
      refetchCharacter();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, isAuthenticated]);
  const { data: chatData, isLoading: chatLoading } = useGetChatHistory(slug, {
    query: { enabled: !!slug && isAuthenticated },
  });

  const [content, setContent] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [sendState, setSendState] = useState<SendState>("idle");
  const [bioExpanded, setBioExpanded] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);
  const [lastSentContent, setLastSentContent] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) login();
  }, [authLoading, isAuthenticated, login]);

  const allMessages = [...(chatData?.messages || []), ...optimisticMessages];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages.length, sendState]);

  const stopAudio = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
  }, []);

  const sendMessage = useSendMessage({
    mutation: {
      onMutate: () => {
        setSendState("thinking");
        setLastError(null);
      },
      onSuccess: (data) => {
        // Update ember balance from response
        if (typeof data.embers === "number") {
          updateEmbers(data.embers);
        }

        // Clear optimistic + refresh history
        setOptimisticMessages([]);
        queryClient.invalidateQueries({ queryKey: [`/api/chat/${slug}/messages`] });

        if (voiceEnabled && data.audio) {
          stopAudio();
          setSendState("speaking");
          currentAudioRef.current = playAudioBase64(data.audio, () => {
            setSendState("idle");
          });
        } else {
          setSendState("idle");
        }
      },
      onError: (err: unknown) => {
        setOptimisticMessages([]);
        setSendState("idle");

        // Check for 402 (no embers)
        const anyErr = err as { status?: number; response?: { status?: number } };
        const status = anyErr?.status ?? anyErr?.response?.status;
        if (status === 402) {
          setShowPaywall(true);
          return;
        }

        const msg = (err as Error)?.message ?? "Failed to send. Please try again.";
        setLastError(msg);
      },
    },
  });

  const doSend = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sendState !== "idle") return;

      setLastSentContent(trimmed);
      setLastError(null);
      setSendState("sending");

      // Optimistic user bubble
      setOptimisticMessages([
        {
          id: `optimistic-${Date.now()}`,
          characterSlug: slug,
          role: "user",
          content: trimmed,
          createdAt: new Date().toISOString(),
          audio: null,
        },
      ]);

      sendMessage.mutate({
        characterSlug: slug,
        data: { content: trimmed },
      });
      setContent("");
    },
    [sendState, slug, sendMessage],
  );

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    doSend(content);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      doSend(content);
    }
  };

  const handleRetry = () => {
    if (lastSentContent) {
      setLastError(null);
      doSend(lastSentContent);
    }
  };

  const toggleVoice = useCallback(() => {
    if (voiceEnabled) stopAudio();
    setVoiceEnabled((v) => !v);
    if (sendState === "speaking") setSendState("idle");
  }, [voiceEnabled, stopAudio, sendState]);

  const isBusy = sendState !== "idle";
  const isEmberless = embers !== null && embers <= 0;

  const statusLabel: Record<SendState, string> = {
    idle: "",
    sending: "Sending…",
    thinking: "Thinking…",
    speaking: "Speaking…",
  };

  if (!isAuthenticated || !character) return <div className="h-screen bg-background" />;

  return (
    <div className="h-screen pt-[72px] flex flex-col md:flex-row bg-background overflow-hidden">

      {/* ── Left Sidebar (desktop) ─────────────────────────────────────────── */}
      <div className="hidden md:flex w-72 flex-col border-r border-white/[0.06] bg-card/30 backdrop-blur-xl p-6 overflow-y-auto">
        <Link
          href="/characters"
          className="inline-flex items-center text-xs font-light tracking-widest uppercase text-muted-foreground/70 hover:text-white/70 mb-8 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-2" /> Directory
        </Link>

        <div className="text-center mb-6">
          <div className="relative inline-block mb-4">
            <Avatar
              src={character.avatarUrl}
              name={character.name}
              size="xl"
              className="mx-auto ring-4 ring-primary/10"
            />
            <div
              className={cn(
                "absolute bottom-1 right-1 w-3 h-3 rounded-full border-2 border-card",
                character.isOnline
                  ? "bg-emerald-400/80 shadow-[0_0_6px_rgba(52,211,153,0.5)]"
                  : "bg-white/20",
              )}
            />
          </div>
          <h2 className="font-display text-xl font-semibold text-white/90 italic mb-0.5">
            {character.name}
          </h2>
          <p className="text-xs text-primary/70 font-light tracking-widest uppercase">
            {character.category}
          </p>
        </div>

        {/* Profile fields */}
        {slug === "isabella" && (
          <div className="mb-5 shrink-0 rounded-2xl bg-white/[0.03] border border-white/[0.05] overflow-hidden">
            {[
              { icon: "🎂", label: "Birthday", value: "March 15" },
              { icon: "⚧", label: "Gender", value: "Female" },
              { icon: "📏", label: "Height", value: "5'5\" (165 cm)" },
              { icon: "⚖️", label: "Weight", value: "125 lbs (57 kg)" },
              { icon: "🌺", label: "Ethnicity", value: "Latina / Hispanic" },
              { icon: "✨", label: "Horoscope", value: "Pisces ♓" },
              { icon: "💼", label: "Job", value: "Marketing Coordinator" },
            ].map((field, i, arr) => (
              <div
                key={field.label}
                className={cn(
                  "flex items-center gap-2.5 px-3.5 py-2.5",
                  i < arr.length - 1 && "border-b border-white/[0.04]",
                )}
              >
                <span className="text-sm shrink-0">{field.icon}</span>
                <span className="text-[10px] text-muted-foreground/50 font-light tracking-wide w-14 shrink-0 uppercase">
                  {field.label}
                </span>
                <span className="text-[11px] text-white/75 font-light leading-snug text-right flex-1">
                  {field.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Collapsible About/Bio */}
        <div className="mb-5">
          <button
            onClick={() => setBioExpanded((v) => !v)}
            className="w-full flex items-center justify-between text-[10px] text-white/30 uppercase tracking-widest mb-2 hover:text-white/50 transition-colors rounded-xl px-3.5 py-2.5 bg-white/[0.03] border border-white/[0.05] hover:border-white/[0.08]"
          >
            <span>About</span>
            <motion.span
              animate={{ rotate: bioExpanded ? 180 : 0 }}
              transition={{ duration: 0.25 }}
            >
              <ChevronDown className="w-3 h-3" />
            </motion.span>
          </button>
          <motion.div
            initial={false}
            animate={{ height: bioExpanded ? "auto" : 0, opacity: bioExpanded ? 1 : 0 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pt-2 pb-0.5 px-3.5 text-xs text-muted-foreground/75 font-light leading-relaxed">
              {character.bio || character.description}
            </div>
          </motion.div>
        </div>

        {/* Voice toggle */}
        <button
          onClick={toggleVoice}
          className={cn(
            "flex items-center gap-2 text-xs px-3 py-2.5 rounded-xl border transition-all duration-300 mb-6 w-full justify-center font-light tracking-wide",
            voiceEnabled
              ? "border-primary/30 text-primary/80 bg-primary/8 hover:bg-primary/12"
              : "border-white/[0.07] text-white/30 hover:text-white/50 hover:bg-white/[0.04]",
          )}
        >
          {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          {voiceEnabled ? "Voice on" : "Voice off"}
        </button>

        <div>
          <h3 className="text-[10px] font-light text-white/30 uppercase tracking-widest mb-3">
            Conversation Starters
          </h3>
          <div className="flex flex-col gap-2">
            {character.conversationStarters.map((starter) => (
              <button
                key={starter}
                onClick={() => {
                  setContent(starter);
                  inputRef.current?.focus();
                }}
                disabled={isBusy}
                className="text-left text-xs p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-primary/25 hover:bg-primary/[0.05] transition-all duration-300 text-white/60 hover:text-white/80 font-light leading-relaxed disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {starter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Chat Area ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Ambient bedroom glow behind chat */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-primary/[0.04] blur-[120px] rounded-full" />
        </div>

        {/* Mobile Header */}
        <div className="md:hidden flex items-center p-4 border-b border-white/[0.06] bg-background/80 backdrop-blur-xl relative z-10">
          <Link href="/characters" className="mr-4 text-muted-foreground/60 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Avatar src={character.avatarUrl} name={character.name} size="sm" className="mr-3" />
          <div className="flex-1">
            <h2 className="font-display font-semibold text-white/90 italic leading-tight text-sm">
              {character.name}
            </h2>
            <div className="flex items-center text-[10px] text-emerald-400/80 font-light">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/80 mr-1.5" /> Online
            </div>
          </div>
          <button
            onClick={toggleVoice}
            className={cn(
              "p-2 rounded-xl transition-colors",
              voiceEnabled ? "text-primary/80" : "text-white/30",
            )}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-5 relative z-10">
          {/* Top disclaimer */}
          <div className="text-center py-6">
            <ShieldAlert className="w-4 h-4 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-[10px] text-muted-foreground/40 uppercase tracking-widest">
              Beginning of conversation
            </p>
            <p className="text-[10px] text-white/20 mt-1">
              {character.name} is an AI companion. All responses are generated.
            </p>
          </div>

          {/* Chat history loading */}
          {chatLoading && (
            <div className="flex justify-center py-6">
              <ThinkingDots label="Loading messages…" />
            </div>
          )}

          {/* Messages */}
          <AnimatePresence initial={false}>
            {allMessages.map((msg: Message) => {
              const isUser = msg.role === "user";
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className={cn("flex max-w-[82%]", isUser ? "ml-auto justify-end" : "")}
                >
                  {!isUser && (
                    <Avatar
                      src={character.avatarUrl}
                      name={character.name}
                      size="sm"
                      className="mr-2.5 mt-1 shrink-0 ring-2 ring-primary/10"
                    />
                  )}
                  <div>
                    <div
                      className={cn(
                        "px-4 py-3 rounded-2xl text-[14px] leading-relaxed",
                        isUser
                          ? "bg-gradient-to-br from-primary/80 to-accent/70 text-white rounded-tr-sm shadow-md shadow-primary/15"
                          : "bg-card/70 border border-white/[0.07] text-white/85 rounded-tl-sm",
                      )}
                    >
                      {msg.content}
                    </div>
                    <div
                      className={cn(
                        "text-[10px] text-muted-foreground/40 mt-1 font-light",
                        isUser ? "text-right mr-1" : "ml-1",
                      )}
                    >
                      {format(new Date(msg.createdAt), "h:mm a")}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Thinking / speaking indicator */}
          <AnimatePresence>
            {isBusy && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.25 }}
                className="flex max-w-[82%]"
              >
                <Avatar
                  src={character.avatarUrl}
                  name={character.name}
                  size="sm"
                  className="mr-2.5 mt-1 shrink-0 ring-2 ring-primary/10"
                />
                <div className="px-4 py-3 rounded-2xl bg-card/70 border border-white/[0.07] rounded-tl-sm">
                  <ThinkingDots label={statusLabel[sendState]} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error state with retry */}
          <AnimatePresence>
            {lastError && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-between gap-3 text-sm bg-destructive/8 border border-destructive/20 rounded-2xl px-4 py-3"
              >
                <p className="text-destructive/80 font-light leading-relaxed text-xs">
                  {lastError}
                </p>
                {lastSentContent && (
                  <button
                    onClick={handleRetry}
                    className="flex items-center gap-1.5 text-xs text-destructive/70 hover:text-destructive/90 transition-colors shrink-0 font-light"
                  >
                    <RefreshCw className="w-3 h-3" /> Retry
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>

        {/* ── Input Bar ─────────────────────────────────────────────────────── */}
        <div className="p-4 md:p-5 border-t border-white/[0.05] bg-background/70 backdrop-blur-2xl relative z-10">
          {/* Mobile starters strip — hide when emberless */}
          {!isEmberless && (
            <div className="md:hidden flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
              {character.conversationStarters.slice(0, 3).map((starter) => (
                <button
                  key={starter}
                  onClick={() => {
                    setContent(starter);
                    inputRef.current?.focus();
                  }}
                  disabled={isBusy}
                  className="shrink-0 text-[11px] px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.07] text-white/50 font-light whitespace-nowrap hover:border-primary/25 hover:text-white/70 transition-all disabled:opacity-40"
                >
                  {starter}
                </button>
              ))}
            </div>
          )}

          {/* Paywall freeze banner */}
          {isEmberless ? (
            <div className="max-w-3xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between gap-4 px-5 py-4 rounded-2xl bg-gradient-to-r from-amber-500/8 to-rose-500/8 border border-amber-500/20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-500/15 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <Flame className="w-4.5 h-4.5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm text-white/85 font-medium">You're out of Embers</p>
                    <p className="text-xs text-muted-foreground font-light">Top up to keep chatting with {character.name}</p>
                  </div>
                </div>
                <Button
                  variant="glow"
                  size="sm"
                  onClick={() => setShowPaywall(true)}
                  className="shrink-0 font-light tracking-wide"
                >
                  Get Embers
                </Button>
              </motion.div>
            </div>
          ) : (
            <form onSubmit={handleSend} className="max-w-3xl mx-auto relative flex items-center gap-2">
              <Input
                ref={inputRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  sendState === "speaking"
                    ? `${character.name} is speaking…`
                    : `Message ${character.name}…`
                }
                className={cn(
                  "pr-14 h-12 rounded-2xl font-light text-sm transition-all duration-300",
                  "bg-card/50 border-white/[0.08] text-white/90 placeholder:text-muted-foreground/40",
                  "focus-visible:border-primary/30 focus-visible:ring-0",
                  "focus-visible:shadow-[0_0_20px_-4px_hsl(var(--primary)/0.25)]",
                )}
                disabled={isBusy}
              />
              <Button
                type="submit"
                size="icon"
                variant="glow"
                className="absolute right-1.5 h-9 w-9 rounded-xl shadow-[0_0_20px_-4px_hsl(var(--primary)/0.4)]"
                disabled={!content.trim() || isBusy}
              >
                <Send className="w-4 h-4 ml-0.5" />
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
