'use client';

import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth.client";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const session = authClient.useSession();

  if (session?.data?.user) {
    return (
      <div className="flex items-center justify-center h-[100svh]">
        <Button onClick={async () => {
          await authClient.signOut();
          router.push("/");
        }}>
          Logout
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center h-[100svh]">
      <Button onClick={async () => {
        await authClient.signIn.social({
          provider: "github",
        })
      }}>
        Login with github
      </Button>
    </div>
  );
}
