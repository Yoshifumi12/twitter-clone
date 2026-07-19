import type { Metadata } from "next";
import Image from "next/image";
import { SignInForm } from "./signin-form";

export const metadata: Metadata = {
  title: "Yapper. Let's talk about it",
};

export default function SignInPage() {
  return (
    <main className="flex min-h-svh">
      <div className="flex w-full flex-col items-center justify-center gap-10 p-6 lg:w-1/2">
        <div className="flex w-full max-w-sm flex-col gap-8">
          <h1 className="text-5xl font-bold text-balance">Talk About It.</h1>
          <SignInForm />
        </div>
      </div>

      <div className="bg-background relative hidden lg:block lg:w-1/2">
        <Image
          src="/y_logo_light.png"
          alt=""
          fill
          priority
          draggable={false}
          className="pointer-events-none object-cover opacity-80 select-none dark:hidden"
        />
        <Image
          src="/y_logo_dark.png"
          alt=""
          fill
          priority
          draggable={false}
          className="pointer-events-none hidden object-cover opacity-80 select-none dark:block"
        />
      </div>
    </main>
  );
}
