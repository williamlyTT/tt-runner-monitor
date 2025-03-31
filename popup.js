document.addEventListener("DOMContentLoaded", function () {
    console.log("Popup Loaded. Fetching stored data...");
    loadRunnerData();

    document.getElementById("refreshButton").addEventListener("click", function () {
        console.log("🔄 Refresh button clicked! Reloading stored data...");
        loadRunnerData(); // ✅ Just reload from stored data, no extra fetch needed
    });

    makeTableSortable();  // ✅ Make table sortable


});

function loadRunnerData() {
    chrome.storage.local.get(["runners", "workflows", "jobs", "lastUpdated"], data => {
        console.log("Retrieved data from storage:", data);  // ✅ Log for debugging

        const runnerTable = document.getElementById("runnerTable");
        const lastUpdated = document.getElementById("lastUpdated");

        runnerTable.innerHTML = ""; // Clear old data

        if (!data.runners || !data.workflows) {
            console.warn("No runner/workflow data available.");
            runnerTable.innerHTML = "<tr><td colspan='6'>No data available.</td></tr>";
            return;
        }

        if (data.lastUpdated) {
            lastUpdated.innerText = `Last Updated: ${new Date(data.lastUpdated).toLocaleTimeString()}`;
        }

        data.runners.forEach(runner => {

            let statusText = "Unknown";
            let rowClass = "offline";

            const runnerTags = runner.labels.map(label => label.name);
            const isInService = runnerTags.includes("in-service");

            if (runner.status === "offline") {
                statusText = "Offline";
                rowClass = "offline";
            } else if (!isInService) {
                statusText = "Out of Service";  // ✅ Runner is online but NOT accepting jobs
                rowClass = "out-of-service";
            } else if (runner.status === "online" && runner.busy) {
                statusText = "Active";
                rowClass = "active";
            } else if (runner.status === "online" && !runner.busy) {
                statusText = "Idle";
                rowClass = "idle";
            }

            const validTypes = ["build", "E150", "N150", "P150", "N300", "config-t3000", "config-tg", "config-tgg"];
            const runnerType = runner.labels
                .map(label => label.name)
                .find(label => validTypes.includes(label)) || "Unknown"; // Default to "Unknown"

            // ✅ Find the job currently running on this runner
            let activeJob = data.jobs.find(job => job.runner_name === runner.name && job.status === "in_progress") || null;

            let jobColumn = "-";
            let workflowColumn = "-";

            if (activeJob) {
                const jobUrl = activeJob.html_url; // GitHub Job URL
                const jobName = activeJob.name;
                const workflowBranch = activeJob.head_branch || "Unknown Branch";

                jobColumn = `<a href="${jobUrl}" target="_blank">${jobName}</a>`; // ✅ Clickable Job Link
                workflowColumn = workflowBranch;
            }

            const row = document.createElement("tr");
            row.className = rowClass;

            row.innerHTML = `
                <td>${runner.name}</td>
                <td>${runnerType}</td>
                <td>${statusText}</td>
                <td>${jobColumn}</td>  <!-- ✅ Clickable Job Link -->
                <td>${workflowColumn}</td>  <!-- ✅ Workflow Branch -->
                <td>${runner.labels.map(label => label.name).join(', ')}</td>
            `;

            runnerTable.appendChild(row);
        });
    });
}

// ✅ Make Table Sortable
function makeTableSortable() {
    document.querySelectorAll("th").forEach((header, index) => {
        header.addEventListener("click", () => {
            sortTable(index);
        });
    });
}

// ✅ Sorting Function
function sortTable(columnIndex) {
    const table = document.getElementById("runnerTable");
    const rows = Array.from(table.querySelectorAll("tr"));
    const isAscending = table.dataset.sortOrder === "asc";
    
    rows.sort((rowA, rowB) => {
        const cellA = rowA.children[columnIndex].innerText.trim();
        const cellB = rowB.children[columnIndex].innerText.trim();

        // Detect if sorting numbers or text
        const isNumeric = !isNaN(parseFloat(cellA)) && !isNaN(parseFloat(cellB));
        
        if (isNumeric) {
            return isAscending ? cellA - cellB : cellB - cellA;
        } else {
            return isAscending ? cellA.localeCompare(cellB) : cellB.localeCompare(cellA);
        }
    });

    table.dataset.sortOrder = isAscending ? "desc" : "asc"; // Toggle sorting order

    // Rebuild the table with sorted rows
    rows.forEach(row => table.appendChild(row));
}

// Function to filter the table rows based on the search bar input
function filterTable() {
    const searchQuery = document.getElementById('label-search').value.toLowerCase();
    const searchTerms = searchQuery.split(/\s+/); // Split the query into words, based on spaces
    const table = document.getElementById("runnerTable");
    const rows = Array.from(table.querySelectorAll("tr"));
  
    rows.forEach(row => {
      const labelsCell = row.cells[5].textContent.toLowerCase(); // Get the labels cell
      const labels = labelsCell.split(',').map(label => label.trim());
      // Check if all search terms are in the labels list
      const matches = searchTerms.every(term => labels.some(label => label.includes(term)));

      // Show or hide row based on whether all terms match
      if (matches) {
        row.style.display = ''; // Show the row if it matches the search terms
      } else {
        row.style.display = 'none'; // Hide the row if it doesn't match
      }
    });
  }

// Set up the event listener for the search bar
document.addEventListener('DOMContentLoaded', () => {
    const searchBar = document.getElementById('label-search');
    searchBar.addEventListener('input', filterTable); // Listen for input events
    loadRunnerData(); // Initialize the table with runners
});