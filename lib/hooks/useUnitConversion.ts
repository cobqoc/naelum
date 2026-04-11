'use client';

import { useState, useCallback } from 'react';
import {
  gramsToOunces, ouncesToGrams,
  mlToCups, cupsToMl,
  mlToTablespoons, tablespoonsToMl,
  mlToTeaspoons, teaspoonsToMl,
  kgToLbs, lbsToKg,
  celsiusToFahrenheit, fahrenheitToCelsius,
} from '@/lib/utils/unitConversion';

export type UnitSystem = 'metric' | 'imperial';

const STORAGE_KEY = 'naelum_unit_system';

// Unit mappings: metric -> imperial
const UNIT_CONVERSIONS: Record<string, {
  to: string;
  convert: (v: number) => number;
  reverse: (v: number) => number;
}> = {
  'g': { to: 'oz', convert: gramsToOunces, reverse: ouncesToGrams },
  'kg': { to: 'lb', convert: kgToLbs, reverse: lbsToKg },
  'ml': { to: 'cup', convert: mlToCups, reverse: cupsToMl },
  'L': { to: 'cup', convert: (v) => mlToCups(v * 1000), reverse: (v) => cupsToMl(v) / 1000 },
  '큰술': { to: 'tbsp', convert: (v) => v, reverse: (v) => v },
  '작은술': { to: 'tsp', convert: (v) => v, reverse: (v) => v },
  'tbsp': { to: 'ml', convert: tablespoonsToMl, reverse: mlToTablespoons },
  'tsp': { to: 'ml', convert: teaspoonsToMl, reverse: mlToTeaspoons },
  'cup': { to: 'ml', convert: cupsToMl, reverse: mlToCups },
  'oz': { to: 'g', convert: ouncesToGrams, reverse: gramsToOunces },
  'lb': { to: 'kg', convert: lbsToKg, reverse: kgToLbs },
  '°C': { to: '°F', convert: celsiusToFahrenheit, reverse: fahrenheitToCelsius },
  '°F': { to: '°C', convert: fahrenheitToCelsius, reverse: celsiusToFahrenheit },
};

// Korean unit aliases
const UNIT_ALIASES: Record<string, string> = {
  '그램': 'g',
  '킬로그램': 'kg',
  '밀리리터': 'ml',
  '리터': 'L',
  '컵': 'cup',
  '온스': 'oz',
  '파운드': 'lb',
};

function normalizeUnit(unit: string): string {
  return UNIT_ALIASES[unit] || unit;
}

export interface ConvertedIngredient {
  ingredient_name: string;
  quantity: string;
  unit: string;
  originalQuantity: string;
  originalUnit: string;
  isConverted: boolean;
}

export function useUnitConversion() {
  const [system, setSystem] = useState<UnitSystem>(() => {
    if (typeof window === 'undefined') return 'metric';
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'imperial' ? 'imperial' : 'metric';
  });

  const toggleSystem = useCallback(() => {
    setSystem(prev => {
      const next = prev === 'metric' ? 'imperial' : 'metric';
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const convertIngredient = useCallback((
    quantity: string,
    unit: string,
  ): { quantity: string; unit: string; isConverted: boolean } => {
    if (system === 'metric') {
      return { quantity, unit, isConverted: false };
    }

    const normalizedUnit = normalizeUnit(unit);
    const conversion = UNIT_CONVERSIONS[normalizedUnit];

    if (!conversion) {
      return { quantity, unit, isConverted: false };
    }

    const numValue = parseFloat(quantity);
    if (isNaN(numValue)) {
      return { quantity, unit, isConverted: false };
    }

    const converted = conversion.convert(numValue);
    // Format nicely
    const formatted = converted < 0.01 ? converted.toString() :
      converted < 1 ? converted.toFixed(2) :
      converted < 10 ? converted.toFixed(1) :
      Math.round(converted).toString();

    return {
      quantity: formatted,
      unit: conversion.to,
      isConverted: true,
    };
  }, [system]);

  const convertIngredients = useCallback((
    ingredients: { ingredient_name: string; quantity: string; unit: string; notes?: string }[]
  ): ConvertedIngredient[] => {
    return ingredients.map(ing => {
      const result = convertIngredient(ing.quantity, ing.unit);
      return {
        ingredient_name: ing.ingredient_name,
        quantity: result.quantity,
        unit: result.unit,
        originalQuantity: ing.quantity,
        originalUnit: ing.unit,
        isConverted: result.isConverted,
      };
    });
  }, [convertIngredient]);

  return {
    system,
    toggleSystem,
    isImperial: system === 'imperial',
    convertIngredient,
    convertIngredients,
  };
}
