/**
 * user_interests.interest_type 값.
 *
 * 현재 코드 전체에서 'cuisine' 단일 값만 사용 (요리 종류 관심사).
 * 미래 'diet'·'meal_type'·'technique' 등 확장 시 여기에 추가하면
 * 단일 진실 소스로 전파됨. dead literal 7곳 → 한 곳에 모음.
 */
export const INTEREST_TYPE_CUISINE = 'cuisine' as const;
