'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useI18n } from '@/lib/i18n/context';

/**
 * 조리 단계 음성 안내 — StepsTab 의 🔊 버튼이 누를 때마다 해당 단계를 즉시 낭독.
 *
 * 2026-10-04 [PHR-07] 정리(행위 보존): 옛 RecipeCookMode/CookVoicePanel(2026-09-27 삭제)용 공개 API
 * (speak·speakStep·toggle·isEnabled·isSpeaking·speed·setSpeed·speakDirect·stop)는 호출처 0 이라 제거하고,
 * 유일한 소비자(RecipeBrowseView → StepsTab)가 쓰는 `isSupported`·`speakStepDirect` 만 남겼다.
 * 26줄 복붙이던 speak/speakDirect 본문은 이 한 벌만 남음. 발화 설정은 그대로 — rate 1.0(옛 기본 속도
 * 'normal', setSpeed 호출처 없었음)·pitch·volume 1.0·한국어 voice 우선·lang 'ko-KR'.
 * isSpeaking state 는 읽는 곳이 없어 발화 시작/끝마다 RecipeBrowseView 전체를 재렌더시키기만 했으므로 제거.
 * (UI 로케일과 무관하게 ko-KR 로 읽는 문제는 동작 변경이라 별도 결정 — 손대지 않음.)
 */
export function useVoiceGuide() {
  const { t } = useI18n();
  const [isSupported, setIsSupported] = useState(false);
  // 발화 중 utterance 가 GC 되지 않도록 참조 유지(옛 코드와 동일)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);
  }, []);

  // isEnabled 게이트 없이 즉시 읽기 — 버튼 클릭 직접 호출용
  const speakStepDirect = useCallback((stepNumber: number, instruction: string, tip?: string) => {
    let text = `${t.cookMode.voiceStepPrefix.replace('{n}', String(stepNumber))} ${instruction}`;
    if (tip) {
      text += ` ${t.cookMode.voiceTipPrefix} ${tip}`;
    }
    if (!isSupported) return;
    // 진행 중인 발화 중단 후 새로 읽기(옛 stop() 의 cancel)
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    // Try to find a Korean voice
    const voices = window.speechSynthesis.getVoices();
    const koreanVoice = voices.find(v => v.lang.startsWith('ko'));
    if (koreanVoice) {
      utterance.voice = koreanVoice;
    }
    utterance.lang = 'ko-KR';
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isSupported, t]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    isSupported,
    speakStepDirect,
  };
}
