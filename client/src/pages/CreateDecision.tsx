import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/Sidebar";
import { useCreateDecision } from "@/hooks/use-decisions";
import { insertDecisionSchema } from "@shared/schema";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { MicrophoneButton } from "@/components/MicrophoneButton";

// Extend base schema to ensure types match for the form
const formSchema = insertDecisionSchema.extend({
  title: z.string().min(5, "Title too short"),
  description: z.string().min(10, "Description needed"),
  category: z.string().min(1, "Category required"),
});

export default function CreateDecision() {
  const [, setLocation] = useLocation();
  const { mutate: create, isPending } = useCreateDecision();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      status: "open",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    create(values);
    setLocation("/");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 lg:p-12">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            className="mb-8 pl-0 hover:pl-2 transition-all text-muted-foreground hover:text-foreground"
            onClick={() => setLocation("/")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Button>

          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-white mb-2">Initiate Decision Case</h1>
            <p className="text-muted-foreground">Create a new container for rigorous decision analysis.</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 bg-card border border-white/5 p-8 rounded-xl shadow-2xl">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Case Title</FormLabel>
                      <MicrophoneButton
                        onTranscript={(text) => field.onChange((field.value + text).trimStart())}
                        testId="button-microphone-title"
                      />
                    </div>
                    <FormControl>
                      <Input placeholder="e.g. Q4 Marketing Budget Allocation" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a domain context" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="GRANT_ALLOCATION">Grant Allocation</SelectItem>
                        <SelectItem value="BUDGET_APPROVAL">Budget Approval</SelectItem>
                        <SelectItem value="STRATEGIC_PLANNING">Strategic Planning</SelectItem>
                        <SelectItem value="Strategy">Strategy</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                        <SelectItem value="Hiring">Hiring</SelectItem>
                        <SelectItem value="Operations">Operations</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      This helps the system reference relevant historical bias patterns.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Context & Background</FormLabel>
                      <MicrophoneButton
                        onTranscript={(text) => field.onChange((field.value + text).trimStart())}
                        testId="button-microphone-description"
                      />
                    </div>
                    <FormControl>
                      <Textarea
                        placeholder="Provide the necessary context for the committee..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4 border-t border-white/5 flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => setLocation("/")}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending} className="bg-primary text-primary-foreground min-w-[140px]">
                  {isPending ? "Creating..." : "Initialize Case"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </main>
    </div>
  );
}
