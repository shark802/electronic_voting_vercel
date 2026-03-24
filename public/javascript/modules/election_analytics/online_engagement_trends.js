async function getAllCompleteElections() {
    try {
        const response = await fetch('/api/election/complete/total-voted');
        const responseObject = await response.json();

        if (!response.ok) {
            const errorMessage = responseObject?.message ?? 'Unxpected error response from server!';
            throw new Error(errorMessage);
        }

        return responseObject?.completedElections;

    } catch (error) {
        console.error(error);
    }
}


async function fetchVoteModeSummary() {
    try {

        const response = await fetch('/api/election/turn-out/vote-mode');
        const responseObject = await response.json();
        if (!response.ok) throw new Error('Error on fetching voting mode summaries');

        return responseObject?.votingModeSummary;

    } catch (error) {
        console.error(error);

    }
}


async function renderOnlineEngagementTrends(completedElectionsArray, canvasId) {
    try {
        const canvas = document.querySelector(`#${canvasId}`);
        if (!canvas) {
            throw new Error('Canvas element not found');
        }

        // Turnout percentage per election 
        let datasets = await fetchVoteModeSummary();
        const onlineVotingPercentage = datasets.map(data => data.online_vote_percentage)

        // destroy existing if present
        if (canvas.chartInstance) {
            canvas.chartInstance.destroy();
        }

        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
        gradient.addColorStop(1, 'rgba(147, 197, 253, 0.3)')

        canvas.chartInstance = new Chart(canvas, {
            type: 'line',
            data: {
                labels: completedElectionsArray.map(election => election.election_name),
                datasets: [{
                    label: 'Past Elections Online Voting Trends',
                    data: onlineVotingPercentage,
                    borderWidth: 2,
                    borderColor: '#3b82f6',
                    backgroundColor: gradient,
                    fill: true,
                    tension: 0.3,
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        ticks: {
                            display: false
                        }
                    },
                    y: {
                        max: 100,
                        beginAtZero: true,
                        ticks: {
                            stepSize: 20,
                            callback: function (value) {
                                return value + '%';
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        backgroundColor: 'rgba(22, 41, 88, 0.85)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: '#3b82f6',
                        borderWidth: 1,
                        titleFont: {
                            size: 16,
                            weight: 'bold'
                        },
                        bodyFont: {
                            size: 14
                        },
                        padding: 12,
                        cornerRadius: 6,
                        displayColors: false,
                        callbacks: {
                            title: function (context) {
                                return completedElectionsArray[context[0].dataIndex].election_name;
                            },
                            label: function (context) {
                                // Get the data for this specific data point
                                const electionData = completedElectionsArray[context.dataIndex];
                                const datasetData = datasets[context.dataIndex];

                                // Calculate turnout percentage
                                const turnoutPercentage = Math.round((electionData.total_voted / electionData.total_populations) * 100);

                                // Format date nicely
                                const date = new Date(electionData.date_end);
                                const formattedDate = date.toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                });

                                // Calculate percentages
                                const onlinePercent = context.raw;

                                // Calculate absolute numbers
                                const votedOnline = datasetData.voted_online;

                                return [
                                    `Date: ${formattedDate}`,
                                    ``,
                                    `📊 Turnout: ${turnoutPercentage}% (${electionData.total_voted}/${electionData.total_populations})`,
                                    `💻 Online Voting: ${onlinePercent}% (${votedOnline} voters)`,
                                ];
                            }
                        },
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                hover: {
                    mode: 'nearest',
                    intersect: false
                }
            }
        });
    } catch (error) {
        console.error(error);
    }
}
let completedElections = await getAllCompleteElections();
completedElections.reverse()
const canvasId = 'online-engagement'
await renderOnlineEngagementTrends(completedElections, canvasId)


export { getAllCompleteElections, renderOnlineEngagementTrends };
