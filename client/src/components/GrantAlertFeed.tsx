import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, CheckCircle2, XCircle, FileCheck2, DollarSign, Calendar, Building } from "lucide-react";
import { useGrantAlerts, useUpdateAlertStatus } from "@/hooks/use-grant-alerts";
import type { GrantAlertStatus } from "@shared/mcp-schemas";

function ScoreBadge({ score }: { score: number }) {
  const variant = score >= 70 ? "default" : "secondary";
  const color = score >= 70 ? "text-green-400" : score >= 40 ? "text-amber-400" : "text-muted-foreground";
  return (
    <Badge variant={variant} className={`${color} font-mono`}>
      {score}
    </Badge>
  );
}

export function GrantAlertFeed() {
  const [statusFilter, setStatusFilter] = useState<GrantAlertStatus | undefined>();
  const { data, isLoading, error } = useGrantAlerts(statusFilter);
  const updateStatus = useUpdateAlertStatus();

  const handleStatusChange = (id: number, status: GrantAlertStatus) => {
    updateStatus.mutate({ id, status });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-semibold">PA Grant Alerts</h2>
          {data && data.newCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {data.newCount} new
            </Badge>
          )}
        </div>
      </div>

      <Tabs
        defaultValue="all"
        onValueChange={(v) =>
          setStatusFilter(v === "all" ? undefined : (v as GrantAlertStatus))
        }
      >
        <TabsList className="bg-white/5">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="new">New</TabsTrigger>
          <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
          <TabsTrigger value="applied">Applied</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4" />
        <TabsContent value="new" className="mt-4" />
        <TabsContent value="reviewed" className="mt-4" />
        <TabsContent value="applied" className="mt-4" />
      </Tabs>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      )}

      {error && (
        <div className="text-sm text-red-400 bg-red-400/10 rounded-lg p-3">
          {error.message}
        </div>
      )}

      {data && data.alerts.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Bell className="w-8 h-8 mx-auto mb-3 opacity-50" />
          <p>No grant alerts yet.</p>
          <p className="text-sm mt-1">
            The scanner runs every 6 hours to find PA-relevant opportunities.
          </p>
        </div>
      )}

      {data && (
        <div className="space-y-3">
          {data.alerts.map((alert) => (
            <Card
              key={alert.id}
              className="bg-white/5 border-white/5 hover:bg-white/10 transition-colors"
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <ScoreBadge score={alert.relevanceScore} />
                      <Badge
                        variant={
                          alert.status === "new"
                            ? "default"
                            : alert.status === "applied"
                              ? "default"
                              : "secondary"
                        }
                        className="text-xs"
                      >
                        {alert.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {alert.relevanceReason}
                    </p>
                  </div>
                </div>

                {alert.matchedKeywords &&
                  Array.isArray(alert.matchedKeywords) &&
                  (alert.matchedKeywords as string[]).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {(alert.matchedKeywords as string[]).slice(0, 6).map((kw) => (
                        <Badge key={kw} variant="outline" className="text-xs">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  )}

                <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                  {alert.status === "new" && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStatusChange(alert.id, "reviewed")}
                        disabled={updateStatus.isPending}
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Review
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStatusChange(alert.id, "dismissed")}
                        disabled={updateStatus.isPending}
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        Dismiss
                      </Button>
                    </>
                  )}
                  {alert.status === "reviewed" && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStatusChange(alert.id, "applied")}
                        disabled={updateStatus.isPending}
                      >
                        <FileCheck2 className="w-3 h-3 mr-1" />
                        Mark Applied
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStatusChange(alert.id, "dismissed")}
                        disabled={updateStatus.isPending}
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        Dismiss
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
