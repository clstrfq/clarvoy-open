import { useParams, Link } from "wouter";
import { useDecision, useUpdateDecision } from "@/hooks/use-decisions";
import { useJudgments } from "@/hooks/use-judgments";
import { useComments, useCreateComment } from "@/hooks/use-comments";
import { Sidebar } from "@/components/Sidebar";
import { BlindInputForm } from "@/components/BlindInputForm";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { ArrowLeft, Brain, CheckCircle2, Lock, MessageSquare, Paperclip, Unlock } from "lucide-react";
import { MicrophoneButton } from "@/components/MicrophoneButton";
import { useAuth } from "@/hooks/use-auth";
import { AICoach } from "@/components/AICoach";
import { FileAttachments } from "@/components/FileAttachments";

export default function DecisionDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0");
  const { user } = useAuth();

  const { data: decision, isLoading: decisionLoading } = useDecision(id);
  const { data: judgments, isLoading: judgmentsLoading } = useJudgments(id);
  const { data: comments, isLoading: commentsLoading } = useComments(id);

  const { mutate: updateDecision } = useUpdateDecision();
  const { mutate: createComment } = useCreateComment();

  const [commentText, setCommentText] = useState("");

  const hasUserVoted = judgments?.some(j => j.userId === user?.id);
  const isClosed = decision?.status === "closed";
  const isOpen = decision?.status === "open";

  const handlePostComment = () => {
    if (!commentText.trim()) return;
    createComment({ decisionId: id, content: commentText });
    setCommentText("");
  };

  const closeDecision = () => {
    if (confirm("Are you sure? This will reveal all blind judgments to the group.")) {
      updateDecision({ id, updates: { status: "closed" } });
    }
  };

  if (decisionLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 ml-64 p-12">
           <Skeleton className="h-12 w-1/3 mb-6 bg-white/5" />
           <Skeleton className="h-64 w-full bg-white/5" />
        </main>
      </div>
    );
  }

  if (!decision) return <div>Not found</div>;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 lg:p-12 max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
           <Link href="/">
             <Button variant="ghost" className="pl-0 text-muted-foreground hover:text-foreground mb-4">
               <ArrowLeft className="w-4 h-4 mr-2" /> Back
             </Button>
           </Link>
           <div className="flex items-start justify-between">
             <div>
               <div className="flex items-center gap-3 mb-2">
                 <Badge variant="outline" className="uppercase tracking-widest text-[10px]">
                   {decision.category}
                 </Badge>
                 <span className="text-xs text-muted-foreground font-mono">#{decision.id}</span>
               </div>
               <h1 className="text-3xl font-display font-bold text-white mb-2">{decision.title}</h1>
               <div className="flex items-center gap-2 text-sm text-muted-foreground">
                 <span>Author: {decision.authorId || "Unknown"}</span>
               </div>
             </div>

             {isOpen && (
               <Button onClick={closeDecision} variant="outline" className="border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10">
                 <CheckCircle2 className="w-4 h-4 mr-2" />
                 Finalize & Reveal
               </Button>
             )}

             {isClosed && (
                <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-emerald-400 font-medium">
                  <Unlock className="w-4 h-4" /> Decision Closed
                </div>
             )}
           </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="bg-white/5 border border-white/5 p-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="judgments">Judgments & Consensus</TabsTrigger>
            <TabsTrigger value="discussion">Debate ({comments?.length || 0})</TabsTrigger>
            <TabsTrigger value="coach" data-testid="tab-ai-coach"><Brain className="w-3.5 h-3.5 mr-1.5" /> AI Coach</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            <div className="grid grid-cols-3 gap-8">
              <div className="col-span-2 space-y-8">
                <div className="bg-card border border-white/5 rounded-xl p-8 shadow-lg">
                  <h3 className="text-lg font-semibold mb-4 text-white">Context</h3>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {decision.description}
                  </p>
                </div>

                {/* ACTION AREA */}
                {isOpen && !hasUserVoted && (
                  <BlindInputForm decisionId={id} />
                )}

                {isOpen && hasUserVoted && (
                  <div className="bg-secondary/30 border border-dashed border-white/10 rounded-xl p-8 text-center">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                       <Lock className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">Judgment Sealed</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      You have submitted your input. Group results will remain hidden until all committee members have voted or the decision is finalized.
                    </p>
                  </div>
                )}
              </div>

              <div className="col-span-1 space-y-6">
                <Card className="p-6">
                  <FileAttachments decisionId={id} context="decision" />
                </Card>
                <div className="bg-card border border-white/5 rounded-xl p-6">
                   <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Timeline</h4>
                   <div className="space-y-4">
                      <div className="flex gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                        <div>
                          <p className="text-sm font-medium text-white">Created</p>
                          <p className="text-xs text-muted-foreground">{new Date(decision.createdAt!).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${hasUserVoted ? 'bg-emerald-500' : 'bg-white/10'}`} />
                        <div>
                          <p className="text-sm font-medium text-white">Your Input</p>
                          <p className="text-xs text-muted-foreground">{hasUserVoted ? "Submitted" : "Pending"}</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${isClosed ? 'bg-white' : 'bg-white/10'}`} />
                        <div>
                          <p className="text-sm font-medium text-white">Consensus</p>
                          <p className="text-xs text-muted-foreground">{isClosed ? "Reached" : "In Progress"}</p>
                        </div>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="judgments">
            {isClosed ? (
              <div className="grid gap-6">
                <div className="bg-gradient-to-br from-card to-card/50 border border-white/5 rounded-xl p-6">
                   <h3 className="text-xl font-display font-bold mb-6">Group Consensus</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {judgments?.map((j) => (
                        <div key={j.id} className="bg-background/40 border border-white/5 rounded-lg p-5">
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-xs font-mono text-muted-foreground">User {j.userId.slice(0,4)}...</span>
                            <Badge className="bg-primary text-white text-lg font-bold w-10 h-10 rounded-full flex items-center justify-center p-0">
                              {j.score}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground italic">"{j.rationale}"</p>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-xl bg-white/5">
                <Lock className="w-8 h-8 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-medium">Results Hidden</h3>
                <p className="text-muted-foreground">Judgments are blind until the decision phase is closed.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="coach">
            <AICoach decisionId={id} />
          </TabsContent>

          <TabsContent value="discussion">
            <div className="grid grid-cols-3 gap-8">
              <div className="col-span-2 space-y-6">
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-6">
                    {comments?.map((comment) => (
                      <div key={comment.id} className="flex gap-4">
                        <Avatar className="h-8 w-8 mt-1">
                          <AvatarFallback className="text-xs">{comment.userId[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="bg-white/5 rounded-lg p-4 text-sm leading-relaxed">
                            {comment.content}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground ml-1">
                             User {comment.userId.slice(0,6)} • {new Date(comment.createdAt!).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                    {comments?.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">No comments yet. Start the debate.</div>
                    )}
                  </div>
                </ScrollArea>

                <div className="flex gap-4 items-start bg-card border border-white/5 p-4 rounded-xl">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>Me</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-3">
                    <Textarea
                      placeholder="Add a perspective..."
                      className="min-h-[80px] bg-transparent border-none focus-visible:ring-0 resize-none placeholder:text-muted-foreground/50"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                    />
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <MicrophoneButton
                          onTranscript={(text) => setCommentText((prev) => (prev + text).trimStart())}
                          testId="button-microphone-comment"
                        />
                        <FileAttachments decisionId={id} context="comment" compact />
                      </div>
                      <Button size="sm" onClick={handlePostComment} disabled={!commentText.trim()}>
                        <MessageSquare className="w-3 h-3 mr-2" /> Post
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

      </main>
    </div>
  );
}
