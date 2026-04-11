/**
 * 범용 자동완성 컴포넌트 타입 정의
 * Generic 타입을 사용하여 다양한 항목(재료, 요리명, 태그 등)에 재사용 가능
 */

/**
 * 자동완성 아이템의 기본 인터페이스
 * 모든 자동완성 항목은 이 인터페이스를 확장해야 함
 */
export interface AutocompleteItem {
  /** 고유 식별자 */
  id: string;

  /** 표시될 메인 텍스트 */
  label: string;

  /** 보조 텍스트 (예: 영어명, 설명) */
  secondaryLabel?: string;

  /** 아이콘 (이모지 또는 URL) */
  icon?: string;

  /** 뱃지 텍스트 (예: 카테고리명) */
  badge?: string;

  /** 추가 메타데이터 (타입별로 자유롭게 확장 가능) */
  metadata?: Record<string, unknown>;
}

/**
 * 자동완성 컴포넌트 Props
 * Generic 타입 T는 AutocompleteItem을 확장한 타입이어야 함
 */
export interface AutocompleteProps<T extends AutocompleteItem> {
  // ===== 기본 Props =====

  /** 현재 입력값 */
  value: string;

  /** 입력값 변경 핸들러 */
  onChange: (value: string) => void;

  /** 항목 선택 핸들러 */
  onSelect: (item: T) => void;

  /** Placeholder 텍스트 */
  placeholder?: string;

  // ===== 데이터 Fetching =====

  /**
   * 자동완성 제안을 가져오는 함수
   * @param query - 검색어
   * @returns 검색 결과 배열
   */
  fetchSuggestions: (query: string) => Promise<T[]>;

  /** 최소 검색어 길이 (기본값: 2) */
  minQueryLength?: number;

  /** 디바운싱 시간 (ms, 기본값: 300) */
  debounceMs?: number;

  // ===== 추가 기능 =====

  /** 커스텀 입력 허용 여부 */
  allowCustomInput?: boolean;

  /**
   * 커스텀 입력 핸들러 (검색 결과 없을 때 호출)
   * @param value - 입력한 커스텀 값
   */
  onCustomInput?: (value: string) => void;

  /** 최근 선택한 항목 목록 */
  recentItems?: T[];

  /** 최근 항목 전체 삭제 핸들러 */
  onRecentItemsClear?: () => void;

  /** 필터 컴포넌트 (검색창과 드롭다운 사이에 삽입) */
  filterComponent?: React.ReactNode;

  // ===== 커스터마이징 =====

  /**
   * 커스텀 항목 렌더링 함수
   * @param item - 렌더링할 항목
   * @param isSelected - 현재 선택된 항목인지 여부
   * @returns 렌더링할 ReactNode
   */
  renderItem?: (item: T, isSelected: boolean) => React.ReactNode;

  /** 검색 결과 없을 때 렌더링할 커스텀 UI */
  renderNoResults?: () => React.ReactNode;

  /** 로딩 중일 때 렌더링할 커스텀 UI */
  renderLoading?: () => React.ReactNode;

  // ===== 스타일링 =====

  /** 입력창 컨테이너 클래스명 */
  className?: string;

  /** 드롭다운 클래스명 */
  dropdownClassName?: string;

  // ===== 접근성 =====

  /** ARIA 레이블 */
  ariaLabel?: string;

  /** 입력창 비활성화 */
  disabled?: boolean;
}

/**
 * 자동완성 드롭다운 섹션 인터페이스
 * 최근 항목, 검색 결과 등 여러 섹션을 구분하기 위해 사용
 */
export interface AutocompleteSection<T extends AutocompleteItem> {
  /** 섹션 제목 */
  title: string;

  /** 섹션에 표시할 항목들 */
  items: T[];

  /** 섹션별 액션 버튼 (예: "전체 삭제") */
  action?: {
    label: string;
    onClick: () => void;
  };
}
