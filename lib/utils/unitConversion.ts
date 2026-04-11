/**
 * Unit conversion utilities for recipe measurements.
 * All results are rounded to 2 decimal places.
 */

// Temperature conversions

export function celsiusToFahrenheit(c: number): number {
  return Math.round((c * 9 / 5 + 32) * 100) / 100;
}

export function fahrenheitToCelsius(f: number): number {
  return Math.round(((f - 32) * 5 / 9) * 100) / 100;
}

// Volume conversions

export function mlToCups(ml: number): number {
  return Math.round((ml / 236.588) * 100) / 100;
}

export function cupsToMl(cups: number): number {
  return Math.round((cups * 236.588) * 100) / 100;
}

export function mlToTablespoons(ml: number): number {
  return Math.round((ml / 14.787) * 100) / 100;
}

export function tablespoonsToMl(tbsp: number): number {
  return Math.round((tbsp * 14.787) * 100) / 100;
}

export function mlToTeaspoons(ml: number): number {
  return Math.round((ml / 4.929) * 100) / 100;
}

export function teaspoonsToMl(tsp: number): number {
  return Math.round((tsp * 4.929) * 100) / 100;
}

// Weight conversions

export function gramsToOunces(g: number): number {
  return Math.round((g / 28.3495) * 100) / 100;
}

export function ouncesToGrams(oz: number): number {
  return Math.round((oz * 28.3495) * 100) / 100;
}

export function kgToLbs(kg: number): number {
  return Math.round((kg * 2.20462) * 100) / 100;
}

export function lbsToKg(lbs: number): number {
  return Math.round((lbs / 2.20462) * 100) / 100;
}
