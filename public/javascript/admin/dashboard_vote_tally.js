import "/javascript/logout.js"
import socket from "/javascript/socket_io.js"
// import $ from 'jquery';
// import Chart from '/javascript/lib/chart.js';

let electionsCandidateData; // Declare the variable in a higher scope

const dashboard_nav = document.querySelector("#dashboard_nav")
const vote_tally_page = document.querySelector("#vote_tally_page")

dashboard_nav.classList.remove("font-normal")
dashboard_nav.classList.add("active-page")

$("#dashboard_subpage").show()

vote_tally_page.classList.add("active-nav");

// Hide Sidebar
document.querySelector("#show-sidebar").addEventListener("click", () => {
    $("#sidebar").show(100);
});
// Show Sidebar
document.querySelector("#hide-sidebar").addEventListener('click', () => {
    $("#sidebar").hide(100);
});

document.addEventListener('DOMContentLoaded', async () => {
    electionsCandidateData = await fetchAllCandidatesDataForActiveElection(); // Assign data to the variable

    // Initialize charts for all active elections
    initializeCharts();
});

// Global charts object to store references to all created charts
let charts = {};

function initializeCharts() {
    const activeElections = document.querySelectorAll('section'); // select all section elements that represent each active election

    activeElections.forEach(election => {
        const electionId = election.dataset.electionId;

        const positionDivContainer = election.querySelectorAll('#position-container'); // select all div that serve as container for group of candidate per position
        positionDivContainer.forEach(div => {
            const positionDataAttribute = div.dataset.position; // Example: 'PRESIDENT', 'VICE_PRESIDENT', 'SENATOR'

            if (positionDataAttribute === 'SENATOR') {
                const senatorPositionPerProgram = div.querySelectorAll('#senator-by-program'); // SENATOR div container holds multiple canvas per program

                senatorPositionPerProgram.forEach(program => {
                    const canvas = program.querySelector('canvas');
                    if (canvas) {
                        const candidatesToDisplay = electionsCandidateData.filter(candidate =>
                            candidate.position === 'SENATOR' &&
                            candidate.election_id === electionId &&
                            candidate.department === canvas.id
                        );
                        createChart(canvas, candidatesToDisplay);
                    }
                });
            } else {
                const canvas = div.querySelector('canvas');
                if (canvas) {
                    // Important: use positionDataAttribute instead of canvas.id for filtering the position
                    const candidatesToDisplay = electionsCandidateData.filter(candidate =>
                        candidate.position === positionDataAttribute &&
                        candidate.election_id === electionId
                    );
                    createChart(canvas, candidatesToDisplay);
                }
            }
        });
    });
}

