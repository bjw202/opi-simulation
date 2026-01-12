/**
 * OPI 주식보상 시뮬레이터 - 차트 렌더링
 * Chart.js 기반
 */

const ChartManager = {
    // 차트 인스턴스 저장
    ratioChart: null,
    priceScenarioChart: null,
    taxComparisonChart: null,

    // 색상 팔레트
    colors: {
        samsung: {
            blue: '#1428a0',
            light: '#4a5fc1',
            dark: '#0d1a6b'
        },
        chart: {
            cash: 'rgba(251, 191, 36, 0.8)',       // amber-400
            cashBorder: 'rgb(251, 191, 36)',
            stock: 'rgba(34, 197, 94, 0.8)',       // green-500
            stockBorder: 'rgb(34, 197, 94)',
            benefit: 'rgba(99, 102, 241, 0.8)',    // indigo-500
            benefitBorder: 'rgb(99, 102, 241)',
            remainder: 'rgba(156, 163, 175, 0.8)', // gray-400
            remainderBorder: 'rgb(156, 163, 175)'
        },
        ratioColors: [
            'rgba(239, 68, 68, 0.8)',   // red-500 (0%)
            'rgba(249, 115, 22, 0.8)',  // orange-500 (10%)
            'rgba(234, 179, 8, 0.8)',   // yellow-500 (20%)
            'rgba(132, 204, 22, 0.8)',  // lime-500 (30%)
            'rgba(34, 197, 94, 0.8)',   // green-500 (40%)
            'rgba(6, 182, 212, 0.8)'    // cyan-500 (50%)
        ],
        ratioBorders: [
            'rgb(239, 68, 68)',
            'rgb(249, 115, 22)',
            'rgb(234, 179, 8)',
            'rgb(132, 204, 22)',
            'rgb(34, 197, 94)',
            'rgb(6, 182, 212)'
        ]
    },

    // 공통 차트 옵션
    getCommonOptions() {
        const isDark = document.documentElement.classList.contains('dark');
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: isDark ? '#e5e7eb' : '#374151',
                        font: {
                            family: "'Pretendard', sans-serif"
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: isDark ? '#9ca3af' : '#6b7280'
                    },
                    grid: {
                        color: isDark ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.5)'
                    }
                },
                y: {
                    ticks: {
                        color: isDark ? '#9ca3af' : '#6b7280',
                        callback: function(value) {
                            return (value / 10000).toLocaleString() + '만';
                        }
                    },
                    grid: {
                        color: isDark ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.5)'
                    }
                }
            }
        };
    },

    /**
     * 비율별 총 수령액 비교 차트 (스택 바 차트)
     * @param {Array} scenarios - 시나리오 배열
     */
    updateRatioChart(scenarios) {
        const ctx = document.getElementById('ratio-chart');
        if (!ctx) return;

        if (this.ratioChart) {
            this.ratioChart.destroy();
        }

        const labels = scenarios.map(s => `${s.stockRatio}%`);
        const cashData = scenarios.map(s => s.netCashAmount);
        const stockData = scenarios.map(s => s.futureStockValue);
        const benefitData = scenarios.map(s => s.additionalBenefit * (s.futureStockValue / (s.stockCount * Calculator.CONFIG.STOCK_RATIO_OPTIONS[0] || s.currentStockValue || 1)));
        const remainderData = scenarios.map(s => s.remainder);

        // 최적 비율 인덱스 찾기
        const optimalIndex = scenarios.findIndex(s =>
            s.totalReceived === Math.max(...scenarios.map(sc => sc.totalReceived))
        );

        // 배경색 배열 (최적 비율 강조)
        const bgColors = scenarios.map((_, i) =>
            i === optimalIndex ? 'rgba(99, 102, 241, 0.2)' : 'transparent'
        );

        this.ratioChart = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: '현금 수령 (세후)',
                        data: cashData,
                        backgroundColor: this.colors.chart.cash,
                        borderColor: this.colors.chart.cashBorder,
                        borderWidth: 1,
                        borderRadius: 4
                    },
                    {
                        label: '주식 가치 (1년 후)',
                        data: stockData,
                        backgroundColor: this.colors.chart.stock,
                        borderColor: this.colors.chart.stockBorder,
                        borderWidth: 1,
                        borderRadius: 4
                    },
                    {
                        label: '차액',
                        data: remainderData,
                        backgroundColor: this.colors.chart.remainder,
                        borderColor: this.colors.chart.remainderBorder,
                        borderWidth: 1,
                        borderRadius: 4
                    }
                ]
            },
            options: {
                ...this.getCommonOptions(),
                plugins: {
                    ...this.getCommonOptions().plugins,
                    title: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' +
                                    Calculator.formatCurrency(context.raw);
                            },
                            footer: function(tooltipItems) {
                                const total = tooltipItems.reduce((sum, item) => sum + item.raw, 0);
                                return '합계: ' + Calculator.formatCurrency(total);
                            }
                        }
                    },
                    annotation: optimalIndex >= 0 ? {
                        annotations: {
                            optimal: {
                                type: 'box',
                                xMin: optimalIndex - 0.5,
                                xMax: optimalIndex + 0.5,
                                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                borderColor: 'rgba(99, 102, 241, 0.5)',
                                borderWidth: 2
                            }
                        }
                    } : {}
                },
                scales: {
                    ...this.getCommonOptions().scales,
                    x: {
                        ...this.getCommonOptions().scales.x,
                        stacked: true,
                        title: {
                            display: true,
                            text: '주식보상 비율',
                            color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280'
                        }
                    },
                    y: {
                        ...this.getCommonOptions().scales.y,
                        stacked: true,
                        title: {
                            display: true,
                            text: '금액 (원)',
                            color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280'
                        }
                    }
                }
            }
        });
    },

    /**
     * 주가 시나리오별 수익 분석 차트 (라인 차트)
     * @param {Array} priceScenarios - 주가 시나리오 배열
     */
    updatePriceScenarioChart(priceScenarios) {
        const ctx = document.getElementById('price-scenario-chart');
        if (!ctx) return;

        if (this.priceScenarioChart) {
            this.priceScenarioChart.destroy();
        }

        const labels = priceScenarios.map(ps => `${ps.priceChange > 0 ? '+' : ''}${ps.priceChange}%`);

        const datasets = Calculator.CONFIG.STOCK_RATIO_OPTIONS.map((ratio, index) => ({
            label: `${ratio}%`,
            data: priceScenarios.map(ps => ps.scenarios[index].totalReceived),
            borderColor: this.colors.ratioBorders[index],
            backgroundColor: this.colors.ratioColors[index],
            fill: false,
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 6
        }));

        this.priceScenarioChart = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                ...this.getCommonOptions(),
                plugins: {
                    ...this.getCommonOptions().plugins,
                    title: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ' 선택: ' +
                                    Calculator.formatCurrency(context.raw);
                            }
                        }
                    }
                },
                scales: {
                    ...this.getCommonOptions().scales,
                    x: {
                        ...this.getCommonOptions().scales.x,
                        title: {
                            display: true,
                            text: '주가 변동률',
                            color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280'
                        }
                    },
                    y: {
                        ...this.getCommonOptions().scales.y,
                        title: {
                            display: true,
                            text: '총 수령액 (원)',
                            color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280'
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    },

    /**
     * 세금 비교 도넛 차트
     * @param {Object} comparison - 세금 비교 데이터
     */
    updateTaxComparisonChart(comparison) {
        const ctx = document.getElementById('tax-comparison-chart');
        if (!ctx) return;

        if (this.taxComparisonChart) {
            this.taxComparisonChart.destroy();
        }

        const isDark = document.documentElement.classList.contains('dark');

        this.taxComparisonChart = new Chart(ctx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['현금 (세후)', '주식 가치', '차액'],
                datasets: [{
                    data: [
                        comparison.withStock.cashPortion,
                        comparison.withStock.stockPortion,
                        comparison.withStock.remainder
                    ],
                    backgroundColor: [
                        this.colors.chart.cash,
                        this.colors.chart.stock,
                        this.colors.chart.remainder
                    ],
                    borderColor: [
                        this.colors.chart.cashBorder,
                        this.colors.chart.stockBorder,
                        this.colors.chart.remainderBorder
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: isDark ? '#e5e7eb' : '#374151',
                            padding: 16,
                            font: {
                                family: "'Pretendard', sans-serif"
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.raw / total) * 100).toFixed(1);
                                return context.label + ': ' + Calculator.formatCurrency(context.raw) + ` (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    },

    /**
     * 모든 차트 업데이트
     * @param {Object} data - 차트 데이터
     */
    updateAllCharts(data) {
        if (data.scenarios) {
            this.updateRatioChart(data.scenarios);
        }
        if (data.priceScenarios) {
            this.updatePriceScenarioChart(data.priceScenarios);
        }
        if (data.taxComparison) {
            this.updateTaxComparisonChart(data.taxComparison);
        }
    },

    /**
     * 다크모드 변경 시 차트 리프레시
     */
    refreshChartsForTheme() {
        // 기존 데이터가 있으면 차트 다시 그리기
        if (this.ratioChart) {
            const data = this.ratioChart.data;
            this.ratioChart.options = {
                ...this.ratioChart.options,
                ...this.getCommonOptions()
            };
            this.ratioChart.update();
        }
        if (this.priceScenarioChart) {
            this.priceScenarioChart.options = {
                ...this.priceScenarioChart.options,
                ...this.getCommonOptions()
            };
            this.priceScenarioChart.update();
        }
        if (this.taxComparisonChart) {
            const isDark = document.documentElement.classList.contains('dark');
            this.taxComparisonChart.options.plugins.legend.labels.color = isDark ? '#e5e7eb' : '#374151';
            this.taxComparisonChart.update();
        }
    },

    /**
     * 모든 차트 삭제
     */
    destroyAllCharts() {
        if (this.ratioChart) {
            this.ratioChart.destroy();
            this.ratioChart = null;
        }
        if (this.priceScenarioChart) {
            this.priceScenarioChart.destroy();
            this.priceScenarioChart = null;
        }
        if (this.taxComparisonChart) {
            this.taxComparisonChart.destroy();
            this.taxComparisonChart = null;
        }
    }
};

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.ChartManager = ChartManager;
}
