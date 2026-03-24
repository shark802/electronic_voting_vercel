import { showSwalErrorToast, showSwalSuccessToast, showSwalWarningToast } from "/javascript/helper/sweetAlertFunctions.js";

function parseDateTime(date, time) {
    const parseDate = new Date(date);
    const [hourPart, minutePart] = time.split(':');

    return parseDate.setHours(hourPart, minutePart);
}

async function fetchPublicIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();

        return data.ip;
    } catch (error) {
        console.error('Error fetching IP address:', error);
        throw new Error('Unable to fetch IP address');
    }
}

// Function to show authentication modal
function showAuthenticationModal() {
    return Swal.fire({
        html: `
            <div class="modern-auth-modal">
                <div class="auth-icon-container">
                    <div class="auth-spinner">
                        <div class="spinner-ring"></div>
                        <div class="spinner-ring delay-1"></div>
                        <div class="spinner-ring delay-2"></div>
                    </div>
                    <div class="auth-shield">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L2 7V12C2 18.08 6.61 23.29 12 24C17.39 23.29 22 18.08 22 12V7L12 2Z" fill="currentColor"/>
                            <path d="M10 14L8 12L7 13L10 16L17 9L16 8L10 14Z" fill="white"/>
                        </svg>
                    </div>
                </div>
                <h3 class="auth-title">Verifying Your Voting Location</h3>
                <p class="auth-subtitle">Please wait while we confirm your access from a registered voting precinct. This may take a few seconds.</p>
                <div class="auth-steps">
                    <div class="step active">
                        <div class="step-dot"></div>
                        <span>Detecting IP Address</span>
                    </div>
                    <div class="step">
                        <div class="step-dot"></div>
                        <span>Validating Precinct</span>
                    </div>
                    <div class="step">
                        <div class="step-dot"></div>
                        <span>Authorizing Access</span>
                    </div>
                </div>
                <p class="auth-note">This step ensures voting is only allowed from approved locations.</p>
            </div>
            <style>
                .modern-auth-modal {
                    padding: 2rem 1rem;
                    text-align: center;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                
                .auth-icon-container {
                    position: relative;
                    display: inline-block;
                    margin-bottom: 2rem;
                }
                
                .auth-spinner {
                    width: 80px;
                    height: 80px;
                    position: relative;
                }
                
                .spinner-ring {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    border: 3px solid transparent;
                    border-top: 3px solid #4f46e5;
                    border-radius: 50%;
                    animation: spin 1.5s linear infinite;
                }
                
                .spinner-ring.delay-1 {
                    animation-delay: 0.3s;
                    border-top-color: #06b6d4;
                    width: 90%;
                    height: 90%;
                    top: 5%;
                    left: 5%;
                }
                
                .spinner-ring.delay-2 {
                    animation-delay: 0.6s;
                    border-top-color: #10b981;
                    width: 80%;
                    height: 80%;
                    top: 10%;
                    left: 10%;
                }
                
                .auth-shield {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 40px;
                    height: 40px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                }
                
                .auth-title {
                    font-size: 1.5rem;
                    font-weight: 600;
                    color: #1f2937;
                    margin: 0 0 0.5rem 0;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                
                .auth-subtitle {
                    font-size: 1rem;
                    color: #6b7280;
                    margin: 0 0 2rem 0;
                    font-weight: 500;
                }
                
                .auth-steps {
                    display: flex;
                    justify-content: center;
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                    flex-wrap: wrap;
                }
                
                .step {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.8rem;
                    color: #9ca3af;
                    transition: all 0.3s ease;
                    min-width: 80px;
                }
                
                .step.active {
                    color: #4f46e5;
                }
                
                .step-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #e5e7eb;
                    transition: all 0.3s ease;
                }
                
                .step.active .step-dot {
                    background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%);
                    box-shadow: 0 0 15px rgba(79, 70, 229, 0.5);
                    animation: pulse 2s infinite;
                }
                
                .auth-note {
                    font-size: 0.9rem;
                    color: #6b7280;
                    margin: 0;
                    font-style: italic;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.2); opacity: 0.8; }
                }
                
                @media (max-width: 480px) {
                    .auth-steps {
                        flex-direction: column;
                        gap: 1rem;
                    }
                    
                    .step {
                        flex-direction: row;
                        justify-content: center;
                    }
                }
            </style>
        `,
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        backdrop: 'rgba(0, 0, 0, 0.4)',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        showCloseButton: false,
        customClass: {
            popup: 'modern-auth-popup',
            container: 'modern-auth-container'
        },
        didOpen: () => {
            // Add additional styling to SweetAlert2 elements
            const style = document.createElement('style');
            style.textContent = `
                .modern-auth-popup {
                    border-radius: 20px !important;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
                    border: 1px solid rgba(255, 255, 255, 0.2) !important;
                    backdrop-filter: blur(10px) !important;
                }
                
                .modern-auth-container {
                    backdrop-filter: blur(5px) !important;
                }
            `;
            document.head.appendChild(style);

            // Animate steps progression
            setTimeout(() => {
                const steps = document.querySelectorAll('.step');
                if (steps[1]) {
                    steps[0].classList.remove('active');
                    steps[1].classList.add('active');
                }
            }, 2000);

            setTimeout(() => {
                const steps = document.querySelectorAll('.step');
                if (steps[2]) {
                    steps[1].classList.remove('active');
                    steps[2].classList.add('active');
                }
            }, 4000);
        }
    });
}

