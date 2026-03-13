document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.querySelector('#full-history-body');
    const filterButtons = document.querySelectorAll('.toggle-btn');
    const searchInput = document.querySelector('#history-search');

    let allTransactions = [];
    let currentFilter = 'all';
    let searchTerm = '';

    async function loadHistory() {
        const userEmail = localStorage.getItem('userEmail'); 
        
        if (!userEmail) {
            console.error("No user email found. Redirecting to login...");
            return;
        }

        try {
            
            const response = await fetch(`http://localhost:3000/api/history/${userEmail}`);
            
            if (!response.ok) throw new Error('Network response was not ok');
            
            allTransactions = await response.json();
            renderTable(); 
        } catch (error) {
            console.error("Failed to load history:", error);
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red;">Failed to load data.</td></tr>';
        }
    }

    // Logic to filter and display the data
    function renderTable() {
        const filteredData = allTransactions.filter(item => {
            const matchesType = currentFilter === 'all' || item.transaction_type === currentFilter;
            
           
            const matchesSearch = (item.description || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                                (item.category || "").toLowerCase().includes(searchTerm.toLowerCase());
            
            return matchesType && matchesSearch;
        });

        if (filteredData.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No transactions found.</td></tr>';
            return;
        }

        // database columns: t_date, transaction_type, category, description, amount
        tableBody.innerHTML = filteredData.map(item => `
            <tr>
                <td>${formatDate(item.t_date)}</td>
                <td><span class="badge ${item.transaction_type}">${item.transaction_type}</span></td>
                <td>${item.category}</td>
                <td>${item.description || '-'}</td>
                <td class="amount ${item.transaction_type}">
                    ${item.transaction_type === 'income' ? '+' : '-'}${Math.abs(parseFloat(item.amount)).toFixed(2)}
                </td>
            </tr>
        `).join('');
    }

    // sql date
    function formatDate(dateString) {
        if (!dateString) return "-";
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }

    //(All, Income, Expense)
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
           
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
        
            currentFilter = btn.getAttribute('data-type');
            renderTable();
        });
    });

   
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchTerm = e.target.value;
            renderTable();
        });
    }

    loadHistory();
});