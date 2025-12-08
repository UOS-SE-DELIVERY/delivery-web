import axios from 'axios';
import { MessageCircle, Send, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';

import { getAuthMeAPI } from '@/api/auth/me/me.api';
import { postOrderAPI } from '@/api/order/order.api';
import { useAuthStore } from '@/store/authStore';
import type { OrderItem, OrderRequest } from '@/types/order';
import type { Profile, ProfileAddress } from '@/types/profile';

// Web Speech API 타입 선언
interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onstart: (() => void) | null;
  start(): void;
  stop(): void;
}

interface ISpeechRecognitionConstructor {
  new (): ISpeechRecognition;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

interface ChatbotResponse {
  reply: string;
  order_state: Record<string, unknown>;
  finished: boolean;
}

// 챗봇 서버 전용 Axios 인스턴스 (다른 도메인)
const chatbotClient = axios.create({
  baseURL: 'http://localhost:9000',
  timeout: 300000, // 5분
});

export function ChatbotOrder() {
  const navigate = useNavigate();
  const isLogin = useAuthStore(s => s.isLogin);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState<string | undefined>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessionId] = useState(
    () => `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [speechSupported, setSpeechSupported] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const requestAbortRef = useRef<AbortController | null>(null);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [ttsSupported, setTtsSupported] = useState(false);

  // 스크롤을 맨 아래로 이동
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // 메시지가 추가될 때마다 스크롤
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // 브라우저 음성 인식 지원 여부 확인
  useEffect(() => {
    const SR =
      (
        window as unknown as {
          SpeechRecognition?: ISpeechRecognitionConstructor;
        }
      ).SpeechRecognition ||
      (
        window as unknown as {
          webkitSpeechRecognition?: ISpeechRecognitionConstructor;
        }
      ).webkitSpeechRecognition;
    setSpeechSupported(!!SR);

    // TTS 지원 여부 확인
    setTtsSupported('speechSynthesis' in window);
  }, []);

  // 사용자 정보 가져오기
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await getAuthMeAPI();
        const me = response.data as Profile;
        if (me?.username) setUserName(me.username);
        setProfile(me);
      } catch (err) {
        console.error('사용자 정보 조회 실패:', err);
        setErrorText('로그인 정보를 불러오지 못해 게스트로 진행합니다.');
      }
    };
    fetchUserInfo();
  }, []);

  // TTS로 텍스트 읽기
  const speakText = useCallback(
    (text: string) => {
      if (!ttsEnabled || !ttsSupported) return;

      // 이미 말하고 있으면 중지
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = 1.5; // 1.0 → 1.5으로 속도 증가 (50% 빠름)
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      window.speechSynthesis.speak(utterance);
    },
    [ttsEnabled, ttsSupported],
  );

  const sendMessage = useCallback(
    async (textToSend: string) => {
      // 로그인 필요 가드
      if (!isLogin) {
        setShowLoginPrompt(true);
        return;
      }
      if (!textToSend.trim()) return;

      // 이미 로딩 중이면 중복 요청 방지
      if (isLoading) return;

      const userMessage: ChatMessage = {
        role: 'user',
        text: textToSend,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMessage]);
      setInputText('');
      setIsLoading(true);
      setErrorText(null);

      try {
        const controller = new AbortController();
        requestAbortRef.current = controller;
        const response = await chatbotClient.post<ChatbotResponse>(
          '/chatbot',
          {
            session_id: sessionId,
            text: textToSend,
            user_name: userName,
          },
          {
            signal: controller.signal as AbortSignal,
          },
        );

        const botMessage: ChatMessage = {
          role: 'bot',
          text: response.data.reply,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, botMessage]);

        // TTS로 봇 응답 읽기
        speakText(response.data.reply);

        // 주문이 완료되면 서버 주문 생성 진행
        if (response.data.finished) {
          const state = response.data.order_state as any;
          // order_state에서 dinner code/style/items 추출
          let dinnerCode = '';
          let dinnerStyle = '';
          let dinnerQuantity = '1';
          let items: OrderItem[] = [];

          if (state?.dinner?.code && state?.dinner?.style) {
            dinnerCode = String(state.dinner.code);
            dinnerStyle = String(state.dinner.style);
            dinnerQuantity = String(state.dinner.quantity || '1');
          } else if (
            Array.isArray(state?.dinners) &&
            state.dinners[0]?.dinner
          ) {
            const firstDinner = state.dinners[0];
            dinnerCode = String(firstDinner.dinner.code || '');
            dinnerStyle = String(firstDinner.dinner.style || '');
            dinnerQuantity = String(firstDinner.dinner.quantity || '1');

            // items 추출 및 변환 (추가 아이템)
            if (Array.isArray(firstDinner.items)) {
              items = firstDinner.items.map((item: any) => ({
                code: String(item.code || ''),
                qty: String(item.qty || '0'),
                options: item.options || [],
              }));
            }
          }

          // 사용자 프로필 정보로 수신자/주소 채우기
          const me = profile;
          const pickDefaultAddress = (addresses?: ProfileAddress[]) => {
            if (!addresses || !addresses.length) return null;
            const def = addresses.find(a => a.is_default) || addresses[0];
            return def || null;
          };
          const addr = pickDefaultAddress(me?.addresses);

          const orderBody: OrderRequest = {
            customer_id: me?.customer_id ?? 0,
            order_source: 'VOICE',
            fulfillment_type: 'DELIVERY',
            dinner: {
              code: dinnerCode,
              quantity: dinnerQuantity,
              style: dinnerStyle,
              dinner_options: [],
              default_overrides: [],
            },
            items: items.length > 0 ? items : undefined,
            receiver_name: me?.real_name ?? '',
            receiver_phone: me?.phone ?? '',
            delivery_address: addr?.line ?? '',
            geo_lat: addr?.lat,
            geo_lng: addr?.lng,
            place_label: addr?.label,
            coupons: [],
          };

          try {
            const orderRes = await postOrderAPI(orderBody);
            console.log('주문 생성 완료:', orderRes.data);
            // 주문 완료 안내 후 내 주문 내역으로 이동
            alert('주문이 완료되었습니다!');
            navigate('/orders/me');
          } catch (e) {
            console.error('주문 생성 실패:', e);
            setErrorText(
              '주문 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
            );
          }
        }
      } catch (err) {
        console.error('챗봇 요청 실패:', err);
        // 취소된 요청이면 사용자에게 표시하지 않음
        const error = err as {
          name?: string;
          code?: string;
          message?: string;
          response?: { data?: { message?: string } };
        };
        const isCanceled =
          error?.name === 'CanceledError' ||
          error?.code === 'ERR_CANCELED' ||
          error?.message?.includes('aborted');
        if (!isCanceled) {
          const serverMsg = error?.response?.data?.message;
          const friendly =
            serverMsg ||
            '죄송합니다. 네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
          setErrorText(friendly);
          const errorMessage: ChatMessage = {
            role: 'bot',
            text: friendly,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, errorMessage]);
        }
      } finally {
        setIsLoading(false);
        requestAbortRef.current = null;
      }
    },
    [isLoading, sessionId, userName, isLogin, navigate],
  );

  // 음성 인식 시작
  const startListening = useCallback(() => {
    if (isRecognizing) return;
    const SR =
      (
        window as unknown as {
          SpeechRecognition?: ISpeechRecognitionConstructor;
        }
      ).SpeechRecognition ||
      (
        window as unknown as {
          webkitSpeechRecognition?: ISpeechRecognitionConstructor;
        }
      ).webkitSpeechRecognition;
    if (!SR) return;

    // 마이크 접근 사전 확인 (권한/장치 점검)
    const getMedia = navigator.mediaDevices?.getUserMedia
      ? navigator.mediaDevices.getUserMedia({ audio: true })
      : Promise.reject(new Error('getUserMedia not supported'));

    getMedia
      .then(() => {
        const recognition = new SR();
        recognition.lang = 'ko-KR';
        recognition.interimResults = true;
        recognition.continuous = false;

        recognition.onstart = () => {
          setIsRecognizing(true);
          setInterimText('');
          setErrorText(null);
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('음성인식 오류:', event);
          setIsRecognizing(false);
          const reason = event.error;
          if (reason === 'audio-capture') {
            setErrorText(
              '마이크 장치를 찾을 수 없거나 접근할 수 없습니다. 장치 연결/권한을 확인해주세요.',
            );
          } else if (
            reason === 'not-allowed' ||
            reason === 'service-not-allowed'
          ) {
            setErrorText(
              '마이크 권한이 거부되었습니다. 브라우저 권한을 확인해주세요.',
            );
          } else if (reason === 'network') {
            setErrorText('음성 인식 네트워크 오류가 발생했습니다.');
          } else if (reason === 'no-speech') {
            setErrorText('음성이 감지되지 않았습니다. 다시 시도해주세요.');
          } else {
            setErrorText('음성 인식 중 오류가 발생했습니다.');
          }
          recognitionRef.current = null;
          try {
            recognition.stop();
          } catch {
            // ignore
          }
        };

        recognition.onend = () => {
          setIsRecognizing(false);
          recognitionRef.current = null;
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let interim = '';
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interim += transcript;
            }
          }
          if (interim) {
            setInterimText(interim);
          }
          if (finalTranscript.trim()) {
            setInterimText('');
            sendMessage(finalTranscript.trim());
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      })
      .catch(err => {
        console.error('마이크 접근 실패:', err);
        setErrorText(
          '마이크에 접근할 수 없습니다. 브라우저 권한 또는 장치 연결 상태를 확인해주세요.',
        );
        setIsRecognizing(false);
        recognitionRef.current = null;
      });
  }, [isRecognizing, sendMessage]);

  // 음성 인식 중지
  const stopListening = useCallback(() => {
    const r = recognitionRef.current;
    if (r) {
      try {
        r.stop();
      } catch {
        // ignore
      }
    }
    setIsRecognizing(false);
    setInterimText('');
  }, []);

  // 채팅창 닫히면 인식 중지
  useEffect(() => {
    if (!isOpen) {
      stopListening();
      // TTS 중지
      if (ttsSupported) {
        window.speechSynthesis.cancel();
      }
      // 열려있던 네트워크 요청이 있으면 취소
      if (requestAbortRef.current) {
        requestAbortRef.current.abort();
        requestAbortRef.current = null;
      }
    }
  }, [isOpen, stopListening, ttsSupported]);

  // 언마운트 시 정리
  useEffect(() => {
    return () => {
      stopListening();
      if (ttsSupported) {
        window.speechSynthesis.cancel();
      }
      if (requestAbortRef.current) {
        requestAbortRef.current.abort();
        requestAbortRef.current = null;
      }
    };
  }, [stopListening, ttsSupported]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(inputText);
      }
    },
    [sendMessage, inputText],
  );

  return (
    <>
      {/* 챗봇 열기 버튼 */}
      {!isOpen && (
        <button
          onClick={() => {
            if (!isLogin) {
              setShowLoginPrompt(true);
              return;
            }
            setIsOpen(true);
          }}
          className="bg-primary hover:bg-primary/90 fixed z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-110"
          style={{
            right: 'max(1.5rem, calc((100vw - 64rem) / 2 + 1.5rem))',
            bottom: '1.5rem',
          }}
          aria-label="챗봇으로 주문하기"
        >
          <MessageCircle className="h-6 w-6 text-white" />
        </button>
      )}

      {/* 비로그인 안내 토스트 */}
      {!isOpen && showLoginPrompt && (
        <div
          className="fixed z-50 rounded-lg border bg-white px-4 py-3 text-sm shadow-lg"
          style={{
            right: 'max(1.5rem, calc((100vw - 64rem) / 2 + 1.5rem))',
            bottom: '5rem',
          }}
          role="alert"
        >
          <div className="flex items-start gap-3">
            <MessageCircle className="text-primary h-4 w-4" />
            <div className="min-w-0">
              <div className="font-medium">로그인이 필요합니다</div>
              <div className="mt-0.5 text-gray-600">
                로그인 후 챗봇 주문을 이용할 수 있습니다.
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
                  onClick={() => setShowLoginPrompt(false)}
                >
                  닫기
                </button>
                <button
                  className="bg-primary hover:bg-primary/90 rounded px-2 py-1 text-xs text-white"
                  onClick={() => navigate('/login')}
                >
                  로그인 하러 가기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 챗봇 창 */}
      {isOpen && (
        <div
          className="bg-card border-border fixed z-50 flex h-[500px] w-[380px] flex-col rounded-xl border shadow-2xl"
          style={{
            right: 'max(1.5rem, calc((100vw - 64rem) / 2 + 1.5rem))',
            bottom: '1.5rem',
          }}
        >
          {/* 헤더 */}
          <div className="bg-primary flex items-center justify-between rounded-t-xl px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <h3 className="font-semibold">챗봇 주문</h3>
            </div>
            <div className="flex items-center gap-2">
              {ttsSupported && (
                <button
                  onClick={() => setTtsEnabled(!ttsEnabled)}
                  className={`rounded px-2 py-1 text-xs transition-colors ${
                    ttsEnabled
                      ? 'bg-white/20 hover:bg-white/30'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                  aria-label="TTS 토글"
                >
                  {ttsEnabled ? '🔊 TTS ON' : '🔇 TTS OFF'}
                </button>
              )}
              <button
                onClick={() => {
                  if (isRecognizing) stopListening();
                  if (ttsSupported) window.speechSynthesis.cancel();
                  setIsOpen(false);
                }}
                className="hover:bg-primary/80 rounded p-1 transition-colors"
                aria-label="닫기"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* 메시지 목록 */}
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {errorText && (
              <div className="mb-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {errorText}
              </div>
            )}
            {messages.length === 0 && (
              <div className="text-muted-foreground flex h-full items-center justify-center text-center text-sm">
                <div>
                  <MessageCircle className="text-muted-foreground/50 mx-auto mb-2 h-8 w-8" />
                  <p>챗봇에게 주문을 말씀해주세요</p>
                  <p className="mt-1 text-xs">
                    예: &ldquo;잉글리시 디너 심플 스타일로 주문할게요&rdquo;
                  </p>
                </div>
              </div>
            )}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                  <p
                    className={`mt-1 text-xs ${
                      msg.role === 'user'
                        ? 'text-primary-foreground/70'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {msg.timestamp.toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted max-w-[80%] rounded-lg px-4 py-2">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]"></span>
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]"></span>
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 입력 / 음성 영역 */}
          <div className="border-border border-t p-4">
            {speechSupported ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (isRecognizing) {
                      stopListening();
                    } else {
                      startListening();
                    }
                  }}
                  disabled={isLoading}
                  className={`rounded-lg px-4 py-2 text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    isRecognizing
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-primary hover:bg-primary/90'
                  }`}
                  aria-label={
                    isRecognizing ? '음성 인식 중지' : '음성 인식 시작'
                  }
                >
                  {isRecognizing ? (
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 animate-ping rounded-full bg-white" />
                      듣는 중...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" /> 말하기
                    </span>
                  )}
                </button>
                {isLoading && (
                  <button
                    onClick={() => {
                      if (requestAbortRef.current) {
                        requestAbortRef.current.abort();
                        requestAbortRef.current = null;
                      }
                      setIsLoading(false);
                      setErrorText(null);
                    }}
                    className="rounded-lg bg-yellow-600 px-4 py-2 text-white transition-colors hover:bg-yellow-700"
                    aria-label="취소하기"
                  >
                    취소
                  </button>
                )}
                <div className="flex-1 truncate text-sm text-gray-600">
                  {isLoading
                    ? '응답 대기 중...'
                    : isRecognizing
                      ? interimText || '듣는 중...'
                      : '버튼을 눌러 말하세요'}
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="메시지를 입력하세요..."
                  disabled={isLoading}
                  className="border-border focus:border-primary flex-1 rounded-lg border px-4 py-2 text-sm transition-colors outline-none disabled:bg-gray-50"
                />
                <button
                  onClick={() => sendMessage(inputText)}
                  disabled={!inputText.trim() || isLoading}
                  className="bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground flex items-center justify-center rounded-lg px-4 py-2 text-white transition-colors disabled:cursor-not-allowed"
                  aria-label="전송"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
