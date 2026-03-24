export function showLoading() {
    const containerDiv = document.createElement('div');
    containerDiv.classList.add('loader');
    containerDiv.id = "loader";

    const svgContent = `
        <svg
            class="container"
            viewBox="0 0 40 40"
            height="80"
            width="80"
            >
            <circle
                class="track"
                cx="20"
                cy="20"
                r="17.5"
                pathlength="100"
                stroke-width="5px"
                fill="none"
            />
            <circle
                class="car"
                cx="20"
                cy="20"
                r="17.5"
                pathlength="100"
                stroke-width="5px"
                fill="none"
            />
         </svg>

        <style>
            .loader {
                width: 100vw;
                height: 100vh;
                position: fixed; /* Changed to fixed to ensure it covers the entire viewport */
                top: 0;
                left: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                background-color: rgba(0, 0, 0, 0.5); /* Semi-transparent background */
                z-index: 9999; /* Ensure it's on top of other elements */
            }

            .container {
                --uib-size: 60px; /* Increased size for better visibility */
                --uib-color: white;
                --uib-speed: .8s;
                --uib-bg-opacity: 0.3;
                height: var(--uib-size);
                width: var(--uib-size);
                transform-origin: center;
                animation: rotate var(--uib-speed) linear infinite;
                will-change: transform;
                overflow: visible;
            }

            .car {
                fill: none;
                stroke: var(--uib-color);
                stroke-dasharray: 25, 75;
                stroke-dashoffset: 0;
                stroke-linecap: round;
                transition: stroke 0.5s ease;
            }

            .track {
                fill: none;
                stroke: var(--uib-color);
                opacity: var(--uib-bg-opacity);
                transition: stroke 0.5s ease;
            }

            @keyframes rotate {
                100% {
                transform: rotate(360deg);
                }
            }
        </style>
    `;

    containerDiv.innerHTML = svgContent;

    document.body.appendChild(containerDiv);
};

export function hideLoader() {
    const loader = document.querySelector("#loader");
    if (loader) {
        loader.remove();
    }
}