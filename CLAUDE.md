# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

삼성전자 OPI(성과급) 주식보상 비율 최적화 시뮬레이터. 빌드 과정 없이 브라우저에서 바로 실행되는 정적 웹 애플리케이션.

## Running the Application

```bash
# 방법 1: 직접 파일 열기
open index.html

# 방법 2: 로컬 서버
python3 -m http.server 8080

# 단일 파일 버전 (opi-simulation.html)은 서버 없이 바로 실행 가능
```

## Architecture

### File Structure
- `index.html` - 메인 페이지 (Tailwind CSS CDN + Chart.js CDN)
- `opi-simulation.html` - 단일 파일 버전 (모든 JS 인라인 포함)
- `js/calculator.js` - 핵심 계산 로직 (세금, OPI, 시나리오 분석)
- `js/chart.js` - Chart.js 차트 렌더링 (ChartManager 객체)
- `js/ui.js` - UI 컨트롤러 (UI 객체, DOM 조작)
- `js/main.js` - 앱 초기화

### Key Objects (Global Scope)
- `CONFIG` - 상수 정의 (세금율, 보험율, 주식비율 옵션)
- `Calculator` - 계산 함수 (calculateOPIReward, calculateAllScenarios, compareTaxImpact 등)
- `ChartManager` - 차트 인스턴스 관리
- `UI` - DOM 요소 캐싱 및 이벤트 처리

### Calculation Flow
1. 사용자 입력 → `UI.getInputValues()`
2. 모든 비율(0-50%) 시나리오 계산 → `calculateAllScenarios()`
3. 주가 변동 시나리오 분석 → `analyzePriceScenarios()`
4. 세금 비교 → `compareTaxImpact()`
5. 결과 렌더링 → UI 테이블 + Chart.js 차트

### Tax Calculation (2025 기준)
- 4대 보험: 국민연금(4.5%, 상한 325.8만), 건강보험(3.545%), 장기요양(건강×12.95%), 고용보험(0.9%)
- 소득세: 누진세율 6%~45% + 지방소득세(소득세×10%)

## Reference Documents
- `opi-explanation.md` - OPI 주식보상 제도 상세 설명
- `tax.md` - 세금 계산 로직 정의
