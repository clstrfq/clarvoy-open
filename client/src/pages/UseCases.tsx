import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen, ShieldAlert, Scale, Eye, ArrowLeft, ArrowRight,
  AlertTriangle, BarChart3, Users, DollarSign, Building2, Bus,
  Heart, Briefcase, ChevronRight, Loader2, Database
} from "lucide-react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Decision, ReferenceClass } from "@shared/schema";

const CATEGORY_ICONS: Record<string, any> = {
  GRANT_ALLOCATION: Users,
  BUDGET_APPROVAL: DollarSign,
  STRATEGIC_PLANNING: Scale,
};

const CATEGORY_LABELS: Record<string, string> = {
  GRANT_ALLOCATION: "Grant Allocation",
  BUDGET_APPROVAL: "Budget Approval",
  STRATEGIC_PLANNING: "Strategic Planning",
};

const USE_CASE_ICONS = [Users, DollarSign, Heart, Briefcase, ShieldAlert, Scale, Building2, Bus];

const BIAS_EXPLANATIONS: Record<string, string> = {
  "Recency Bias": "Over-weighting recent events or information while neglecting older but equally relevant data",
  "Halo Effect": "Letting one positive attribute of a candidate or option influence judgment across all attributes",
  "Anchoring": "Fixating on the first piece of information encountered, which disproportionately influences subsequent judgments",
  "Status Quo Bias": "Preferring the current state of affairs over change, even when change would be beneficial",
  "Loss Aversion": "Weighing potential losses more heavily than equivalent gains, leading to overly conservative decisions",
  "Optimism Bias": "Overestimating the likelihood of positive outcomes and underestimating risks and costs",
  "Availability Bias": "Over-weighting information that comes readily to mind rather than seeking representative data",
  "Sunk Cost Fallacy": "Continuing to invest in a failing course of action because of previously invested resources",
  "Confirmation Bias": "Seeking and interpreting information in ways that confirm pre-existing beliefs",
  "Groupthink": "Group members converging on a consensus position without critically evaluating alternatives",
  "Concrete vs. Abstract Bias": "Preferring tangible, visible options over abstract but potentially more impactful alternatives",
  "Endowment Effect": "Over-valuing what you already own or control compared to equivalent alternatives",
  "Sunk Cost (Prospective)": "Committing to an option based on the fear of losing a current opportunity",
  "Risk Aversion as Disguised Paternalism": "Framing restrictive choices as 'safety' when they may reflect organizational liability concerns rather than individual welfare",
};

