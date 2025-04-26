"use server"

import { db } from "@/db"
import { account, repositories, scanResult } from "@/db/schema"
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm"
import { headers } from "next/headers";
import { v4 as uuidv4 } from 'uuid';
import * as JSZip from "jszip";
import { AnalyzeCode, AssignUniqueCards } from "@/lib/ai";
import { connectRedis } from "@/lib/redis";


const redis = await connectRedis();


export async function fetchRepoAndSave() {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const userId = session?.user.id;

    const cachedRepos = await redis.get(`repos:${userId}`);
    if (cachedRepos) {
      return JSON.parse(cachedRepos);
    }

    const githubAccount = await db.select().from(account).where(eq(account.userId, userId));

    if (!githubAccount[0] || !githubAccount[0].accessToken) {
      throw new Error("Github Account not connected");
    }

    const accessToken = githubAccount[0].accessToken;
    let allRepos: any[] = [];
    let page = 1;
    const response = await fetch(`https://api.github.com/user/repos?per_page=100&page=${page}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
      }
    });

    if (!response.ok) {
      throw new Error("Failed to fetch repositories");
    }

    const repos = await response.json();
    allRepos.push(...repos);

    await redis.setEx(`repos:${userId}`, 3600, JSON.stringify(allRepos));

    const existingRepos = await db
      .select({
        repoUrl: repositories.repoUrl
      })
      .from(repositories)
      .where(eq(repositories.userId, userId));

    const existingRepoUrls = new Set(existingRepos.map(repo => repo.repoUrl));

    const newRepos = repos.filter((repo: any) => !existingRepoUrls.has(repo.html_url));

    if (newRepos.length > 0) {
      const data = newRepos.map((repo: any) => ({
        id: uuidv4(),
        repoName: repo.name,
        repoUrl: repo.html_url,
        userId,
        createdAt: new Date(),
      }));

      await db.insert(repositories).values(data);
    }

    return repos;
  } catch (error) {
    return {
      success: false,
      message: error
    }
  }
}

export async function ChunkTheRepositories(repo: { repoUrl: string, repoName?: string, id?: string }) {
  try {
    if (!repo.repoUrl) {
      throw new Error("Invalid repository URL");
    }

    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const userId = session.user.id;
    const redisKey = `repo:${repo.repoUrl}`;

    // Check cache first
    const cachedData = await redis.get(redisKey);
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      return {
        success: true,
        source: "cache",
        ...parsed
      };
    }

    const existingRepo = await db
      .select()
      .from(repositories)
      .where(eq(repositories.repoUrl, repo.repoUrl))
      .limit(1);

    if (existingRepo[0]) {
      const repoId = existingRepo[0].id;
      const scanResults = await db
        .select()
        .from(scanResult)
        .where(eq(scanResult.repoId, repoId));

      if (scanResults.length > 0) {
        const payload = {
          chunksAnalyzed: scanResults.length,
          analysisResults: scanResults,
          repoId: repoId
        };

        await redis.setEx(redisKey, 3600, JSON.stringify(payload));
        return {
          success: true,
          source: "database",
          ...payload
        };
      }
    }

    const githubAccount = await db.select().from(account).where(eq(account.userId, userId));

    if (!githubAccount[0] || !githubAccount[0].accessToken) {
      throw new Error("Github Account not connected");
    }

    const accessToken = githubAccount[0].accessToken;
    const zipUrl = `${repo.repoUrl.replace("github.com", "api.github.com/repos")}/zipball`;

    const zipResponse = await fetch(zipUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
      },
    });

    if (!zipResponse.ok) {
      throw new Error("Failed to download repository archive");
    }

    const buffer = await zipResponse.arrayBuffer();
    const zip = await JSZip.loadAsync(buffer);

    const files = Object.keys(zip.files).filter(path => {
      const file = zip.files[path];
      return !file.dir && /\.(js|ts|tsx|jsx|py|go|rs|java|cpp|c|cs|html|css|json|md)$/.test(file.name);
    });

    const fileContents: { name: string; content: string }[] = [];
    for (const filePath of files) {
      const file = zip.files[filePath];
      const content = await file.async("text");
      if (content.trim()) {
        fileContents.push({
          name: file.name,
          content: content.trim()
        });
      }
    }

    const MAX_TOKENS_PER_CHUNK = 4000;
    const chunks: string[] = [];
    let currentChunk = '';
    let currentTokenCount = 0;

    for (const file of fileContents) {
      const fileContent = `\n// FILE: ${file.name}\n${file.content}\n`;
      const estimatedTokens = Math.ceil(fileContent.length / 4);

      if (currentTokenCount + estimatedTokens > MAX_TOKENS_PER_CHUNK) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
          currentTokenCount = 0;
        }
      }

      currentChunk += fileContent;
      currentTokenCount += estimatedTokens;

      // If current file made chunk too big, create a new chunk just for this file
      if (currentTokenCount > MAX_TOKENS_PER_CHUNK) {
        chunks.push(fileContent.trim());
        currentChunk = '';
        currentTokenCount = 0;
      }
    }

    // Add the last chunk if there's any content left
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    // Analyze all chunks together
    const results = await Promise.all(
      chunks.map(async (chunk) => {
        try {
          return await AnalyzeCode(chunk);
        } catch (error) {
          console.error("Error analyzing chunk:", error);
          return null;
        }
      })
    );

    const repoId = existingRepo[0]?.id || uuidv4();
    const repoName = repo.repoName || repo.repoUrl.split('/').pop() || 'unnamed-repo';

    if (!existingRepo[0]) {
      await db.insert(repositories).values({
        id: repoId,
        repoUrl: repo.repoUrl,
        repoName: repoName,
        userId: userId,
        createdAt: new Date(),
        lastScannedAt: new Date(),
      });
    } else {
      await db
        .update(repositories)
        .set({ lastScannedAt: new Date() })
        .where(eq(repositories.id, repoId));
    }

    const validResults = results.filter((r): r is NonNullable<typeof r> => r !== null);
    const averageScore = validResults.length > 0
      ? validResults.reduce((sum, r) => sum + r.authenticityScore, 0) / validResults.length
      : 0;

    const uniqueObservations = new Set<string>();
    validResults.forEach(r => {
      const observations = r.reasoning.split('.').filter(Boolean);
      observations.forEach(obs => uniqueObservations.add(obs.trim()));
    });

    const topObservations = Array.from(uniqueObservations).slice(0, 3);


    const aggregateResult = {
      id: uuidv4(),
      repoId: repoId,
      authencityScore: Number(averageScore),
      confidenceLevel: validResults[0]?.confidenceLevel || "Medium",
      reasoning: topObservations.join('. '),
      createdAt: new Date()
    };

    await db.insert(scanResult).values(aggregateResult);

    const payload = {
      chunksAnalyzed: chunks.length,
      analysisResults: [aggregateResult],
      repoId: repoId
    };

    await redis.setEx(redisKey, 3600, JSON.stringify(payload));

    return {
      success: true,
      source: "fresh",
      ...payload
    };

  } catch (error: any) {
    console.error("Repository analysis failed:", error);
    return {
      success: false,
      message: error.message || "Unknown error"
    };
  }
}



