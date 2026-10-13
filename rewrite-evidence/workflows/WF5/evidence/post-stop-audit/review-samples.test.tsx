// Independent Gate 2 probes. Root copies this evidence file into the disposable
// frontend-react/tests directory; canonical implementation stays read-only.
// These are added tests, not a port of the original Vue assertion suite.
// Empty-slot fallback and callback merge order remain pending Vue-runtime proof.
import { describe, expect, test, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router";
import { ThemeProvider } from "@mui/material";
import type { MouseEvent, ReactNode } from "react";
import BaseButton from "../src/generated/BaseButton";
import RecipeChips from "../src/generated/RecipeChips";
import { UserApiProvider, type UserApiPort } from "../src/infra/services";
import { sampleTheme } from "../src/infra/ui";

function LocationText() {
  const location = useLocation();
  return <output data-testid="review-location">{location.pathname + location.search + location.hash}</output>;
}
function shell(children: ReactNode, api: UserApiPort = { utils: { download: vi.fn() } }) {
  return <ThemeProvider theme={sampleTheme}><MemoryRouter initialEntries={["/start"]}>
    <UserApiProvider api={api}>{children}<LocationText /></UserApiProvider>
  </MemoryRouter></ThemeProvider>;
}

describe("independent generated-component semantics", () => {
  test("required block attr maps to fullWidth or fails with an explicit unsupported diagnostic", () => {
    // Real source callers: InputLabelType.vue:26-30 and
    // RecipeIngredientEditor.vue:91,143 use BaseButton block.
    // Silent DOM fallthrough is neither mapping nor an unsupported diagnosis.
    try {
      render(shell(<BaseButton block text="Wide action" />));
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toMatch(/R08.*(?:block|attribute|unsupported)/i);
      return;
    }
    expect(screen.getByRole("button", { name: "Wide action" }).classList.contains("MuiButton-fullWidth")).toBe(true);
  });

  test("normal button fallthrough preserves attrs, submit type and the click event payload", () => {
    const download = vi.fn();
    const observed: { button: number; currentTarget: HTMLElement; target: EventTarget; nativeEvent: globalThis.MouseEvent }[] = [];
    const click = vi.fn((event: MouseEvent<HTMLElement>) => {
      observed.push({ button: event.button, currentTarget: event.currentTarget,
        target: event.target, nativeEvent: event.nativeEvent });
    });
    render(shell(<BaseButton text="Submit action" type="submit" id="review-submit" aria-label="Submit record"
      title="Submit title" data-purpose="review" onClick={click} />, { utils: { download } }));
    const button = screen.getByRole("button", { name: "Submit record" });
    expect(button.getAttribute("type")).toBe("submit");
    expect(button.id).toBe("review-submit");
    expect(button.getAttribute("title")).toBe("Submit title");
    expect(button.getAttribute("data-purpose")).toBe("review");
    const nativeClick = new globalThis.MouseEvent("click", { bubbles: true, cancelable: true, button: 0 });
    fireEvent(button, nativeClick);
    expect(click).toHaveBeenCalledTimes(1);
    expect(observed).toEqual([{ button: 0, currentTarget: button, target: button, nativeEvent: nativeClick }]);
    expect(download).not.toHaveBeenCalled();
  });

  test("real link href keeps query/hash and a normal primary click updates Router location", () => {
    render(shell(<BaseButton text="Open recipe" to="/g/test?x=1#recipes" />));
    const link = screen.getByRole("link", { name: "Open recipe" });
    expect(link.tagName).toBe("A");
    expect(link.getAttribute("href")).toBe("/g/test?x=1#recipes");
    fireEvent.click(link, { button: 0 });
    expect(screen.getByTestId("review-location").textContent).toBe("/g/test?x=1#recipes");
  });

  test("caller preventDefault receives the click and cancels Router navigation", () => {
    const click = vi.fn((event: MouseEvent<HTMLElement>) => event.preventDefault());
    render(shell(<BaseButton text="Stay here" to="/g/test?x=1#recipes" onClick={click} />));
    expect(fireEvent.click(screen.getByRole("link", { name: "Stay here" }), { button: 0 })).toBe(false);
    expect(click).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("review-location").textContent).toBe("/start");
  });

  test.each([
    ["Ctrl", { button: 0, ctrlKey: true }],
    ["Meta", { button: 0, metaKey: true }],
    ["Alt", { button: 0, altKey: true }],
    ["Shift", { button: 0, shiftKey: true }],
    ["middle button", { button: 1 }],
  ] as const)("%s link click is not intercepted by the SPA", (_name, clickOptions) => {
    // JSDOM proves non-interception, not a real browser's new-tab behavior.
    const click = vi.fn();
    render(shell(<BaseButton text="Modified link" to="/g/test?x=1#recipes" onClick={click} />));
    const event = new globalThis.MouseEvent("click", { bubbles: true, cancelable: true, ...clickOptions });
    fireEvent(screen.getByRole("link", { name: "Modified link" }), event);
    expect(click).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(false);
    expect(screen.getByTestId("review-location").textContent).toBe("/start");
  });

  test("download uses the current URL after a prop update and exactly one caller callback per click", () => {
    const download = vi.fn(), click = vi.fn();
    const api = { utils: { download } };
    const { rerender } = render(shell(<BaseButton download downloadUrl="/api/first" text="Download action" onClick={click} />, api));
    fireEvent.click(screen.getByRole("button", { name: "Download action" }));
    rerender(shell(<BaseButton download downloadUrl="/api/second" text="Download action" onClick={click} />, api));
    fireEvent.click(screen.getByRole("button", { name: "Download action" }));
    expect(download.mock.calls).toEqual([["/api/first"], ["/api/second"]]);
    expect(click).toHaveBeenCalledTimes(2);
    // Relative ordering of the download and caller callbacks is pending
    // execution against Vue runtime; no order parity is asserted here.
  });

  test("RecipeChips prevent modifier preserves payload identity and does not imply stopPropagation", () => {
    const item = { id: "review-item", slug: "review-item", name: "Review category" };
    const selected = vi.fn();
    const parent = vi.fn((event: MouseEvent<HTMLElement>) => {
      expect(event.defaultPrevented).toBe(true);
    });
    render(<div onClick={parent}><RecipeChips items={[item]} urlPrefix="tools" onItemSelected={selected} /></div>);
    const event = new globalThis.MouseEvent("click", { bubbles: true, cancelable: true });
    fireEvent(screen.getByRole("button", { name: "Review category" }), event);
    expect(event.defaultPrevented).toBe(true);
    expect(selected).toHaveBeenCalledExactlyOnceWith(item, "tools");
    expect(parent).toHaveBeenCalledTimes(1);
  });
});
