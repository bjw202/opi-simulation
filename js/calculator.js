/**
 * OPI 주식보상 시뮬레이터 - 계산 로직
 * 삼성전자 OPI 주식보상 제도 기반
 */

const CONFIG = {
    // 주식보상 비율 선택지 (%)
    STOCK_RATIO_OPTIONS: [0, 10, 20, 30, 40, 50],

    // 추가혜택 비율 (15%)
    ADDITIONAL_BENEFIT_RATE: 0.15,

    // 4대 보험 요율 (2025년 기준)
    NATIONAL_PENSION_RATE: 0.045,        // 국민연금 4.5%
    NATIONAL_PENSION_CAP: 3258000,       // 국민연금 연간 상한액
    HEALTH_INSURANCE_RATE: 0.03545,      // 건강보험 3.545%
    LONG_TERM_CARE_RATE: 0.1295,         // 장기요양보험 (건강보험료의 12.95%)
    EMPLOYMENT_INSURANCE_RATE: 0.009,    // 고용보험 0.9%

    // 소득세 누진세율 구간
    TAX_BRACKETS: [
        { limit: 14000000, rate: 0.06, deduction: 0 },
        { limit: 50000000, rate: 0.15, deduction: 1260000 },
        { limit: 88000000, rate: 0.24, deduction: 5760000 },
        { limit: 150000000, rate: 0.35, deduction: 15440000 },
        { limit: 300000000, rate: 0.38, deduction: 19940000 },
        { limit: 500000000, rate: 0.40, deduction: 25940000 },
        { limit: 1000000000, rate: 0.42, deduction: 35940000 },
        { limit: Infinity, rate: 0.45, deduction: 65940000 }
    ],

    // 지방소득세 (소득세의 10%)
    LOCAL_TAX_RATE: 0.10,

    // 주가 시나리오 변동률 (%)
    PRICE_CHANGE_SCENARIOS: [-30, -20, -10, 0, 10, 20, 30]
};

/**
 * 4대 보험료 계산
 * @param {number} grossPay - 세전 급여
 * @returns {Object} 4대 보험 상세 내역
 */
function calculateSocialInsurance(grossPay) {
    const nationalPension = Math.min(grossPay * CONFIG.NATIONAL_PENSION_RATE, CONFIG.NATIONAL_PENSION_CAP);
    const healthInsurance = grossPay * CONFIG.HEALTH_INSURANCE_RATE;
    const longTermCare = healthInsurance * CONFIG.LONG_TERM_CARE_RATE;
    const employmentInsurance = grossPay * CONFIG.EMPLOYMENT_INSURANCE_RATE;

    return {
        nationalPension,
        healthInsurance,
        longTermCare,
        employmentInsurance,
        total: nationalPension + healthInsurance + longTermCare + employmentInsurance
    };
}

/**
 * 소득세 계산 (누진세율 적용)
 * @param {number} taxableIncome - 과세표준
 * @returns {Object} 소득세 상세 내역
 */
function calculateIncomeTax(taxableIncome) {
    if (taxableIncome <= 0) {
        return { incomeTax: 0, localTax: 0, total: 0, bracket: null };
    }

    for (const bracket of CONFIG.TAX_BRACKETS) {
        if (taxableIncome <= bracket.limit) {
            const incomeTax = Math.max(0, taxableIncome * bracket.rate - bracket.deduction);
            const localTax = incomeTax * CONFIG.LOCAL_TAX_RATE;
            return {
                incomeTax,
                localTax,
                total: incomeTax + localTax,
                bracket: bracket
            };
        }
    }

    // Fallback (should not reach here)
    const lastBracket = CONFIG.TAX_BRACKETS[CONFIG.TAX_BRACKETS.length - 1];
    const incomeTax = taxableIncome * lastBracket.rate - lastBracket.deduction;
    const localTax = incomeTax * CONFIG.LOCAL_TAX_RATE;
    return { incomeTax, localTax, total: incomeTax + localTax, bracket: lastBracket };
}

/**
 * 실수령액 계산 (세전 급여 기준)
 * @param {number} grossPay - 세전 급여
 * @returns {Object} 실수령액 상세 내역
 */
function calculateNetPay(grossPay) {
    const insurance = calculateSocialInsurance(grossPay);
    // 과세표준 = 총급여 - 4대보험 (간이 계산, 실제로는 더 복잡함)
    const taxableIncome = grossPay - insurance.total;
    const tax = calculateIncomeTax(taxableIncome);

    return {
        grossPay,
        insurance,
        tax,
        totalDeductions: insurance.total + tax.total,
        netPay: grossPay - insurance.total - tax.total
    };
}