export async function getAnalysis(repoId: string) {
  try {
    const analysis = await db.select().from(scanResult).where(eq(scanResult.repoId, repoId));
    if (!analysis.length) {
      return null;
    }
    return analysis;
  } catch (error) {
    throw error;
  }
}

export async function getUniqueCard() {
  try {
    // Get session
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      throw new Error("Unauthorized: No user session found.");
    }

    const userId = session.user.id;

    const cachedCards = await redis.get(`cards:${userId}`);
    if (cachedCards) {
      return JSON.parse(cachedCards);
    }
    const repo = await db
      .select()
      .from(repositories)
      .where(eq(repositories.userId, userId));

    if (!repo[0]) {
      throw new Error("No repositories found for user.");
    }

    const repoId = repo[0].id;

    const analysisResults = await db
      .select()
      .from(scanResult)
      .where(eq(scanResult.repoId, repoId));

    if (!analysisResults.length) {
      throw new Error("No analysis found for the repository.");
    }

    const latestAnalysis = analysisResults
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

    const analysis = {
      id: latestAnalysis.id,
      repoId: latestAnalysis.repoId,
      authenticityScore: latestAnalysis.authencityScore,
      confidenceLevel: latestAnalysis.confidenceLevel,
      reasoning: latestAnalysis.reasoning,
      createdAt: latestAnalysis.createdAt,
    };

  
    const uniqueCard = await AssignUniqueCards(analysis);
    
    await redis.setEx(`cards:${userId}`, 3600, JSON.stringify(uniqueCard));

    return uniqueCard;

  } catch (error: any) {
    console.error("Error fetching unique card:", error);
    throw new Error(`Failed to fetch unique card: ${error.message}`);
  }
}
