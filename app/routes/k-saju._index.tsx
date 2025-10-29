import { useState } from 'react';
import { Link } from '@remix-run/react';

export default function KSajuLanding() {
  const [userName, setUserName] = useState('');
  const [birthDate, setBirthDate] = useState('');

  const handleGenerate = () => {
    if (!userName || !birthDate) {
      alert('이름과 생년월일을 모두 입력해주세요!');
      return;
    }

    alert(`작명 서비스가 곧 시작됩니다! 🎉\n\n입력하신 정보:\n이름: ${userName}\n생년월일: ${birthDate}`);
  };

  return (
    <>
      {/* 다크 그라데이션 배경 */}
      <div
        className="min-h-screen relative"
        style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #0f0f1e 100%)' }}
      >
        {/* 헤더 */}
        <header
          className="fixed top-0 left-0 right-0 h-16 z-50"
          style={{ background: 'rgba(26, 26, 46, 0.8)', backdropFilter: 'blur(10px)' }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-20">
            <nav className="flex items-center justify-between h-16">
              {/* 로고 */}
              <Link to="/" className="flex items-center">
                <span className="text-xl font-bold" style={{ color: '#8B5CF6' }}>
                  K-SajuName
                </span>
              </Link>

              {/* 네비게이션 링크 */}
              <div className="hidden md:flex items-center space-x-8">
                <a
                  href="#intro"
                  className="text-sm font-medium transition-colors"
                  style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'}
                >
                  서비스 소개
                </a>
                <a
                  href="#pricing"
                  className="text-sm font-medium transition-colors"
                  style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'}
                >
                  가격
                </a>
                <a
                  href="#how-it-works"
                  className="text-sm font-medium transition-colors"
                  style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'}
                >
                  작명 과정
                </a>
              </div>

              {/* 로그인 버튼 */}
              <div>
                <button
                  className="px-5 py-2.5 text-sm font-semibold text-white rounded-lg transition-all"
                  style={{ background: '#8B5CF6', boxShadow: '0 2px 8px rgba(139, 92, 246, 0.2)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#7C3AED';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#8B5CF6';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(139, 92, 246, 0.2)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  로그인
                </button>
              </div>
            </nav>
          </div>
        </header>

        {/* 메인 히어로 섹션 */}
        <section
          className="flex items-center justify-center"
          style={{ padding: '140px 0 80px', minHeight: 'calc(100vh - 64px)' }}
        >
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              {/* 아이콘 */}
              <div className="flex justify-center mb-8">
                <div
                  className="relative w-20 h-20"
                  style={{ animation: 'floatIcon 3s ease-in-out infinite' }}
                >
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{ background: '#8B5CF6', opacity: 0.2 }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-4xl">
                    🌸
                  </div>
                </div>
              </div>

              {/* 제목 */}
              <h1
                className="font-bold mb-6"
                style={{
                  fontSize: '48px',
                  lineHeight: '1.3',
                  color: '#ffffff',
                  letterSpacing: '-0.02em'
                }}
              >
                10초 만에 찾는<br />나만의 한국 이름
              </h1>

              {/* 부제목 */}
              <p
                className="mb-16 leading-relaxed"
                style={{ fontSize: '18px', color: 'rgba(255, 255, 255, 0.7)' }}
              >
                이름과 생년월일만 입력하면 전통 사주팔자 기반으로<br />
                당신에게 딱 맞는 한국 이름을 추천해드려요 ✨
              </p>

              {/* 입력 폼 */}
              <div
                className="max-w-md mx-auto mb-6 rounded-2xl p-8"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                {/* 이름 입력 */}
                <div className="mb-4 text-left">
                  <label
                    htmlFor="userName"
                    className="block text-sm font-semibold mb-2"
                    style={{ color: 'rgba(255, 255, 255, 0.8)', letterSpacing: '0.01em' }}
                  >
                    이름 (Name)
                  </label>
                  <input
                    type="text"
                    id="userName"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="e.g., John Smith"
                    className="w-full px-5 py-4 text-base rounded-lg transition-all"
                    style={{
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: '#ffffff',
                      fontFamily: 'inherit'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.outline = 'none';
                      e.currentTarget.style.borderColor = '#8B5CF6';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>

                {/* 생년월일 입력 */}
                <div className="mb-4 text-left">
                  <label
                    htmlFor="birthDate"
                    className="block text-sm font-semibold mb-2"
                    style={{ color: 'rgba(255, 255, 255, 0.8)', letterSpacing: '0.01em' }}
                  >
                    생년월일 (Birth Date)
                  </label>
                  <input
                    type="date"
                    id="birthDate"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-5 py-4 text-base rounded-lg transition-all cursor-pointer font-medium"
                    style={{
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: '#ffffff',
                      colorScheme: 'dark',
                      fontFamily: 'inherit'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.outline = 'none';
                      e.currentTarget.style.borderColor = '#8B5CF6';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>

                {/* 생성 버튼 */}
                <button
                  onClick={handleGenerate}
                  className="w-full px-6 py-4 text-lg font-semibold rounded-lg transition-all"
                  style={{
                    background: '#8B5CF6',
                    color: '#ffffff',
                    boxShadow: '0 2px 8px rgba(139, 92, 246, 0.2)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#7C3AED';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#8B5CF6';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(139, 92, 246, 0.2)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  Generate My Korean Name ✨
                </button>
              </div>

              {/* 신뢰 배지 */}
              <div
                className="flex flex-wrap justify-center gap-6 text-sm"
                style={{ color: 'rgba(255, 255, 255, 0.5)' }}
              >
                <span className="flex items-center">✓ 1개 무료 체험</span>
                <span className="flex items-center">✓ 공유하면 2개 추가 🎁</span>
                <span className="flex items-center">✓ 10,000+ K-pop 팬 사용중</span>
              </div>
            </div>
          </div>
        </section>

        {/* 푸터 */}
        <footer
          className="py-8"
          style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div
              className="flex flex-col md:flex-row justify-between items-center text-center md:text-left text-sm"
              style={{ color: 'rgba(255, 255, 255, 0.5)' }}
            >
              <p className="mb-4 md:mb-0">
                © 2025 K-SajuName. All rights reserved.
              </p>
              <div className="flex flex-col md:flex-row gap-2 md:gap-6">
                <a
                  href="#"
                  className="transition-colors"
                  onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'}
                >
                  이용약관
                </a>
                <a
                  href="#"
                  className="transition-colors"
                  onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'}
                >
                  개인정보처리방침
                </a>
                <a
                  href="#intro"
                  className="transition-colors"
                  onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'}
                >
                  서비스 소개
                </a>
              </div>
            </div>
          </div>
        </footer>

        {/* CSS 애니메이션 */}
        <style>{`
          @keyframes floatIcon {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }

          input::placeholder {
            color: rgba(255, 255, 255, 0.4);
          }
        `}</style>
      </div>
    </>
  );
}
