import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSubmitJudgment } from "@/hooks/use-judgments";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Lock } from "lucide-react";
import { MicrophoneButton } from "@/components/MicrophoneButton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { insertJudgmentSchema } from "@shared/schema";
import { FileAttachments } from "@/components/FileAttachments";

const formSchema = z.object({
  score: z.number().min(1).max(10),
  rationale: z.string().min(20, "Rationale must be at least 20 characters detailed."),
});

export function BlindInputForm({ decisionId }: { decisionId: number }) {
  const { mutate: submit, isPending } = useSubmitJudgment();
  const [score, setScore] = useState(5);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      score: 5,
      rationale: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    submit({ decisionId, data: values });
  }

  return (
    <Card className="border-primary/20 bg-primary/5 overflow-hidden">
      <div className="h-1 w-full bg-gradient-to-r from-primary to-accent" />
      <CardHeader>
        <div className="flex items-center gap-2 text-primary mb-2">
          <Lock className="w-5 h-5" />
          <span className="text-sm font-bold tracking-wider uppercase">Blind Protocol Active</span>
        </div>
        <CardTitle className="font-display text-2xl">Submit Independent Judgment</CardTitle>
        <CardDescription>
          Your input is encrypted and hidden from peers until consensus phase.
          Avoid discussing this case until submission is locked.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="score"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-medium">Quantitative Score (1-10)</FormLabel>
                  <div className="flex items-center gap-6">
                    <FormControl>
                      <Slider
                        min={1}
                        max={10}
                        step={1}
                        value={[field.value]}
                        onValueChange={(vals) => {
                          field.onChange(vals[0]);
                          setScore(vals[0]);
                        }}
                        className="flex-1 py-4"
                      />
                    </FormControl>
                    <div className="w-12 h-12 rounded-full bg-background border-2 border-primary flex items-center justify-center text-xl font-bold text-primary font-display shadow-lg shadow-primary/20">
                      {score}
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rationale"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-lg font-medium">Qualitative Rationale</FormLabel>
                    <MicrophoneButton
                      onTranscript={(text) => field.onChange((field.value + text).trimStart())}
                      testId="button-microphone-rationale"
                    />
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder="Explain your reasoning precisely. Focus on evidence, risks, and strategic alignment..."
                      className="min-h-[150px] bg-background/50 border-white/10 resize-none focus:border-primary/50 transition-all"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel className="text-lg font-medium mb-3 block">Supporting Evidence</FormLabel>
              <FileAttachments decisionId={decisionId} context="judgment" compact />
            </div>

            <Alert className="bg-amber-500/10 border-amber-500/20 text-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                Once submitted, judgment cannot be edited. Ensure your rationale is complete.
              </AlertDescription>
            </Alert>

            <Button
              type="submit"
              size="lg"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xl shadow-primary/20"
              disabled={isPending}
            >
              {isPending ? "Encrypting & Submitting..." : "Seal Judgment"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
