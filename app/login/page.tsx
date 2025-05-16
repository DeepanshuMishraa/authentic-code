'use client'

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { IconBrandGithub } from "@tabler/icons-react";
import { authClient } from "@/lib/auth.client";
import { useState } from "react";
import { toast } from "sonner";

export default function Login() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      
      // Add a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Login timeout')), 30000);
      });

      const loginPromise = authClient.signIn.social({
        provider: "github",
        fetchOptions: {
          onError: (error) => {
            console.error("Error during sign-in:", error);
            const errorMessage = error.error?.message || error.message || "Failed to login with GitHub";
            toast.error(errorMessage);
          },
          onSuccess: () => {
            toast.success("Successfully logged in!");
            router.push("/dashboard");
          },
        }
      });

      // Race between timeout and login
      await Promise.race([loginPromise, timeoutPromise]).catch((error) => {
        if (error.message === 'Login timeout') {
          toast.error("Login timed out. Please try again.");
        }
        throw error;
      });

    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(
        error.message === 'Login timeout' 
          ? "Connection timed out. Please check your internet connection and try again."
          : "Failed to connect to GitHub. Please try again later."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-8 items-center justify-center min-h-[80svh]">
      <h1 className="text-4xl max-lg:text-3xl font-bold">Login to Codedoc</h1>
      <Button
        variant="outline"
        onClick={handleLogin}
        disabled={isLoading}
        className="min-w-[200px]"
      >
        {isLoading ? (
          <>
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <IconBrandGithub className="mr-2" />
            <span>Continue with Github</span>
          </>
        )}
      </Button>
    </div>
  );
}