/**
 * OPI 주식보상 계산
 * @param {Object} params - 입력 파라미터
 * @param {number} params.annualSalary - 계약연봉 (원)
 * @param {number} params.opiRate - 예상 OPI 비율 (0~50, %)
 * @param {number} params.baseStockPrice - 기준주가 (원)
 * @param {number} params.futureStockPrice - 미래 예상 주가 (원)
 * @param {number} params.stockRatio - 주식보상 비율 (0~50, %)
 * @returns {Object} 계산 결과
 */
function calculateOPIReward(params) {
    const { annualSalary, opiRate, baseStockPrice, futureStockPrice, stockRatio } = params;

    // 1. OPI 지급액 (세전)
    const opiAmount = annualSalary * (opiRate / 100);

    // 2. 주식보상 신청금액
    const stockRewardAmount = opiAmount * (stockRatio / 100);

    // 3. 현금 지급액 (세전)
    const cashAmountGross = opiAmount - stockRewardAmount;

    // 4. 추가혜택 (15%)
    const additionalBenefit = stockRewardAmount * CONFIG.ADDITIONAL_BENEFIT_RATE;

    // 5. 총 주식보상 (주식보상 신청금액 + 15% 추가혜택)
    const totalStockReward = stockRewardAmount + additionalBenefit;

    // 6. 지급 주식수 = 총 주식보상 / 기준주가 (소수점 버림)
    const stockCount = Math.floor(totalStockReward / baseStockPrice);

    // 7. 차액 (현금 지급)
    const remainder = totalStockReward - (stockCount * baseStockPrice);

    // 8. 1년 후 주식 가치 (미래주가 기준)
    const futureStockValue = stockCount * futureStockPrice;

    // ========== 세금 계산 ==========
    // 과세소득 = OPI + 15% 추가혜택 (평가차액은 과세 대상 아님)
    // 연봉과 합산하여 한계세율 적용

    // 연봉만 있을 때의 세금
    const salaryOnlyTax = calculateNetPay(annualSalary);

    // OPI 관련 과세소득 = OPI + 15% 추가혜택
    const opiTaxableIncome = opiAmount + additionalBenefit;

    // 연봉 + OPI 관련 소득 합산 시 세금
    const totalIncome = annualSalary + opiTaxableIncome;
    const totalTax = calculateNetPay(totalIncome);

    // OPI에 대한 추가 세금 (한계세금)
    const opiTaxAmount = totalTax.totalDeductions - salaryOnlyTax.totalDeductions;

    // ========== 실수령액 계산 ==========

    // 총 수령액 (세전) = 현금 + 주식 미래가치 + 차액
    const grossTotal = cashAmountGross + futureStockValue + remainder;

    // 실수령액 = 총 수령액 - OPI 관련 세금
    const totalReceived = grossTotal - opiTaxAmount;

    // ========== 100% 현금 수령 대비 ==========

    const allCashTotalTax = calculateNetPay(annualSalary + opiAmount);
    const allCashOpiTax = allCashTotalTax.totalDeductions - salaryOnlyTax.totalDeductions;
    const allCashNet = opiAmount - allCashOpiTax;
    const vsAllCash = totalReceived - allCashNet;

    return {
        // 입력값
        stockRatio,
        opiRate,

        // OPI 기본
        opiAmount,

        // 주식 관련
        stockRewardAmount,
        additionalBenefit,
        totalStockReward,
        stockCount,
        remainder,
        futureStockValue,

        // 현금 관련
        cashAmountGross,

        // 세금 정보
        opiTaxableIncome,    // OPI 관련 과세소득 (OPI + 15% 추가혜택)
        opiTaxAmount,        // OPI 관련 세금
        salaryOnlyTax,
        totalTax,

        // 총합
        grossTotal,          // 세전 총수령
        totalReceived,       // 세후 실수령
        vsAllCash,
        allCashNet
    };
}

/**
 * 모든 비율에 대한 시나리오 비교 계산
 * @param {Object} baseParams - 기본 파라미터 (annualSalary, opiRate, baseStockPrice, futureStockPrice)
 * @returns {Object} 모든 시나리오 결과 및 최적 비율
 */
