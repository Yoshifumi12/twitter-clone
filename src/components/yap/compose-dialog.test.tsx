import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ComposeDialog } from "./compose-dialog";
import { YAP_MAX_LENGTH } from "@/lib/validations/yap";

const {
  createYapThreadMock,
  saveDraftMock,
  deleteDraftMock,
  removeDraftFromThreadMock,
  listDraftsMock,
  listDraftChainMock,
  refreshMock,
} = vi.hoisted(() => ({
  createYapThreadMock: vi.fn(),
  saveDraftMock: vi.fn(),
  deleteDraftMock: vi.fn(),
  removeDraftFromThreadMock: vi.fn(),
  listDraftsMock: vi.fn(),
  listDraftChainMock: vi.fn(),
  refreshMock: vi.fn(),
}));

vi.mock("@/app/(app)/yap-actions", () => ({
  createYapThread: createYapThreadMock,
  saveDraft: saveDraftMock,
  deleteDraft: deleteDraftMock,
  removeDraftFromThread: removeDraftFromThreadMock,
  listDrafts: listDraftsMock,
  listDraftChain: listDraftChainMock,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  listDraftsMock.mockResolvedValue([]);
  listDraftChainMock.mockResolvedValue([]);
});

function openComposer(parentId?: string) {
  render(
    <ComposeDialog
      trigger={<button type="button">Yap</button>}
      parentId={parentId}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Yap" }));
}

describe("ComposeDialog", () => {
  it("opens the composer when the trigger is clicked", () => {
    openComposer();

    expect(screen.getByPlaceholderText("Yap about it.")).toBeInTheDocument();
  });

  it("disables the post button until text is entered", () => {
    openComposer();

    const postButton = screen.getByRole("button", { name: "Yap" });
    expect(postButton).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText("Yap about it."), {
      target: { value: "Hello world" },
    });

    expect(postButton).toBeEnabled();
  });

  it("hides the character count until there is input", () => {
    openComposer();

    expect(screen.queryByLabelText("Character count")).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Yap about it."), {
      target: { value: "Hello world" },
    });

    expect(screen.getByLabelText("Character count")).toBeInTheDocument();
  });

  it("disables the post button once the character limit is exceeded", () => {
    openComposer();

    fireEvent.change(screen.getByPlaceholderText("Yap about it."), {
      target: { value: "a".repeat(YAP_MAX_LENGTH + 1) },
    });

    expect(screen.getByRole("button", { name: "Yap" })).toBeDisabled();
    expect(
      screen.getByLabelText("Over the character limit"),
    ).toBeInTheDocument();
  });

  it("posts the yap and closes the dialog on submit", async () => {
    createYapThreadMock.mockResolvedValue([{ id: "yap-1" }]);
    openComposer();

    fireEvent.change(screen.getByPlaceholderText("Yap about it."), {
      target: { value: "Hello world" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Yap" }));

    await waitFor(() => {
      expect(createYapThreadMock).toHaveBeenCalledWith(
        ["Hello world"],
        undefined,
      );
    });
    await waitFor(() => {
      expect(
        screen.queryByPlaceholderText("Yap about it."),
      ).not.toBeInTheDocument();
    });
    expect(refreshMock).toHaveBeenCalled();
  });

  it("asks to save or discard when closed with unsent text", async () => {
    openComposer();

    fireEvent.change(screen.getByPlaceholderText("Yap about it."), {
      target: { value: "unsent thought" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(await screen.findByText("Save yap?")).toBeInTheDocument();
    expect(saveDraftMock).not.toHaveBeenCalled();
  });

  it("saves a draft when the save-yap prompt is confirmed", async () => {
    saveDraftMock.mockResolvedValue({ id: "draft-1" });
    openComposer();

    fireEvent.change(screen.getByPlaceholderText("Yap about it."), {
      target: { value: "unsent thought" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    fireEvent.click(await screen.findByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(saveDraftMock).toHaveBeenCalledWith(
        "unsent thought",
        undefined,
        undefined,
      );
    });
  });

  it("discards without saving when the save-yap prompt is declined", async () => {
    openComposer();

    fireEvent.change(screen.getByPlaceholderText("Yap about it."), {
      target: { value: "unsent thought" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    fireEvent.click(await screen.findByRole("button", { name: "Discard" }));

    await waitFor(() => {
      expect(
        screen.queryByPlaceholderText("Yap about it."),
      ).not.toBeInTheDocument();
    });
    expect(saveDraftMock).not.toHaveBeenCalled();
  });

  it("does not save a draft when closed with no text", () => {
    openComposer();

    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.queryByText("Save yap?")).not.toBeInTheDocument();
    expect(saveDraftMock).not.toHaveBeenCalled();
    expect(deleteDraftMock).not.toHaveBeenCalled();
  });

  it("lists saved drafts and reopens one into the composer", async () => {
    listDraftsMock.mockResolvedValue([
      { id: "draft-1", content: "an old draft", updatedAt: new Date() },
    ]);
    listDraftChainMock.mockResolvedValue([
      { id: "draft-1", content: "an old draft" },
    ]);
    openComposer();

    fireEvent.click(screen.getByRole("button", { name: "Drafts" }));

    const draftButton = await screen.findByText("an old draft");
    fireEvent.click(draftButton);

    expect(await screen.findByPlaceholderText("Yap about it.")).toHaveValue(
      "an old draft",
    );
  });

  it("hides the plus button until there is input", () => {
    openComposer();
    expect(
      screen.queryByRole("button", { name: "Add another post" }),
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Yap about it."), {
      target: { value: "Hello world" },
    });

    expect(
      screen.getByRole("button", { name: "Add another post" }),
    ).toBeInTheDocument();
  });

  it("hides the plus button when replying to another yap, even with input", () => {
    openComposer("parent-1");

    fireEvent.change(screen.getByPlaceholderText("Yap about it."), {
      target: { value: "Hello world" },
    });

    expect(
      screen.queryByRole("button", { name: "Add another post" }),
    ).not.toBeInTheDocument();
  });

  it("adds another post box, labels it, and posts the whole thread", async () => {
    createYapThreadMock.mockResolvedValue([{ id: "yap-1" }, { id: "yap-2" }]);
    openComposer();

    fireEvent.change(screen.getByPlaceholderText("Yap about it."), {
      target: { value: "First post" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add another post" }));

    expect(screen.getByPlaceholderText("Yap some more")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Yap some more"), {
      target: { value: "Second post" },
    });

    const postButton = screen.getByRole("button", { name: "Post all" });
    expect(postButton).toBeEnabled();
    fireEvent.click(postButton);

    await waitFor(() => {
      expect(createYapThreadMock).toHaveBeenCalledWith(
        ["First post", "Second post"],
        undefined,
      );
    });
  });

  it("focuses the newly added box when the plus button is clicked", () => {
    openComposer();

    fireEvent.change(screen.getByPlaceholderText("Yap about it."), {
      target: { value: "First post" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add another post" }));

    expect(screen.getByPlaceholderText("Yap some more")).toHaveFocus();
  });

  it("hides the remove button on a child box once it has content", () => {
    openComposer();

    fireEvent.change(screen.getByPlaceholderText("Yap about it."), {
      target: { value: "First post" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add another post" }));

    expect(
      screen.getByRole("button", { name: "Remove post" }),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Yap some more"), {
      target: { value: "Second post" },
    });

    expect(
      screen.queryByRole("button", { name: "Remove post" }),
    ).not.toBeInTheDocument();
  });

  it("removes a post box from the thread", () => {
    openComposer();

    fireEvent.change(screen.getByPlaceholderText("Yap about it."), {
      target: { value: "First post" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add another post" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove post" }));

    expect(
      screen.queryByPlaceholderText("Yap some more"),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Yap" })).toBeEnabled();
  });
});
