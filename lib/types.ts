export interface Repository {
  id: string;
  repoName: string;
  repoUrl: string;
  userId: string;
  createdAt: string; 
}

export interface AnalysisResult {
  success: boolean;
  chunksAnalyzed?: number;
  analysisResults?: Array<{
    authenticity_score: number;
    reasoning: string;
    writing_style: string;
    confidence_level: string;
  }>;
  message?: string;
}
