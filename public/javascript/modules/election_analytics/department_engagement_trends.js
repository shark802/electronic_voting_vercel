import { getAllCompleteElections } from "/javascript/modules/election_analytics/voter_engagement_trends.js"

async function fetchElectionTurnoutPerDepartment() {
    try {
        const response = await fetch('/api/election/turn-out/department');
        const responseObject = await response.json();

        if (!response.ok) throw new Error(responseObject?.message || 'Unexpected server error!');
        return responseObject?.turnoutPerDepartment
    } catch (error) {
        console.error(error);
    }
}

async function fetchAllDepartment() {
    try {
        const response = await fetch('/api/departments');
        const responseObject = await response.json();

        if (!response.ok) throw new Error(responseObject?.message || 'Unexpected server error!');
        return responseObject?.departments
    } catch (error) {
        console.error(error);
    }
}

const turnoutPerDepartment = await fetchElectionTurnoutPerDepartment();
const departments = await fetchAllDepartment();
let completeElections = await getAllCompleteElections();

completeElections.reverse()
const electionIds = completeElections.map(election => election.election_id);

function getTuroutPerentagePerDepartment(electionIdArray, turnoutPerDepartment, departments) {
    return departments.map(department => {
        const departmentCode = department.department_code

        // const departmentsTurnouts = turnoutPerDepartment
        //     .filter(data => electionIdArray.includes(data.electionId) && data.department === department.department_code)
        //     .map(data => data.turnOutPercentage)

        const departmentsTurnouts = electionIdArray.map(electionId => {
            const data = turnoutPerDepartment.find(data => data.electionId === electionId && data.department === departmentCode);
            return data && data.turnOutPercentage !== undefined ? data.turnOutPercentage : null;
        });
        return { departmentCode, departmentsTurnouts }
    })
}

const chartLineColor = ['#eab308', '#ef4444', '#3b82f6', '#22c55e', '#8b5cf6', '#0891b2']

function prepareChartData(departments, preparedData) {
    departments.sort((a, b) => a.department_code.localeCompare(b.department_code));
    return departments.map((department, index) => {
        const turnoutData = preparedData.find(data => data.departmentCode === department.department_code)?.departmentsTurnouts;

        return {
            label: department.department_code,
            data: turnoutData,
            borderColor: chartLineColor[index],
            borderWidth: 2,
            backgroundColor: 'rgba(0, 0, 0, 0)',
            fill: true,
            tension: 0.4,
            pointRadius: 2.3,
        }
    })
}
const preparedData = getTuroutPerentagePerDepartment(electionIds, turnoutPerDepartment, departments);
const chartData = prepareChartData(departments, preparedData);

