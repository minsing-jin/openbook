declare module "@mozilla/readability" {
  export interface ReadabilityResult {
    title?: string;
    content?: string;
  }

  export class Readability {
    constructor(document: Document, options?: Record<string, unknown>);
    parse(): ReadabilityResult | null;
  }
}
