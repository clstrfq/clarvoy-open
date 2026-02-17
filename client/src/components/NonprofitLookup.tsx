import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, CheckCircle2, XCircle, Search, ShieldCheck } from "lucide-react";
import { useCharityLookup, useCharitySearch, useCharityVerify } from "@/hooks/use-charity";

export function NonprofitLookup() {
  const [einInput, setEinInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchState, setSearchState] = useState("");
  const [activeEin, setActiveEin] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  const lookup = useCharityLookup(activeEin);
  const verify = useCharityVerify(activeEin);
  const search = useCharitySearch({ query: activeSearch, state: searchState || undefined });

  return (
    <div className="space-y-6">
      <Tabs defaultValue="ein" className="w-full">
        <TabsList className="bg-white/5">
          <TabsTrigger value="ein">EIN Lookup</TabsTrigger>
          <TabsTrigger value="search">Name Search</TabsTrigger>
        </TabsList>

        <TabsContent value="ein" className="space-y-4">
          <div className="flex gap-3">
            <Input
              placeholder="Enter EIN (e.g., 81-1874043)"
              value={einInput}
              onChange={(e) => setEinInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setActiveEin(einInput)}
              className="bg-white/5 border-white/10"
            />
            <Button onClick={() => setActiveEin(einInput)} disabled={lookup.isLoading}>
              <Search className="w-4 h-4 mr-2" />
              Lookup
            </Button>
          </div>

          {lookup.isLoading && (
            <Card className="bg-white/5 border-white/5">
              <CardContent className="p-6 space-y-3">
                <Skeleton className="h-6 w-64" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          )}

          {lookup.data && (
            <Card className="bg-white/5 border-white/5">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-indigo-400" />
                  <CardTitle className="text-lg">{lookup.data.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">EIN:</span>{" "}
                    <span className="font-mono">{lookup.data.ein}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Location:</span>{" "}
                    {lookup.data.city}, {lookup.data.state}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tax Status:</span>{" "}
                    {lookup.data.taxStatus || "N/A"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">NTEE Code:</span>{" "}
                    {lookup.data.nteeCode || "N/A"}
                  </div>
                  {lookup.data.deductibility && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Deductibility:</span>{" "}
                      {lookup.data.deductibility}
                    </div>
                  )}
                </div>

                {verify.data && (
                  <div className="flex gap-3 pt-2 border-t border-white/5">
                    <Badge variant={verify.data.isPublicCharity ? "default" : "secondary"}>
                      {verify.data.isPublicCharity ? (
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                      ) : (
                        <XCircle className="w-3 h-3 mr-1" />
                      )}
                      {verify.data.isPublicCharity ? "Public Charity" : "Not Public Charity"}
                    </Badge>
                    <Badge variant={verify.data.isTaxDeductible ? "default" : "destructive"}>
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      {verify.data.isTaxDeductible ? "Tax Deductible" : "Not Tax Deductible"}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {lookup.error && (
            <div className="text-sm text-red-400 bg-red-400/10 rounded-lg p-3">
              {lookup.error.message}
            </div>
          )}
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <div className="flex gap-3">
            <Input
              placeholder="Search by organization name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setActiveSearch(searchQuery)}
              className="bg-white/5 border-white/10 flex-1"
            />
            <Input
              placeholder="State (PA)"
              value={searchState}
              onChange={(e) => setSearchState(e.target.value.toUpperCase().slice(0, 2))}
              className="bg-white/5 border-white/10 w-20"
            />
            <Button onClick={() => setActiveSearch(searchQuery)} disabled={search.isLoading}>
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>

          {search.isLoading && (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          )}

          {search.data && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {search.data.total} results found
                {search.data.hasMore && " (showing first page)"}
              </p>
              {search.data.results.map((org) => (
                <Card
                  key={org.ein}
                  className="bg-white/5 border-white/5 cursor-pointer hover:bg-white/10 transition-colors"
                  onClick={() => {
                    setEinInput(org.ein);
                    setActiveEin(org.ein);
                  }}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{org.name}</p>
                      <p className="text-sm text-muted-foreground">
                        EIN: {org.ein}
                        {org.city && ` | ${org.city}, ${org.state}`}
                        {org.nteeCode && ` | NTEE: ${org.nteeCode}`}
                      </p>
                    </div>
                    <Search className="w-4 h-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {search.error && (
            <div className="text-sm text-red-400 bg-red-400/10 rounded-lg p-3">
              {search.error.message}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
