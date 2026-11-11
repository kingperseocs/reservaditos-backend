import {
  ExtractedIntent,
  ExtractionContext,
  IntentExtractor,
} from '../../src/modules/assistant/domain/intent-extractor';

/** Stands in for Gemini/Claude in tests: returns what the test programs. */
export class FakeIntentExtractor implements IntentExtractor {
  lastContext?: ExtractionContext;
  private next: ExtractedIntent | Error = {
    areaId: null,
    date: null,
    startTime: null,
    endTime: null,
  };

  willReturn(intent: ExtractedIntent): void {
    this.next = intent;
  }

  willFail(error: Error): void {
    this.next = error;
  }

  extract(context: ExtractionContext): Promise<ExtractedIntent> {
    this.lastContext = context;
    return this.next instanceof Error
      ? Promise.reject(this.next)
      : Promise.resolve(this.next);
  }
}
