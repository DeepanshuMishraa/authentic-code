'use client'

import { ChunkTheRepositories, fetchRepoAndSave } from "@/actions/action";
import { Button } from "@/components/ui/button";
import { GitHubRepo } from "@/lib/types";
import { useMutation, useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function Dash() {
  const [analyzingId, setAnalyzingId] = useState<number | null>(null);
  const router = useRouter();

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
      <div className="flex items-center justify-center min-h-[80vh]">
          <h1 className="text-xl font-medium bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Loading your repositories...
          </h1>
        </div>
    );
  }

  if (query.isError) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="max-w-md p-8 bg-white border border-red-100 rounded-2xl shadow-lg">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-red-600 font-medium">{query.error.message}</p>
            <Button
              onClick={() => query.refetch()}
              variant="outline"
              className="mt-4 text-sm"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center space-y-4 mb-16">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
            Your Repositories
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Select a repository to analyze and explore its contents
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {query.data?.map((repo: GitHubRepo) => (
            <div
              key={repo.id}
              className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 hover:border-blue-100 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-lg font-semibold">
                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-900 hover:text-blue-600 transition-colors duration-200 flex items-center gap-2"
                    >
                      {repo.name}
                      <svg className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </h2>
                  <Button
                    onClick={() => {
                      setAnalyzingId(repo.id);
                      mutation.mutate(repo.html_url);
                    }}
                    disabled={analyzingId !== null && analyzingId !== repo.id}
                    className="relative overflow-hidden group/btn"
                    variant="default"
                    size="sm"
                  >
                    <span className={`inline-flex items-center gap-2 transition-all duration-200 ${analyzingId === repo.id ? 'opacity-100' : 'group-hover/btn:-translate-y-full opacity-0'}`}>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Analyzing
                    </span>
                    <span className={`absolute inset-0 inline-flex items-center justify-center gap-2 transition-all duration-200 ${analyzingId === repo.id ? 'translate-y-full opacity-0' : 'group-hover/btn:-translate-y-full opacity-0'}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                      Analyze
                    </span>
                    <span className={`absolute inset-0 inline-flex items-center justify-center transition-all duration-200 ${analyzingId === repo.id ? 'translate-y-full opacity-0' : 'group-hover/btn:translate-y-0 opacity-100'}`}>
                      Analyze
                    </span>
                  </Button>
                </div>

                <p className="text-sm text-gray-500 mb-6 line-clamp-2 flex-grow">
                  {repo.description || 'No description available'}
                </p>

                <div className="space-y-4">
                  {repo.language && (
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-blue-400 to-blue-600"></span>
                      <span className="text-sm font-medium text-gray-600">{repo.language}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5 group/stars">
                      <svg className="w-4 h-4 transition-transform duration-200 group-hover/stars:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      <span className="font-medium">{repo.stargazers_count}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <time className="font-medium" dateTime={repo.updated_at}>
                        {new Date(repo.updated_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </time>
                    </span>
                    <span className="flex items-center gap-1.5">
                      {repo.private ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                      )}
                      <span className="font-medium">{repo.private ? 'Private' : 'Public'}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
