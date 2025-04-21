"use server"

import { db } from "@/db"
import { account, repositories } from "@/db/schema"
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
    allRepos.push(...repos)


    const data = repos.map((repo: any) => ({
      id: uuidv4(),
      repoName: repo.name,
      repoUrl: repo.html_url,
      userId,
      createdAt: new Date(),
    }));


    await db.insert(repositories).values(data);

    return data;
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

    return {
      success: true,
      chunksAnalyzed: results.length,
      analysisResults: results
    };

  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Unknown error"
    };
  }
}
