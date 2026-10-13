import { describe, expect, test, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { ThemeProvider } from "@mui/material";
import RecipeChips from "../src/generated/RecipeChips";
import BaseButton from "../src/generated/BaseButton";
import { UserApiProvider, type UserApiPort } from "../src/infra/services";
import { sampleTheme } from "../src/infra/ui";
import { formatLegacyMessage, UnsupportedLegacyMessage, i18n } from "../src/infra/i18n";
import type { ReactNode } from "react";

const item = { id: "c1", name: "Category", slug: "category" };
function shell(children: ReactNode, api: UserApiPort) {
  return <ThemeProvider theme={sampleTheme}><MemoryRouter><UserApiProvider api={api}>{children}</UserApiProvider></MemoryRouter></ThemeProvider>;
}
describe("RecipeChips source behavior", () => {
  test("empty default mounts no list and no zero text", () => {
    const { container } = render(<RecipeChips />);
    expect(container.textContent).toBe("");
    expect(container.querySelectorAll(".MuiChip-root")).toHaveLength(0);
  });
  test("list limit, truncation and emitted payload preserve actual source objects", () => {
    const callback = vi.fn();
    const long = { ...item, name: "a".repeat(25) };
    render(<RecipeChips items={[long, { ...item, name: "Second" }]} limit={1} truncate urlPrefix="tags" onItemSelected={callback} />);
    const chip = screen.getByRole("button", { name: "a".repeat(20) + "..." });
    const result = fireEvent.click(chip);
    expect(result).toBe(false); // @click.prevent actually cancels the DOM event.
    expect(callback).toHaveBeenCalledExactlyOnceWith(long, "tags");
    expect(screen.queryByText("Second")).toBeNull();
  });
  test("default urlPrefix and optional listener", () => {
    const callback = vi.fn();
    const { rerender } = render(<RecipeChips items={[item]} onItemSelected={callback} />);
    fireEvent.click(screen.getByRole("button"));
    expect(callback).toHaveBeenCalledExactlyOnceWith(item, "categories");
    rerender(<RecipeChips items={[item]} />);
    expect(() => fireEvent.click(screen.getByRole("button"))).not.toThrow();
  });
  test("boolean title remains source interpolation, not an invented string prop", () => {
    render(<RecipeChips items={[item]} title />);
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("true");
  });
  test("undefined uses default; caller attrs reach root; updates change visible list", () => {
    const { rerender } = render(<RecipeChips items={[item]} limit={undefined} data-testid="chip-root" />);
    expect(screen.getByTestId("chip-root").textContent).toBe("Category");
    rerender(<RecipeChips items={[]} data-testid="chip-root" />);
    expect(screen.queryByTestId("chip-root")).toBeNull();
  });
  test("markup remains escaped text", () => {
    const { container } = render(<RecipeChips items={[{ ...item, name: "<img src=x onerror=alert(1)>" }]} />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain("<img");
  });
});

describe("BaseButton local contracts (transport supplied explicitly)", () => {
  test("action precedence and explicit text override", () => {
    const api: UserApiPort = { utils: { download: vi.fn() } };
    const { rerender } = render(shell(<BaseButton delete update />, api));
    expect(screen.getByRole("button").textContent).toBe("Delete");
    rerender(shell(<BaseButton delete text="Explicit" />, api));
    expect(screen.getByRole("button").textContent).toBe("Explicit");
  });
  test("default and named slots replace fallback and preserve ordering", () => {
    const api: UserApiPort = { utils: { download: vi.fn() } };
    render(shell(<BaseButton iconRight iconSlot={<span data-testid="icon">Custom icon</span>}>Custom child</BaseButton>, api));
    const button = screen.getByRole("button");
    expect(button.textContent).toBe("Custom childCustom icon");
    expect(screen.queryByText("Create")).toBeNull();
  });
  test("nonempty destination renders a real link with query/hash; empty remains button", () => {
    const api: UserApiPort = { utils: { download: vi.fn() } };
    const { rerender } = render(shell(<BaseButton to="/g/test?x=1#recipes" />, api));
    expect(screen.getByRole("link").getAttribute("href")).toBe("/g/test?x=1#recipes");
    rerender(shell(<BaseButton to="" />, api));
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByRole("button")).toBeTruthy();
  });
  test("download port receives original URL exactly once and fallthrough callback runs", () => {
    const download = vi.fn(), click = vi.fn();
    render(shell(<BaseButton download downloadUrl="/api/resource" onClick={click} />, { utils: { download } }));
    fireEvent.click(screen.getByRole("button"));
    expect(download).toHaveBeenCalledExactlyOnceWith("/api/resource");
    expect(click).toHaveBeenCalledTimes(1);
  });
  test("disabled and loading block clicks", () => {
    const download = vi.fn();
    const api = { utils: { download } };
    const { rerender } = render(shell(<BaseButton disabled download />, api));
    fireEvent.click(screen.getByRole("button"));
    expect(download).not.toHaveBeenCalled();
    rerender(shell(<BaseButton loading download />, api));
    fireEvent.click(screen.getByRole("button"));
    expect(download).not.toHaveBeenCalled();
  });
  test("missing transport throws rather than creating a fake client", () => {
    expect(() => render(<MemoryRouter><BaseButton /></MemoryRouter>)).toThrow(/verified UserApi transport/);
  });
  test("setup-created translated option preserves Vue instance lifetime", async () => {
    const api = { utils: { download: vi.fn() } };
    const { unmount } = render(shell(<BaseButton create />, api));
    i18n.addResourceBundle("fr-FR", "translation", { general: { create: "Créer" } }, true, true);
    await act(async () => { await i18n.changeLanguage("fr-FR"); });
    // Source buttonOptions is a plain setup object, not computed translations.
    expect(screen.getByRole("button").textContent).toBe("Create");
    unmount();
    render(shell(<BaseButton create />, api));
    expect(screen.getByRole("button").textContent).toBe("Créer");
    await act(async () => { await i18n.changeLanguage("en-US"); });
  });
  test("default icon is an SVG path, not raw path text", () => {
    const { container } = render(shell(<BaseButton create />, { utils: { download: vi.fn() } }));
    expect(container.querySelector("svg path")?.getAttribute("d")).toMatch(/^M/);
    expect(screen.getByRole("button").textContent).toBe("Create");
  });
  test("unresolved grey/cancel and legacy x-small fail visibly instead of guessing", () => {
    const api = { utils: { download: vi.fn() } };
    expect(() => render(shell(<BaseButton cancel />, api))).toThrow(/unresolved palette color/);
    expect(() => render(shell(<BaseButton xSmall />, api))).toThrow(/legacy x-small/);
  });
});

describe("limited legacy i18n adapter", () => {
  test("named, positional and missing arguments", () => {
    expect(formatLegacyMessage("Delete {name}", { name: "Recipe" })).toBe("Delete Recipe");
    expect(formatLegacyMessage("Created {0}", { 0: "today" })).toBe("Created today");
    expect(() => formatLegacyMessage("Delete {name}")).toThrow(UnsupportedLegacyMessage);
  });
  test("unsupported syntax blocks instead of silently mistranslating", () => {
    for (const value of ["none|one|many", "@:general.save", "{'literal'}", "{{double}}", "bad {", "bad }"]) {
      expect(() => formatLegacyMessage(value)).toThrow(UnsupportedLegacyMessage);
    }
  });
  test("existing resource key preserved through react-i18next initialization", () => {
    expect(i18n.getResource("en-US", "translation", "general.create")).toBe("Create");
  });
});
