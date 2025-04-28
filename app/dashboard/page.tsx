'use client'

import { ChunkTheRepositories, fetchRepoAndSave } from "@/actions/action";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth.client";
import { GitHubRepo } from "@/lib/types";
import { useMutation, useQuery } from "@tanstack/react-query"
import { Metadata } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const metadata: Metadata = {
  title: "Repositories",
  description: "Your repositories",
}

export default function Dash() {
  const [analyzingId, setAnalyzingId] = useState<number | null>(null);
  const router = useRouter();
  const session = authClient.useSession();

  useEffect(() => {
    if (!session.data?.user) {
      router.push('/');
    }
  }, [])

  const query = useQuery<GitHubRepo[]>({
    queryKey: ['repos'],
    queryFn: async () => {
      const data = await fetchRepoAndSave();
      if (Array.isArray(data)) {
        return data;
      } else {
        throw new Error("Unexpected response");
      }
    }
  });

  const mutation = useMutation({
    mutationFn: async (repoUrl: string) => {
      const chunk = await ChunkTheRepositories({ repoUrl });
      if (!chunk.success) {
        throw new Error(chunk.message);
      }
      return chunk.repoId as string;
    },
    onSuccess: (repoId) => {
      console.log("Analysis completed");
      setAnalyzingId(null);
      toast.success("Analysis completed successfully");
      router.push(`/dashboard/${repoId}`);
    },
    onError: (error) => {
      console.error("Analysis error:", error);
      setAnalyzingId(null);
      toast.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  if (query.isLoading) {
    return (
      <div className="min-h-[90vh] flex flex-col items-center justify-center p-4">
        <div className="relative w-16 h-16 mb-6">
          <div className="absolute inset-0 border-t-2 border-primary rounded-full animate-spin"></div>
          <div className="absolute inset-3 border-t-2 border-primary/30 rounded-full animate-ping opacity-20"></div>
        </div>
        <h1 className="text-xl font-semibold text-foreground/80">
          Fetching repositories
        </h1>
        <p className="text-sm text-muted-foreground mt-2">Please wait a moment...</p>
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="min-h-[90vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card rounded-lg shadow-sm border p-6 space-y-4">
          <div className="w-12 h-12 mx-auto relative">
            <div className="absolute inset-0 bg-destructive/10 rounded-full animate-pulse"></div>
            <svg className="absolute inset-0 w-12 h-12 text-destructive p-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-medium text-foreground">Unable to Load Repositories</h3>
            <p className="text-sm text-muted-foreground mb-4">{query.error.message}</p>
            <Button
              onClick={() => query.refetch()}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center space-y-3 mb-10">
          <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
            Your Repositories
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Select a repository to analyze its content and explore insights
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {query.data?.map((repo: GitHubRepo) => (
            <div
              key={repo.id}
              className="group relative bg-white rounded-lg border border-black/[0.08] shadow-[0_1px_3px_0_rgba(0,0,0,0.08)] hover:shadow-[0_4px_20px_0_rgba(0,0,0,0.12)] transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute inset-0 bg-gradient-to-br from-white via-white/40 to-white/0 mix-blend-overlay pointer-events-none" />

              <div className="p-5 flex flex-col h-full relative">
                <header className="mb-4">
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <h2 className="text-base font-medium text-foreground group-hover:text-primary/90 transition-colors duration-200">
                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 hover:underline decoration-primary/30 underline-offset-4"
                      >
                        {repo.name}
                        <svg className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </h2>
                    <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${repo.private
                        ? 'bg-muted/40 text-foreground/60'
                        : 'bg-primary/[0.08] text-primary/90'
                      } backdrop-blur-sm`}>
                      {repo.private ? 'Private' : 'Public'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground/90 line-clamp-2 min-h-[2.5rem]">
                    {repo.description || 'No description available'}
                  </p>
                </header>

                <div className="mt-auto space-y-4">
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    {repo.language && (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-primary/70 ring-[1.5px] ring-primary/20 shadow-sm"></span>
                        <span className="font-medium text-foreground/80">{repo.language}</span>
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground/80">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                      </svg>
                      {repo.stargazers_count}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground/80">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <time dateTime={repo.updated_at} className="tabular-nums font-medium">
                        {new Date(repo.updated_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </time>
                    </span>
                  </div>

                  <Button
                    onClick={() => {
                      setAnalyzingId(repo.id);
                      mutation.mutate(repo.html_url);
                    }}
                    disabled={analyzingId !== null && analyzingId !== repo.id}
                    variant="outline"
                    size="sm"
                    className="w-full relative overflow-hidden group/btn bg-white hover:bg-primary/[0.04] border-black/[0.12] text-foreground/90 hover:text-primary/90 hover:border-primary/20"
                  >
                    <span className={`absolute inset-0 flex items-center justify-center transition-all duration-200 ${analyzingId === repo.id ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                      }`}>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span className="ml-2 font-medium">Analyzing...</span>
                    </span>
                    <span className={`flex items-center justify-center gap-2 transition-all duration-200 ${analyzingId === repo.id ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'
                      }`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                      </svg>
                      <span className="font-medium">Analyze Repository</span>
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
