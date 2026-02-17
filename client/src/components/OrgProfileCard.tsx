import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  MapPin,
  Users,
  DollarSign,
  CheckCircle2,
  ShieldCheck,
  Bell,
} from "lucide-react";
import { useOrgProfile } from "@/hooks/use-org-profile";

export function OrgProfileCard() {
  const { data: profile, isLoading, error } = useOrgProfile();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-400 bg-red-400/10 rounded-lg p-4">
        Failed to load organization profile: {error.message}
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="space-y-4">
      {/* Organization Overview */}
      <Card className="bg-white/5 border-white/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-indigo-400" />
            <div>
              <CardTitle className="text-lg">{profile.name}</CardTitle>
              <p className="text-sm text-muted-foreground font-mono">
                EIN: {profile.ein}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {profile.city && (
              <Badge variant="outline" className="gap-1">
                <MapPin className="w-3 h-3" />
                {profile.city}, {profile.state}
              </Badge>
            )}
            {profile.taxStatus && (
              <Badge variant="outline">{profile.taxStatus}</Badge>
            )}
            {profile.nteeCode && (
              <Badge variant="secondary">NTEE: {profile.nteeCode}</Badge>
            )}
            {profile.isPublicCharity !== null && (
              <Badge variant={profile.isPublicCharity ? "default" : "secondary"}>
                <CheckCircle2 className="w-3 h-3 mr-1" />
                {profile.isPublicCharity ? "Public Charity" : "Private Foundation"}
              </Badge>
            )}
            {profile.isTaxDeductible !== null && (
              <Badge variant={profile.isTaxDeductible ? "default" : "destructive"}>
                <ShieldCheck className="w-3 h-3 mr-1" />
                {profile.isTaxDeductible ? "Tax Deductible" : "Not Deductible"}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {profile.revenue !== null && profile.revenue !== undefined && (
              <div className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center gap-1 text-muted-foreground text-xs mb-1">
                  <DollarSign className="w-3 h-3" />
                  Revenue
                </div>
                <p className="text-lg font-semibold">
                  ${(profile.revenue / 1_000_000).toFixed(1)}M
                </p>
              </div>
            )}
            {profile.expenses !== null && profile.expenses !== undefined && (
              <div className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center gap-1 text-muted-foreground text-xs mb-1">
                  <DollarSign className="w-3 h-3" />
                  Expenses
                </div>
                <p className="text-lg font-semibold">
                  ${(profile.expenses / 1_000_000).toFixed(1)}M
                </p>
              </div>
            )}
            {profile.assets !== null && profile.assets !== undefined && (
              <div className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center gap-1 text-muted-foreground text-xs mb-1">
                  <DollarSign className="w-3 h-3" />
                  Assets
                </div>
                <p className="text-lg font-semibold">
                  ${(profile.assets / 1_000_000).toFixed(1)}M
                </p>
              </div>
            )}
            {profile.employeeCount !== null && profile.employeeCount !== undefined && (
              <div className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center gap-1 text-muted-foreground text-xs mb-1">
                  <Users className="w-3 h-3" />
                  Employees
                </div>
                <p className="text-lg font-semibold">{profile.employeeCount}</p>
              </div>
            )}
          </div>

          {profile.alertCount > 0 && (
            <div className="flex items-center gap-2 bg-indigo-500/10 rounded-lg p-3">
              <Bell className="w-4 h-4 text-indigo-400" />
              <span className="text-sm">
                <b>{profile.alertCount}</b> new grant alerts matching your mission
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grant History */}
      {profile.grantHistory.length > 0 && (
        <Card className="bg-white/5 border-white/5">
          <CardHeader>
            <CardTitle className="text-base">Historical Grant Funding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {profile.grantHistory.map((g) => (
                <div
                  key={g.id || `${g.funderName}-${g.year}`}
                  className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-sm">{g.funderName}</p>
                    <p className="text-xs text-muted-foreground">{g.year}</p>
                  </div>
                  <span className="font-mono text-sm font-semibold text-green-400">
                    ${g.amount.toLocaleString()}
                  </span>
                </div>
              ))}
              <div className="flex justify-between text-sm pt-2 border-t border-white/10">
                <span className="text-muted-foreground">Total Known Grants</span>
                <span className="font-mono font-semibold">
                  $
                  {profile.grantHistory
                    .reduce((sum, g) => sum + g.amount, 0)
                    .toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
