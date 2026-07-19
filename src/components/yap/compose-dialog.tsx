"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  BarChart2,
  CalendarClock,
  Flag,
  Globe,
  Image as ImageIcon,
  MapPin,
  Plus,
  Smile,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { YAP_MAX_LENGTH } from "@/lib/validations/yap";
import {
  createYapThread,
  deleteDraft,
  listDraftChain,
  listDrafts,
  removeDraftFromThread,
  saveDraft,
} from "@/app/(app)/yap-actions";

type Draft = {
  id: string;
  content: string;
  updatedAt: Date;
};

type ComposerBox = {
  key: string;
  draftId: string | null;
  content: string;
};

type ComposeDialogProps = {
  trigger: React.ReactNode;
  parentId?: string;
};

const DISABLED_TOOLS = [
  { icon: ImageIcon, label: "Media" },
  { icon: BarChart2, label: "Poll" },
  { icon: Smile, label: "Emoji" },
  { icon: CalendarClock, label: "Schedule" },
  { icon: MapPin, label: "Location" },
  { icon: Flag, label: "Flag" },
] as const;

function CharacterProgress({ value, max }: { value: number; max: number }) {
  const radius = 9;
  const circumference = 2 * Math.PI * radius;
  const fraction = Math.min(value / max, 1);
  const isOver = value > max;

  return (
    <svg
      viewBox="0 0 20 20"
      className="size-5 shrink-0 -rotate-90"
      aria-label={isOver ? "Over the character limit" : "Character count"}
    >
      <circle
        cx="10"
        cy="10"
        r={radius}
        strokeWidth="2"
        fill="none"
        className="stroke-zinc-200 dark:stroke-zinc-800"
      />
      <circle
        cx="10"
        cy="10"
        r={radius}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - fraction)}
        className={cn(
          "transition-[stroke-dashoffset]",
          isOver ? "stroke-destructive" : "stroke-blue-500",
        )}
      />
    </svg>
  );
}

