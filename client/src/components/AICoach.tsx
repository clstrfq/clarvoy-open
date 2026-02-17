import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Send, Loader2, Sparkles, Paperclip } from "lucide-react";
import { SiOpenai, SiGooglegemini } from "react-icons/si";
import { useQuery } from "@tanstack/react-query";
import { MicrophoneButton } from "@/components/MicrophoneButton";
import { FileAttachments } from "@/components/FileAttachments";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function sanitizeCoachHTML(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/&lt;b&gt;/g, "<b>")
    .replace(/&lt;\/b&gt;/g, "</b>")
    .replace(/&lt;i&gt;/g, "<i>")
    .replace(/&lt;\/i&gt;/g, "</i>")
    .replace(/&lt;br&gt;/g, "<br>")
    .replace(/&lt;br\/&gt;/g, "<br>")
    .replace(/&lt;br \/&gt;/g, "<br>")
    .replace(/\n/g, "<br>");
}

interface Provider {
  id: string;
  name: string;
  model: string;
}

function ProviderIcon({ provider }: { provider: string }) {
  switch (provider) {
    case "openai":
      return <SiOpenai className="w-3.5 h-3.5" />;
    case "claude":
      return <Sparkles className="w-3.5 h-3.5" />;
    case "gemini":
      return <SiGooglegemini className="w-3.5 h-3.5" />;
    default:
      return <Brain className="w-3.5 h-3.5" />;
  }
}

export function AICoach({ decisionId }: { decisionId: number }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState("openai");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: providers } = useQuery<Provider[]>({
    queryKey: ["/api/coaching/providers"],
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsStreaming(true);

    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const response = await fetch("/api/coaching/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: userMessage,
          decisionId,
          provider: selectedProvider,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to connect to AI coach");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No response stream");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last && last.role === "assistant") {
                    updated[updated.length - 1] = {
                      ...last,
                      content: last.content + data.content,
                    };
                  }
                  return updated;
                });
              }
              if (data.error) {
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: "Sorry, the AI coach is temporarily unavailable. Please try again.",
                  };
                  return updated;
                });
              }
            } catch {
            }
          }
        }
      }
    } catch (error) {
      setMessages((prev) => {
        const updated = [...prev];
        if (updated[updated.length - 1]?.role === "assistant" && !updated[updated.length - 1]?.content) {
          updated[updated.length - 1] = {
            role: "assistant",
            content: "Failed to connect to the AI coach. Please try again.",
          };
        }
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const currentProvider = providers?.find((p) => p.id === selectedProvider);

  return (
    <div className="flex flex-col h-[600px]">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <Brain className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">AI Decision Coach</h3>
            <p className="text-xs text-muted-foreground">Bias detection & decision frameworks</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Model:</span>
          <Select value={selectedProvider} onValueChange={setSelectedProvider} disabled={isStreaming}>
            <SelectTrigger className="w-[180px]" data-testid="select-llm-provider">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {providers?.map((p) => (
                <SelectItem key={p.id} value={p.id} data-testid={`option-provider-${p.id}`}>
                  <div className="flex items-center gap-2">
                    <ProviderIcon provider={p.id} />
                    <span>{p.name}</span>
                    <span className="text-muted-foreground text-[10px]">({p.model})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-center">
              <div className="w-14 h-14 rounded-full bg-primary/5 flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-muted-foreground" />
              </div>
              <h4 className="text-sm font-medium text-foreground mb-2">Ask your AI Coach</h4>
              <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                Get help identifying cognitive biases, run a pre-mortem analysis, or explore decision frameworks for this case.
              </p>
              {currentProvider && (
                <Badge variant="secondary" className="mt-4">
                  <ProviderIcon provider={currentProvider.id} />
                  <span className="ml-1.5">Powered by {currentProvider.name}</span>
                </Badge>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                  {msg.role === "assistant" && (
                    <Avatar className="h-7 w-7 mt-0.5 shrink-0">
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                        <ProviderIcon provider={selectedProvider} />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`rounded-lg px-3.5 py-2.5 text-sm leading-relaxed max-w-[80%] ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground coach-response"
                    }`}
                    data-testid={`chat-message-${msg.role}-${i}`}
                  >
                    {msg.role === "assistant" ? (
                      <>
                        <span dangerouslySetInnerHTML={{ __html: sanitizeCoachHTML(msg.content) }} />
                        {!msg.content && isStreaming && (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                        )}
                      </>
                    ) : (
                      msg.content
                    )}
                  </div>
                  {msg.role === "user" && (
                    <Avatar className="h-7 w-7 mt-0.5 shrink-0">
                      <AvatarFallback className="text-[10px]">You</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="border-t p-3 space-y-2">
          <div className="flex gap-2 items-end">
            <MicrophoneButton
              onTranscript={(text) => setInput((prev) => (prev + text).trimStart())}
              disabled={isStreaming}
              testId="button-microphone-coach"
            />
            <Textarea
              placeholder="Ask about biases, noise, frameworks..."
              className="resize-none min-h-[44px] max-h-[120px] text-sm"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isStreaming}
              data-testid="input-coach-message"
            />
            <Button
              size="icon"
              onClick={sendMessage}
              disabled={!input.trim() || isStreaming}
              data-testid="button-send-coach"
            >
              {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
          <FileAttachments decisionId={decisionId} context="coaching" compact />
        </div>
      </Card>
    </div>
  );
}
