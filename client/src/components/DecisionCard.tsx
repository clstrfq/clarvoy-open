import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { type Decision } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Clock, Scale } from "lucide-react";

export function DecisionCard({ decision }: { decision: Decision }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-primary/20 text-primary border-primary/20";
      case "closed": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/20";
      case "draft": return "bg-muted text-muted-foreground border-white/10";
      default: return "bg-muted";
    }
  };

  return (
    <div className="group relative bg-card/50 hover:bg-card border border-white/5 hover:border-primary/30 rounded-xl p-5 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1">
      <div className="flex justify-between items-start mb-4">
        <Badge variant="outline" className={`capitalize ${getStatusColor(decision.status)}`}>
          {decision.status}
        </Badge>
        <span className="text-xs text-muted-foreground font-mono">
          #{decision.id.toString().padStart(4, '0')}
        </span>
      </div>

      <Link href={`/decisions/${decision.id}`}>
        <h3 className="font-display text-lg font-semibold leading-tight mb-2 group-hover:text-primary transition-colors cursor-pointer">
          {decision.title}
        </h3>
      </Link>

      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
        {decision.description}
      </p>

      <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-4 border-t border-white/5">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {decision.deadline ? formatDistanceToNow(new Date(decision.deadline), { addSuffix: true }) : "No deadline"}
          </span>
          <span className="flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5" />
            {decision.category}
          </span>
        </div>

        <Link href={`/decisions/${decision.id}`}>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-primary font-medium cursor-pointer">
            View Case <ArrowRight className="w-3 h-3" />
          </div>
        </Link>
      </div>
    </div>
  );
}
