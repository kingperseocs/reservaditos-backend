export const INTENT_EXTRACTOR = Symbol('INTENT_EXTRACTOR');

/** What the model could read from the message. Unknown fields are null; it never guesses. */
export interface ExtractedIntent {
  areaId: string | null;
  /** yyyy-MM-dd */
  date: string | null;
  /** HH:mm (24 h) */
  startTime: string | null;
  /** HH:mm (24 h) */
  endTime: string | null;
}

export interface ExtractionContext {
  message: string;
  /** yyyy-MM-dd in the building time zone */
  today: string;
  timezone: string;
  areas: { id: string; name: string; slots: string[] }[];
}

/** Port implemented by each AI provider (Gemini, Anthropic, fakes in tests). */
export interface IntentExtractor {
  extract(context: ExtractionContext): Promise<ExtractedIntent>;
}
