document.addEventListener('DOMContentLoaded', () => {
    const expenseForm = document.getElementById('expense-form');
    const expensesList = document.getElementById('expense-list');
    const totalAmountElement = document.getElementById('total-amount');
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    const logoutButton = document.getElementById('logout-button');

    // Handle expense form submission
    if (expenseForm) {
        expenseForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(expenseForm);
            const category = formData.get('category');
            const description = formData.get('description');
            const amount = formData.get('amount');

            try {
                const response = await fetch('/api/expenses', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ category, description, amount })
                });

                if (response.ok) {
                    alert('Expense added successfully');
                    expenseForm.reset();
                    loadExpenses();
                } else {
                    alert('Failed to add expense');
                }
            } catch (error) {
                console.error('Error:', error);
            }
        });
    }

    // Handle register form submission
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(registerForm);
            const fullName = formData.get('full_name');
            const email = formData.get('email');
            const username = formData.get('username');
            const password = formData.get('password');

            try {
                const response = await fetch('/api/registration', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ full_name: fullName, email, username, password })
                });

                if (response.ok) {
                    alert('Registration successful');
                    window.location.href = '/login'; // Redirect to login page
                } else {
                    alert('Failed to register');
                }
            } catch (error) {
                console.error('Error:', error);
            }
        });
    }

    // Handle login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(loginForm);
            const username = formData.get('username');
            const password = formData.get('password');

            try {
                const response = await fetch('/api/user/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });

                if (response.ok) {
                    alert('Login successful');
                    window.location.href = '/dashboard'; // Redirect to dashboard
                } else {
                    alert('Failed to login');
                }
            } catch (error) {
                console.error('Error:', error);
            }
        });
    }

    // Handle logout
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            try {
                const response = await fetch('/logout');
                if (response.ok) {
                    window.location.href = '/login'; // Redirect to login page
                } else {
                    alert('Failed to log out');
                }
            } catch (error) {
                console.error('Error:', error);
            }
        });
    }

    // Load expenses and display them
    async function loadExpenses() {
        try {
            const response = await fetch('/api/expenses');
            if (response.ok) {
                const data = await response.json();
                const expenses = data.expenses;
                const totalAmount = data.totalAmount;
                
                expensesList.innerHTML = '';
                totalAmountElement.textContent = totalAmount.toFixed(2);

                expenses.forEach(expense => {
                    const expenseRow = document.createElement('tr');
                    expenseRow.innerHTML = `
                        <td>${expense.description}</td>
                        <td>$${expense.amount.toFixed(2)}</td>
                        <td>${expense.category}</td>
                        <td>${new Date(expense.date_created).toLocaleDateString()}</td>
                        <td>
                            <button class="edit-btn" data-id="${expense.id}">Edit</button>
                            <button class="delete-btn" data-id="${expense.id}">Delete</button>
                        </td>
                    `;
                    expensesList.appendChild(expenseRow);
                });

                // Add event listeners for Edit and Delete buttons
                document.querySelectorAll('.edit-btn').forEach(button => {
                    button.addEventListener('click', handleEdit);
                });

                document.querySelectorAll('.delete-btn').forEach(button => {
                    button.addEventListener('click', handleDelete);
                });
            } else {
                console.error('Failed to load expenses');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    // Handle editing an expense
    async function handleEdit(e) {
        const expenseId = e.target.getAttribute('data-id');
        const newDescription = prompt('Enter new description:');
        const newAmount = prompt('Enter new amount:');
        const newCategory = prompt('Enter new category:');

        if (newDescription && newAmount && newCategory) {
            try {
                const response = await fetch(`/api/expenses/${expenseId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ description: newDescription, amount: parseFloat(newAmount), category: newCategory })
                });

                if (response.ok) {
                    alert('Expense updated successfully');
                    loadExpenses();
                } else {
                    alert('Failed to update expense');
                }
            } catch (error) {
                console.error('Error:', error);
            }
        }
    }

    // Handle deleting an expense
    async function handleDelete(e) {
        const expenseId = e.target.getAttribute('data-id');

        if (confirm('Are you sure you want to delete this expense?')) {
            try {
                const response = await fetch(`/api/expenses/${expenseId}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    alert('Expense deleted successfully');
                    loadExpenses();
                } else {
                    alert('Failed to delete expense');
                }
            } catch (error) {
                console.error('Error:', error);
            }
        }
    }

    // Initial load of expenses
    if (document.getElementById('dashboard')) {
        loadExpenses();
    }
});