export function ComposeDialog({ trigger, parentId }: ComposeDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [view, setView] = React.useState<"compose" | "drafts">("compose");
  const [boxes, setBoxes] = React.useState<ComposerBox[]>([
    { key: "box-0", draftId: null, content: "" },
  ]);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [confirmClose, setConfirmClose] = React.useState(false);
  const [drafts, setDrafts] = React.useState<Draft[]>([]);
  const [isPending, startTransition] = React.useTransition();
  const nextKeyRef = React.useRef(1);
  const textareaRefs = React.useRef(new Map<string, HTMLTextAreaElement>());

  function newBox(content = "", draftId: string | null = null): ComposerBox {
    return { key: `box-${nextKeyRef.current++}`, draftId, content };
  }

  React.useEffect(() => {
    const activeKey = boxes[activeIndex]?.key;
    if (activeKey) {
      textareaRefs.current.get(activeKey)?.focus();
    }
    // Only refocus when the active box changes, not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  function resetComposer() {
    setView("compose");
    setBoxes([newBox()]);
    setActiveIndex(0);
  }

  async function persistThread(currentBoxes: ComposerBox[]) {
    let prevId = parentId;
    let savedCount = 0;

    for (const box of currentBoxes) {
      const trimmed = box.content.trim();
      if (!trimmed) break;
      const saved = await saveDraft(
        box.content,
        box.draftId ?? undefined,
        prevId,
      );
      prevId = saved.id;
      savedCount += 1;
    }

    const orphan = currentBoxes[savedCount];
    if (orphan?.draftId) {
      await deleteDraft(orphan.draftId);
    }
  }

  async function handleOpenChange(next: boolean) {
    if (next) {
      resetComposer();
      setOpen(true);
      return;
    }

    const hasContent = boxes.some((box) => box.content.trim().length > 0);
    if (hasContent) {
      setConfirmClose(true);
      return;
    }

    await persistThread(boxes);
    setOpen(false);
  }

  async function handleSaveAndClose() {
    await persistThread(boxes);
    setConfirmClose(false);
    setOpen(false);
  }

  async function handleDiscardAndClose() {
    const rootDraftId = boxes[0]?.draftId;
    if (rootDraftId) {
      await deleteDraft(rootDraftId);
    }
    setConfirmClose(false);
    setOpen(false);
  }

  function openDrafts() {
    setView("drafts");
    startTransition(async () => {
      const result = await listDrafts(parentId);
      setDrafts(result);
    });
  }

  function loadDraft(draft: Draft) {
    startTransition(async () => {
      const chain = await listDraftChain(draft.id);
      setBoxes(
        chain.length > 0
          ? chain.map((d) => newBox(d.content, d.id))
          : [newBox(draft.content, draft.id)],
      );
      setActiveIndex(0);
      setView("compose");
    });
  }

  function updateBox(idx: number, content: string) {
    setBoxes((prev) =>
      prev.map((box, i) => (i === idx ? { ...box, content } : box)),
    );
  }

  function addBox() {
    setBoxes((prev) => [...prev, newBox()]);
    setActiveIndex(boxes.length);
  }

  function removeBox(idx: number) {
    const draftId = boxes[idx]?.draftId;
    setBoxes((prev) => prev.filter((_, i) => i !== idx));
    setActiveIndex((prev) => (prev >= idx ? Math.max(0, prev - 1) : prev));
    if (draftId) {
      startTransition(async () => {
        await removeDraftFromThread(draftId);
      });
    }
  }

  function handlePost() {
    startTransition(async () => {
      await createYapThread(
        boxes.map((box) => box.content),
        parentId,
      );
      const rootDraftId = boxes[0]?.draftId;
      if (rootDraftId) {
        await deleteDraft(rootDraftId);
      }
      resetComposer();
      setOpen(false);
      router.refresh();
    });
  }

  const hasEmptyBox = boxes.some((box) => box.content.trim().length === 0);
  const hasOverLimitBox = boxes.some(
    (box) => box.content.length > YAP_MAX_LENGTH,
  );
  const canPost = !hasEmptyBox && !hasOverLimitBox && !isPending;
  const isThread = boxes.length > 1;
  const activeBox = boxes[activeIndex] ?? boxes[0];
  const beforeAndActiveBoxes = boxes.slice(0, activeIndex + 1);
  const afterActiveBoxes = boxes.slice(activeIndex + 1);

  function renderBoxRow(box: ComposerBox, idx: number, isLastInGroup: boolean) {
    const isActive = idx === activeIndex;

    return (
      <div key={box.key} className="flex min-w-0 gap-3 px-4">
        <div className="flex flex-col items-center">
          <div className="size-10 shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          {!isLastInGroup && (
            <div className="mt-2 w-0.5 flex-1 bg-zinc-200 dark:bg-zinc-800" />
          )}
        </div>
        <div className={cn("min-w-0 flex-1", isActive ? "pb-6" : "pb-3")}>
          <div className="flex min-w-0 items-start gap-2">
            <Textarea
              ref={(el) => {
                if (el) textareaRefs.current.set(box.key, el);
                else textareaRefs.current.delete(box.key);
              }}
              autoFocus={idx === 0}
              value={box.content}
              onChange={(event) => updateBox(idx, event.target.value)}
              onFocus={() => setActiveIndex(idx)}
              placeholder={idx === 0 ? "Yap about it." : "Yap some more"}
              className={cn(
                "min-w-0 flex-1 resize-none border-none bg-transparent p-0 text-xl break-words shadow-none focus-visible:ring-0 dark:bg-transparent",
                isActive
                  ? "min-h-32"
                  : "min-h-0 text-zinc-500 dark:text-zinc-400",
              )}
            />
            {idx > 0 && box.content.trim().length === 0 && (
              <button
                type="button"
                aria-label="Remove post"
                onClick={() => removeBox(idx)}
                className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-blue-500 hover:bg-blue-500/10"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent
          showCloseButton={false}
          className="top-16 flex max-h-[92vh] w-full max-w-xl translate-y-0 flex-col gap-0 overflow-hidden border-none bg-white p-0 dark:bg-zinc-900"
        >
          <DialogTitle className="sr-only">Compose a Yap</DialogTitle>
          <DialogDescription className="sr-only">
            Share what&apos;s happening
          </DialogDescription>
          <div className="flex shrink-0 items-center justify-between px-4 pt-3">
            <button
              type="button"
              aria-label="Close"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
              className="flex size-9 cursor-pointer items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              <X className="size-5" />
            </button>
            {view === "compose" ? (
              <button
                type="button"
                onClick={openDrafts}
                className="cursor-pointer text-sm font-semibold text-blue-500 hover:underline"
              >
                Drafts
              </button>
            ) : (
              <span className="text-sm font-semibold">Drafts</span>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
            {view === "drafts" ? (
              <div className="flex min-h-64 flex-col px-4 pb-4">
                {drafts.length === 0 ? (
                  <p className="mt-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    {isPending
                      ? "Loading drafts…"
                      : "You have no saved drafts."}
                  </p>
                ) : (
                  <ul className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
                    {drafts.map((draft) => (
                      <li key={draft.id}>
                        <button
                          type="button"
                          onClick={() => loadDraft(draft)}
                          className="w-full cursor-pointer px-2 py-3 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
                        >
                          <p className="line-clamp-2">{draft.content}</p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <>
                <div className="flex min-w-0 flex-col pt-2">
                  {beforeAndActiveBoxes.map((box, i) =>
                    renderBoxRow(box, i, i === beforeAndActiveBoxes.length - 1),
                  )}
                </div>

                <p className="flex items-center gap-1 px-4 pb-3 text-sm font-semibold text-blue-500">
                  <Globe className="size-4" />
                  Everyone can reply
                </p>

                <div
                  className={cn(
                    "flex items-center justify-between border-t border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900",
                    afterActiveBoxes.length === 0 && "sticky bottom-0",
                  )}
                >
                  <div className="flex items-center gap-1">
                    {DISABLED_TOOLS.map(({ icon: Icon, label }) => (
                      <button
                        key={label}
                        type="button"
                        disabled
                        title="Coming soon"
                        aria-label={label}
                        className="flex size-8 cursor-not-allowed items-center justify-center rounded-full text-blue-500/50"
                      >
                        <Icon className="size-5" />
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    {activeBox.content.length > 0 && (
                      <>
                        <CharacterProgress
                          value={activeBox.content.length}
                          max={YAP_MAX_LENGTH}
                        />
                        {!parentId && (
                          <>
                            <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800" />
                            <button
                              type="button"
                              aria-label="Add another post"
                              onClick={addBox}
                              className="flex size-5 cursor-pointer items-center justify-center rounded-full border border-blue-500 text-blue-500 hover:bg-blue-500/10"
                            >
                              <Plus className="size-3" />
                            </button>
                          </>
                        )}
                      </>
                    )}

                    <Button
                      size="lg"
                      className="rounded-full font-bold"
                      disabled={!canPost}
                      onClick={handlePost}
                    >
                      {isThread ? "Post all" : "Yap"}
                    </Button>
                  </div>
                </div>

                {afterActiveBoxes.length > 0 && (
                  <div className="flex min-w-0 flex-col pt-4">
                    {afterActiveBoxes.map((box, i) =>
                      renderBoxRow(
                        box,
                        activeIndex + 1 + i,
                        i === afterActiveBoxes.length - 1,
                      ),
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmClose}
        onOpenChange={(next) => {
          if (!next) setConfirmClose(false);
        }}
      >
        <DialogContent showCloseButton={false} className="sm:max-w-sm">
          <DialogTitle>Save yap?</DialogTitle>
          <DialogDescription>
            You can save this to send later from your drafts.
          </DialogDescription>
          <div className="flex flex-col gap-2">
            <Button
              className="rounded-full font-bold"
              disabled={isPending}
              onClick={handleSaveAndClose}
            >
              Save
            </Button>
            <Button
              variant="outline"
              className="rounded-full font-bold"
              disabled={isPending}
              onClick={handleDiscardAndClose}
            >
              Discard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
