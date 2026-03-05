(function () {
    const style = document.createElement('style');
    style.textContent = `
        #pageLoader {
            position: fixed;
            inset: 0;
            background: rgb(14, 16, 14);
            z-index: 99999;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 1.5rem;
            transition: opacity 0.45s ease;
        }
        #pageLoader.fade-out {
            opacity: 0;
            pointer-events: none;
        }
        .loader-track {
            width: 56px;
            height: 56px;
            position: relative;
        }
        .loader-track::before,
        .loader-track::after {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: 50%;
            border: 4px solid transparent;
        }
        .loader-track::before {
            border-top-color: #5a97f9;
            animation: ldrSpin 0.9s linear infinite;
        }
        .loader-track::after {
            border-bottom-color: #5a97f930;
            animation: ldrSpin 0.9s linear infinite reverse;
        }
        .loader-dots {
            display: flex;
            gap: 6px;
        }
        .loader-dots span {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #5a97f9;
            animation: ldrBounce 1.2s ease-in-out infinite;
        }
        .loader-dots span:nth-child(2) { animation-delay: 0.2s; }
        .loader-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes ldrSpin {
            to { transform: rotate(360deg); }
        }
        @keyframes ldrBounce {
            0%, 80%, 100% { opacity: 0.25; transform: scale(0.8); }
            40%            { opacity: 1;    transform: scale(1.2); }
        }
    `;
    document.head.appendChild(style);

    const loader = document.createElement('div');
    loader.id = 'pageLoader';
    loader.innerHTML = `
        <div class="loader-track"></div>
        <div class="loader-dots">
            <span></span><span></span><span></span>
        </div>
    `;
    document.documentElement.appendChild(loader);

    function dismissLoader() {
        loader.classList.add('fade-out');
        setTimeout(function () { if (loader.parentNode) loader.remove(); }, 480);
    }

    const startTime = Date.now();

    // Primary: fire when all resources (images, scripts) are ready
    window.addEventListener('load', function () {
        const elapsed   = Date.now() - startTime;
        const remaining = Math.max(0, 2000 - elapsed);
        setTimeout(dismissLoader, remaining);
    });

    // Fallback: force-remove after 6 seconds no matter what
    setTimeout(dismissLoader, 6000);
}());