function UseCaseCard({ decision, index, onClick }: { decision: Decision; index: number; onClick: () => void }) {
  const Icon = USE_CASE_ICONS[index % USE_CASE_ICONS.length];
  const catLabel = CATEGORY_LABELS[decision.category] || decision.category;
  const biases = extractBiases(decision.description);

  return (
    <Card
      className="hover-elevate cursor-pointer transition-all group"
      onClick={onClick}
      data-testid={`card-use-case-${decision.id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center border border-primary/20 shrink-0">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="outline" className="text-[10px] shrink-0">{catLabel}</Badge>
              <Badge
                variant={decision.status === "closed" ? "secondary" : "default"}
                className="text-[10px] shrink-0"
              >
                {decision.status === "closed" ? "Resolved" : "Active"}
              </Badge>
            </div>
            <CardTitle className="text-sm font-semibold leading-snug">{decision.title}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
          {decision.description.split("\n")[0]}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex gap-1 flex-wrap">
            {biases.slice(0, 2).map(b => (
              <Badge key={b} variant="outline" className="text-[9px] border-amber-500/30 text-amber-400">
                <AlertTriangle className="w-2.5 h-2.5 mr-1" />
                {b}
              </Badge>
            ))}
            {biases.length > 2 && (
              <Badge variant="outline" className="text-[9px]">+{biases.length - 2}</Badge>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
      </CardContent>
    </Card>
  );
}

function UseCaseWalkthrough({ decision, referenceClasses, onBack }: {
  decision: Decision;
  referenceClasses: ReferenceClass[];
  onBack: () => void;
}) {
  const { data: judgments } = useQuery<any[]>({
    queryKey: ["/api/decisions", decision.id, "judgments"],
    queryFn: async () => {
      const res = await fetch(`/api/decisions/${decision.id}/judgments`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });
  const matchingRC = referenceClasses.find(rc => rc.category === decision.category);
  const biases = extractBiases(decision.description);
  const scores = judgments?.map(j => j.score) || [];
  const mean = scores.length > 0 ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : 0;
  const stdDev = scores.length > 1
    ? Math.sqrt(scores.reduce((a: number, b: number) => a + Math.pow(b - mean, 2), 0) / (scores.length - 1))
    : 0;
  const isHighNoise = stdDev > 1.5;
  const descParts = decision.description.split("\n\n");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} data-testid="button-walkthrough-back">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Use Cases
        </Button>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Badge variant="outline">{CATEGORY_LABELS[decision.category] || decision.category}</Badge>
          <Badge variant={decision.status === "closed" ? "secondary" : "default"}>
            {decision.status === "closed" ? "Resolved" : "Active Demo"}
          </Badge>
          <Badge variant="outline" className="border-primary/30 text-primary">Tutorial</Badge>
        </div>
        <h2 className="text-2xl font-display font-bold mb-2">{decision.title}</h2>
        <p className="text-muted-foreground">{descParts[0]}</p>
        {descParts.length > 1 && (
          <p className="text-sm text-muted-foreground mt-2 p-3 rounded-lg bg-muted/30 border border-white/5">
            {descParts.slice(1).join(" ")}
          </p>
        )}
      </div>

      <Separator className="bg-white/5" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Bias Detections (Shadow Layer)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {biases.map(bias => (
                <div key={bias} className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                  <p className="text-sm font-medium text-amber-400 mb-1">{bias}</p>
                  <p className="text-xs text-muted-foreground">
                    {BIAS_EXPLANATIONS[bias] || "Cognitive bias detected in decision-making process"}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-400" />
              Blind Input Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            {judgments && judgments.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-lg font-bold">{judgments.length}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Inputs</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-lg font-bold">{mean.toFixed(1)}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Mean</p>
                  </div>
                  <div className={`p-3 rounded-lg ${isHighNoise ? "bg-red-500/10 border border-red-500/20" : "bg-muted/30"}`}>
                    <p className={`text-lg font-bold ${isHighNoise ? "text-red-400" : ""}`}>{stdDev.toFixed(2)}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Std Dev</p>
                  </div>
                </div>
                {isHighNoise && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-xs text-red-400 font-medium">High Noise Detected - Significant disagreement among reviewers. Further deliberation recommended before consensus.</p>
                  </div>
                )}
                <div className="space-y-3">
                  {judgments.map((j: any, i: number) => (
                    <div key={j.id} className="p-3 rounded-lg bg-muted/20 border border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground font-mono">Reviewer {i + 1}</span>
                        <Badge variant="outline">{j.score}/10</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{j.rationale}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Skeleton className="h-32 bg-white/5" />
            )}
          </CardContent>
        </Card>
      </div>

      {matchingRC && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              Reference Class Data (Outside View)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3">
              <p className="text-sm font-medium">{matchingRC.name}</p>
              <p className="text-xs text-muted-foreground">Source: {matchingRC.source}</p>
              {matchingRC.description && (
                <p className="text-xs text-muted-foreground mt-1">{matchingRC.description}</p>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(matchingRC.metrics as Record<string, number>).map(([key, value]) => (
                <div key={key} className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-center">
                  <p className="text-sm font-bold text-emerald-400">
                    {typeof value === "number"
                      ? value < 1 && value > 0
                        ? `${(value * 100).toFixed(0)}%`
                        : value >= 1000
                          ? value.toLocaleString()
                          : value.toFixed(value % 1 === 0 ? 0 : 1)
                      : value}
                  </p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-1">
                    {key.replace(/_/g, " ").replace(/^(avg|pct|n)/, (m) => m === "n" ? "Sample Size" : m === "avg" ? "Avg" : "%")}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {decision.outcome && (
        <Card className="border-emerald-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <ArrowRight className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-400">Decision Outcome</p>
                <p className="text-sm text-muted-foreground">{decision.outcome}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Ready to run your own decision?</p>
                <p className="text-xs text-muted-foreground">Apply these frameworks to your organization's real decisions.</p>
              </div>
            </div>
            <Link href="/new">
              <Button data-testid="button-start-decision">
                Start Here <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function extractBiases(description: string): string[] {
  const knownBiases = Object.keys(BIAS_EXPLANATIONS);
  return knownBiases.filter(b => description.toLowerCase().includes(b.toLowerCase().split(" ")[0]));
}

export default function UseCases() {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: allDecisions, isLoading: decisionsLoading } = useQuery<Decision[]>({
    queryKey: ["/api/decisions"],
  });

  const { data: referenceClasses, isLoading: rcLoading } = useQuery<ReferenceClass[]>({
    queryKey: ["/api/reference-classes"],
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/seed-demo-data");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/decisions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reference-classes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/audit-logs"] });
    },
  });

  const demoDecisions = allDecisions?.filter(d => d.isDemo) || [];
  const selected = demoDecisions.find(d => d.id === selectedId);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 lg:p-12">
        {selected && referenceClasses ? (
          <UseCaseWalkthrough
            decision={selected}
            referenceClasses={referenceClasses}
            onBack={() => setSelectedId(null)}
          />
        ) : (
          <>
            <header className="mb-10">
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="w-6 h-6 text-primary" />
                <h1 className="text-3xl font-display font-bold" data-testid="text-use-cases-title">PA Use Case Scenarios</h1>
              </div>
              <p className="text-muted-foreground max-w-2xl">
                Explore real-world decision scenarios for Pennsylvania non-profit organizations serving adults with intellectual disabilities and autism. Each use case demonstrates Clarvoy's decision hygiene framework in action.
              </p>
            </header>

            {decisionsLoading || rcLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="p-6">
                    <Skeleton className="h-4 w-20 bg-white/5 mb-3" />
                    <Skeleton className="h-6 w-3/4 bg-white/5 mb-2" />
                    <Skeleton className="h-12 w-full bg-white/5" />
                  </Card>
                ))}
              </div>
            ) : demoDecisions.length === 0 ? (
              <Card className="max-w-lg mx-auto mt-12">
                <CardContent className="pt-6 text-center space-y-4">
                  <Database className="w-12 h-12 text-muted-foreground mx-auto" />
                  <div>
                    <p className="text-lg font-medium mb-1">No Demo Data Yet</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Load 8 PA-specific use case scenarios with reference class data, blind inputs, and bias detection examples.
                    </p>
                  </div>
                  <Button
                    onClick={() => seedMutation.mutate()}
                    disabled={seedMutation.isPending}
                    data-testid="button-seed-demo-data"
                  >
                    {seedMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Seeding Data...
                      </>
                    ) : (
                      <>
                        <Database className="w-4 h-4 mr-2" />
                        Load PA Use Case Data
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {demoDecisions.map((decision, index) => (
                  <UseCaseCard
                    key={decision.id}
                    decision={decision}
                    index={index}
                    onClick={() => setSelectedId(decision.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
