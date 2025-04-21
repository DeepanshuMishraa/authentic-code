'use client';

import { fetchRepoAndSave } from "@/actions/action";
import { Button } from "@/components/ui/button";
import { AnalyzeCode } from "@/lib/ai";
import { authClient } from "@/lib/auth.client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const session = authClient.useSession();
  const [repos, setRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleFetchRepos() {
    try {
      setLoading(true);
      const data = await fetchRepoAndSave();
      if (Array.isArray(data)) {
        setRepos(data);
      } else {
        console.error("Unexpected response:", data);
        alert("Something went wrong");
      }
    } catch (error) {
      console.error("Error fetching repositories:", error);
      alert("Failed to fetch repositories.");
    } finally {
      setLoading(false);
    }
  }

  if (session?.data?.user) {
    return (
      <div className="flex flex-col items-center justify-start min-h-[100svh] p-6 gap-6">
        <div className="flex gap-4">
          <Button disabled={loading} onClick={handleFetchRepos}>
            {loading ? "Fetching..." : "Fetch My Repositories"}
          </Button>

          <Button variant="destructive" onClick={async () => {
            await authClient.signOut();
            router.push("/");
          }}>
            Logout
          </Button>

          <Button onClick={async () => {
            await AnalyzeCode(`
                function sum(a:number,b:number):number{
  return a+b;
  }`)
          }}>
            Ping AI
          </Button>
        </div>
        <div className="mt-10 w-full max-w-2xl">
          {repos.length > 0 ? (
            <ul className="space-y-4">
              {repos.map((repo) => (
                <li
                  key={repo.id}
                  className="border p-4 rounded-lg shadow hover:bg-gray-50 transition"
                >
                  <a
                    href={repo.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 font-semibold hover:underline"
                  >
                    {repo.repoName}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No repositories fetched yet</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-[100svh]">
      <Button onClick={async () => {
        await authClient.signIn.social({
          provider: "github",
        });
        router.refresh();
      }}>
        Login with GitHub
      </Button>
    </div>
  );
}