// Function to validate IP address with server
async function validateIPAddress(publicIP) {
    try {
        const response = await fetch(`/api/ip-address/validate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ipAddress: publicIP })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error validating IP address:', error);
        throw error;
    }
}

document.querySelectorAll("#vote-now-button").forEach(button => {
    button.addEventListener('click', async event => {
        const parentSection = event.target.parentElement;
        const electionId = event.target.closest('section').querySelector("#election-id").textContent;

        const now = new Date();
        const startDate = parseDateTime(parentSection.querySelector("#date-start").value, parentSection.querySelector("#time-start").value);
        const endDate = parseDateTime(parentSection.querySelector("#date-end").value, parentSection.querySelector("#time-end").value);

        if (now >= startDate && now < endDate) {
            await handleVoteRequest(electionId);
        } else if (now < startDate) {
            showSwalWarningToast('Voting has not started yet. Please come back later.');
        } else {
            viewElectionResult(electionId);
        }
    });
});

async function handleVoteRequest(electionId) {
    let authModal;

    try {
        // Show authentication modal
        authModal = showAuthenticationModal();

        // Fetch public IP
        const publicIP = await fetchPublicIP();
        console.log('Public IP:', publicIP);

        // Validate IP address with server
        const validationResult = await validateIPAddress(publicIP);

        // Close authentication modal
        if (authModal) {
            Swal.close();
        }

        // Check validation result
        console.log(validationResult);
        if (validationResult?.isValid === true) {
            // Redirect to ballot page
            window.location.href = `/ballot/${electionId}`;

        } else {
            // IP is not valid - show modern error message
            await Swal.fire({
                html: `
                    <div class="modern-error-modal">
                        <div class="error-icon-container">
                            <div class="error-icon">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="12" cy="12" r="10" fill="#fee2e2"/>
                                    <path d="M15 9L9 15M9 9L15 15" stroke="#dc2626" stroke-width="2" stroke-linecap="round"/>
                                </svg>
                            </div>
                        </div>
                        <h3 class="error-title">Access Denied – Unregistered Location</h3>
                        <p class="error-message">Voting from this location is not allowed. Please connect from an authorized precinct computer or contact an election official for help.</p>
                        <div class="error-details">
                            <div class="detail-card">
                                <div class="detail-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22S19 14.25 19 9C19 5.13 15.87 2 12 2Z" fill="#f97316"/>
                                        <circle cx="12" cy="9" r="2.5" fill="white"/>
                                    </svg>
                                </div>
                                <div class="detail-content">
                                    <h4>Action Required</h4>
                                    <p>Please go to your proper voting precinct to cast your vote</p>
                                </div>
                            </div>
                            <div class="ip-info">
                                <span class="ip-label">Your current IP:</span>
                                <code class="ip-address">${publicIP}</code>
                            </div>
                        </div>
                    </div>
                    <style>
                        .modern-error-modal {
                            padding: 1rem;
                            padding-bottom: 0px;
                            text-align: center;
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        }
                        
                        .error-icon-container {
                            display: inline-block;
                        }
                        
                        .error-icon {
                            width: 80px;
                            height: 80px;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
                            border: 2px solid #fecaca;
                            animation: shake 0.5s ease-in-out;
                        }
                        
                        .error-title {
                            font-size: 1.5rem;
                            font-weight: 600;
                            color: #dc2626;
                            margin: 0 0 0.5rem 0;
                        }
                        
                        .error-message {
                            font-size: 1rem;
                            color: #6b7280;
                            margin: 0 0 2rem 0;
                        }
                        
                        .error-details {
                            background: #f8fafc;
                            border-radius: 12px;
                            margin-bottom: 1rem;
                        }
                        
                        .detail-card {
                            display: flex;
                            align-items: center;
                            gap: 1rem;
                            text-align: left;
                        }
                        
                        .detail-icon {
                            width: 40px;
                            height: 40px;
                            border-radius: 8px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            background: #fff7ed;
                            flex-shrink: 0;
                        }
                        
                        .detail-content h4 {
                            font-size: 1rem;
                            font-weight: 600;
                            color: #1f2937;
                            margin: 0 0 0.25rem 0;
                        }
                        
                        .detail-content p {
                            font-size: 0.9rem;
                            color: #6b7280;
                            margin: 0;
                        }
                        
                        .ip-info {
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 0.5rem;
                            flex-wrap: wrap;
                        }
                        
                        .ip-label {
                            font-size: 0.9rem;
                            color: #6b7280;
                        }
                        
                        .ip-address {
                            background: #f3f4f6;
                            color: #374151;
                            padding: 0.25rem 0.5rem;
                            border-radius: 6px;
                            font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
                            font-size: 0.85rem;
                            border: 1px solid #e5e7eb;
                        }
                        
                        @keyframes shake {
                            0%, 100% { transform: translateX(0); }
                            25% { transform: translateX(-5px); }
                            75% { transform: translateX(5px); }
                        }
                    </style>
                `,
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                backdrop: 'rgba(0, 0, 0, 0.4)',
                confirmButtonText: 'Understood',
                confirmButtonColor: '#dc2626',
                customClass: {
                    popup: 'modern-error-popup',
                    confirmButton: 'modern-error-button'
                },
                didOpen: () => {
                    const style = document.createElement('style');
                    style.textContent = `
                        .modern-error-popup {
                            border-radius: 20px !important;
                            box-shadow: 0 25px 50px -12px rgba(220, 38, 38, 0.15) !important;
                            border: 1px solid rgba(220, 38, 38, 0.1) !important;
                        }
                        
                        .modern-error-button {
                            border-radius: 10px !important;
                            padding: 0.75rem 2rem !important;
                            font-weight: 600 !important;
                            font-size: 0.95rem !important;
                            box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3) !important;
                            transition: all 0.2s ease !important;
                        }
                        
                        .modern-error-button:hover {
                            transform: translateY(-2px) !important;
                            box-shadow: 0 8px 25px rgba(220, 38, 38, 0.4) !important;
                        }
                    `;
                    document.head.appendChild(style);
                }
            });
        }

    } catch (error) {
        console.error('Error during vote request:', error);

        // Close authentication modal if open
        if (authModal) {
            Swal.close();
        }

        // Show modern error message
        await Swal.fire({
            html: `
                <div class="modern-error-modal">
                    <div class="error-icon-container">
                        <div class="error-icon warning">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L2 22H22L12 2Z" fill="#fbbf24"/>
                                <path d="M12 9V13M12 17H12.01" stroke="#92400e" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </div>
                    </div>
                    <h3 class="error-title warning">Authentication Failed</h3>
                    <p class="error-message">We encountered an error while authenticating your location</p>
                    <div class="error-details">
                        <div class="detail-card">
                            <div class="detail-icon warning">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M13 16H12V12H11M12 8H12.01M21 12C21 16.97 16.97 21 12 21C7.03 21 3 16.97 3 12C3 7.03 7.03 3 12 3C16.97 3 21 7.03 21 12Z" fill="#f59e0b"/>
                                </svg>
                            </div>
                            <div class="detail-content">
                                <h4>What happened?</h4>
                                <p>Please try again or contact support if the problem persists</p>
                            </div>
                        </div>
                        <div class="error-code">
                            <span class="error-label">Error Details:</span>
                            <code class="error-text">${error.message}</code>
                        </div>
                    </div>
                </div>
                <style>
                    .modern-error-modal {
                        padding: 2rem 1rem;
                        text-align: center;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    }
                    
                    .error-icon-container {
                        display: inline-block;
                        margin-bottom: 1.5rem;
                    }
                    
                    .error-icon {
                        width: 80px;
                        height: 80px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        animation: shake 0.5s ease-in-out;
                    }
                    
                    .error-icon.warning {
                        background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
                        border: 2px solid #fde68a;
                    }
                    
                    .error-title {
                        font-size: 1.5rem;
                        font-weight: 600;
                        margin: 0 0 0.5rem 0;
                    }
                    
                    .error-title.warning {
                        color: #d97706;
                    }
                    
                    .error-message {
                        font-size: 1rem;
                        color: #6b7280;
                        margin: 0 0 2rem 0;
                    }
                    
                    .error-details {
                        background: #f8fafc;
                        border-radius: 12px;
                        padding: 0 1.5rem;
                    }
                    
                    .detail-card {
                        display: flex;
                        align-items: center;
                        gap: 1rem;
                        text-align: left;
                    }
                    
                    .detail-icon {
                        width: 40px;
                        height: 40px;
                        border-radius: 8px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        flex-shrink: 0;
                    }
                    
                    .detail-icon.warning {
                        background: #fffbeb;
                    }
                    
                    .detail-content h4 {
                        font-size: 1rem;
                        font-weight: 600;
                        color: #1f2937;
                        margin: 0 0 0.25rem 0;
                    }
                    
                    .detail-content p {
                        font-size: 0.9rem;
                        color: #6b7280;
                        margin: 0;
                    }
                    
                    .error-code {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 0.5rem;
                        flex-wrap: wrap;
                    }
                    
                    .error-label {
                        font-size: 0.9rem;
                        color: #6b7280;
                    }
                    
                    .error-text {
                        background: #fef2f2;
                        color: #dc2626;
                        padding: 0.25rem 0.5rem;
                        border-radius: 6px;
                        font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
                        font-size: 0.85rem;
                        border: 1px solid #fecaca;
                        max-width: 300px;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }
                    
                    @keyframes shake {
                        0%, 100% { transform: translateX(0); }
                        25% { transform: translateX(-5px); }
                        75% { transform: translateX(5px); }
                    }
                </style>
            `,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            backdrop: 'rgba(0, 0, 0, 0.4)',
            confirmButtonText: 'Try Again',
            confirmButtonColor: '#f59e0b',
            customClass: {
                popup: 'modern-error-popup',
                confirmButton: 'modern-warning-button'
            },
            didOpen: () => {
                const style = document.createElement('style');
                style.textContent = `
                    .modern-error-popup {
                        border-radius: 20px !important;
                        box-shadow: 0 25px 50px -12px rgba(245, 158, 11, 0.15) !important;
                        border: 1px solid rgba(245, 158, 11, 0.1) !important;
                    }
                    
                    .modern-warning-button {
                        border-radius: 10px !important;
                        padding: 0.75rem 2rem !important;
                        font-weight: 600 !important;
                        font-size: 0.95rem !important;
                        box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3) !important;
                        transition: all 0.2s ease !important;
                    }
                    
                    .modern-warning-button:hover {
                        transform: translateY(-2px) !important;
                        box-shadow: 0 8px 25px rgba(245, 158, 11, 0.4) !important;
                    }
                `;
                document.head.appendChild(style);
            }
        });
    }
}

function viewElectionResult(electionId) {
    window.location.href = `/result/${electionId}`;
}