function createChart(canvas, candidatesToDisplay) {
    // Create a unique chart ID that includes both canvas ID and election ID
    const electionId = canvas.closest('section').dataset.electionId;
    const uniqueChartId = `${canvas.id}_${electionId}`;

    // Check if a chart already exists for this canvas and election combination
    if (charts[uniqueChartId]) {
        // If it exists, update the chart data instead of recreating it
        updateChart(charts[uniqueChartId], candidatesToDisplay);
        return;
    }

    // Create a new chart and store the reference with the unique ID
    charts[uniqueChartId] = new Chart(canvas, {
        type: 'bar',
        data: transformDataset(candidatesToDisplay),
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    padding: 10,
                    cornerRadius: 6,
                    callbacks: {
                        label: function (context) {
                            return `Votes: ${context.raw}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        font: {
                            size: 11,
                            weight: '500'
                        },
                        padding: 8,
                        callback: function (value) {
                            return Math.floor(value) === value ? value : '';
                        }
                    },
                    grid: {
                        drawOnChartArea: true,
                        drawTicks: true,
                        color: function (context) {
                            return Math.floor(context.tick.value) === context.tick.value ? 'rgba(0,0,0,0.07)' : 'transparent';
                        }
                    },
                    border: {
                        display: true,
                        color: 'rgba(0,0,0,0.1)'
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: 11,
                            weight: '500'
                        },
                        padding: 6,
                        maxRotation: 45,
                        minRotation: 0
                    },
                    grid: {
                        display: false
                    },
                    border: {
                        display: true,
                        color: 'rgba(0,0,0,0.1)'
                    }
                },
            },
            layout: {
                padding: {
                    top: 16,
                    right: 16,
                    bottom: 16,
                    left: 8
                }
            },
            animation: {
                duration: 800,
                easing: 'easeOutQuart'
            },
            barPercentage: 0.8,
            categoryPercentage: 0.8
        }
    });
}

function updateChart(chart, candidatesToDisplay) {
    // Update the chart's data
    chart.data = transformDataset(candidatesToDisplay);
    chart.update(); // Refresh the chart
}

async function fetchAllCandidatesDataForActiveElection() {
    try {
        const response = await fetch('/api/candidate/data');
        const responseObject = await response.json();

        if (response.ok) return responseObject.candidatesData;
        return [];
    } catch (error) {
        console.error("Error fetching candidate data:", error);
        return [];
    }
}

function transformDataset(dataset) {
    // Generate a unique color for each candidate
    const generateUniqueColors = (count) => {
        const colors = [];
        const baseColors = [
            [54, 162, 235],   // blue
            [75, 192, 192],   // teal
            [153, 102, 255],  // purple
            [255, 159, 64],   // orange
            [255, 99, 132],   // pink
            [255, 206, 86]    // yellow
        ];

        for (let i = 0; i < count; i++) {
            const colorIndex = i % baseColors.length;
            const baseColor = baseColors[colorIndex];
            // Add slight variation to colors if we have more candidates than base colors
            const variation = Math.floor(i / baseColors.length) * 20;
            const r = Math.max(0, Math.min(255, baseColor[0] - variation));
            const g = Math.max(0, Math.min(255, baseColor[1] - variation));
            const b = Math.max(0, Math.min(255, baseColor[2] - variation));

            colors.push(`rgba(${r}, ${g}, ${b}, 0.7)`);
        }
        return colors;
    };

    const backgroundColors = generateUniqueColors(dataset.length);
    const borderColors = backgroundColors.map(color => color.replace('0.7', '0.9'));

    return {
        labels: dataset.map(candidate => `${candidate.firstname} ${candidate.lastname}`),
        datasets: [{
            label: 'Vote count',
            data: dataset.map(candidate => Math.round(candidate.vote_count)),
            backgroundColor: backgroundColors,
            borderColor: borderColors,
            borderWidth: 1,
            borderRadius: 4,
            maxBarThickness: 80,
            minBarLength: 2
        }]
    }
}

// Socket event handler for real-time vote updates
socket.on('new-vote', (data) => {
    if (!electionsCandidateData) {
        console.error("electionsCandidateData is not defined.");
        return;
    }

    console.log("Received new vote data:", data);

    // Track which candidates were actually updated
    const updatedCandidates = [];

    // Update our local data with the new votes
    data.voted_candidate_list.forEach(vote => {
        console.log(`Processing vote for candidate_id: ${vote.candidate_id}, position: ${vote.candidate_position}`);

        // We need to find ALL instances of this candidate across all elections
        electionsCandidateData.forEach((candidate, index) => {
            if (String(candidate.id_number) === String(vote.candidate_id) &&
                candidate.position === vote.candidate_position) {

                // Update the vote count
                electionsCandidateData[index].vote_count =
                    (electionsCandidateData[index].vote_count || 0) + 1;

                console.log(`Updated vote count for ${candidate.firstname} ${candidate.lastname} to ${electionsCandidateData[index].vote_count}`);

                // Add to our list of updated candidates with their election ID
                updatedCandidates.push({
                    candidateId: candidate.id_number,
                    electionId: candidate.election_id
                });
            }
        });
    });

    // Update charts for all affected elections
    const affectedElectionIds = [...new Set(updatedCandidates.map(c => c.electionId))];
    console.log(`Updating charts for ${affectedElectionIds.length} affected elections`);

    affectedElectionIds.forEach(electionId => {
        updateChartsForElection(electionId);
    });
});

// Function to update all charts for a specific election
function updateChartsForElection(electionId) {
    // Get ALL election sections with the matching election ID
    // Using querySelectorAll instead of querySelector to handle multiple sections with the same election ID
    const electionSections = document.querySelectorAll(`section[data-election-id="${electionId}"]`);

    if (electionSections.length === 0) {
        console.warn(`No election sections found for election ID: ${electionId}`);
        return;
    }

    console.log(`Found ${electionSections.length} election sections for election ID: ${electionId}`);

    // Update charts in each matching election section
    electionSections.forEach(electionSection => {
        const positionContainers = electionSection.querySelectorAll('#position-container');

        positionContainers.forEach(container => {
            const position = container.dataset.position;

            if (position === 'SENATOR') {
                // Update senator charts by department
                const senatorPrograms = container.querySelectorAll('#senator-by-program');
                senatorPrograms.forEach(program => {
                    const canvas = program.querySelector('canvas');
                    if (canvas) {
                        const uniqueChartId = `${canvas.id}_${electionId}`;

                        if (charts[uniqueChartId]) {
                            const department = canvas.id;
                            const candidatesToDisplay = electionsCandidateData.filter(candidate =>
                                candidate.position === 'SENATOR' &&
                                candidate.election_id === electionId &&
                                candidate.department === department
                            );

                            updateChart(charts[uniqueChartId], candidatesToDisplay);
                        }
                    }
                });
            } else {
                // Update other position charts
                const canvas = container.querySelector('canvas');
                if (canvas) {
                    const uniqueChartId = `${canvas.id}_${electionId}`;

                    if (charts[uniqueChartId]) {
                        const candidatesToDisplay = electionsCandidateData.filter(candidate =>
                            candidate.position === position &&
                            candidate.election_id === electionId
                        );

                        updateChart(charts[uniqueChartId], candidatesToDisplay);
                    }
                }
            }
        });
    });
}