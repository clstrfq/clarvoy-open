import { Sidebar } from "@/components/Sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { GrantAlertFeed } from "@/components/GrantAlertFeed";
import { OrgProfileCard } from "@/components/OrgProfileCard";
import { NonprofitLookup } from "@/components/NonprofitLookup";
import { GrantExplorer } from "@/components/GrantExplorer";
import { useMcpStatus } from "@/hooks/use-mcp-status";
import { useAlertCount } from "@/hooks/use-grant-alerts";
import { Bell, Building2, Search, Compass, Wifi, WifiOff } from "lucide-react";

function McpStatusIndicator() {
  const { data: status, isLoading } = useMcpStatus();

  if (isLoading) return null;

  return (
    <div className="flex items-center gap-3 text-xs">
      <div className="flex items-center gap-1">
        {status?.charity.connected ? (
          <Wifi className="w-3 h-3 text-green-400" />
        ) : (
          <WifiOff className="w-3 h-3 text-red-400" />
        )}
        <span className="text-muted-foreground">Charity MCP</span>
      </div>
      <div className="flex items-center gap-1">
        {status?.grants.connected ? (
          <Wifi className="w-3 h-3 text-green-400" />
        ) : (
          <WifiOff className="w-3 h-3 text-red-400" />
        )}
        <span className="text-muted-foreground">Grants MCP</span>
      </div>
    </div>
  );
}

export default function NonprofitExplorer() {
  const alertCount = useAlertCount();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 lg:p-12">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Nonprofit Data</h1>
              <p className="text-muted-foreground mt-1">
                Charity research, grant discovery, and proactive PA alerts
              </p>
            </div>
            <McpStatusIndicator />
          </div>

          <Tabs defaultValue="alerts" className="w-full">
            <TabsList className="bg-white/5 mb-6">
              <TabsTrigger value="alerts" className="gap-2">
                <Bell className="w-4 h-4" />
                Grant Alerts
                {alertCount > 0 && (
                  <Badge variant="destructive" className="text-xs ml-1 h-5 px-1.5">
                    {alertCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="profile" className="gap-2">
                <Building2 className="w-4 h-4" />
                Org Profile
              </TabsTrigger>
              <TabsTrigger value="lookup" className="gap-2">
                <Search className="w-4 h-4" />
                Nonprofit Lookup
              </TabsTrigger>
              <TabsTrigger value="grants" className="gap-2">
                <Compass className="w-4 h-4" />
                Grant Explorer
              </TabsTrigger>
            </TabsList>

            <TabsContent value="alerts">
              <GrantAlertFeed />
            </TabsContent>
            <TabsContent value="profile">
              <OrgProfileCard />
            </TabsContent>
            <TabsContent value="lookup">
              <NonprofitLookup />
            </TabsContent>
            <TabsContent value="grants">
              <GrantExplorer />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
