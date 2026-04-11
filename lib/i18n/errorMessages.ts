/**
 * Supabase 및 일반 에러 메시지를 한국어로 변환하는 유틸리티
 */

const errorMessages: Record<string, string> = {
  // 비밀번호 관련
  'New password should be different from the old password': '새 비밀번호는 기존 비밀번호와 달라야 합니다',
  'Password should be at least 6 characters': '비밀번호는 최소 6자 이상이어야 합니다',
  'Password is too weak': '비밀번호가 너무 약합니다',

  // 로그인 관련
  'Invalid login credentials': '이메일 또는 비밀번호가 일치하지 않습니다',
  'Email not confirmed': '이메일 인증이 필요합니다',
  'Invalid email or password': '이메일 또는 비밀번호가 일치하지 않습니다',
  'User not found': '사용자를 찾을 수 없습니다',

  // 회원가입 관련
  'User already registered': '이미 등록된 이메일입니다',
  'Email already registered': '이미 등록된 이메일입니다',
  'Signup requires a valid password': '유효한 비밀번호가 필요합니다',
  'Unable to validate email address: invalid format': '올바른 이메일 형식이 아닙니다',

  // 세션 관련
  'Session expired': '세션이 만료되었습니다',
  'Invalid token': '유효하지 않은 토큰입니다',
  'Token has expired': '토큰이 만료되었습니다',
  'No user found': '사용자를 찾을 수 없습니다',

  // 이메일 관련
  'Email link is invalid or has expired': '이메일 링크가 유효하지 않거나 만료되었습니다',
  'Invalid email': '올바른 이메일 형식이 아닙니다',
  'For security purposes, you can only request this once every 60 seconds': '보안을 위해 60초마다 한 번만 요청할 수 있습니다',

  // 일반 에러
  'Network error': '네트워크 오류가 발생했습니다',
  'Server error': '서버 오류가 발생했습니다',
  'Something went wrong': '오류가 발생했습니다',
  'Unable to process request': '요청을 처리할 수 없습니다',

  // OAuth 관련
  'OAuth error': 'OAuth 인증 중 오류가 발생했습니다',
  'Callback URL mismatch': '콜백 URL이 일치하지 않습니다',
};

/**
 * 에러 메시지를 한국어로 변환합니다.
 * 매칭되는 메시지가 없으면 기본 에러 메시지를 반환합니다.
 *
 * @param error - 에러 메시지 문자열 또는 에러 객체
 * @returns 한국어로 변환된 에러 메시지
 */
export function translateError(error: string | { message?: string } | null | undefined): string {
  if (!error) {
    return '알 수 없는 오류가 발생했습니다';
  }

  const errorMessage = typeof error === 'string' ? error : error.message || '알 수 없는 오류가 발생했습니다';

  // 정확히 일치하는 메시지 찾기
  if (errorMessages[errorMessage]) {
    return errorMessages[errorMessage];
  }

  // 부분 일치 검색 (case-insensitive)
  const lowerMessage = errorMessage.toLowerCase();
  for (const [key, value] of Object.entries(errorMessages)) {
    if (lowerMessage.includes(key.toLowerCase())) {
      return value;
    }
  }

  // 특정 패턴 매칭
  if (lowerMessage.includes('password')) {
    if (lowerMessage.includes('weak') || lowerMessage.includes('strong')) {
      return '비밀번호가 너무 약합니다';
    }
    if (lowerMessage.includes('match') || lowerMessage.includes('same') || lowerMessage.includes('different')) {
      return '새 비밀번호는 기존 비밀번호와 달라야 합니다';
    }
    if (lowerMessage.includes('short') || lowerMessage.includes('length') || lowerMessage.includes('characters')) {
      return '비밀번호는 최소 8자 이상이어야 합니다';
    }
    return '비밀번호 오류가 발생했습니다';
  }

  if (lowerMessage.includes('email')) {
    if (lowerMessage.includes('invalid') || lowerMessage.includes('format')) {
      return '올바른 이메일 형식이 아닙니다';
    }
    if (lowerMessage.includes('exists') || lowerMessage.includes('already') || lowerMessage.includes('registered')) {
      return '이미 등록된 이메일입니다';
    }
    if (lowerMessage.includes('confirm') || lowerMessage.includes('verify')) {
      return '이메일 인증이 필요합니다';
    }
    return '이메일 오류가 발생했습니다';
  }

  if (lowerMessage.includes('network')) {
    return '네트워크 오류가 발생했습니다';
  }

  if (lowerMessage.includes('token') || lowerMessage.includes('session') || lowerMessage.includes('expire')) {
    return '세션이 만료되었습니다. 다시 로그인해주세요';
  }

  if (lowerMessage.includes('credentials') || lowerMessage.includes('login') || lowerMessage.includes('incorrect')) {
    return '이메일 또는 비밀번호가 일치하지 않습니다';
  }

  // 매칭되지 않으면 원본 메시지 반환 (개발용)
  // 프로덕션에서는 일반적인 메시지로 대체할 수 있습니다
  return errorMessage || '알 수 없는 오류가 발생했습니다';
}

/**
 * 여러 에러 메시지를 한국어로 변환합니다.
 *
 * @param errors - 에러 메시지 배열
 * @returns 한국어로 변환된 에러 메시지 배열
 */
export function translateErrors(errors: Array<string | { message?: string }>): string[] {
  return errors.map(translateError);
}

/**
 * 에러 객체에서 메시지를 추출하고 번역합니다.
 *
 * @param error - 에러 객체 (다양한 형식 지원)
 * @returns 한국어로 변환된 에러 메시지
 */
export function getTranslatedErrorMessage(error: unknown): string {
  if (!error) {
    return '알 수 없는 오류가 발생했습니다';
  }

  // error가 문자열인 경우
  if (typeof error === 'string') {
    return translateError(error);
  }

  if (typeof error === 'object') {
    const err = error as Record<string, unknown>;

    // error.message가 있는 경우
    if (typeof err.message === 'string') {
      return translateError(err.message);
    }

    // error.error가 있는 경우 (중첩된 에러)
    if (err.error) {
      return getTranslatedErrorMessage(err.error);
    }

    // error_description이 있는 경우 (OAuth 에러)
    if (typeof err.error_description === 'string') {
      return translateError(err.error_description);
    }
  }

  return '알 수 없는 오류가 발생했습니다';
}
