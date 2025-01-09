import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Account Not Found</h1>
        <p>No account exists with these credentials.</p>
        <div className="space-y-2">
          <Button asChild className="w-full">
            <Link href="/">Back to Login</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
