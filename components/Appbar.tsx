'use client'

import { authClient } from "@/lib/auth.client";
import { Button } from "./ui/button"
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "./ui/input";
import { useCallback, useState } from "react";
import { useDebounceFunction } from "@/hooks/use-debounce";
import { Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Appbar() {
  const session = authClient.useSession();
  const router = useRouter();
  const pathName = usePathname();
  const [searchValue, setSearchValue] = useState("");

  const handleSearchWithDebounce = useDebounceFunction((value: string) => {
    if (pathName === "/dashboard") {
      const params = new URLSearchParams();
      if (value) params.set("search", value);
      router.push(`/dashboard${value ? `?${params.toString()}` : ""}`);
    }
  }, 300);

  const handleSearch = useCallback((value: string) => {
    setSearchValue(value);
    handleSearchWithDebounce(value);
  }, [handleSearchWithDebounce]);

  const clearSearch = useCallback(() => {
    setSearchValue("");
    router.push("/dashboard");
  }, [router]);

  return (
    <div className="flex items-center justify-between p-4 bg-background/60 backdrop-blur-sm sticky top-0 z-50">
      <div>
        <Link href="/" className="font-bold text-2xl hover:text-primary/90 transition-colors">codedoc.ai</Link>
      </div>
      <div className="flex items-center gap-3">
        {session?.data?.user && pathName === "/dashboard" && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "auto", opacity: 1 }}
            className="relative"
          >
            <Input
              type="text"
              value={searchValue}
              placeholder="Search repositories..."
              className="w-[300px] pl-9 pr-9 transition-all"
              onChange={(e) => handleSearch(e.target.value)}
            />
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <AnimatePresence>
              {searchValue && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        )}

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
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Check Repositories
          </Button>
        )}
      </div>
    </div>
  )
}
