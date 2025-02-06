chrome.alarms.create("updateData", { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener(alarm => {
    if (alarm.name === "updateData") {
        fetchRunnerData();
    }
});

// Fetch GitHub data periodically
async function fetchRunnerData() {
    const token = "ghp_NOTMYREALPAT";  // Store securely in storage later
    const repoOwner = "tenstorrent";
    const repoName = "tt-metal";

    const headers = { Authorization: `token ${token}` };
    const baseRunnersUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/actions/runners`;
    const baseWorkflowsUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/actions/runs?status=in_progress`;
    const baseQueuedWorkflowsUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/actions/runs?status=queued`;

    try {
        console.log("Fetching runners...");
        let allRunners = await fetchAllPages(baseRunnersUrl, headers, "runners");
        console.log(`✅ Total runners fetched: ${allRunners.length}`);

        console.log("Fetching active workflows...");
        let inProgressWorkflows = await fetchAllPages(baseWorkflowsUrl, headers, "workflow_runs");
        let queuedWorkflows = await fetchAllPages(baseQueuedWorkflowsUrl, headers, "workflow_runs");

        // ✅ Combine both workflow lists
        let allWorkflows = [...inProgressWorkflows, ...queuedWorkflows];

        console.log(`✅ Total workflows fetched (in_progress + queued): ${allWorkflows.length}`);
        let allJobs = [];

        // ✅ Fetch jobs per workflow
        for (const workflow of allWorkflows) {
            console.log(`Fetching jobs for workflow ${workflow.id}...`);
            const jobsUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/actions/runs/${workflow.id}/jobs?status=in_progress`;
            // const jobsUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/actions/runs/${workflow.id}/jobs`;
            let workflowJobs = await fetchAllPages(jobsUrl, headers, "jobs");

            console.log(`✅ Workflow ${workflow.id} -> Total jobs fetched: ${workflowJobs.length}`);

            if (!workflowJobs || workflowJobs.length === 0) {
                console.warn(`⚠️ No jobs returned for workflow ${workflow.id}.`);
            }

            allJobs = allJobs.concat(workflowJobs);
        }


        console.log(`✅ Total jobs fetched: ${allJobs.length}`);

        // ✅ Debug: Verify that every "Active" runner has a corresponding job
        allRunners.forEach(runner => {
            if (runner.busy) {
                let matchingJob = allJobs.find(job => job.runner_name === runner.name && job.status === "in_progress");
                if (!matchingJob) {
                    console.warn(`⚠️ Runner "${runner.name}" is marked as busy but has NO matching job.`);
                }
            }
        });

        // ✅ Store everything in chrome.storage.local
        chrome.storage.local.set({
            runners: allRunners,
            workflows: allWorkflows,
            jobs: allJobs,
            lastUpdated: Date.now()
        });

        console.log("✅ Data successfully stored in chrome.storage.local");

    } catch (error) {
        console.error("❌ Failed to fetch runner data:", error);
    }
}

// ✅ Generic function to handle paginated GitHub API requests
async function fetchAllPages(url, headers, key) {
    let allResults = [];
    let nextUrl = url;

    while (nextUrl) {
        const response = await fetch(nextUrl, { headers });

        if (!response.ok) {
            console.error(`GitHub API error for ${key}:`, await response.text());
            return allResults;
        }

        const data = await response.json();
        allResults = allResults.concat(data[key]); // Merge results

        // Extract next page URL from 'Link' header
        const linkHeader = response.headers.get("Link");
        if (linkHeader && linkHeader.includes('rel="next"')) {
            const match = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
            nextUrl = match ? match[1] : null;
            // console.log(`➡️ Pagination detected, fetching next page: ${nextUrl}`);
        } else {
            nextUrl = null; // No more pages
        }
    }

    console.log(`✅ Completed fetching all pages for ${key}, total items: ${allResults.length}`);
    return allResults;
}

