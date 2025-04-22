'use client'

import { authClient } from "@/lib/auth.client";
import { Button } from "./ui/button"
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

export default function Appbar() {
  const session = authClient.useSession();
  const router = useRouter();
  const pathName = usePathname();
  return (
    <div className="flex items-center justify-between p-4">
      <div>
        <Link href="/" className="font-bold text-2xl">Checker</Link>
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

        {session?.data?.user && pathName === "/" && (
          <Button variant="outline" className="ml-2" onClick={() => router.push("/dashboard")}>
            Check Repositories
          </Button>
        )}
      </div>
    </div>
  )
}
