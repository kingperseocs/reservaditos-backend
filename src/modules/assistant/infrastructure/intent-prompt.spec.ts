import { buildSystemPrompt, parseExtractedIntent } from './intent-prompt';

describe('intent prompt', () => {
  it('keeps well-formed values from the model', () => {
    expect(
      parseExtractedIntent({
        areaId: 'grill',
        date: '2026-11-14',
        startTime: '19:00',
        endTime: '22:00',
      }),
    ).toEqual({
      areaId: 'grill',
      date: '2026-11-14',
      startTime: '19:00',
      endTime: '22:00',
    });
  });

  it('turns malformed or missing values into null', () => {
    expect(
      parseExtractedIntent({ areaId: '', date: '14/11', startTime: '7pm' }),
    ).toEqual({ areaId: null, date: null, startTime: null, endTime: null });
    expect(parseExtractedIntent(undefined).areaId).toBeNull();
  });

  it('gives the model today, the weekday and the area catalog', () => {
    const prompt = buildSystemPrompt({
      message: 'quiero la parrilla el sábado',
      today: '2026-11-11',
      timezone: 'America/Lima',
      areas: [{ id: 'grill', name: 'Parrilla', slots: ['19:00–22:00'] }],
    });

    expect(prompt).toContain('Today is miércoles 2026-11-11');
    expect(prompt).toContain('- grill: Parrilla (slots: 19:00–22:00)');
  });
});
