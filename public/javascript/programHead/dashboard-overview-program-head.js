import { showSwalErrorToast, confirmErrorAlert, confirmAlert, showSwalSuccessToast } from "/javascript/helper/sweetAlertFunctions.js"
import socket from "/javascript/socket_io.js"
const overview_page = document.querySelector("#overview_page");
overview_page.classList.add("active-nav");

document.addEventListener('DOMContentLoaded', async () => {

    const electionIdList = Array.from(document.querySelectorAll('#election-section')).map(election => election.dataset.electionId);
    const programCode = document.querySelector('#program').value;
    const urlParams = electionIdList.map(electionId => `election_id=${electionId}`).join('&');

    const electionTotalPopulation = await fetchElectionTotalPopulation(urlParams);
    const electionTotalVoted = await fetchElectionTotalVoted(urlParams);

    // display the summary of total population, voted, not voted by election
    displayElectionPopulationInDashboard(electionTotalPopulation);
    displayElectionNumberOfVotedInDashboard(electionTotalVoted, electionTotalPopulation);
    displayElectionNumberOfNotVotedInDashboard(electionTotalPopulation, electionTotalVoted);

    const programPopulation = await fetchTotalPopulationByProgram(programCode, urlParams);
    const programVoteCount = await fetchProgramTotalVoteCount(programCode, urlParams);

    // display the total population, number of voted and not voted by program (depends on program head's program)
    displayProgramTotalPopulation(programPopulation);
    displayTotalVoteCountInProgram(programVoteCount, programPopulation);
    displayProgramNumberOfNotVoted(programPopulation, programVoteCount);
})



// helper functions
async function fetchElectionTotalPopulation(urlParams) {
    try {
        const url = `/api/election-population?${urlParams}`
        const response = await fetch(url);
        const responseObject = await response.json()

        if (!response.ok) return showSwalErrorToast(responseObject.message);

        return responseObject.elections;
    } catch (error) {
        console.error(error);
    }
}

function displayElectionPopulationInDashboard(electionTotalPopulationArrayObject) {

    electionTotalPopulationArrayObject.forEach(electionObject => {
        if (electionObject.total_populations > 0) {
            const electionSection = document.body.querySelector(`section[data-election-id="${electionObject.election_id}"]`);
            electionSection.querySelector('#total-population').textContent = electionObject.total_populations
        }
    })
}

async function fetchElectionTotalVoted(urlParams) {
    try {
        const url = `/api/election-voted?${urlParams}`
        const response = await fetch(url);
        const responseObject = await response.json()

        if (!response.ok) return showSwalErrorToast(responseObject.message);

        return responseObject.elections;
    } catch (error) {
        console.error(error);
    }
}

function displayElectionNumberOfVotedInDashboard(electionTotalVotedArrayObject, electionTotalPopulationArrayObject) {

    electionTotalVotedArrayObject.forEach((electionObject) => {
        if (electionObject.voted > 0) {
            const electionSection = document.body.querySelector(`section[data-election-id="${electionObject.election_id}"]`);

            electionSection.querySelector('#total-voted').textContent = electionObject.voted;

            const findElectionsTotalPopulation = electionTotalPopulationArrayObject.find(election => election.election_id === electionObject.election_id);
            const totalPopulation = findElectionsTotalPopulation.total_populations;

            // dispaly election turnout percentage if total population is truthy (not zero)
            if (totalPopulation) {
                const votedPercentage = ((electionObject.voted / totalPopulation) * 100).toFixed(2);
                electionSection.querySelector('#total-voted-percentage').textContent = `(${votedPercentage}%)`;
            }
        }
    })
}

function displayElectionNumberOfNotVotedInDashboard(electionTotalPopulationArrayObject, electionTotalVotedArrayObject) {

    electionTotalPopulationArrayObject.forEach(election => {

        const electionSection = document.body.querySelector(`section[data-election-id="${election.election_id}"]`);
        const findElectionTotalVoted = electionTotalVotedArrayObject.find(electionObject => electionObject.election_id === election.election_id);

        if (election.total_populations) {
            const numberOfNotVoted = findElectionTotalVoted ? (election.total_populations - findElectionTotalVoted.voted) : election.total_populations;
            const numberOfNotVotedPercentage = ((numberOfNotVoted / election.total_populations) * 100).toFixed(2);

            electionSection.querySelector('#number-of-not-voted').textContent = numberOfNotVoted;
            electionSection.querySelector('#not-voted-percentage').textContent = `(${numberOfNotVotedPercentage}%)`;
        }
    })
}

async function fetchTotalPopulationByProgram(programCode, urlParams) {
    try {
        const url = `/api/program-population?program=${programCode}&${urlParams}`
        const response = await fetch(url);
        const responseObject = await response.json()

        if (!response.ok) return showSwalErrorToast(responseObject.message);

        return responseObject.programPopulation;
    } catch (error) {
        console.error(error);
    }
}

async function fetchProgramTotalVoteCount(programCode, urlParams) {
    try {
        const url = `/api/program-voted?program=${programCode}&${urlParams}`
        const response = await fetch(url);
        const responseObject = await response.json()

        if (!response.ok) return showSwalErrorToast(responseObject.message);

        return responseObject.programVoteCount;
    } catch (error) {
        console.error(error);
    }
}

function displayProgramTotalPopulation(programPopulationObject) {

    programPopulationObject.forEach(program => {
        if (program.program_population > 0) {
            const electionSection = document.querySelector(`section[data-election-id="${program.election_id}"]`);
            electionSection.querySelector('#program-population').textContent = program.program_population;
        }
    })
}

function displayTotalVoteCountInProgram(programVoteCountObject) {

    programVoteCountObject.forEach(programVoteCount => {
        if (programVoteCount.total_voted > 0) {
            const electionSection = document.body.querySelector(`section[data-election-id="${programVoteCount.election_id}"]`);
            electionSection.querySelector('#program-vote-count').textContent = programVoteCount.total_voted;
        }
    })
}

function displayProgramNumberOfNotVoted(programPopulationObject, programVoteCountObject) {

    programPopulationObject.forEach(program => {

        if (program.program_population > 0) {
            const electionSection = document.body.querySelector(`section[data-election-id="${program.election_id}"]`);

            const findProgramVoteCount = programVoteCountObject.find(programObject => programObject.election_id === program.election_id);
            const programPopulation = program.program_population;
            const numberOfNotVoted = findProgramVoteCount ? (programPopulation - findProgramVoteCount.total_voted) : programPopulation;

            electionSection.querySelector('#program-number-of-not-voted').textContent = numberOfNotVoted;
        }
    })
}
