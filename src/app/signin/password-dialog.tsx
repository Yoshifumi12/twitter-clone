"use client";

import { useActionState } from "react";
import { useForm, getFormProps } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod/v4";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/form/FormInput";
import { signInAction, signUpAction, type PasswordResult } from "./actions";
import { signInSchema, signUpSchema } from "@/lib/validations/auth";

interface PasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "sign-in" | "sign-up";
  identifier?: string;
  email?: string;
}

export function PasswordDialog({
  open,
  onOpenChange,
  mode,
  identifier,
  email,
}: PasswordDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {mode === "sign-up" ? (
          <SignUpForm email={email ?? ""} />
        ) : (
          <SignInForm identifier={identifier ?? ""} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function SignInForm({ identifier }: { identifier: string }) {
  const [lastResult, action, isPending] = useActionState<
    PasswordResult | undefined,
    FormData
  >(signInAction, undefined);

  const [form, fields] = useForm({
    lastResult,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: signInSchema });
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>Enter your password</DialogTitle>
        <DialogDescription>Signing in as {identifier}</DialogDescription>
      </DialogHeader>
      <form
        {...getFormProps(form)}
        action={action}
        className="flex flex-col gap-3"
      >
        <input type="hidden" name="identifier" value={identifier} />
        <FormInput
          field={fields.password}
          label="Password"
          type="password"
          placeholder="Password"
        />
        {form.errors?.map((error) => (
          <p key={error} className="text-destructive text-sm">
            {error}
          </p>
        ))}
        <Button type="submit" disabled={isPending} className="min-h-12 w-full">
          {isPending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </>
  );
}

function SignUpForm({ email }: { email: string }) {
  const [lastResult, action, isPending] = useActionState<
    PasswordResult | undefined,
    FormData
  >(signUpAction, undefined);

  const [form, fields] = useForm({
    lastResult,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: signUpSchema });
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>Create your password</DialogTitle>
        <DialogDescription>Creating an account for {email}</DialogDescription>
      </DialogHeader>
      <form
        {...getFormProps(form)}
        action={action}
        className="flex flex-col gap-3"
      >
        <input type="hidden" name="email" value={email} />
        <FormInput
          field={fields.password}
          label="Password"
          type="password"
          placeholder="Password"
        />
        <Button type="submit" disabled={isPending} className="min-h-12 w-full">
          {isPending ? "Creating account…" : "Sign up"}
        </Button>
      </form>
    </>
  );
}
