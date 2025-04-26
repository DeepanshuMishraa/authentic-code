'use client'

import { getAnalysis, getUniqueCard } from "@/actions/action";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { use } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface AnalysisResult {
  id: string;
  repoId: string | null;
  authencityScore: number | null;
  confidenceLevel: string | null;
  reasoning: string | null;
  createdAt: Date;
}

export default function Result({ params }: { params: { id: string } }) {
  const { id } = use(params);
  const router = useRouter();

  const query = useQuery<AnalysisResult[]>({
    queryKey: ['analysis', id],
    queryFn: async (): Promise<AnalysisResult[]> => {
      const data = await getAnalysis(id);
      if (!data) throw new Error('No analysis results found');
      return data;
    }
  });

  const cardMutation = useMutation({
    mutationFn: getUniqueCard,
    onSuccess: (data) => {
      toast.success("Card generated successfully!");
    },
    onError: (error) => {
      toast.error(`Failed to generate card: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    <div className="p-8">
      <div className="mb-6">
        <Button
          variant="secondary"
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to repositories
        </Button>
      </div>

      <div className="flex flex-col items-center justify-center">
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
                <div className="border-t pt-4 mt-4">
                  <Button
                    onClick={() => cardMutation.mutate()}
                    disabled={cardMutation.isPending}
                    className="w-full justify-center"
                    variant="outline"
                  >
                    {cardMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-t-2 border-b-2 border-current rounded-full animate-spin"></div>
                        Generating your card...
                      </div>
                    ) : (
                      'Get Your Unique Card'
                    )}
                  </Button>
                </div>

                {cardMutation.isSuccess && cardMutation.data && (
                  <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">Your Unique Character Card</h3>
                    <div className="space-y-2">
                      <div className="flex flex-col gap-1">
                        <h4 className="text-base font-semibold text-blue-800">
                          {cardMutation.data.card.characterName}
                        </h4>
                        <p className="text-sm text-blue-700 italic">
                          {cardMutation.data.card.title}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm text-blue-700">
                          <span className="font-medium">Traits:</span>{' '}
                          {cardMutation.data.card.traits.join(', ')}
                        </p>
                        <p className="text-sm text-blue-700">
                          <span className="font-medium">Special Skills:</span>{' '}
                          {cardMutation.data.card.skills.join(', ')}
                        </p>
                        <p className="text-sm text-blue-700">
                          <span className="font-medium">Weakness:</span>{' '}
                          {cardMutation.data.card.weakness}
                        </p>
                      </div>

                      <div className="mt-2 text-sm text-blue-700">
                        <span className="font-medium">Background Story:</span>
                        <p className="mt-1 italic">
                          {cardMutation.data.card.backgroundStory}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
