"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useState } from "react";
import { useForm, getFormProps, getInputProps } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod/v4";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ErrorMessage from "@/components/form/ErrorMessage";
import { checkIdentifierAction } from "./actions";
import { identifierSchema } from "@/lib/validations/auth";
import { PasswordDialog } from "./password-dialog";

export function SignInForm() {
  const [checkResult, checkAction, isChecking] = useActionState(
    checkIdentifierAction,
    undefined,
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [handledResult, setHandledResult] = useState(checkResult);
  const [identifierValue, setIdentifierValue] = useState("");

  if (checkResult !== handledResult) {
    setHandledResult(checkResult);
    if (checkResult?.status === "success" && checkResult.mode) {
      setDialogOpen(true);
    }
  }

  const [form, fields] = useForm({
    lastResult: checkResult,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: identifierSchema });
    },
    shouldValidate: "onSubmit",
  });

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
      <Button
        asChild
        variant="outline"
        className="min-h-12 w-full rounded-full border-black bg-white text-black hover:bg-neutral-100 hover:text-black dark:border-black dark:bg-white dark:text-black dark:hover:bg-neutral-100 dark:hover:text-black"
      >
        <Link href="/auth/login?connection=google-oauth2">
          <Image
            src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/google/google-original.svg"
            alt="Google"
            width={16}
            height={16}
          />
          Continue with Google
        </Link>
      </Button>

      <div className="flex items-center gap-3">
        <div className="border-input h-px flex-1 border-t" />
        <span className="text-muted-foreground text-sm">or</span>
        <div className="border-input h-px flex-1 border-t" />
      </div>

      <form
        {...getFormProps(form)}
        action={checkAction}
        className="flex flex-col gap-3"
      >
        <div className="flex flex-col gap-1">
          <Input
            {...getInputProps(fields.identifier, { type: "text" })}
            key={fields.identifier.key}
            placeholder="Email or username"
            aria-invalid={!fields.identifier.valid || undefined}
            onChange={(event) => setIdentifierValue(event.target.value)}
            className="bg-transparent dark:bg-transparent"
          />
          <ErrorMessage message={fields.identifier.errors} />
        </div>
        <Button
          type="submit"
          disabled={isChecking || identifierValue.trim().length === 0}
          className="min-h-12 w-full rounded-full"
        >
          {isChecking ? "Checking…" : "Continue"}
        </Button>
      </form>

      <PasswordDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={checkResult?.mode}
        identifier={checkResult?.identifier}
        email={checkResult?.email}
      />
    </div>
  );
}
