'use client'

import { authClient } from "@/lib/auth.client";
import { Button } from "./ui/button"
import { useRouter } from "next/navigation";

export default function Appbar() {
  const session = authClient.useSession();
  const router = useRouter();
  return (
    <div className="flex items-center justify-between p-4">
      <div>
        <h1>XYZ</h1>
      </div>
      <div>
        {session?.data?.user ? (
          <Button onClick={async () => await authClient.signOut({
            fetchOptions: {
              onSuccess: () => {
                router.push("/");
              }
            }
          })}>
            Logout
          </Button>
        ) : (
          <Button onClick={async () => {
            await authClient.signIn.social({
              provider: "github",
            });
            router.refresh();
          }}>
            Login with GitHub
          </Button>
        )}
      </div>
    </div>
  )
}
