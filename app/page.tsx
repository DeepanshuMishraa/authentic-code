import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-dot-pattern">
      <div className="max-w-3xl mx-auto px-4 py-16 sm:px-6 sm:py-24 lg:px-8 relative">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background/50 backdrop-blur-sm" />
        </div>

        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-foreground">
              Analyze Code Authenticity with Confidence
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Professional code analysis for your GitHub repositories. Get detailed insights, authenticity scores, and comprehensive analysis to ensure code quality.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="w-full sm:w-auto gap-2 group">
                Analyze Repository
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>

          <div className="pt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            {[
              {
                title: "Authenticity Scoring",
                description: "Get precise scores based on comprehensive code analysis",
              },
              {
                title: "Repository Insights",
                description: "Deep analysis of code patterns and quality metrics",
              },
              {
                title: "Secure Analysis",
                description: "Safe and private analysis of your repositories",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="relative p-6 rounded-lg border bg-card text-card-foreground transition-colors"
              >
                <h3 className="font-medium mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
