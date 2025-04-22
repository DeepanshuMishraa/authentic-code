import { fetchRepoAndSave, ChunkTheRepositories } from "@/actions/action";
import Link from "next/link";

// Wrapper server action
async function analyzeRepo(formData: FormData) {
  "use server";
  const repoId = formData.get("repoId") as string;
  const repoUrl = formData.get("repoUrl") as string;
  const repoName = formData.get("repoName") as string;

  if (!repoId || !repoUrl || !repoName) {
    throw new Error("Missing repo data, Sir 🛑");
  }

  // Pass the necessary repo data
  await ChunkTheRepositories({ id: repoId, repoUrl, repoName });
}

export default async function Landing() {
  const repos = await fetchRepoAndSave(); // Fetch repositories from DB

  return (
    <div className="flex flex-col items-center justify-start min-h-[100svh] p-6 gap-6">
      <div className="mt-10 w-full max-w-2xl">
        {repos && repos.length > 0 ? (
          <ul className="space-y-4">
            {repos.map((repo: any) => (
              <li
                key={repo.id}
                className="border flex justify-between items-center p-4 rounded-lg shadow hover:bg-gray-50 transition"
              >
                {/* Repo Name Link */}
                <Link
                  href={repo.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 font-semibold hover:underline"
                >
                  {repo.repoName}
                </Link>

                {/* Analyze Button */}
                <form action={analyzeRepo}>
                  <input type="hidden" name="repoId" value={repo.id} />
                  <input type="hidden" name="repoUrl" value={repo.repoUrl} />
                  <input type="hidden" name="repoName" value={repo.repoName} />
                  <button
                    type="submit"
                    className="border px-4 py-2 rounded hover:bg-gray-200 transition"
                  >
                    Analyze
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No repositories found, Sir. 🧐</p>
        )}
      </div>
    </div>
  );
}
