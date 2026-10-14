export interface RouteMap {
  version: number;
  takeoverEnabled: boolean;
  groupSlug: string | null;
  explicitVueQuery: { name: string; value: string };
  vueModes: string[];
  excludedSlugs: string[];
}
export function ownsReact(target: string, map: RouteMap): boolean;
export function explicitVue(target: string, map: RouteMap): string;
