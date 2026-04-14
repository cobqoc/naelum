// 재료 카테고리별 pill 색상 — fridge/page.tsx, FridgeDropdown.tsx 공용

export const CATEGORY_PILL_LIGHT: Record<string, string> = {
  veggie:    'bg-green-100 text-green-800 ring-1 ring-green-300/70',
  meat:      'bg-red-100 text-red-800 ring-1 ring-red-300/70',
  seafood:   'bg-sky-100 text-sky-800 ring-1 ring-sky-300/70',
  grain:     'bg-lime-100 text-lime-800 ring-1 ring-lime-300/70',
  dairy:     'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-300/70',
  seasoning: 'bg-violet-100 text-violet-800 ring-1 ring-violet-300/70',
  condiment: 'bg-teal-100 text-teal-800 ring-1 ring-teal-300/70',
  fruit:     'bg-orange-100 text-orange-800 ring-1 ring-orange-300/70',
  other:     'bg-indigo-100 text-indigo-800 ring-1 ring-indigo-300/70',
};

export const CATEGORY_PILL_FREEZER: Record<string, string> = {
  veggie:    'bg-green-400/30 text-green-200 ring-1 ring-green-400/40',
  meat:      'bg-red-400/30 text-red-200 ring-1 ring-red-400/40',
  seafood:   'bg-sky-400/30 text-sky-200 ring-1 ring-sky-400/40',
  grain:     'bg-lime-400/30 text-lime-200 ring-1 ring-lime-400/40',
  dairy:     'bg-yellow-300/30 text-yellow-200 ring-1 ring-yellow-300/40',
  seasoning: 'bg-violet-400/30 text-violet-200 ring-1 ring-violet-400/40',
  condiment: 'bg-teal-400/30 text-teal-200 ring-1 ring-teal-400/40',
  fruit:     'bg-orange-400/30 text-orange-200 ring-1 ring-orange-400/40',
  other:     'bg-indigo-400/30 text-indigo-200 ring-1 ring-indigo-400/40',
};