function calculateAllScenarios(baseParams) {
    const scenarios = CONFIG.STOCK_RATIO_OPTIONS.map(ratio => {
        return calculateOPIReward({
            ...baseParams,
            stockRatio: ratio
        });
    });

    // 최적 비율 찾기 (총 수령액 기준)
    const optimalScenario = scenarios.reduce((best, current) =>
        current.totalReceived > best.totalReceived ? current : best
    );

    return {
        scenarios,
        optimalRatio: optimalScenario.stockRatio,
        optimalScenario
    };
}

/**
 * 주가 변동 시나리오 분석
 * @param {Object} baseParams - 기본 파라미터
 * @param {Array} priceChanges - 주가 변동률 배열 (기본값: CONFIG.PRICE_CHANGE_SCENARIOS)
 * @returns {Array} 각 주가 변동에 대한 분석 결과
 */
function analyzePriceScenarios(baseParams, priceChanges = CONFIG.PRICE_CHANGE_SCENARIOS) {
    return priceChanges.map(change => {
        const futurePrice = baseParams.baseStockPrice * (1 + change / 100);
        const scenarios = calculateAllScenarios({
            ...baseParams,
            futureStockPrice: futurePrice
        });

        return {
            priceChange: change,
            futurePrice,
            ...scenarios
        };
    });
}

/**
 * 주식 vs 현금 세금 영향 비교
 * @param {Object} params - 파라미터
 * @returns {Object} 세금 비교 결과
 */
function compareTaxImpact(params) {
    const { annualSalary, opiRate, baseStockPrice, futureStockPrice, stockRatio } = params;
    const opiAmount = annualSalary * (opiRate / 100);

    // Case 1: 100% 현금 수령 (연봉 합산 기준 한계세율 적용)
    const salaryOnlyTax = calculateNetPay(annualSalary);
    const salaryPlusOpiTax = calculateNetPay(annualSalary + opiAmount);
    const opiMarginalTax = salaryPlusOpiTax.totalDeductions - salaryOnlyTax.totalDeductions;
    const allCashNetAmount = opiAmount - opiMarginalTax;

    const allCash = {
        grossAmount: opiAmount,
        taxableIncome: opiAmount,
        tax: opiMarginalTax,
        netAmount: allCashNetAmount,
        futureValue: allCashNetAmount
    };

    // Case 2: 주식 선택
    const stockResult = calculateOPIReward(params);
    const withStock = {
        grossAmount: opiAmount,
        additionalBenefit: stockResult.additionalBenefit,
        taxableIncome: stockResult.opiTaxableIncome,
        tax: stockResult.opiTaxAmount,
        stockCount: stockResult.stockCount,
        futureStockValue: stockResult.futureStockValue,
        totalFutureValue: stockResult.totalReceived
    };

    // 손익분기 주가 계산 (평가차액 과세 반영으로 약 -12%~-14% 수준)
    const breakEvenPrice = baseStockPrice * (1 - CONFIG.ADDITIONAL_BENEFIT_RATE / (1 + CONFIG.ADDITIONAL_BENEFIT_RATE));
    const breakEvenChange = ((breakEvenPrice / baseStockPrice) - 1) * 100;

    return {
        allCash,
        withStock,
        difference: withStock.totalFutureValue - allCash.futureValue,
        breakEvenPrice,
        breakEvenChange,
        recommendation: withStock.totalFutureValue >= allCash.futureValue ? 'stock' : 'cash'
    };
}

/**
 * 숫자 포맷팅 (한국 원화)
 * @param {number} value - 숫자
 * @returns {string} 포맷팅된 문자열
 */
function formatCurrency(value) {
    return new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency: 'KRW',
        maximumFractionDigits: 0
    }).format(value);
}

/**
 * 숫자 포맷팅 (간략화, 만원 단위)
 * @param {number} value - 숫자
 * @returns {string} 포맷팅된 문자열
 */
function formatCurrencyShort(value) {
    if (value >= 100000000) {
        return (value / 100000000).toFixed(1) + '억';
    } else if (value >= 10000) {
        return Math.round(value / 10000).toLocaleString() + '만';
    }
    return value.toLocaleString() + '원';
}

/**
 * 퍼센트 포맷팅
 * @param {number} value - 숫자
 * @param {number} decimals - 소수점 자릿수
 * @returns {string} 포맷팅된 문자열
 */
function formatPercent(value, decimals = 1) {
    return value.toFixed(decimals) + '%';
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.Calculator = {
        CONFIG,
        calculateSocialInsurance,
        calculateIncomeTax,
        calculateNetPay,
        calculateOPIReward,
        calculateAllScenarios,
        analyzePriceScenarios,
        compareTaxImpact,
        formatCurrency,
        formatCurrencyShort,
        formatPercent
    };
}
