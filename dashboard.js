// --- VARIABLES ---
const apiUrl = "http://localhost:3000/api";
const userEmail = localStorage.getItem('userEmail');
var budgetLimit = localStorage.getItem('budgetLimit');

// Set default budget if missing
if (budgetLimit == null) {
    budgetLimit = 2000;
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
    var response = await fetch(apiUrl + "/dashboard-stats/" + userEmail);
    var data = await response.json();

    var income = data.income;
    var expenses = data.expenses;
    var balance = data.balance;

    if (income == null) income = 0;
    if (expenses == null) expenses = 0;
    if (balance == null) balance = 0;


    document.getElementById('total-income').innerText = "+" + income;
    document.getElementById('total-expenses').innerText = "-" + expenses;
    document.getElementById('total-balance').innerText = balance;


    checkBudget(expenses);
    showGraph(income, expenses);
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