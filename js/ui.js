/**
 * OPI 주식보상 시뮬레이터 - UI 컨트롤러
 */

const UI = {
    // DOM 요소 캐싱
    elements: {},

    // 현재 시뮬레이션 결과 저장
    currentResult: null,

    /**
     * UI 초기화
     */
    init() {
        this.cacheElements();
        this.bindEvents();
        this.initDarkMode();
    },

    /**
     * DOM 요소 캐싱
     */
    cacheElements() {
        this.elements = {
            // 폼 요소
            form: document.getElementById('simulator-form'),
            annualSalary: document.getElementById('annual-salary'),
            opiRate: document.getElementById('opi-rate'),
            opiRateValue: document.getElementById('opi-rate-value'),
            basePrice: document.getElementById('base-price'),
            futurePrice: document.getElementById('future-price'),

            // 결과 섹션
            results: document.getElementById('results'),

            // 요약 카드
            optimalRatio: document.getElementById('optimal-ratio'),
            opiAmount: document.getElementById('opi-amount'),
            maxTotal: document.getElementById('max-total'),

            // 테이블
            comparisonTable: document.getElementById('comparison-table')?.querySelector('tbody'),
            priceScenarioTable: document.getElementById('price-scenario-table')?.querySelector('tbody'),

            // 세금 비교
            taxComparison: document.getElementById('tax-comparison'),
            breakevenAnalysis: document.getElementById('breakeven-analysis'),

            // 다크모드 토글
            darkModeToggle: document.getElementById('dark-mode-toggle'),

            // 로딩
            loading: document.getElementById('loading')
        };
    },

    /**
     * 이벤트 바인딩
     */
    bindEvents() {
        // OPI 비율 슬라이더 실시간 업데이트
        if (this.elements.opiRate) {
            this.elements.opiRate.addEventListener('input', (e) => {
                this.updateOpiRateDisplay(e.target.value);
            });
        }

        // 폼 제출
        if (this.elements.form) {
            this.elements.form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.runSimulation();
            });
        }

        // 숫자 입력 포맷팅
        const numberInputs = [
            this.elements.annualSalary,
            this.elements.basePrice,
            this.elements.futurePrice
        ].filter(Boolean);

        numberInputs.forEach(input => {
            input.addEventListener('blur', (e) => this.formatNumberInput(e.target));
            input.addEventListener('focus', (e) => this.unformatNumberInput(e.target));
        });

        // 다크모드 토글
        if (this.elements.darkModeToggle) {
            this.elements.darkModeToggle.addEventListener('click', () => this.toggleDarkMode());
        }
    },

    /**
     * OPI 비율 표시 업데이트
     */
    updateOpiRateDisplay(value) {
        if (this.elements.opiRateValue) {
            this.elements.opiRateValue.textContent = `${value}%`;
        }
    },

    /**
     * 숫자 입력 포맷팅
     */
    formatNumberInput(input) {
        if (input.value) {
            const num = parseInt(input.value.replace(/,/g, ''));
            if (!isNaN(num)) {
                input.value = num.toLocaleString('ko-KR');
            }
        }
    },

    /**
     * 숫자 입력 포맷 해제
     */
    unformatNumberInput(input) {
        input.value = input.value.replace(/,/g, '');
    },

    /**
     * 입력값 가져오기
     */
    getInputValues() {
        return {
            annualSalary: parseInt(this.elements.annualSalary?.value.replace(/,/g, '') || '0'),
            opiRate: parseInt(this.elements.opiRate?.value || '0'),
            baseStockPrice: parseInt(this.elements.basePrice?.value.replace(/,/g, '') || '0'),
            futureStockPrice: parseInt(this.elements.futurePrice?.value.replace(/,/g, '') || '0')
        };
    },

    /**
     * 입력값 유효성 검사
     */
    validateInputs(params) {
        const errors = [];

        if (isNaN(params.annualSalary) || params.annualSalary <= 0) {
            errors.push('계약연봉을 올바르게 입력해주세요.');
        }
        if (isNaN(params.opiRate) || params.opiRate < 0 || params.opiRate > 50) {
            errors.push('OPI 비율은 0~50% 사이여야 합니다.');
        }
        if (isNaN(params.baseStockPrice) || params.baseStockPrice <= 0) {
            errors.push('기준주가를 올바르게 입력해주세요.');
        }
        if (isNaN(params.futureStockPrice) || params.futureStockPrice <= 0) {
            errors.push('미래 예상 주가를 올바르게 입력해주세요.');
        }

        if (errors.length > 0) {
            this.showError(errors.join('\n'));
            return false;
        }
        return true;
    },

    /**
     * 시뮬레이션 실행
     */
    runSimulation() {
        const params = this.getInputValues();

        if (!this.validateInputs(params)) return;

        this.showLoading(true);

        // 비동기 처리로 UI 블로킹 방지
        setTimeout(() => {
            try {
                // 계산 실행
                const result = Calculator.calculateAllScenarios(params);
                const priceScenarios = Calculator.analyzePriceScenarios(params);
                const taxComparison = Calculator.compareTaxImpact({
                    ...params,
                    stockRatio: result.optimalRatio
                });

                this.currentResult = {
                    params,
                    result,
                    priceScenarios,
                    taxComparison
                };

                // UI 업데이트
                this.updateSummary(result, params);
                this.updateComparisonTable(result.scenarios);
                this.updatePriceScenarioTable(priceScenarios);
                this.updateTaxComparison(taxComparison, params);
                this.updateBreakevenAnalysis(taxComparison, params);

                // 차트 업데이트
                ChartManager.updateAllCharts({
                    scenarios: result.scenarios,
                    priceScenarios: priceScenarios,
                    taxComparison: taxComparison
                });

                // 결과 섹션 표시
                this.showResults();

            } catch (error) {
                console.error('Simulation error:', error);
                this.showError('계산 중 오류가 발생했습니다.');
            } finally {
                this.showLoading(false);
            }
        }, 100);
    },

    /**
     * 요약 카드 업데이트
     */
    updateSummary(result, params) {
        if (this.elements.optimalRatio) {
            this.elements.optimalRatio.textContent = `${result.optimalRatio}%`;
        }
        if (this.elements.opiAmount) {
            this.elements.opiAmount.textContent = Calculator.formatCurrencyShort(result.optimalScenario.opiAmount);
        }
        if (this.elements.maxTotal) {
            this.elements.maxTotal.textContent = Calculator.formatCurrencyShort(result.optimalScenario.totalReceived);
        }
    },

    /**
     * 비율별 비교 테이블 업데이트
     */
    updateComparisonTable(scenarios) {
        if (!this.elements.comparisonTable) return;

        const tbody = this.elements.comparisonTable;
        tbody.innerHTML = '';

        const optimalRatio = scenarios.reduce((best, curr) =>
            curr.totalReceived > best.totalReceived ? curr : best
        ).stockRatio;

        scenarios.forEach(s => {
            const isOptimal = s.stockRatio === optimalRatio;
            const row = document.createElement('tr');
            row.className = isOptimal
                ? 'bg-indigo-50 dark:bg-indigo-900/30 font-semibold'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700/50';

            row.innerHTML = `
                <td class="px-4 py-3 whitespace-nowrap">
                    ${isOptimal ? '<span class="text-indigo-600 dark:text-indigo-400 mr-1">★</span>' : ''}
                    ${s.stockRatio}%
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-right">${Calculator.formatCurrencyShort(s.stockRewardAmount)}</td>
                <td class="px-4 py-3 whitespace-nowrap text-right text-green-600 dark:text-green-400">+${Calculator.formatCurrencyShort(s.additionalBenefit)}</td>
                <td class="px-4 py-3 whitespace-nowrap text-right">${s.stockCount.toLocaleString()}주</td>
                <td class="px-4 py-3 whitespace-nowrap text-right">${Calculator.formatCurrencyShort(s.netCashAmount)}</td>
                <td class="px-4 py-3 whitespace-nowrap text-right">${Calculator.formatCurrencyShort(s.futureStockValue)}</td>
                <td class="px-4 py-3 whitespace-nowrap text-right font-bold ${isOptimal ? 'text-indigo-600 dark:text-indigo-400' : ''}">${Calculator.formatCurrencyShort(s.totalReceived)}</td>
            `;
            tbody.appendChild(row);
        });
    },

    /**
     * 주가 시나리오 테이블 업데이트
     */
    updatePriceScenarioTable(priceScenarios) {
        if (!this.elements.priceScenarioTable) return;

        const tbody = this.elements.priceScenarioTable;
        tbody.innerHTML = '';

        priceScenarios.forEach(ps => {
            const row = document.createElement('tr');
            row.className = ps.priceChange === 0
                ? 'bg-gray-50 dark:bg-gray-700/50'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700/50';

            const changeClass = ps.priceChange > 0
                ? 'text-green-600 dark:text-green-400'
                : ps.priceChange < 0
                    ? 'text-red-600 dark:text-red-400'
                    : '';

            row.innerHTML = `
                <td class="px-3 py-2 whitespace-nowrap ${changeClass} font-medium">
                    ${ps.priceChange > 0 ? '+' : ''}${ps.priceChange}%
                </td>
                <td class="px-3 py-2 whitespace-nowrap text-right">${Calculator.formatCurrencyShort(ps.futurePrice)}</td>
                ${ps.scenarios.map(s =>
                    `<td class="px-3 py-2 whitespace-nowrap text-right text-sm">${Calculator.formatCurrencyShort(s.totalReceived)}</td>`
                ).join('')}
                <td class="px-3 py-2 whitespace-nowrap text-right font-bold text-indigo-600 dark:text-indigo-400">${ps.optimalRatio}%</td>
            `;
            tbody.appendChild(row);
        });
    },

    /**
     * 세금 비교 섹션 업데이트
     */
    updateTaxComparison(comparison, params) {
        if (!this.elements.taxComparison) return;

        const formatInsurance = (ins) => `
            <div class="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                <div class="flex justify-between"><span>국민연금</span><span>${Calculator.formatCurrencyShort(ins.nationalPension)}</span></div>
                <div class="flex justify-between"><span>건강보험</span><span>${Calculator.formatCurrencyShort(ins.healthInsurance)}</span></div>
                <div class="flex justify-between"><span>장기요양</span><span>${Calculator.formatCurrencyShort(ins.longTermCare)}</span></div>
                <div class="flex justify-between"><span>고용보험</span><span>${Calculator.formatCurrencyShort(ins.employmentInsurance)}</span></div>
            </div>
        `;

        this.elements.taxComparison.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- 100% 현금 수령 -->
                <div class="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-5 border border-amber-200 dark:border-amber-800">
                    <h4 class="font-bold text-lg mb-4 text-amber-700 dark:text-amber-400">100% 현금 수령</h4>
                    <div class="space-y-3">
                        <div class="flex justify-between">
                            <span class="text-gray-600 dark:text-gray-400">세전 금액</span>
                            <span class="font-semibold">${Calculator.formatCurrency(comparison.allCash.grossAmount)}</span>
                        </div>
                        <details class="group">
                            <summary class="flex justify-between cursor-pointer list-none">
                                <span class="text-gray-600 dark:text-gray-400">4대보험</span>
                                <span class="text-red-500">-${Calculator.formatCurrencyShort(comparison.allCash.insurance.total)}</span>
                            </summary>
                            <div class="mt-2 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                ${formatInsurance(comparison.allCash.insurance)}
                            </div>
                        </details>
                        <details class="group">
                            <summary class="flex justify-between cursor-pointer list-none">
                                <span class="text-gray-600 dark:text-gray-400">소득세+지방세</span>
                                <span class="text-red-500">-${Calculator.formatCurrencyShort(comparison.allCash.tax.total)}</span>
                            </summary>
                            <div class="mt-2 pl-4 border-l-2 border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
                                <div class="flex justify-between"><span>소득세</span><span>${Calculator.formatCurrencyShort(comparison.allCash.tax.incomeTax)}</span></div>
                                <div class="flex justify-between"><span>지방소득세</span><span>${Calculator.formatCurrencyShort(comparison.allCash.tax.localTax)}</span></div>
                            </div>
                        </details>
                        <div class="border-t border-amber-300 dark:border-amber-700 pt-3 flex justify-between">
                            <span class="font-bold">세후 수령액</span>
                            <span class="font-bold text-xl text-amber-700 dark:text-amber-400">${Calculator.formatCurrency(comparison.allCash.netAmount)}</span>
                        </div>
                    </div>
                </div>

                <!-- 주식 선택 -->
                <div class="bg-green-50 dark:bg-green-900/20 rounded-xl p-5 border border-green-200 dark:border-green-800">
                    <h4 class="font-bold text-lg mb-4 text-green-700 dark:text-green-400">주식 ${this.currentResult?.result.optimalRatio || 50}% 선택</h4>
                    <div class="space-y-3">
                        <div class="flex justify-between">
                            <span class="text-gray-600 dark:text-gray-400">현금 부분 (세후)</span>
                            <span class="font-semibold">${Calculator.formatCurrency(comparison.withStock.cashPortion)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600 dark:text-gray-400">주식 가치 (1년 후)</span>
                            <span class="font-semibold">${Calculator.formatCurrency(comparison.withStock.stockPortion)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600 dark:text-gray-400">지급 주식수</span>
                            <span class="font-semibold">${comparison.withStock.stockCount.toLocaleString()}주</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600 dark:text-gray-400">차액</span>
                            <span>${Calculator.formatCurrency(comparison.withStock.remainder)}</span>
                        </div>
                        <div class="flex justify-between text-green-600 dark:text-green-400">
                            <span>추가혜택 가치</span>
                            <span>+${Calculator.formatCurrencyShort(comparison.withStock.additionalBenefitValue)}</span>
                        </div>
                        <div class="border-t border-green-300 dark:border-green-700 pt-3 flex justify-between">
                            <span class="font-bold">예상 총 가치</span>
                            <span class="font-bold text-xl text-green-700 dark:text-green-400">${Calculator.formatCurrency(comparison.withStock.totalFutureValue)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 차이 요약 -->
            <div class="mt-6 p-4 rounded-xl ${comparison.difference >= 0 ? 'bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700' : 'bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700'}">
                <div class="text-center">
                    <span class="text-gray-600 dark:text-gray-400">주식 선택 시 예상 차이</span>
                    <div class="text-2xl font-bold ${comparison.difference >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
                        ${comparison.difference >= 0 ? '+' : ''}${Calculator.formatCurrency(comparison.difference)}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * 손익분기점 분석 업데이트
     */
    updateBreakevenAnalysis(comparison, params) {
        if (!this.elements.breakevenAnalysis) return;

        const breakEvenChange = comparison.breakEvenChange;
        const currentPriceChange = ((params.futureStockPrice / params.baseStockPrice) - 1) * 100;

        this.elements.breakevenAnalysis.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h4 class="font-semibold text-gray-700 dark:text-gray-300 mb-3">손익분기 분석</h4>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="text-gray-600 dark:text-gray-400">기준주가</span>
                            <span class="font-medium">${Calculator.formatCurrency(params.baseStockPrice)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600 dark:text-gray-400">손익분기 주가</span>
                            <span class="font-medium text-indigo-600 dark:text-indigo-400">${Calculator.formatCurrency(comparison.breakEvenPrice)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600 dark:text-gray-400">허용 하락폭</span>
                            <span class="font-medium text-green-600 dark:text-green-400">${breakEvenChange.toFixed(1)}%</span>
                        </div>
                    </div>
                    <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">
                        15% 추가혜택으로 인해 주가가 약 <strong>${Math.abs(breakEvenChange).toFixed(1)}%</strong> 하락해도 현금 수령과 동일한 가치입니다.
                    </p>
                </div>

                <div class="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl p-5">
                    <h4 class="font-semibold text-indigo-700 dark:text-indigo-400 mb-3">추천 전략</h4>
                    ${comparison.recommendation === 'stock' ? `
                        <div class="flex items-start gap-3">
                            <span class="text-2xl">📈</span>
                            <div>
                                <p class="font-medium text-gray-800 dark:text-gray-200">주식 선택 추천</p>
                                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    현재 예상 주가(${Calculator.formatCurrencyShort(params.futureStockPrice)})가 손익분기점(${Calculator.formatCurrencyShort(comparison.breakEvenPrice)})보다 높으므로 주식 선택이 유리합니다.
                                </p>
                            </div>
                        </div>
                    ` : `
                        <div class="flex items-start gap-3">
                            <span class="text-2xl">💵</span>
                            <div>
                                <p class="font-medium text-gray-800 dark:text-gray-200">현금 수령 고려</p>
                                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    현재 예상 주가(${Calculator.formatCurrencyShort(params.futureStockPrice)})가 손익분기점(${Calculator.formatCurrencyShort(comparison.breakEvenPrice)})보다 낮으므로 현금 수령이 유리할 수 있습니다.
                                </p>
                            </div>
                        </div>
                    `}
                </div>
            </div>
        `;
    },

    /**
     * 결과 섹션 표시
     */
    showResults() {
        if (this.elements.results) {
            this.elements.results.classList.remove('hidden');
            this.elements.results.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    },

    /**
     * 로딩 표시
     */
    showLoading(show) {
        if (this.elements.loading) {
            this.elements.loading.classList.toggle('hidden', !show);
        }
    },

    /**
     * 에러 표시
     */
    showError(message) {
        alert(message);
    },

    /**
     * 다크모드 초기화
     */
    initDarkMode() {
        // 시스템 설정 또는 저장된 설정 확인
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            document.documentElement.classList.add('dark');
        }

        // 시스템 설정 변경 감지
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                document.documentElement.classList.toggle('dark', e.matches);
                ChartManager.refreshChartsForTheme();
            }
        });
    },

    /**
     * 다크모드 토글
     */
    toggleDarkMode() {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        ChartManager.refreshChartsForTheme();
    }
};

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.UI = UI;
}
