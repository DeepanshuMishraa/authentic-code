"use server"

import { db } from "@/db"
import { account, repositories } from "@/db/schema"
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm"
import { headers } from "next/headers";
import { v4 as uuidv4 } from 'uuid';


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

    const response = await fetch("https://api.github.com/user/repos", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
      }
    });

    if (!response.ok) {
      throw new Error("Failed to fetch repositories");
    }

    const repos = await response.json();

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
