import "/javascript/socket_io.js";
import "/javascript/logout.js";
import { getAllCompleteElections, renderVoterEngagementTrends, renderAllTurnoutStats } from "/javascript/modules/election_analytics/voter_engagement_trends.js"

const dashboard_nav = document.querySelector("#dashboard_nav")
const analytics_page = document.querySelector("#analytics_page")

dashboard_nav.classList.remove("font-normal")
dashboard_nav.classList.add("active-page")

analytics_page.classList.add("active-nav")
$("#dashboard_subpage").show();

document.querySelector("#sidebar").classList.add("hidden");

// Hide Sidebar
document.querySelector("#show-sidebar").addEventListener("click", () => {
    $("#sidebar").show(100);
});
// Show Sidebar
document.querySelector("#hide-sidebar").addEventListener('click', () => {
    $("#sidebar").hide(100);
});

const voterEngagementCanvasId = 'voter-engagement-trends';
const completedElections = await getAllCompleteElections();

renderVoterEngagementTrends(completedElections.reverse(), voterEngagementCanvasId);
renderAllTurnoutStats(completedElections);

import "/javascript/modules/election_analytics/year_level_engagement_trends.js"
import "/javascript/modules/election_analytics/department_engagement_trends.js"
import "/javascript/modules/election_analytics/onsite_engagement_trends.js"
import "/javascript/modules/election_analytics/online_engagement_trends.js"