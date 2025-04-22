'use client'

import { fetchRepoAndSave } from "@/actions/action";
import { Button } from "@/components/ui/button";
import { GitHubRepo } from "@/lib/types";
import { useQuery } from "@tanstack/react-query"



export default function Dash() {
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

  if (query.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold leading-loose">Loading Repositories....</h1>
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: {query.error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Your Repositories</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {query.data?.map((repo: GitHubRepo) => (
          <div
            key={repo.id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200"
          >
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                    {repo.name}
                  </a>
                </h2>
                <p className="text-gray-600 mb-4 line-clamp-2">{repo.description || 'No description available'}</p>
                {repo.language && (
                  <span className="inline-block bg-gray-100 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2">
                    {repo.language}
                  </span>
                )}
              </div>
              <Button

                onClick={() => console.log(`Analyzing repo: ${repo.name}`)}
              >
                Analyze
              </Button>
            </div>
            <div className="flex items-center text-sm text-gray-500 mt-4">
              <span className="mr-4">⭐ {repo.stargazers_count}</span>
              <span>🔄 {new Date(repo.updated_at).toLocaleDateString()}</span>
              <span className="ml-4">{repo.private ? '🔒 Private' : '🌐 Public'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