export function renderDepartmentsVoteTrends(chartId, completedElections, chartData) {
    const canvas = document.querySelector(`#${chartId}`);

    if (!canvas) return;

    if (canvas.chartInstance) {
        canvas.chartInstance.destroy();
    }

    const ctx = canvas.getContext('2d');

    // Create the custom tooltip container if it doesn't exist
    let tooltipEl = document.getElementById('department-tooltip');
    if (!tooltipEl) {
        tooltipEl = document.createElement('div');
        tooltipEl.id = 'department-tooltip';
        tooltipEl.style.backgroundColor = 'rgba(22, 41, 88, 0.85)';
        tooltipEl.style.color = '#fff';
        tooltipEl.style.borderRadius = '6px';
        tooltipEl.style.padding = '12px';
        tooltipEl.style.position = 'absolute';
        tooltipEl.style.opacity = 0;
        tooltipEl.style.pointerEvents = 'none';
        tooltipEl.style.zIndex = 1000;
        tooltipEl.style.maxWidth = '300px';
        tooltipEl.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        tooltipEl.style.border = '1px solid #3b82f6';
        tooltipEl.style.transition = 'opacity 0.2s';
        document.body.appendChild(tooltipEl);
    }

    canvas.chartInstance = new Chart(canvas, {
        type: 'line',
        data: {
            labels: completedElections.map(election => election.election_name),
            datasets: chartData
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return value + '%';
                        }
                    },
                },
                x: {
                    ticks: {
                        display: false
                    }
                },
            },
            // Add padding around the chart to prevent tooltip clipping
            layout: {
                padding: {
                    top: 20,
                    right: 20,
                    bottom: 20,
                    left: 20
                }
            },
            plugins: {
                tooltip: {
                    enabled: false, // Disable the built-in tooltip
                    external: function (context) {
                        // Hide tooltip if not active
                        if (context.tooltip.opacity === 0) {
                            tooltipEl.style.opacity = 0;
                            return;
                        }

                        const tooltipModel = context.tooltip;

                        if (tooltipModel.body) {
                            // Get election info
                            const dataIndex = tooltipModel.dataPoints[0].dataIndex;
                            const election = completedElections[dataIndex];

                            // Build HTML content
                            let titleHTML = `<div style="font-size: 16px; font-weight: bold; margin-bottom: 8px;">${election.election_name}</div>`;
                            let contentHTML = '<div style="font-size: 14px;">';

                            // Format date
                            const electionDate = new Date(election.date_end);
                            const formattedDate = electionDate.toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                            });

                            contentHTML += `<div style="margin-bottom: 10px;">Date: ${formattedDate}</div>`;

                            // Add data for each department shown in the tooltip
                            tooltipModel.dataPoints.forEach(function (dataPoint) {
                                // Get department name from dataset label
                                const department = dataPoint.dataset.label;

                                // Get turnout data
                                const electionId = election.election_id;
                                const departmentElectionTurnout = turnoutPerDepartment.find(data =>
                                    data.electionId === electionId && data.department === department
                                );

                                // Get turnout percentage
                                let turnoutPercentage = dataPoint.raw;
                                if (typeof turnoutPercentage === 'number') {
                                    turnoutPercentage = turnoutPercentage.toFixed(1);
                                }

                                // Calculate values
                                const totalVoted = departmentElectionTurnout.totalVoted;
                                const totalVoters = departmentElectionTurnout.totalVoter;
                                const notVoted = totalVoters - totalVoted;

                                // Add department data with department color
                                contentHTML += `<div style="padding: 8px; margin: 6px 0; border-left: 3px solid ${dataPoint.dataset.borderColor}; background-color: rgba(255,255,255,0.1);">`;
                                contentHTML += `<div style="font-weight: bold;">${department}</div>`;
                                contentHTML += `<div>Turnout: ${turnoutPercentage}%</div>`;
                                contentHTML += `<div>Participated: ${totalVoted}/${totalVoters} students</div>`;
                                contentHTML += `<div>Abstained: ${notVoted} students</div>`;
                                contentHTML += `</div>`;
                            });

                            contentHTML += '</div>';

                            // Update tooltip content
                            tooltipEl.innerHTML = titleHTML + contentHTML;
                        }

                        // Set a fixed width to prevent text wrapping/squeezing
                        tooltipEl.style.width = '320px'; // Adjust as needed
                        tooltipEl.style.maxWidth = '320px';

                        // Display tooltip to calculate its dimensions
                        tooltipEl.style.opacity = 1;

                        // Position the tooltip - get chart and cursor positions
                        const position = context.chart.canvas.getBoundingClientRect();
                        const cursorX = position.left + window.pageXOffset + tooltipModel.caretX;
                        const cursorY = position.top + window.pageYOffset + tooltipModel.caretY;

                        // Get tooltip dimensions
                        const tooltipRect = tooltipEl.getBoundingClientRect();
                        const tooltipWidth = tooltipRect.width;
                        const tooltipHeight = tooltipRect.height;

                        // Get viewport dimensions
                        const viewportWidth = window.innerWidth;
                        const viewportHeight = window.innerHeight;

                        // Calculate final position
                        let finalX, finalY;
                        const padding = 15; // Space from cursor and edges

                        // Add a pointer element to indicate cursor position
                        const pointerSize = 8; // Size of the pointer triangle
                        let pointerStyle = '';

                        // Determine horizontal position based on available space
                        if (cursorX + tooltipWidth + padding <= viewportWidth) {
                            // Enough space on the right - position tooltip to the right of cursor
                            finalX = cursorX + padding;
                            pointerStyle = `
                #custom-tooltip:before {
                    content: '';
                    position: absolute;
                    left: -${pointerSize}px;
                    top: 50%;
                    margin-top: -${pointerSize}px;
                    border-width: ${pointerSize}px ${pointerSize}px ${pointerSize}px 0;
                    border-style: solid;
                    border-color: transparent rgba(22, 41, 88, 0.85) transparent transparent;
                }
            `;
                        } else if (cursorX - tooltipWidth - padding >= 0) {
                            // Not enough space on right, but enough on left - position to left of cursor
                            finalX = cursorX - tooltipWidth - padding;
                            pointerStyle = `
                #custom-tooltip:before {
                    content: '';
                    position: absolute;
                    right: -${pointerSize}px;
                    top: 50%;
                    margin-top: -${pointerSize}px;
                    border-width: ${pointerSize}px 0 ${pointerSize}px ${pointerSize}px;
                    border-style: solid;
                    border-color: transparent transparent transparent rgba(22, 41, 88, 0.85);
                }
            `;
                        } else {
                            // Not enough space on either side - center horizontally
                            finalX = Math.max(padding, (viewportWidth - tooltipWidth) / 2);
                            pointerStyle = ''; // No pointer when centered
                        }

                        // Determine vertical position
                        if (cursorY + tooltipHeight / 2 <= viewportHeight && cursorY - tooltipHeight / 2 >= 0) {
                            // Center vertically with cursor if possible
                            finalY = cursorY - (tooltipHeight / 2);
                        } else if (cursorY + tooltipHeight + padding <= viewportHeight) {
                            // Position below cursor
                            finalY = cursorY + padding;
                        } else {
                            // Position above cursor or at top with minimum padding
                            finalY = Math.max(padding, cursorY - tooltipHeight - padding);
                        }

                        // Apply positions
                        tooltipEl.style.left = finalX + 'px';
                        tooltipEl.style.top = finalY + 'px';

                        // Add pointer - we need to use a style element for the pseudo-element
                        const styleId = 'tooltip-pointer-style';
                        let styleEl = document.getElementById(styleId);

                        if (!styleEl) {
                            styleEl = document.createElement('style');
                            styleEl.id = styleId;
                            document.head.appendChild(styleEl);
                        }

                        // Update or create tooltip pointer style
                        styleEl.innerHTML = pointerStyle;
                    }
                },
            },
            // Interaction modes for the external tooltip
            interaction: {
                intersect: false,
                mode: 'index'
            },
            hover: {
                mode: 'index',
                intersect: false
            }
        }
    });
}

// Add CSS for department tooltip if not already added
if (!document.getElementById('department-tooltip-styles')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'department-tooltip-styles';
    styleEl.textContent = `
    #department-tooltip {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        line-height: 1.5;
        white-space: normal;
        word-wrap: break-word;
    }
    
    .chart-container {
        position: relative;
        overflow: visible !important;
        height: 300px;
    }
    `;
    document.head.appendChild(styleEl);
}

const canvasId = 'engagement-per-department';
renderDepartmentsVoteTrends(canvasId, completeElections, chartData)