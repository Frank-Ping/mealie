import { useSyncExternalStore } from "react";

export type DeepReadonly<T> = T extends (infer Item)[] ? readonly DeepReadonly<Item>[] : T extends object ? { readonly [Key in keyof T]: DeepReadonly<T[Key]> } : T;
export interface Snapshot<T> { readonly data: DeepReadonly<T>; readonly loading: boolean; readonly initialized: boolean; readonly error: string | null }

function frozenCopy<T>(value: T): DeepReadonly<T> {
  const copy: unknown = structuredClone(value);
  const seen = new WeakSet<object>();
  function freeze(node: unknown): void {
    if (!node || typeof node !== "object" || seen.has(node)) return;
    if (!Array.isArray(node) && Object.getPrototypeOf(node) !== Object.prototype) throw new Error("R25: store supports plain data only");
    seen.add(node);
    Object.values(node).forEach(freeze);
    Object.freeze(node);
  }
  freeze(copy);
  return copy as DeepReadonly<T>;
}

// This tested primitive does not decide food-store tenant keys or API behavior.
export function createSharedStore<T>(initial: T) {
  const initialData = structuredClone(initial);
  const listeners = new Set<() => void>();
  let epoch = 0;
  let flight: Promise<void> | null = null;
  let snapshot: Snapshot<T> = Object.freeze({ data: frozenCopy(initial), loading: false, initialized: false, error: null });
  function publish(next: Snapshot<T>) { snapshot = Object.freeze(next); listeners.forEach(listener => listener()); }
  const store = {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    set(data: T) { publish({ ...snapshot, data: frozenCopy(data) }); },
    reset() { epoch++; flight = null; publish({ data: frozenCopy(initialData), loading: false, initialized: false, error: null }); },
    ensureLoaded(loader: () => Promise<T>): Promise<void> {
      if (flight) return flight;
      if (snapshot.initialized) return Promise.resolve();
      const generation = epoch;
      publish({ ...snapshot, loading: true, error: null });
      const current = Promise.resolve().then(loader).then(data => {
        if (generation === epoch) publish({ data: frozenCopy(data), loading: false, initialized: true, error: null });
      }, (error: unknown) => {
        if (generation === epoch) publish({ ...snapshot, loading: false, error: error instanceof Error ? error.message : String(error) });
      }).finally(() => { if (flight === current) flight = null; });
      flight = current;
      return current;
    },
  };
  return store;
}
export function useSharedStore<T>(store: ReturnType<typeof createSharedStore<T>>) {
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}
