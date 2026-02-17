import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, DollarSign, Calendar, Building, TrendingUp } from "lucide-react";
import { useGrantDiscovery, useFundingTrends } from "@/hooks/use-grants";
import type { GrantOpportunity } from "@shared/mcp-schemas";

function GrantCard({ grant }: { grant: GrantOpportunity }) {
  return (
    <Card className="bg-white/5 border-white/5 hover:bg-white/10 transition-colors">
      <CardContent className="p-4 space-y-2">
        <h3 className="font-medium text-sm leading-tight">{grant.title}</h3>
        <div className="flex flex-wrap gap-2 text-xs">
          {grant.agency && (
            <Badge variant="outline" className="gap-1">
              <Building className="w-3 h-3" />
              {grant.agency}
            </Badge>
          )}
          {(grant.awardFloor || grant.awardCeiling) && (
            <Badge variant="outline" className="gap-1">
              <DollarSign className="w-3 h-3" />
              {grant.awardFloor ? `$${grant.awardFloor.toLocaleString()}` : "$0"}
              {" - "}
              {grant.awardCeiling ? `$${grant.awardCeiling.toLocaleString()}` : "Open"}
            </Badge>
          )}
          {grant.closeDate && (
            <Badge variant="outline" className="gap-1">
              <Calendar className="w-3 h-3" />
              Closes: {grant.closeDate}
            </Badge>
          )}
          {grant.fundingCategory && (
            <Badge variant="secondary" className="text-xs">
              {grant.fundingCategory}
            </Badge>
          )}
        </div>
        {grant.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {grant.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function GrantExplorer() {
  const [query, setQuery] = useState("disability services Pennsylvania");
  const discovery = useGrantDiscovery();
  const trends = useFundingTrends();

  const handleSearch = () => {
    if (query.length >= 2) {
      discovery.mutate({ query, maxResults: 25, page: 1, grantsPerPage: 25 });
    }
  };

  const handleTrends = () => {
    trends.mutate({ timeWindowDays: 90, includeForecasted: false });
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-3">
        <Input
          placeholder="Search grants (e.g., disability services Pennsylvania)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="bg-white/5 border-white/10 flex-1"
        />
        <Button onClick={handleSearch} disabled={discovery.isPending}>
          <Search className="w-4 h-4 mr-2" />
          Discover
        </Button>
        <Button variant="outline" onClick={handleTrends} disabled={trends.isPending}>
          <TrendingUp className="w-4 h-4 mr-2" />
          Trends
        </Button>
      </div>

      {discovery.isPending && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      )}

      {discovery.data && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {discovery.data.total} opportunities found (page {discovery.data.page})
          </p>
          {discovery.data.opportunities.map((grant, i) => (
            <GrantCard key={grant.externalId || i} grant={grant} />
          ))}
          {discovery.data.opportunities.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No grant opportunities found. Try different search terms.
            </p>
          )}
        </div>
      )}

      {discovery.error && (
        <div className="text-sm text-red-400 bg-red-400/10 rounded-lg p-3">
          {discovery.error.message}
        </div>
      )}

      {trends.data && (
        <Card className="bg-white/5 border-white/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              Funding Trends ({trends.data.summary.timeWindowDays}-day window)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total Opportunities</p>
                <p className="text-lg font-semibold">{trends.data.summary.totalOpportunities}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Funding</p>
                <p className="text-lg font-semibold">
                  ${(trends.data.summary.totalFunding / 1_000_000).toFixed(1)}M
                </p>
              </div>
              {trends.data.summary.topCategory && (
                <div>
                  <p className="text-muted-foreground">Top Category</p>
                  <p className="text-lg font-semibold">{trends.data.summary.topCategory}</p>
                </div>
              )}
            </div>
            <div className="space-y-1">
              {trends.data.trends.map((t) => (
                <div
                  key={t.category}
                  className="flex items-center justify-between text-sm bg-white/5 rounded px-3 py-2"
                >
                  <span>{t.category}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">
                      {t.opportunityCount} opps
                    </span>
                    {t.trend && (
                      <Badge
                        variant={
                          t.trend === "increasing"
                            ? "default"
                            : t.trend === "decreasing"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {t.trend}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
