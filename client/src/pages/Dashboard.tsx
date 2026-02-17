import { useDecisions } from "@/hooks/use-decisions";
import { DecisionCard } from "@/components/DecisionCard";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Plus } from "lucide-react";

export default function Dashboard() {
  const { data: decisions, isLoading } = useDecisions();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 lg:p-12">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-display font-bold text-white mb-2">Decision Dashboard</h1>
            <p className="text-muted-foreground">Monitor and participate in active governance cases.</p>
          </div>
          <Link href="/new">
            <Button size="lg" className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25">
              <Plus className="w-4 h-4 mr-2" />
              New Decision Case
            </Button>
          </Link>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-xl border border-white/5 bg-card/50 p-6 space-y-4">
                <Skeleton className="h-4 w-20 bg-white/5" />
                <Skeleton className="h-8 w-3/4 bg-white/5" />
                <Skeleton className="h-20 w-full bg-white/5" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {decisions && decisions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {decisions.map((decision) => (
                  <DecisionCard key={decision.id} decision={decision} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl bg-white/5">
                <p className="text-muted-foreground mb-4">No active decisions found.</p>
                <Link href="/new">
                  <Button variant="outline">Create your first case</Button>
                </Link>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
