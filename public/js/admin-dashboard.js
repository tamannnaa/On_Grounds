let charts = {
    application: null,
    bookings: null
};

async function fetchDashboardData() {
    const errorMessage = document.getElementById('errorMessage');
    const errorText = errorMessage.querySelector('.error-text');
    const containers = document.querySelectorAll('.chart-container, .stats-grid');

    containers.forEach(container => container.classList.add('loading'));
    errorMessage.style.display = 'none';

    try {
        const response = await fetch('/admin/api/dashboard-stats');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.error) {
            throw new Error(data.error);
        }
        document.getElementById('totalUsers').textContent = data.totalUsers;
        document.getElementById('totalMentors').textContent = data.totalMentors;
        document.getElementById('pendingApplications').textContent = data.pendingApplications;
        document.getElementById('todayBookings').textContent = data.todayBookings;
        if (charts.application) {
            charts.application.destroy();
        }
        if (charts.bookings) {
            charts.bookings.destroy();
        }
        const applicationCtx = document.getElementById('applicationChart').getContext('2d');
        charts.application = new Chart(applicationCtx, {
            type: 'doughnut',
            data: {
                labels: ['Pending', 'Approved', 'Rejected'],
                datasets: [{
                    data: [
                        data.applicationStats.pending,
                        data.applicationStats.approved,
                        data.applicationStats.rejected
                    ],
                    backgroundColor: [
                        '#ffd700',
                        '#4CAF50',
                        '#f44336'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
        const bookingsCtx = document.getElementById('bookingsChart').getContext('2d');
        charts.bookings = new Chart(bookingsCtx, {
            type: 'line',
            data: {
                labels: data.weeklyBookings.labels,
                datasets: [{
                    label: 'Number of Bookings',
                    data: data.weeklyBookings.data,
                    borderColor: '#331B3F',
                    tension: 0.1,
                    fill: true,
                    backgroundColor: 'rgba(51, 27, 63, 0.1)'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });

        containers.forEach(container => container.classList.remove('loading'));
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        errorText.textContent = 'Failed to load dashboard data. ';
        errorMessage.style.display = 'flex';
        containers.forEach(container => container.classList.remove('loading'));
    }
}

document.addEventListener('DOMContentLoaded', fetchDashboardData);

setInterval(fetchDashboardData, 5 * 60 * 1000);