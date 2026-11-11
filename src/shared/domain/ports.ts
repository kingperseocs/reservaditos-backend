export const CLOCK = Symbol('CLOCK');
export interface Clock {
  now(): Date;
}

export const RANDOM_GENERATOR = Symbol('RANDOM_GENERATOR');
export interface RandomGenerator {
  uuid(): string;
  digits(length: number): string;
}

export const BUILDING_SETTINGS = Symbol('BUILDING_SETTINGS');
export interface BuildingSettings {
  name: string;
  /** Prefix of confirmation codes, e.g. DEMO-4821 */
  code: string;
  timezone: string;
  publicBaseUrl: string;
}
