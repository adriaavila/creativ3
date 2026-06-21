import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function SignInPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f0e5] p-6 text-[#172016]">
        <div className="max-w-md rounded-2xl border border-[#172016]/10 bg-white p-8">
          <h1 className="font-display text-4xl">Clerk aún no está conectado.</h1>
          <p className="mt-4 text-sm leading-6 text-[#53624f]">
            Configura NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY y CLERK_SECRET_KEY para habilitar el panel privado.
          </p>
          <Link href="/" className="mt-6 inline-flex text-sm font-semibold text-[#31583a]">Volver al sitio</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f0e5] p-6">
      <SignIn routing="path" path="/sign-in" />
    </main>
  );
}

