const STORAGE_KEY = "customerServiceTickets";
// sample Tickets generated for reference
const defaultTickets = [
    {
        id: 1001,
        customer: "Aarav",
        issue: "Unable to login",
        priority: "High",
        status: "Open"
    },
    {
        id: 1002,
        customer: "Riya",
        issue: "Payment failed",
        priority: "Medium",
        status: "In Progress"
    },
    {
        id: 1003,
        customer: "Kabir",
        issue: "Update profile details",
        priority: "Low",
        status: "Resolved"
    }
];

let tickets = loadTickets();


// Filter generated
const elements = {
    totalCount: document.getElementById("totalCount"),
    openCount: document.getElementById("openCount"),
    progressCount: document.getElementById("progressCount"),
    resolvedCount: document.getElementById("resolvedCount"),
    tableBody: document.getElementById("ticketTableBody"),
    emptyState: document.getElementById("emptyState"),
    searchInput: document.getElementById("searchInput"),
    statusFilter: document.getElementById("statusFilter"),
    priorityFilter: document.getElementById("priorityFilter"),
    sortSelect: document.getElementById("sortSelect"),
    modal: document.getElementById("modal"),
    addTicketBtn: document.getElementById("addTicketBtn"),
    closeModal: document.getElementById("closeModal"),
    ticketForm: document.getElementById("ticketForm"),
    customerInput: document.getElementById("customerInput"),
    issueInput: document.getElementById("issueInput"),
    priorityInput: document.getElementById("priorityInput"),
    clearBtn: document.getElementById("clearBtn")
};

//ticket generating function
function loadTickets() {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (error) {
            console.error("Could not load saved tickets:", error);
        }
    }
//saved to local storage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultTickets));
    return [...defaultTickets];
}


function saveTickets() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
}

function getNextId() {
    if (tickets.length === 0) return 1001;
    return Math.max(...tickets.map(ticket => ticket.id)) + 1;
}

function renderStats() {
    elements.totalCount.textContent = tickets.length;
    elements.openCount.textContent =
        tickets.filter(ticket => ticket.status === "Open").length;
    elements.progressCount.textContent =
        tickets.filter(ticket => ticket.status === "In Progress").length;
    elements.resolvedCount.textContent =
        tickets.filter(ticket => ticket.status === "Resolved").length;
}

//filtering
function getFilteredTickets() {
    const search = elements.searchInput.value.trim().toLowerCase();
    const status = elements.statusFilter.value;
    const priority = elements.priorityFilter.value;
    const sort = elements.sortSelect.value;

    let result = tickets.filter(ticket => {
        const matchesSearch =
            ticket.customer.toLowerCase().includes(search) ||
            ticket.issue.toLowerCase().includes(search) ||
            String(ticket.id).includes(search);

        const matchesStatus =
            status === "all" || ticket.status === status;

        const matchesPriority =
            priority === "all" || ticket.priority === priority;

        return matchesSearch && matchesStatus && matchesPriority;
    });

    if (sort === "newest") {
        result.sort((a, b) => b.id - a.id);
    } else if (sort === "oldest") {
        result.sort((a, b) => a.id - b.id);
    } else if (sort === "priority") {
        const rank = { High: 1, Medium: 2, Low: 3 };
        result.sort((a, b) => {
            if (rank[a.priority] !== rank[b.priority]) {
                return rank[a.priority] - rank[b.priority];
            }
            return a.id - b.id;
        });
    }

    return result;
}

function priorityClass(priority) {
    return `badge priority-${priority.toLowerCase()}`;
}

function statusClass(status) {
    if (status === "In Progress") return "badge status-progress";
    return `badge status-${status.toLowerCase()}`;
}

function renderTickets() {
    const filteredTickets = getFilteredTickets();

    elements.tableBody.innerHTML = "";

    if (filteredTickets.length === 0) {
        elements.emptyState.style.display = "block";
        return;
    }

    elements.emptyState.style.display = "none";

    filteredTickets.forEach(ticket => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>#${ticket.id}</td>
            <td>${escapeHtml(ticket.customer)}</td>
            <td>${escapeHtml(ticket.issue)}</td>
            <td><span class="${priorityClass(ticket.priority)}">${ticket.priority}</span></td>
            <td><span class="${statusClass(ticket.status)}">${ticket.status}</span></td>
            <td>
                <button class="action-btn" onclick="changeStatus(${ticket.id})">
                    Next Status
                </button>
                <button class="action-btn" onclick="deleteTicket(${ticket.id})">
                    Delete
                </button>
            </td>
        `;

        elements.tableBody.appendChild(row);
    });
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function changeStatus(id) {
    const ticket = tickets.find(item => item.id === id);
    if (!ticket) return;

    if (ticket.status === "Open") {
        ticket.status = "In Progress";
    } else if (ticket.status === "In Progress") {
        ticket.status = "Resolved";
    } else {
        ticket.status = "Open";
    }

    saveTickets();
    renderAll();
}

//deleting tickets
function deleteTicket(id) {
    const shouldDelete = confirm("Delete this ticket?");

    if (!shouldDelete) return;

    tickets = tickets.filter(ticket => ticket.id !== id);
    saveTickets();
    renderAll();
}

function renderAll() {
    renderStats();
    renderTickets();
}

elements.addTicketBtn.addEventListener("click", () => {
    elements.modal.classList.remove("hidden");
    elements.customerInput.focus();
});

elements.closeModal.addEventListener("click", () => {
    elements.modal.classList.add("hidden");
});

elements.modal.addEventListener("click", event => {
    if (event.target === elements.modal) {
        elements.modal.classList.add("hidden");
    }
});

elements.ticketForm.addEventListener("submit", event => {
    event.preventDefault();

    const customer = elements.customerInput.value.trim();
    const issue = elements.issueInput.value.trim();
    const priority = elements.priorityInput.value;

    if (!customer || !issue) return;

    tickets.push({
        id: getNextId(),
        customer,
        issue,
        priority,
        status: "Open"
    });

    saveTickets();
    renderAll();

    elements.ticketForm.reset();
    elements.priorityInput.value = "Medium";
    elements.modal.classList.add("hidden");
});

[
    elements.searchInput,
    elements.statusFilter,
    elements.priorityFilter,
    elements.sortSelect
].forEach(element => {
    element.addEventListener("input", renderTickets);
    element.addEventListener("change", renderTickets);
});

elements.clearBtn.addEventListener("click", () => {
    if (!tickets.length) return;

    const shouldClear = confirm("Remove all tickets?");

    if (shouldClear) {
        tickets = [];
        saveTickets();
        renderAll();
    }
});

renderAll();
