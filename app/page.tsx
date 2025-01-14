import { SignIn } from "@/app/api/components/auth/sign-in";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-8">Sign In</h1>
        <SignIn />
      </div>
    </main>
  );
}
