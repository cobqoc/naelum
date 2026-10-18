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
 * 2026-10-19 (감사 PHR-07 후속): 낭독 언어를 화면 언어로 — 예전엔 /en 화면의 영문 단계도 ko-KR 음성으로 읽었다.
 */
const SPEECH_LANG: Record<string, string> = {
  ko: 'ko-KR', en: 'en-US', ja: 'ja-JP', zh: 'zh-CN', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', it: 'it-IT',
};

export function useVoiceGuide() {
  const { t, language } = useI18n();
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
    // 화면 언어의 음성 우선 — 없으면 lang 만 지정해 브라우저 기본 음성에 맡김
    const lang = SPEECH_LANG[language] ?? 'ko-KR';
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.startsWith(lang.slice(0, 2)));
    if (voice) {
      utterance.voice = voice;
    }
    utterance.lang = lang;
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isSupported, t, language]);

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
