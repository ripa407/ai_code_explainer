type RouteParams = Record<string, string | string[] | undefined>;

/** Normalize Express route params (`string | string[]`) to a single `string`. */
export function getRouteParam(params: RouteParams, key: string): string {
  const value = params[key];

  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value) && value.length > 0) {
    return value[0];
  }

  throw new Error(`Route param "${key}" is required`);
}
