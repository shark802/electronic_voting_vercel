const electionId = document.querySelector('#election-id');
const totalPopulation = document.querySelector('#total-population').textContent;
const totalVoted = document.querySelector('#total-voted');
const totalVotedPercentage = document.querySelector('#total-voted-percentage');
const numberOfNotVoted = document.querySelector('#number-of-not-voted');
const totalNotVotedPercentage = document.querySelector('#total-not-voted-percentage');

const urlParams = `election_id=${electionId.textContent}`;

async function fetchElectionTotalVoted(urlParams) { // return the total number of voted in election 
    try {
        const url = `/api/election-voted?${urlParams}` // response array of objects {election_id, voted}. voted property contains the total number of voted in election 
        const response = await fetch(url);
        const responseObject = await response.json()

        if (!response.ok) return showSwalErrorToast(responseObject.message);

        return responseObject.elections[0]?.voted ?? 0;
    } catch (error) {
        console.error(error);
    }
}

const electionTotalVoted = await fetchElectionTotalVoted(urlParams);
const electionTotalVotedPercentage = ((electionTotalVoted / totalPopulation) * 100).toFixed(2);
const electionTotalNotVoted = totalPopulation - electionTotalVoted;
const electionTotalNotVotedPercentage = ((electionTotalNotVoted / totalPopulation) * 100).toFixed(2);

totalVoted.textContent = electionTotalVoted;
totalVotedPercentage.textContent = `(${electionTotalVotedPercentage}%)`;
numberOfNotVoted.textContent = electionTotalNotVoted;
totalNotVotedPercentage.textContent = `(${electionTotalNotVotedPercentage}%)`;


async function fetchProgramTotalVoteCount(urlParams) {
    try {
        const response = await fetch(`/api/program-voted?${urlParams}`);

        const responseObject = await response.json()
        if (!response.ok) return showSwalErrorToast(responseObject.message);

        return responseObject.electionVoteSummary[0]?.department_votes;
    } catch (error) {
        console.error(error);
    }
}

// fetch data for each department
const programTotalVoteCount = await fetchProgramTotalVoteCount(urlParams);

document.querySelectorAll('#program').forEach(department => {
    const departmentCode = department.querySelector('#program-code').dataset.programCode;
    const departmentsTotalPopulation = department.querySelector('#program-population').textContent;

    const totalVoter = Number(departmentsTotalPopulation) || 0; // in case the population is not covertable to number like value is 'N/A', use default value 0
    const totalVoted = programTotalVoteCount[departmentCode] || 0; // in case the total number of votes is not found, use default value 0
    const totalNotVoted = totalVoter - totalVoted;

    department.querySelector(`#departmentTotalVotes`).textContent = totalVoted; // display the total number of votes for each department
    department.querySelector(`#departmentNumberOfNotVoted`).textContent = totalNotVoted; // display the total number of not voted
});