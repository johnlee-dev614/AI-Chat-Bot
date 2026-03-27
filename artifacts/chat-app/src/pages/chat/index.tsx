import { useRoute } from "wouter";
import { useState, useRef, useEffect } from "react";
import { 
  useGetCharacter, 
  useGetChatHistory, 
  useSendMessage,
  Message 
} from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, ArrowLeft, ShieldAlert } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export function ChatView() {
  const [, params] = useRoute("/chat/:slug");
  const slug = params?.slug || "";
  
  const { user, isAuthenticated, isLoading: authLoading, login } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: character } = useGetCharacter(slug, { query: { enabled: !!slug && isAuthenticated } });
  const { data: chatData, isLoading: chatLoading } = useGetChatHistory(slug, { query: { enabled: !!slug && isAuthenticated } });
  
  const [content, setContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const sendMessage = useSendMessage({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [`/api/chat/${slug}/messages`] });
      }
    }
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      login();
    }
  }, [authLoading, isAuthenticated, login]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatData?.messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || sendMessage.isPending) return;
    
    sendMessage.mutate({
      characterSlug: slug,
      data: { content }
    });
    setContent("");
  };

  if (!isAuthenticated || !character) return <div className="h-screen bg-background" />;

  const messages = chatData?.messages || [];

  return (
    <div className="h-screen pt-[72px] flex flex-col md:flex-row bg-background overflow-hidden">
      {/* Left Panel - Hidden on mobile unless toggled */}
      <div className="hidden md:flex w-80 flex-col border-r border-white/10 bg-card/30 backdrop-blur-md p-6 overflow-y-auto">
        <Link href="/characters" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-white mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" /> Directory
        </Link>
        
        <div className="text-center mb-8">
          <Avatar src={character.avatarUrl} name={character.name} size="xl" className="mx-auto mb-4 ring-4 ring-white/5" />
          <h2 className="text-2xl font-display font-bold text-white mb-1">{character.name}</h2>
          <p className="text-primary text-sm font-medium">{character.category}</p>
        </div>

        <div className="bg-white/5 rounded-xl p-4 mb-6 text-sm text-muted-foreground">
          {character.bio || character.description}
        </div>

        <div>
          <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">Conversation Starters</h3>
          <div className="flex flex-col gap-2">
            {character.conversationStarters.map(starter => (
              <button
                key={starter}
                onClick={() => setContent(starter)}
                className="text-left text-sm p-3 rounded-lg bg-white/5 border border-white/10 hover:border-primary/50 hover:bg-white/10 transition-colors text-white/90"
              >
                {starter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center p-4 border-b border-white/10 bg-background/80 backdrop-blur-md">
          <Link href="/characters" className="mr-4 text-muted-foreground">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <Avatar src={character.avatarUrl} name={character.name} size="sm" className="mr-3" />
          <div>
            <h2 className="font-bold text-white leading-tight">{character.name}</h2>
            <div className="flex items-center text-xs text-green-500">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-1" /> Online
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          <div className="text-center py-8">
            <ShieldAlert className="w-6 h-6 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Beginning of conversation</p>
            <p className="text-xs text-white/30 mt-1">AI generated characters are fictional.</p>
          </div>

          {messages.map((msg: Message) => {
            const isUser = msg.role === "user";
            return (
              <div key={msg.id} className={cn("flex max-w-[85%]", isUser ? "ml-auto justify-end" : "")}>
                {!isUser && (
                  <Avatar src={character.avatarUrl} name={character.name} size="sm" className="mr-3 mt-1 shrink-0" />
                )}
                <div>
                  <div className={cn(
                    "p-4 rounded-2xl text-[15px] leading-relaxed",
                    isUser 
                      ? "bg-gradient-to-br from-primary to-accent text-white rounded-tr-sm shadow-lg shadow-primary/20" 
                      : "bg-white/5 border border-white/10 text-white/90 rounded-tl-sm"
                  )}>
                    {msg.content}
                  </div>
                  <div className={cn("text-[11px] text-muted-foreground mt-1.5", isUser ? "text-right mr-1" : "ml-1")}>
                    {format(new Date(msg.createdAt), "h:mm a")}
                  </div>
                </div>
              </div>
            );
          })}
          {sendMessage.isPending && (
            <div className="flex max-w-[85%]">
              <Avatar src={character.avatarUrl} name={character.name} size="sm" className="mr-3 mt-1 shrink-0" />
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 rounded-tl-sm flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-white/30 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: "0.2s" }} />
                <div className="w-2 h-2 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: "0.4s" }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 md:p-6 bg-background/80 backdrop-blur-xl border-t border-white/10">
          <form onSubmit={handleSend} className="max-w-4xl mx-auto relative flex items-center">
            <Input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Message ${character.name}...`}
              className="pr-14 h-14 bg-white/5 border-white/10 focus-visible:ring-primary/50 text-base"
              disabled={sendMessage.isPending}
            />
            <Button 
              type="submit" 
              size="icon" 
              variant="glow" 
              className="absolute right-1.5 h-11 w-11 rounded-lg"
              disabled={!content.trim() || sendMessage.isPending}
            >
              <Send className="w-5 h-5 ml-0.5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
