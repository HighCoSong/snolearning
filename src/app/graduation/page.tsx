'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, GraduationCap, ExternalLink, RefreshCw, Loader2 } from 'lucide-react';
import PdfUploader from '@/components/PdfUploader';
import ResultBox from '@/components/ResultBox';

const GRAD_CACHE_KEY = 'sno_grad_cache';

function saveGradCache(result: string, dept: string, remainingSemesters: string, careerGoal: string) {
  try {
    localStorage.setItem(GRAD_CACHE_KEY, JSON.stringify({ result, dept, remainingSemesters, careerGoal }));
  } catch { /* ignore */ }
}

function loadGradCache(): { result: string; dept: string; remainingSemesters: string; careerGoal?: string } | null {
  try {
    const raw = localStorage.getItem(GRAD_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

const DEPT_INFO: Record<string, string> = {
  '컴퓨터과학전공': 'https://csweb.sookmyung.ac.kr/',
  '데이터사이언스전공': 'https://ds.sookmyung.ac.kr/',
  '인공지능공학부': 'https://aie.sookmyung.ac.kr/',
  '수학과': 'http://math.sookmyung.ac.kr/',
  '통계학과': 'https://stat.sookmyung.ac.kr/',
  '화학과': 'https://chem.sookmyung.ac.kr/',
  '생명시스템학부': 'https://bio.sookmyung.ac.kr/',
  '화공생명공학부': 'https://chembioe.sookmyung.ac.kr/',
  '지능형전자시스템학부': 'https://electro.sookmyung.ac.kr/',
  '신소재물리학부': 'https://physics.sookmyung.ac.kr/',
  '기계시스템학부': 'https://mse.sookmyung.ac.kr/',
  '식품영양학과': 'http://fn.sookmyung.ac.kr/',
  '의류학과': 'https://cloth.sookmyung.ac.kr/',
  '아동복지학부': 'http://childwelfare.sookmyung.ac.kr/',
  '가족자원경영학과': 'https://family.sookmyung.ac.kr/',
  '영어영문학부': 'http://english.sookmyung.ac.kr/',
  '한국어문학부': 'http://korean.sookmyung.ac.kr/',
  '역사문화학과': 'http://history.sookmyung.ac.kr/',
  '문헌정보학과': 'https://lis.sookmyung.ac.kr/',
  '프랑스언어·문화학과': 'http://french.sookmyung.ac.kr/',
  '중어중문학부': 'http://chinese.sookmyung.ac.kr/',
  '독일언어·문화학과': 'http://german.sookmyung.ac.kr/',
  '일본학과': 'http://japan.sookmyung.ac.kr/',
  '경제학부': 'http://econ.sookmyung.ac.kr/',
  '법학부': 'http://law.sookmyung.ac.kr/',
  '정치외교학과': 'http://politics.sookmyung.ac.kr/',
  '행정학과': 'http://pa.sookmyung.ac.kr/',
  '홍보광고학과': 'http://prad.sookmyung.ac.kr/',
  '소비자경제학과': 'http://conecon.sookmyung.ac.kr/',
  '사회심리학과': 'https://www.socpsy.sookmyung.ac.kr/',
  '교육학부': 'https://edu.sookmyung.ac.kr/',
  '미디어학부': 'https://home.sookmyung.ac.kr/media/index.do',
  '영어영문학전공': 'https://english.sookmyung.ac.kr/',
  '글로벌협력전공': 'http://global.sookmyung.ac.kr/',
  '앙트러프러너십전공': 'http://global.sookmyung.ac.kr/',
  '융합국제학부': 'https://hallyu.sookmyung.ac.kr/',
  '한류국제학부': 'https://hallyu.sookmyung.ac.kr/',
};
const DEPARTMENTS = Object.keys(DEPT_INFO);

function saveUserProfile(dept: string, remainingSemesters: string, careerGoal: string) {
  try {
    localStorage.setItem('sno_user_profile', JSON.stringify({ department: dept, remaining_semesters: remainingSemesters, career_goal: careerGoal }));
  } catch { /* ignore */ }
}

export default function GraduationPage() {
  const [result, setResult] = useState('');
  const [dept, setDept] = useState('');
  const [remainingSemesters, setRemainingSemesters] = useState('4');
  const [careerGoal, setCareerGoal] = useState('');
  const [cachedBase64, setCachedBase64] = useState('');
  const [cachedFileName, setCachedFileName] = useState('');
  const [reanalyzing, setReanalyzing] = useState(false);
  const [lastAnalyzedDept, setLastAnalyzedDept] = useState('');
  const [lastAnalyzedSem, setLastAnalyzedSem] = useState('');
  const [lastAnalyzedGoal, setLastAnalyzedGoal] = useState('');

  // Restore cached result on mount
  useEffect(() => {
    const cache = loadGradCache();
    if (cache) {
      setResult(cache.result);
      setDept(cache.dept);
      setRemainingSemesters(cache.remainingSemesters);
      setCareerGoal(cache.careerGoal || '');
      setLastAnalyzedDept(cache.dept);
      setLastAnalyzedSem(cache.remainingSemesters);
      setLastAnalyzedGoal(cache.careerGoal || '');
    }
  }, []);

  function handleSuccess(text: string) {
    setResult(text);
    setLastAnalyzedDept(dept);
    setLastAnalyzedSem(remainingSemesters);
    setLastAnalyzedGoal(careerGoal);
    if (dept) saveUserProfile(dept, remainingSemesters, careerGoal);
    saveGradCache(text, dept, remainingSemesters, careerGoal);
  }

  const canReanalyze = !!cachedBase64 && !!result && (dept !== lastAnalyzedDept || remainingSemesters !== lastAnalyzedSem || careerGoal !== lastAnalyzedGoal);

  async function handleReanalyze() {
    if (!cachedBase64) return;
    setReanalyzing(true);
    try {
      const res = await fetch('/api/graduation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_base64: cachedBase64,
          file_name: cachedFileName,
          department: dept,
          remaining_semesters: remainingSemesters,
          career_goal: careerGoal,
        }),
      });
      if (res.ok) {
        const text = await res.text();
        handleSuccess(text);
        saveGradCache(text, dept, remainingSemesters);
      }
    } catch { /* ignore */ }
    setReanalyzing(false);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      <div style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '52px 20px 20px' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#64748B', textDecoration: 'none', fontSize: '13px', marginBottom: '16px' }}>
          <ArrowLeft size={14} /> 홈
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', background: '#EFF6FF', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={20} color="#1E40AF" strokeWidth={1.8} />
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>졸업요건 분석</div>
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '1px' }}>학과 선택 + 이수표 PDF → AI 로드맵 설계</div>
          </div>
        </div>
      </div>
      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* 학과 선택 */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '16px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A', marginBottom: '10px' }}>학과 선택</div>
          <select
            value={dept}
            onChange={e => { setDept(e.target.value); setResult(''); }}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: '8px',
              border: `1px solid ${dept ? '#1E40AF' : '#E2E8F0'}`,
              background: 'white', fontSize: '13px',
              color: dept ? '#0F172A' : '#94A3B8',
              outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="">학과를 선택하세요</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          {dept && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
              <div style={{ fontSize: '11px', color: '#64748B' }}>
                학과 졸업요건을 자동으로 조회해 이수표와 비교 분석합니다
              </div>
              <a
                href={DEPT_INFO[dept]}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 500, color: '#1E40AF', textDecoration: 'none', background: '#EFF6FF', borderRadius: '6px', padding: '4px 8px', flexShrink: 0, marginLeft: '8px' }}
              >
                <ExternalLink size={10} /> 학과 홈페이지
              </a>
            </div>
          )}
        </div>

        {/* 남은 학기 선택 */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '16px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A', marginBottom: '10px' }}>남은 학기 수</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['1', '2', '3', '4', '5', '6', '7', '8'].map(s => (
              <button
                key={s}
                onClick={() => setRemainingSemesters(s)}
                style={{
                  padding: '7px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: remainingSemesters === s ? 600 : 400,
                  border: `1px solid ${remainingSemesters === s ? '#1E40AF' : '#E2E8F0'}`,
                  background: remainingSemesters === s ? '#EFF6FF' : 'white',
                  color: remainingSemesters === s ? '#1E40AF' : '#64748B',
                  cursor: 'pointer',
                }}
              >{s}학기</button>
            ))}
          </div>
          <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '8px' }}>
            선수과목 관계를 고려한 학기별 수강 로드맵을 생성합니다
          </div>
        </div>

        {/* 희망 진로 입력 (피드백 반영: 수강 설계 근거) */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '16px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A', marginBottom: '10px' }}>희망 직무 / 진로</div>
          <input 
            type="text"
            value={careerGoal}
            onChange={e => setCareerGoal(e.target.value)}
            placeholder="예: 백엔드 개발자, 데이터 분석가"
            style={{
              width: '100%', padding: '10px 12px', borderRadius: '8px',
              border: `1px solid ${careerGoal ? '#1E40AF' : '#E2E8F0'}`,
              background: 'white', fontSize: '13px',
              color: '#0F172A', outline: 'none',
            }}
          />
          <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '8px' }}>
            진로에 맞춘 최적의 전공 선택 과목을 추천해 드립니다 (피드백 반영)
          </div>
        </div>

        <PdfUploader
          webhookPath="graduation"
          extraBody={{ department: dept, remaining_semesters: remainingSemesters, career_goal: careerGoal }}
          onSuccess={handleSuccess}
          onBase64={(b64, name) => { setCachedBase64(b64); setCachedFileName(name); }}
        />

        {canReanalyze && (
          <button
            onClick={handleReanalyze}
            disabled={reanalyzing}
            style={{
              width: '100%', padding: '12px', borderRadius: '10px',
              background: reanalyzing ? '#E2E8F0' : '#1E40AF',
              color: reanalyzing ? '#94A3B8' : 'white',
              fontWeight: 600, fontSize: '14px', border: 'none',
              cursor: reanalyzing ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            {reanalyzing
              ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> 재분석 중...</>
              : <><RefreshCw size={16} /> 변경된 설정으로 재분석</>}
          </button>
        )}

        <div style={{ position: 'relative' }}>
          <ResultBox text={result} />
          {result && (
            <div style={{ marginTop: '12px', padding: '12px', background: '#FFF1F2', borderRadius: '10px', border: '1px solid #FECACA' }}>
              <div style={{ fontSize: '11px', color: '#E11D48', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                ⚠️ 확인 바랍니다
              </div>
              <div style={{ fontSize: '11px', color: '#F43F5E', marginTop: '4px', lineHeight: 1.5 }}>
                본 분석 결과는 Upstage AI가 작성한 참고용 자료입니다. 학과별 세부 규정(교직, 트랙 등)에 따라 실제와 다를 수 있으니 반드시 학사 시스템에서 최종 확인해 주세요. (피드백 반영)
              </div>
            </div>
          )}
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
