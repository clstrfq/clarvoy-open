import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveContainer, Tooltip, XAxis, YAxis, ScatterChart, Scatter, ZAxis } from "recharts";
import { AlertTriangle, Activity, Database, BarChart3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { AuditLog } from "@shared/schema";

const CATEGORY_LABELS: Record<string, string> = {
  GRANT_ALLOCATION: "Grant Alloc.",
  BUDGET_APPROVAL: "Budget",
  STRATEGIC_PLANNING: "Strategy",
  Strategy: "Strategy",
  Finance: "Finance",
  Hiring: "Hiring",
  Product: "Product",
  Operations: "Operations",
};

function buildHeatmapData(logs: AuditLog[]) {
  const biasLogs = logs.filter(l => l.action === "BIAS_DETECTED" && l.details);
  const severityMap = new Map<string, { total: number; count: number }>();

  for (const log of biasLogs) {
    const details = log.details as any;
    const category = CATEGORY_LABELS[details.category] || details.category || "Other";
    const biasType = details.biasType || "Unknown";
    const key = `${category}|${biasType}`;
    const existing = severityMap.get(key) || { total: 0, count: 0 };
    existing.total += (details.severity || 50);
    existing.count += 1;
    severityMap.set(key, existing);
  }

  return Array.from(severityMap.entries()).map(([key, val]) => {
    const [x, y] = key.split("|");
    return { x, y, z: Math.round(val.total / val.count) };
  });
}

function formatTimeAgo(dateStr: string | Date | null) {
  if (!dateStr) return "unknown";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

const ACTION_LABELS: Record<string, string> = {
  BIAS_DETECTED: "BIAS_ALERT",
  DECISION_CREATED: "DECISION_CREATED",
  JUDGMENT_SUBMITTED: "JUDGMENT_SUBMITTED",
  CONSENSUS_REACHED: "CONSENSUS_REACHED",
};

export default function AdminDashboard() {
  const { data: auditLogs, isLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/admin/audit-logs"],
  });

  const heatmapData = auditLogs ? buildHeatmapData(auditLogs) : [];
  const recentLogs = auditLogs?.slice(0, 15) || [];

  const biasCount = auditLogs?.filter(l => l.action === "BIAS_DETECTED").length || 0;
  const decisionCount = auditLogs?.filter(l => l.action === "DECISION_CREATED").length || 0;
  const judgmentCount = auditLogs?.filter(l => l.action === "JUDGMENT_SUBMITTED").length || 0;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 lg:p-12">
        <header className="mb-10">
          <h1 className="text-3xl font-display font-bold mb-2" data-testid="text-admin-title">System Analytics</h1>
          <p className="text-muted-foreground">Monitor organizational epistemic health and audit trails.</p>
        </header>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold text-amber-400" data-testid="text-bias-count">{biasCount}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Bias Detections</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold text-primary" data-testid="text-decision-count">{decisionCount}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Decisions Tracked</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold text-emerald-400" data-testid="text-judgment-count">{judgmentCount}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Blind Inputs</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-accent" />
                Organizational Bias Heatmap
              </CardTitle>
              <CardDescription>Frequency of detected bias patterns by decision category.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] bg-white/5" />
              ) : heatmapData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                  <div className="text-center">
                    <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>No bias data yet. Load PA use cases to populate.</p>
                  </div>
                </div>
              ) : (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <XAxis type="category" dataKey="x" name="Category" stroke="#52525b" />
                      <YAxis type="category" dataKey="y" name="Bias Type" stroke="#52525b" width={120} />
                      <ZAxis type="number" dataKey="z" range={[50, 400]} name="Severity" />
                      <Tooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a' }}
                        formatter={(value: number, name: string) => [
                          name === "Severity" ? `${value}%` : value,
                          name
                        ]}
                      />
                      <Scatter name="Bias Severity" data={heatmapData} fill="hsl(var(--primary))" shape="circle" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-500" />
                System Audit Log
              </CardTitle>
              <CardDescription>Immutable record of all governance actions.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} className="h-16 bg-white/5" />
                  ))}
                </div>
              ) : recentLogs.length === 0 ? (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                  <p>No audit logs yet.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {recentLogs.map((log) => {
                    const details = log.details as any;
                    const displayAction = ACTION_LABELS[log.action] || log.action;
                    const isBias = log.action === "BIAS_DETECTED";
                    return (
                      <div
                        key={log.id}
                        className="flex items-start gap-3 p-3 rounded-lg hover-elevate border border-transparent"
                        data-testid={`audit-log-${log.id}`}
                      >
                        <div className="mt-1">
                          {isBias ? (
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-white/20 mt-1" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <p className="text-sm font-medium">{displayAction}</p>
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {formatTimeAgo(log.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {isBias
                              ? `${details?.biasType} detected in ${details?.category}`
                              : details?.title || details?.description || `Entity #${log.entityId}`
                            }
                          </p>
                          {isBias && details?.severity && (
                            <Badge
                              variant="outline"
                              className={`text-[9px] mt-1 ${
                                details.severity > 80
                                  ? "border-red-500/30 text-red-400"
                                  : details.severity > 60
                                    ? "border-amber-500/30 text-amber-400"
                                    : "border-yellow-500/30 text-yellow-400"
                              }`}
                            >
                              Severity: {details.severity}%
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
