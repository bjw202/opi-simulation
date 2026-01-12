/**
 * OPI 주식보상 시뮬레이터 - 메인 초기화
 */

document.addEventListener('DOMContentLoaded', () => {
    // UI 초기화
    UI.init();

    // 디버그용: 콘솔에 Calculator 함수 노출
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('OPI 시뮬레이터 개발 모드');
        console.log('Calculator:', Calculator);
        console.log('ChartManager:', ChartManager);
        console.log('UI:', UI);
    }

    // 예시 데이터로 기본값 설정 (선택적)
    // setDefaultValues();
});

/**
 * 기본값 설정 (테스트용)
 */
function setDefaultValues() {
    const defaults = {
        annualSalary: 150000000,  // 1.5억
        opiRate: 25,             // 25%
        basePrice: 55000,        // 5.5만원
        futurePrice: 65000       // 6.5만원
    };

    const annualSalary = document.getElementById('annual-salary');
    const opiRate = document.getElementById('opi-rate');
    const basePrice = document.getElementById('base-price');
    const futurePrice = document.getElementById('future-price');
    const opiRateValue = document.getElementById('opi-rate-value');

    if (annualSalary) annualSalary.value = defaults.annualSalary.toLocaleString();
    if (opiRate) opiRate.value = defaults.opiRate;
    if (opiRateValue) opiRateValue.textContent = defaults.opiRate + '%';
    if (basePrice) basePrice.value = defaults.basePrice.toLocaleString();
    if (futurePrice) futurePrice.value = defaults.futurePrice.toLocaleString();
}

/**
 * 서비스 워커 등록 (PWA 지원용, 선택적)
 */
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registered:', registration.scope);
            })
            .catch(error => {
                console.log('ServiceWorker registration failed:', error);
            });
    }
}
