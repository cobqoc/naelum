import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // `_` 접두 인자/변수는 "의도적 미사용"의 표준 관례.
  // 이걸 honor 하지 않으면 stub/shim 시그니처(lib/supabase/shims/*)·미래 확장용
  // placeholder 가 전부 노이즈 경고가 되어 진짜 미사용(=실수)을 가린다.
  // (영상 「2차 소프트웨어 위기」: 용인된 노이즈가 신호를 가린다 — 그 노이즈를 제거)
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
    },
  },
  // scripts/** 는 일회성 렌더·임포트·시드 도구다(배포 산출물 아님).
  // 여기서의 미사용 변수는 추적 가치 < 노이즈 비용 — 제품 코드의 진짜 신호를
  // 가리지 않도록 이 카테고리만 명시적으로 완화한다(블랭킷 억제 아님, 사유 있는 스코핑).
  {
    files: ["scripts/**"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Playwright test artifacts:
    "playwright-report/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;
