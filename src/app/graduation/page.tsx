"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  GraduationCap,
  ExternalLink,
  RefreshCw,
  Loader2,
} from "lucide-react";
import PdfUploader from "@/components/PdfUploader";
import ResultBox from "@/components/ResultBox";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";

const GRAD_CACHE_KEY = "sno_grad_cache";

interface CreditItem {
  earned: number;
  required: number;
}
interface GradesData {
  credits: Record<string, CreditItem>;
  gpa_by_semester: { semester: string; gpa: number }[];
  grade_distribution: Record<string, number>;
  total_earned: number;
  total_required: number;
}

function saveGradCache(
  result: string,
  dept: string,
  remainingSemesters: string,
  careerGoal: string,
  grades: GradesData | null,
) {
  try {
    localStorage.setItem(
      GRAD_CACHE_KEY,
      JSON.stringify({ result, dept, remainingSemesters, careerGoal, grades }),
    );
  } catch {
    /* ignore */
  }
}

function loadGradCache(): {
  result: string;
  dept: string;
  remainingSemesters: string;
  careerGoal?: string;
  grades?: GradesData | null;
} | null {
  try {
    const raw = localStorage.getItem(GRAD_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function splitResult(text: string): { academic: string; career: string } {
  const marker = "## 🎯 취준 역량 분석";
  const idx = text.indexOf(marker);
  if (idx === -1) return { academic: text, career: "" };
  return {
    academic: text.slice(0, idx).trimEnd(),
    career: text.slice(idx).trimStart(),
  };
}

const DEPT_INFO: Record<string, string> = {
  컴퓨터과학전공: "https://csweb.sookmyung.ac.kr/",
  데이터사이언스전공: "https://ds.sookmyung.ac.kr/",
  인공지능공학부: "https://aie.sookmyung.ac.kr/",
  수학과: "http://math.sookmyung.ac.kr/",
  통계학과: "https://stat.sookmyung.ac.kr/",
  화학과: "https://chem.sookmyung.ac.kr/",
  생명시스템학부: "https://bio.sookmyung.ac.kr/",
  화공생명공학부: "https://chembioe.sookmyung.ac.kr/",
  지능형전자시스템학부: "https://electro.sookmyung.ac.kr/",
  신소재물리학부: "https://physics.sookmyung.ac.kr/",
  기계시스템학부: "https://mse.sookmyung.ac.kr/",
  식품영양학과: "http://fn.sookmyung.ac.kr/",
  의류학과: "https://cloth.sookmyung.ac.kr/",
  아동복지학부: "http://childwelfare.sookmyung.ac.kr/",
  가족자원경영학과: "https://family.sookmyung.ac.kr/",
  영어영문학부: "http://english.sookmyung.ac.kr/",
  한국어문학부: "http://korean.sookmyung.ac.kr/",
  역사문화학과: "http://history.sookmyung.ac.kr/",
  문헌정보학과: "https://lis.sookmyung.ac.kr/",
  "프랑스언어·문화학과": "http://french.sookmyung.ac.kr/",
  중어중문학부: "http://chinese.sookmyung.ac.kr/",
  "독일언어·문화학과": "http://german.sookmyung.ac.kr/",
  일본학과: "http://japan.sookmyung.ac.kr/",
  경제학부: "http://econ.sookmyung.ac.kr/",
  법학부: "http://law.sookmyung.ac.kr/",
  정치외교학과: "http://politics.sookmyung.ac.kr/",
  행정학과: "http://pa.sookmyung.ac.kr/",
  홍보광고학과: "http://prad.sookmyung.ac.kr/",
  소비자경제학과: "http://conecon.sookmyung.ac.kr/",
  사회심리학과: "https://www.socpsy.sookmyung.ac.kr/",
  교육학부: "https://edu.sookmyung.ac.kr/",
  미디어학부: "https://home.sookmyung.ac.kr/media/index.do",
  영어영문학전공: "https://english.sookmyung.ac.kr/",
  글로벌협력전공: "http://global.sookmyung.ac.kr/",
  앙트러프러너십전공: "http://global.sookmyung.ac.kr/",
  융합국제학부: "https://hallyu.sookmyung.ac.kr/",
  한류국제학부: "https://hallyu.sookmyung.ac.kr/",
};
const DEPARTMENTS = Object.keys(DEPT_INFO);

function saveUserProfile(
  dept: string,
  remainingSemesters: string,
  careerGoal: string,
) {
  try {
    localStorage.setItem(
      "sno_user_profile",
      JSON.stringify({
        department: dept,
        remaining_semesters: remainingSemesters,
        career_goal: careerGoal,
      }),
    );
  } catch {
    /* ignore */
  }
}

// 졸업요건 달성도 프로그레스 바
function CreditsProgress({ credits }: { credits: Record<string, CreditItem> }) {
  const COLORS: Record<string, string> = {
    전공필수: "#1E40AF",
    전공선택: "#3B82F6",
    교양필수: "#7C3AED",
    교양선택: "#A78BFA",
    자유선택: "#64748B",
  };
  const ORDER = ["전공필수", "전공선택", "교양필수", "교양선택", "자유선택"];
  const items = ORDER.filter((k) => credits[k] && credits[k].required > 0);

  if (items.length === 0) return null;

  return (
    <div
      style={{
        background: "white",
        borderRadius: "12px",
        border: "1px solid #E2E8F0",
        padding: "16px",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          fontWeight: 700,
          color: "#0F172A",
          marginBottom: "14px",
        }}
      >
        졸업요건 달성도
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {items.map((key) => {
          const { earned, required } = credits[key];
          const pct = Math.min(100, Math.round((earned / required) * 100));
          const done = earned >= required;
          return (
            <div key={key}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "5px",
                }}
              >
                <span style={{ fontSize: "12px", color: "#334155", fontWeight: 500 }}>
                  {key}
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: done ? "#16A34A" : COLORS[key] || "#1E40AF",
                  }}
                >
                  {done ? "✓ " : ""}{earned} / {required}학점
                </span>
              </div>
              <div
                style={{
                  height: "8px",
                  background: "#F1F5F9",
                  borderRadius: "999px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${pct}%`,
                    background: done ? "#16A34A" : COLORS[key] || "#1E40AF",
                    borderRadius: "999px",
                    transition: "width 0.6s ease",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      {/* 전체 요약 */}
      {credits["전공필수"] && (
        <div
          style={{
            marginTop: "14px",
            paddingTop: "12px",
            borderTop: "1px solid #F1F5F9",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "11px", color: "#64748B" }}>전체 이수학점</span>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A" }}>
            {Object.values(credits)
              .filter((c) => c.earned >= 0)
              .reduce((a, c) => a + c.earned, 0)}{" "}
            /{" "}
            {Object.values(credits)
              .filter((c) => c.required >= 0)
              .reduce((a, c) => a + c.required, 0)}
            학점
          </span>
        </div>
      )}
    </div>
  );
}

// 학기별 GPA 라인 차트
function GpaChart({ data }: { data: { semester: string; gpa: number }[] }) {
  const valid = data.filter((d) => d.gpa > 0);
  if (valid.length < 2) return null;

  return (
    <div
      style={{
        background: "white",
        borderRadius: "12px",
        border: "1px solid #E2E8F0",
        padding: "16px",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          fontWeight: 700,
          color: "#0F172A",
          marginBottom: "14px",
        }}
      >
        학기별 GPA 추이
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={valid} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
          <XAxis
            dataKey="semester"
            tick={{ fontSize: 10, fill: "#94A3B8" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[2.0, 4.5]}
            tick={{ fontSize: 10, fill: "#94A3B8" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #E2E8F0",
              fontSize: "12px",
            }}
            formatter={(v) => [typeof v === "number" ? v.toFixed(2) : v, "GPA"]}
          />
          <Line
            type="monotone"
            dataKey="gpa"
            stroke="#1E40AF"
            strokeWidth={2}
            dot={{ fill: "#1E40AF", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// 성적 분포 바 차트
function GradeChart({ dist }: { dist: Record<string, number> }) {
  const ORDER = ["A+", "A0", "B+", "B0", "C+", "C0", "D+", "D0", "F"];
  const data = ORDER.map((g) => ({ grade: g, count: dist[g] ?? 0 })).filter(
    (d) => d.count > 0,
  );
  if (data.length === 0) return null;

  const GRADE_COLOR: Record<string, string> = {
    "A+": "#1E40AF",
    "A0": "#3B82F6",
    "B+": "#7C3AED",
    "B0": "#A78BFA",
    "C+": "#F59E0B",
    "C0": "#FCD34D",
    "D+": "#EF4444",
    "D0": "#FCA5A5",
    F: "#94A3B8",
  };

  return (
    <div
      style={{
        background: "white",
        borderRadius: "12px",
        border: "1px solid #E2E8F0",
        padding: "16px",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          fontWeight: 700,
          color: "#0F172A",
          marginBottom: "14px",
        }}
      >
        성적 분포
      </div>
      <ResponsiveContainer width="100%" height={130}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis
            dataKey="grade"
            tick={{ fontSize: 11, fill: "#64748B" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 10, fill: "#94A3B8" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #E2E8F0",
              fontSize: "12px",
            }}
            formatter={(v) => [v + "과목", "수강"]}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.grade} fill={GRADE_COLOR[entry.grade] ?? "#94A3B8"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

type Tab = "학업" | "취업";

export default function GraduationPage() {
  const [result, setResult] = useState("");
  const [grades, setGrades] = useState<GradesData | null>(null);
  const [dept, setDept] = useState("");
  const [remainingSemesters, setRemainingSemesters] = useState("");
  const [analysisError, setAnalysisError] = useState("");
  const [careerGoal, setCareerGoal] = useState("");
  const [cachedBase64, setCachedBase64] = useState("");
  const [cachedFileName, setCachedFileName] = useState("");
  const [reanalyzing, setReanalyzing] = useState(false);
  const [lastAnalyzedDept, setLastAnalyzedDept] = useState("");
  const [lastAnalyzedSem, setLastAnalyzedSem] = useState("");
  const [lastAnalyzedGoal, setLastAnalyzedGoal] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("학업");

  useEffect(() => {
    try {
      localStorage.removeItem(GRAD_CACHE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  function handleSuccess(raw: string) {
    if (!raw?.trim()) {
      setAnalysisError(
        "분석 결과를 받지 못했습니다. n8n 워크플로우가 실행 중인지 확인해주세요.",
      );
      return;
    }
    let text = raw;
    let parsedGrades: GradesData | null = null;
    try {
      const parsed = JSON.parse(raw);
      if (parsed.result) {
        text = parsed.result;
        if (parsed.grades) parsedGrades = parsed.grades;
      }
    } catch {
      /* 텍스트 그대로 사용 */
    }

    setAnalysisError("");
    setResult(text);
    setGrades(parsedGrades);
    setLastAnalyzedDept(dept);
    setLastAnalyzedSem(remainingSemesters);
    setLastAnalyzedGoal(careerGoal);
    if (dept) saveUserProfile(dept, remainingSemesters, careerGoal);
    saveGradCache(text, dept, remainingSemesters, careerGoal, parsedGrades);
  }

  const canReanalyze =
    !!cachedBase64 &&
    !!result &&
    (dept !== lastAnalyzedDept ||
      remainingSemesters !== lastAnalyzedSem ||
      careerGoal !== lastAnalyzedGoal);

  async function handleReanalyze() {
    if (!cachedBase64) return;
    setReanalyzing(true);
    try {
      const res = await fetch("/api/graduation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      }
    } catch {
      /* ignore */
    }
    setReanalyzing(false);
  }

  const { academic, career } = splitResult(result);
  const hasCareer = !!career;
  const hasCharts =
    grades &&
    (Object.keys(grades.credits ?? {}).length > 0 ||
      (grades.gpa_by_semester ?? []).length >= 2 ||
      Object.keys(grades.grade_distribution ?? {}).length > 0);

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC" }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "white",
          borderBottom: "1px solid #E2E8F0",
          padding: "52px 20px 20px",
        }}
      >
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            color: "#64748B",
            textDecoration: "none",
            fontSize: "13px",
            marginBottom: "16px",
          }}
        >
          <ArrowLeft size={14} /> 홈
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              background: "#EFF6FF",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <GraduationCap size={20} color="#1E40AF" strokeWidth={1.8} />
          </div>
          <div>
            <div
              style={{ fontSize: "18px", fontWeight: 700, color: "#0F172A" }}
            >
              졸업요건 분석
            </div>
            <div
              style={{ fontSize: "12px", color: "#64748B", marginTop: "1px" }}
            >
              학과 선택 + 이수표 PDF → AI 로드맵 설계
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          padding: "20px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {/* 학과 선택 */}
        <div
          style={{
            background: "white",
            borderRadius: "12px",
            padding: "16px",
            border: "1px solid #E2E8F0",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "#0F172A",
              marginBottom: "10px",
            }}
          >
            학과 선택
          </div>
          <select
            value={dept}
            onChange={(e) => {
              setDept(e.target.value);
              setResult("");
              setGrades(null);
            }}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "8px",
              border: `1px solid ${dept ? "#1E40AF" : "#E2E8F0"}`,
              background: "white",
              fontSize: "13px",
              color: dept ? "#0F172A" : "#94A3B8",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="">학과를 선택하세요</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          {dept && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: "8px",
              }}
            >
              <div style={{ fontSize: "11px", color: "#64748B" }}>
                학과 졸업요건을 자동으로 조회해 이수표와 비교 분석합니다
              </div>
              <a
                href={DEPT_INFO[dept]}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "11px",
                  fontWeight: 500,
                  color: "#1E40AF",
                  textDecoration: "none",
                  background: "#EFF6FF",
                  borderRadius: "6px",
                  padding: "4px 8px",
                  flexShrink: 0,
                  marginLeft: "8px",
                }}
              >
                <ExternalLink size={10} /> 학과 홈페이지
              </a>
            </div>
          )}
        </div>

        {/* 남은 학기 선택 */}
        <div
          style={{
            background: "white",
            borderRadius: "12px",
            padding: "16px",
            border: "1px solid #E2E8F0",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "#0F172A",
              marginBottom: "10px",
            }}
          >
            남은 학기 수
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {["1", "2", "3", "4", "5", "6", "7", "8", "없음"].map((s) => (
              <button
                key={s}
                onClick={() => setRemainingSemesters(s)}
                style={{
                  padding: "7px 14px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: remainingSemesters === s ? 600 : 400,
                  border: `1px solid ${remainingSemesters === s ? "#1E40AF" : "#E2E8F0"}`,
                  background: remainingSemesters === s ? "#EFF6FF" : "white",
                  color: remainingSemesters === s ? "#1E40AF" : "#64748B",
                  cursor: "pointer",
                }}
              >
                {s === "없음" ? "없음" : `${s}학기`}
              </button>
            ))}
          </div>
          <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "8px" }}>
            선수과목 관계를 고려한 학기별 수강 로드맵을 생성합니다
          </div>
        </div>

        {/* 희망 진로 */}
        <div
          style={{
            background: "white",
            borderRadius: "12px",
            padding: "16px",
            border: "1px solid #E2E8F0",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "#0F172A",
              marginBottom: "10px",
            }}
          >
            희망 직무 / 진로
          </div>
          <input
            type="text"
            value={careerGoal}
            onChange={(e) => setCareerGoal(e.target.value)}
            placeholder="예: 백엔드 개발자, 데이터 분석가"
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "8px",
              border: `1px solid ${careerGoal ? "#1E40AF" : "#E2E8F0"}`,
              background: "white",
              fontSize: "13px",
              color: "#0F172A",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "8px" }}>
            진로에 맞춘 전공 추천 + 이수 과목 역량 아카이빙을 제공합니다
          </div>
        </div>

        <PdfUploader
          webhookPath="graduation"
          extraBody={{
            department: dept,
            remaining_semesters: remainingSemesters,
            career_goal: careerGoal,
          }}
          onSuccess={handleSuccess}
          onBase64={(b64, name) => {
            setCachedBase64(b64);
            setCachedFileName(name);
          }}
        />

        {analysisError && (
          <div
            style={{
              padding: "12px 14px",
              background: "#FFF1F2",
              borderRadius: "10px",
              border: "1px solid #FECACA",
              fontSize: "13px",
              color: "#E11D48",
            }}
          >
            {analysisError}
          </div>
        )}

        {canReanalyze && (
          <button
            onClick={handleReanalyze}
            disabled={reanalyzing}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "10px",
              background: reanalyzing ? "#E2E8F0" : "#1E40AF",
              color: reanalyzing ? "#94A3B8" : "white",
              fontWeight: 600,
              fontSize: "14px",
              border: "none",
              cursor: reanalyzing ? "default" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            {reanalyzing ? (
              <>
                <Loader2
                  size={16}
                  style={{ animation: "spin 1s linear infinite" }}
                />{" "}
                재분석 중...
              </>
            ) : (
              <>
                <RefreshCw size={16} /> 변경된 설정으로 재분석
              </>
            )}
          </button>
        )}

        {/* 시각화 차트 */}
        {hasCharts && grades && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#64748B", paddingLeft: "2px" }}>
              이수 현황
            </div>
            {grades.credits && Object.keys(grades.credits).length > 0 && (
              <CreditsProgress credits={grades.credits} />
            )}
            {grades.gpa_by_semester && grades.gpa_by_semester.length >= 2 && (
              <GpaChart data={grades.gpa_by_semester} />
            )}
            {grades.grade_distribution &&
              Object.values(grades.grade_distribution).some((v) => v > 0) && (
                <GradeChart dist={grades.grade_distribution} />
              )}
          </div>
        )}

        {/* 결과 탭 */}
        {result && (
          <div style={{ marginTop: "4px" }}>
            <div
              style={{
                display: "flex",
                gap: "4px",
                marginBottom: "0",
                background: "white",
                borderRadius: "12px 12px 0 0",
                border: "1px solid #E2E8F0",
                borderBottom: "none",
                padding: "12px 16px 0",
              }}
            >
              {(["학업", "취업"] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: "8px 18px",
                    borderRadius: "8px 8px 0 0",
                    fontSize: "13px",
                    fontWeight: activeTab === tab ? 600 : 400,
                    border: "none",
                    borderBottom:
                      activeTab === tab
                        ? "2px solid #1E40AF"
                        : "2px solid transparent",
                    background: "transparent",
                    color: activeTab === tab ? "#1E40AF" : "#94A3B8",
                    cursor: "pointer",
                  }}
                >
                  {tab === "학업" ? "학업 분석" : "취업 아카이빙"}
                  {tab === "취업" && !hasCareer && (
                    <span
                      style={{
                        fontSize: "10px",
                        marginLeft: "4px",
                        color: "#CBD5E1",
                      }}
                    >
                      (진로 입력 시 활성화)
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div
              style={{
                background: "white",
                borderRadius: "0 0 12px 12px",
                border: "1px solid #E2E8F0",
                padding: "16px",
              }}
            >
              {activeTab === "학업" && <ResultBox text={academic} />}
              {activeTab === "취업" &&
                (hasCareer ? (
                  <ResultBox text={career} />
                ) : (
                  <div
                    style={{
                      padding: "32px 16px",
                      textAlign: "center",
                      color: "#94A3B8",
                      fontSize: "13px",
                    }}
                  >
                    희망 직무/진로를 입력하고 분석하면
                    <br />
                    이수 과목 역량 아카이빙이 여기에 표시됩니다
                  </div>
                ))}
            </div>

            <div
              style={{
                marginTop: "12px",
                padding: "12px",
                background: "#FFF1F2",
                borderRadius: "10px",
                border: "1px solid #FECACA",
              }}
            >
              <div
                style={{ fontSize: "11px", color: "#E11D48", fontWeight: 600 }}
              >
                ⚠️ 확인 바랍니다
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "#F43F5E",
                  marginTop: "4px",
                  lineHeight: 1.5,
                }}
              >
                본 분석 결과는 Upstage AI가 작성한 참고용 자료입니다. 학과별
                세부 규정에 따라 실제와 다를 수 있으니 반드시 학사 시스템에서
                최종 확인해 주세요.
              </div>
            </div>
          </div>
        )}

        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
