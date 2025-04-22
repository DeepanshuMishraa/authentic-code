"use server"

import { db } from "@/db"
import { account, repositories, scanResult } from "@/db/schema"
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm"
import { headers } from "next/headers";
import { v4 as uuidv4 } from 'uuid';
import * as JSZip from "jszip";
import { AnalyzeCode } from "@/lib/ai";


export async function fetchRepoAndSave() {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const userId = session?.user.id;
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

export async function ChunkTheRepositories(repo: any) {
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

    const userId = session?.user.id;
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

    let allFiles: { path: string; content: string }[] = [];
    for (const relativePath in zip.files) {
      const file = zip.files[relativePath];
      if (!file.dir && /\.(js|ts|tsx|jsx|py|go|rs|java|cpp|c|cs|html|css|json|md)$/.test(file.name)) {
        const content = await file.async("text");
        allFiles.push({ path: file.name, content });
      }
    }

    const chunks: string[] = [];
    let currentChunk = "";

    for (const file of allFiles) {
      if (currentChunk.length + file.content.length > 1500) {
        chunks.push(currentChunk);
        currentChunk = "";
      }
      currentChunk += `\n// FILE: ${file.path}\n${file.content}\n`;
    }

    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk);
    }

    const results = [];
    for (const chunk of chunks) {
      const result = await AnalyzeCode(chunk);
      results.push(result);
    }

    const existingRepo = await db
      .select()
      .from(repositories)
      .where(eq(repositories.repoUrl, repo.repoUrl))
      .limit(1);

    if (!existingRepo[0]) {
      throw new Error("Repository not found in database");
    }

    const repoId = existingRepo[0].id;

    for (const result of results) {
      await db.insert(scanResult).values({
        id: uuidv4(),
        repoId: repoId,
        authencityScore: result.authenticityScore,
        confidenceLevel: result.confidenceLevel,
        reasoning: result.reasoning,
        createdAt: new Date()
      });
    }

    return {
      success: true,
      chunksAnalyzed: results.length,
      analysisResults: results,
      repoId: repoId
    };

  } catch (error: any) {
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
