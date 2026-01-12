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

### OPI 세금 계산 핵심 로직

**과세소득 정의 (정답)**
```javascript
opiTaxableIncome = opiAmount + additionalBenefit
// 과세소득 = OPI 지급액 + 15% 추가혜택
// 평가차액(stockPriceGain)은 과세 대상 아님
```

**한계세율(Marginal Tax Rate) 적용**
```javascript
// 연봉만 있을 때의 세금
salaryOnlyTax = calculateNetPay(annualSalary)

// 연봉 + OPI 합산 시 세금
totalIncome = annualSalary + opiTaxableIncome
totalTax = calculateNetPay(totalIncome)

// OPI에 대한 세금 = 합산 세금 - 연봉만 세금
opiTaxAmount = totalTax.totalDeductions - salaryOnlyTax.totalDeductions
```

**실수령액 계산**
```javascript
grossTotal = cashAmountGross + futureStockValue + remainder  // 세전 총수령
totalReceived = grossTotal - opiTaxAmount                     // 세후 실수령
```

## Common Mistakes (주의사항)

### 1. OPI 단독 과세 (틀림)
```javascript
// 잘못된 방식: OPI만 별도로 세금 계산
opiTax = calculateNetPay(opiAmount)  // ❌ 틀림
```
**문제점**: OPI는 연봉에 추가로 받는 것이므로, 연봉과 합산하여 누진세율 구간이 결정됨.

### 2. 평가차액 과세 포함 (틀림)
```javascript
// 잘못된 방식 (v2): 평가차액을 과세소득에 포함
stockPriceGain = (futureStockPrice - baseStockPrice) * stockCount
opiTaxableIncome = opiAmount + additionalBenefit + stockPriceGain  // ❌ 틀림
```
**문제점**: 주식 평가차액은 1년 후 매도 시점의 양도소득이지, OPI 지급 시점의 근로소득이 아님.

### 3. 정답: OPI + 15% 추가혜택만 과세
```javascript
// 올바른 방식
opiTaxableIncome = opiAmount + additionalBenefit  // ✅ 정답
// 주식으로 받든 현금으로 받든, 세금 계산 기준은 동일
// 평가차액은 과세 대상 아님 (별도 양도소득세 이슈는 제외)
```

## 계산 로직 요약

| 항목 | 계산식 |
|------|--------|
| OPI 지급액 | 연봉 × OPI비율 |
| 주식보상액 | OPI지급액 × 주식선택비율 |
| 추가혜택 | 주식보상액 × 15% |
| 지급주식수 | floor((주식보상액 + 추가혜택) ÷ 기준주가) |
| **과세소득** | **OPI지급액 + 추가혜택** (평가차액 제외) |
| 세금 | (연봉+과세소득 합산세금) - (연봉만 세금) |
| 세후 실수령 | 현금 + 주식가치(1년후) + 차액 - 세금 |

## Reference Documents
- `opi-explanation.md` - OPI 주식보상 제도 상세 설명
- `tax.md` - 세금 계산 로직 정의
