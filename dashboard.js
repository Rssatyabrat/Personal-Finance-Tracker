// --- VARIABLES ---
const apiUrl = "https://personal-finance-tracker-8l67.onrender.com/api";
const userEmail = localStorage.getItem('userEmail');
var budgetLimit = localStorage.getItem('budgetLimit');

// Set default budget if missing
if (budgetLimit == null) {
    budgetLimit = 15000;
}
window.onload = function() {
    
    if (userEmail == null) {
        window.location.href = 'login.html';
    }

    var name = localStorage.getItem('userName');
    if (name == null) {
        name = "User";
    }
    document.getElementById('user-name-display').innerText = "Hello " + name;

    loadData();

    document.getElementById('logout-btn').onclick = function() {
        localStorage.removeItem('userEmail');
        window.location.href = 'login.html';
    };
};

// --- FUNCTIONS ---

async function loadData() {
    console.log("Dashboard: Fetching stats for", userEmail);
    
    try {
        const response = await fetch(apiUrl + "/dashboard-stats/" + userEmail);
        
        if (!response.ok) {
            throw new Error(`Server returned status ${response.status}`);
        }

        const data = await response.json();
        console.log("Dashboard: Received data from server:", data);

        // Fallback to 0 if data is missing/null
        const income = data.income || 0;
        const expenses = data.expenses || 0;
        const balance = data.balance || 0;

        // Update the UI
        document.getElementById('total-income').innerText = "+" + income.toFixed(2);
        document.getElementById('total-expenses').innerText = "-" + expenses.toFixed(2);
        document.getElementById('total-balance').innerText = balance.toFixed(2);

        // Run auxiliary functions
        if (typeof checkBudget === "function") checkBudget(expenses);
        if (typeof showGraph === "function") showGraph(income, expenses);

    } catch (error) {
        console.error("Dashboard: Error loading data:", error);
    }
}

function checkBudget(spent) {
  
    var percent = (spent / budgetLimit) * 100;
    var left = budgetLimit - spent;

    
    document.getElementById('budget-spent-display').innerText = spent;
    document.getElementById('budget-limit-display').innerText = budgetLimit;
    
    
    var bar = document.getElementById('budget-progress-bar');
    bar.style.width = percent + "%";

    // Progress Bar Colors
    if (percent >= 100) {
        bar.style.backgroundColor = "red";
        document.getElementById('budget-message').innerText = "Over Budget!";
    } else {
        bar.style.backgroundColor = "green";
        document.getElementById('budget-message').innerText = "Remaining: " + left;
    }
}

function showGraph(inc, exp) {
    var ctx = document.getElementById('financeChart');
    
    // Delete old chart if exists
    if (window.myChart != null) {
        window.myChart.destroy();
    }

    // Draw new chart
    window.myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Income', 'Expenses'],
            datasets: [{
                data: [inc, exp],
                backgroundColor: ['green', 'red']
            }]
        }
    });
}


function toggleModal(id) {
    var modal = document.getElementById(id);
    if (modal.style.display === "block") {
        modal.style.display = "none";
    } else {
        modal.style.display = "block";
    }
}

// Saving Forms
async function saveTransaction(type) {
    var amountId = "";
    var categoryId = "";
    
    if (type === 'income') {
        amountId = 'income-amount';
        categoryId = 'source';
    } else {
        amountId = 'expense-amount';
        categoryId = 'expense-category';
    }

    var formData = {
        email: userEmail,
        type: type,
        amount: document.getElementById(amountId).value,
        category: document.getElementById(categoryId).value,
        date: new Date().toISOString().split('T')[0], 
        description: "Added from dashboard"
    };

    await fetch(apiUrl + "/transactions", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    });

    alert("Saved!");
    location.reload();
}


function openBudgetModal() {
    document.getElementById('budget-modal').style.display = 'block';
}

function closeBudgetModal() {
    document.getElementById('budget-modal').style.display = 'none';
}

function saveNewBudget() {
    var newLimit = document.getElementById('new-budget-limit').value;
    localStorage.setItem('budgetLimit', newLimit);
    alert("Budget Updated");
    location.reload();
}