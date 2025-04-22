'use client'

import { getAnalysis } from "@/actions/action";
import { useQuery } from "@tanstack/react-query";

interface AnalysisResult {
  id: string;
  repoId: string | null;
  authencityScore: number | null;
  confidenceLevel: string | null;
  reasoning: string | null;
  createdAt: Date;
}

export default function Result({ params }: { params: { id: string } }) {
  const query = useQuery<AnalysisResult[]>({
    queryKey: ['analysis', params.id],
    queryFn: async (): Promise<AnalysisResult[]> => {
      const data = await getAnalysis(params.id);
      if (!data) throw new Error('No analysis results found');
      return data;
    }
  });

  if (query.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <h1 className="text-2xl font-bold leading-loose">Loading Analysis...</h1>
        </div>
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl w-full">
          <h1 className="text-2xl font-bold leading-loose text-red-700">Error: {query.error.message}</h1>
          <p className="text-red-600">Please try refreshing the page or contact support if the issue persists.</p>
        </div>
      </div>
    );
  }

  if (!Array.isArray(query.data) || query.data.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-2xl w-full">
          <h1 className="text-2xl font-bold leading-loose text-yellow-700">No Analysis Results</h1>
          <p className="text-yellow-600">The analysis for this repository has not been completed yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">Analysis Results</h1>
      <div className="w-full max-w-2xl space-y-6">
        {query.data.map((result) => (
          <div
            key={result.id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200"
          >
            <div className="grid gap-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Authenticity Score:</span>
                <span className="font-semibold">{result.authencityScore ?? 'N/A'}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Confidence Level:</span>
                <span className="font-semibold">{result.confidenceLevel ?? 'Unknown'}</span>
              </div>
              <div className="border-t pt-4 mt-2">
                <h3 className="text-gray-600 mb-2">Reasoning:</h3>
                <p className="text-gray-800">{result.reasoning ?? 'No reasoning provided'}</p>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Analyzed on: {new Date(result.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
