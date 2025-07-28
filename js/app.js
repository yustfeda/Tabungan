// js/app.js

document.addEventListener('DOMContentLoaded', () => {
    // Pastikan Firebase library sudah dimuat
    if (typeof firebase === 'undefined') {
        console.error("Firebase library is not loaded. Please check your HTML files and network connection.");
        return;
    }

    let userId = null;

    // Fungsi untuk menampilkan toast/alert kustom
    const showToast = (message, type = 'info', duration = 3000) => {
        const toast = document.getElementById('custom-toast');
        const toastMessage = document.getElementById('toast-message');
        const toastIcon = document.getElementById('toast-icon');

        if (!toast || !toastMessage || !toastIcon) {
            console.warn("Toast elements not found. Fallback to alert.");
            alert(message);
            return;
        }

        toastMessage.textContent = message;
        toast.className = 'toast-notification';
        toast.classList.add('show', type);

        toastIcon.className = '';
        if (type === 'success') toastIcon.classList.add('fas', 'fa-check-circle');
        else if (type === 'error') toastIcon.classList.add('fas', 'fa-times-circle');
        else toastIcon.classList.add('fas', 'fa-info-circle');

        setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    };
    
    // ===================================
    // AUTENTIKASI
    // ===================================

    // Cek status autentikasi setiap kali halaman dimuat
    auth.onAuthStateChanged((user) => {
        const currentPath = window.location.pathname.split('/').pop();
        
        // Halaman yang membutuhkan login
        const protectedPages = ['progress.html', 'settings.html'];

        if (user) {
            userId = user.uid;
            console.log("User logged in:", userId);

            // Jika user login tapi berada di halaman auth, redirect ke progress
            if (currentPath === 'login.html' || currentPath === 'register.html') {
                window.location.href = 'progress.html';
            }

            // Inisialisasi logika khusus halaman setelah login
            initializePageSpecificLogic(userId);

            // Tambahkan event listener untuk tombol logout
            const logoutBtn = document.getElementById('logout-btn');
            if(logoutBtn) {
                logoutBtn.addEventListener('click', () => {
                    auth.signOut().then(() => {
                        window.location.href = 'login.html';
                    }).catch(error => {
                        showToast(`Logout failed: ${error.message}`, 'error');
                    });
                });
            }

        } else {
            console.log("User logged out or not authenticated.");
            userId = null;
            
            // Jika user tidak login dan mencoba mengakses halaman yang dilindungi, redirect ke login
            if (protectedPages.includes(currentPath)) {
                window.location.href = 'login.html';
            }
        }
    });

    // ===================================
    // LOGIKA KHUSUS HALAMAN
    // ===================================
    const initializePageSpecificLogic = (uid) => {
        const currentPath = window.location.pathname.split('/').pop();
        
        if (currentPath === 'register.html') {
            handleRegisterPage();
        } else if (currentPath === 'login.html') {
            handleLoginPage();
        } else if (currentPath === 'progress.html') {
            handleProgressPage(uid);
        } else if (currentPath === 'settings.html') {
            handleSettingsPage(uid);
        }

        const navLinks = document.querySelectorAll('nav a');
        navLinks.forEach(link => {
            if (link.getAttribute('href') === currentPath) {
                link.classList.add('active');
            }
        });
    };
    
    // --- Register Page Handler ---
    const handleRegisterPage = () => {
        const registerForm = document.getElementById('register-form');
        if (!registerForm) return;

        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = registerForm['register-email'].value;
            const password = registerForm['register-password'].value;

            auth.createUserWithEmailAndPassword(email, password)
                .then((cred) => {
                    showToast('Registrasi berhasil! Anda akan diarahkan ke halaman login.', 'success');
                    setTimeout(() => window.location.href = 'login.html', 2000);
                })
                .catch(error => {
                    showToast(`Registrasi gagal: ${error.message}`, 'error');
                });
        });
    };

    // --- Login Page Handler ---
    const handleLoginPage = () => {
        const loginForm = document.getElementById('login-form');
        if (!loginForm) return;

        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = loginForm['login-email'].value;
            const password = loginForm['login-password'].value;
            
            auth.signInWithEmailAndPassword(email, password)
                .then((cred) => {
                    showToast('Login berhasil! Mengarahkan ke halaman progres...', 'success');
                    // onAuthStateChanged akan otomatis mengarahkan ke progress.html
                })
                .catch(error => {
                    showToast(`Login gagal: ${error.message}`, 'error');
                });
        });
    };

    // --- Progress Page Handler ---
    let lineChartInstance, pieChartInstance;
    const handleProgressPage = (uid) => {
        // ... (Kode untuk halaman progress yang sudah ada, pastikan menggunakan `uid` untuk database) ...
        const targetAmountEl = document.getElementById('target-amount');
        const totalSavingsEl = document.getElementById('total-savings');
        const progressBar = document.getElementById('progress-bar');
        const percentageEl = document.getElementById('progress-percentage');
        const transactionsTableBody = document.getElementById('transactions-table-body');
        const ctxLineChart = document.getElementById('lineChart')?.getContext('2d');
        const ctxPieChart = document.getElementById('pieChart')?.getContext('2d');
        const formatCurrency = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
        const formatDate = (dateString) => {
            const date = new Date(dateString);
            return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
        };
        const renderCharts = (transactions, target, totalSavings, lineCtx, pieCtx) => {
            if (lineChartInstance) lineChartInstance.destroy();
            if (pieChartInstance) pieChartInstance.destroy();
            const accumulatedData = [];
            const labels = [];
            let currentAccumulated = 0;
            transactions.forEach((t) => {
                currentAccumulated += t.amount;
                accumulatedData.push(currentAccumulated);
                labels.push(formatDate(t.date));
            });
            lineChartInstance = new Chart(lineCtx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Akumulasi Tabungan',
                        data: accumulatedData,
                        borderColor: 'rgba(32, 201, 151, 1)',
                        backgroundColor: 'rgba(32, 201, 151, 0.3)',
                        borderWidth: 2, fill: true, tension: 0.4, pointRadius: 4
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { display: false } },
                        y: { 
                            beginAtZero: true, 
                            grid: { color: 'rgba(0,0,0,0.05)' },
                            ticks: { callback: (value) => formatCurrency(value) }
                        }
                    }
                }
            });
            const remaining = target - totalSavings;
            pieChartInstance = new Chart(pieCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Terkumpul', 'Sisa Target'],
                    datasets: [{
                        data: [totalSavings, remaining > 0 ? remaining : 0],
                        backgroundColor: ['rgba(32, 201, 151, 1)', '#ecf0f1'],
                        borderColor: '#fff', borderWidth: 2,
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom' } }
                }
            });
        };
        const renderTransactionTable = (transactions, tableBody) => {
            tableBody.innerHTML = '';
            transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
            transactions.forEach(trans => {
                const row = document.createElement('tr');
                const amountClass = trans.type === 'deposit' ? 'deposit' : 'withdrawal';
                const sign = trans.type === 'deposit' ? '+' : '-';
                row.innerHTML = `
                    <td>${formatDate(trans.date)}</td>
                    <td>${trans.description}</td>
                    <td class="${amountClass}">${sign} ${formatCurrency(Math.abs(trans.amount))}</td>
                `;
                tableBody.appendChild(row);
            });
        };
        database.ref('wedding_savings/' + uid).on('value', (snapshot) => {
            const data = snapshot.val() || {};
            const target = data.target || 0;
            const totalSavings = data.total_tabungan || 0;
            const transactions = data.transactions || {};
            
            targetAmountEl.textContent = formatCurrency(target);
            totalSavingsEl.textContent = formatCurrency(totalSavings);
            
            const percentage = target > 0 ? (totalSavings / target) * 100 : 0;
            progressBar.style.width = `${Math.min(percentage, 100)}%`;
            percentageEl.textContent = `${percentage.toFixed(2)}%`;

            const transactionsArray = Object.keys(transactions).map(key => ({
                id: key,
                ...transactions[key]
            })).sort((a, b) => new Date(a.date) - new Date(b.date));

            if (ctxLineChart && ctxPieChart) {
                renderCharts(transactionsArray, target, totalSavings, ctxLineChart, ctxPieChart);
            }
            renderTransactionTable(transactionsArray, transactionsTableBody);
        });
    };

    // --- Settings Page Handler ---
    const handleSettingsPage = (uid) => {
        // ... (Kode untuk halaman settings yang sudah ada, pastikan menggunakan `uid` untuk database) ...
        const targetForm = document.getElementById('target-form');
        const targetInput = document.getElementById('target-input');
        const transactionForm = document.getElementById('transaction-form');
        const transactionsTableBody = document.getElementById('edit-transactions-body');
        
        const descriptionInput = document.getElementById('transaction-description');
        const amountInput = document.getElementById('transaction-amount');
        const dateInput = document.getElementById('transaction-date');
        const typeSelect = document.getElementById('transaction-type');
        const saveTransactionBtn = document.getElementById('save-transaction-btn');
        const cancelEditBtn = document.getElementById('cancel-edit-btn');
        let editingTransactionId = null;

        const formatCurrency = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
        const formatDate = (dateString) => {
            const date = new Date(dateString);
            return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
        };
        
        if (!database) {
            showToast("Koneksi database gagal. Mohon periksa konfigurasi Firebase.", "error");
            return;
        }
        database.ref('wedding_savings/' + uid + '/target').once('value').then(snapshot => {
            if (snapshot.exists()) {
                targetInput.value = snapshot.val();
            }
        }).catch(error => {
            showToast("Gagal memuat target: " + error.message, "error");
        });
        targetForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newTarget = parseFloat(targetInput.value);
            if (!isNaN(newTarget) && newTarget >= 0) {
                database.ref('wedding_savings/' + uid + '/target').set(newTarget)
                    .then(() => showToast('Target berhasil diperbarui!', 'success'))
                    .catch(error => showToast('Gagal memperbarui target: ' + error.message, 'error'));
            } else {
                showToast('Masukkan angka target yang valid.', 'error');
            }
        });
        transactionForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const amount = parseFloat(amountInput.value);
            const description = descriptionInput.value.trim();
            const date = dateInput.value;
            const type = typeSelect.value;
            
            if (isNaN(amount) || amount <= 0 || description === '' || date === '') {
                showToast('Harap isi semua kolom dengan benar.', 'error');
                return;
            }
            const transactionAmount = type === 'withdrawal' ? -amount : amount;
            if (editingTransactionId) {
                database.ref('wedding_savings/' + uid + '/transactions/' + editingTransactionId).once('value').then(snapshot => {
                    const oldTransaction = snapshot.val();
                    const oldAmount = oldTransaction.amount;
                    const amountChange = transactionAmount - oldAmount;
                    const updates = {};
                    updates['/wedding_savings/' + uid + '/transactions/' + editingTransactionId] = {
                        amount: transactionAmount, description: description, date: date, type: type
                    };
                    updates['/wedding_savings/' + uid + '/total_tabungan'] = firebase.database.ServerValue.increment(amountChange);
                    database.ref().update(updates)
                        .then(() => { showToast('Transaksi berhasil diperbarui!', 'success'); resetTransactionForm(); })
                        .catch(error => showToast('Gagal memperbarui transaksi: ' + error.message, 'error'));
                }).catch(error => showToast('Gagal mengambil data transaksi lama: ' + error.message, 'error'));
            } else {
                const newTransactionRef = database.ref('wedding_savings/' + uid + '/transactions').push();
                newTransactionRef.set({
                    amount: transactionAmount, description: description, date: date, type: type
                }).then(() => {
                    database.ref('wedding_savings/' + uid + '/total_tabungan').transaction((currentTotal) => {
                        return (currentTotal || 0) + transactionAmount;
                    }).then(() => {
                        showToast('Transaksi berhasil ditambahkan!', 'success'); resetTransactionForm();
                    });
                }).catch(error => showToast('Gagal menambahkan transaksi: ' + error.message, 'error'));
            }
        });
        const resetTransactionForm = () => {
            transactionForm.reset();
            editingTransactionId = null;
            saveTransactionBtn.textContent = 'Tambah Transaksi';
            cancelEditBtn.style.display = 'none';
        };
        cancelEditBtn.addEventListener('click', resetTransactionForm);
        database.ref('wedding_savings/' + uid + '/transactions').on('value', (snapshot) => {
            const transactions = snapshot.val();
            transactionsTableBody.innerHTML = '';
            if (transactions) {
                const transactionsArray = Object.keys(transactions).map(key => ({ id: key, ...transactions[key] }));
                transactionsArray.sort((a, b) => new Date(b.date) - new Date(a.date));
                transactionsArray.forEach(trans => {
                    const row = document.createElement('tr');
                    const amountClass = trans.type === 'deposit' ? 'deposit' : 'withdrawal';
                    const sign = trans.type === 'deposit' ? '+' : '-';
                    row.innerHTML = `
                        <td>${formatDate(trans.date)}</td>
                        <td>${trans.description}</td>
                        <td class="${amountClass}">${sign} ${formatCurrency(Math.abs(trans.amount))}</td>
                        <td>
                            <div class="btn-group">
                                <button class="edit-btn" data-id="${trans.id}"><i class="fas fa-edit"></i> Edit</button>
                                <button class="delete-btn" data-id="${trans.id}"><i class="fas fa-trash-alt"></i> Hapus</button>
                            </div>
                        </td>
                    `;
                    transactionsTableBody.appendChild(row);
                });
                document.querySelectorAll('.edit-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const transactionId = e.target.dataset.id || e.target.closest('button').dataset.id;
                        database.ref('wedding_savings/' + uid + '/transactions/' + transactionId).once('value').then(snapshot => {
                            const transactionData = snapshot.val();
                            if (transactionData) {
                                editingTransactionId = transactionId;
                                descriptionInput.value = transactionData.description;
                                amountInput.value = Math.abs(transactionData.amount);
                                dateInput.value = transactionData.date;
                                typeSelect.value = transactionData.type;
                                saveTransactionBtn.textContent = 'Simpan Perubahan';
                                cancelEditBtn.style.display = 'inline-block';
                                showToast('Mode Edit: Sesuaikan data di atas.', 'info');
                            }
                        }).catch(error => showToast('Gagal mengambil data untuk edit: ' + error.message, 'error'));
                    });
                });
                document.querySelectorAll('.delete-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const transactionId = e.target.dataset.id || e.target.closest('button').dataset.id;
                        if (confirm('Yakin ingin menghapus transaksi ini?')) {
                            database.ref('wedding_savings/' + uid + '/transactions/' + transactionId).once('value').then(snapshot => {
                                const transactionData = snapshot.val();
                                const amount = transactionData.amount;
                                database.ref('wedding_savings/' + uid + '/transactions/' + transactionId).remove()
                                    .then(() => {
                                        database.ref('wedding_savings/' + uid + '/total_tabungan').transaction(currentTotal => {
                                            return (currentTotal || 0) - amount;
                                        });
                                        showToast('Transaksi berhasil dihapus!', 'success');
                                        resetTransactionForm();
                                    })
                                    .catch(error => showToast('Gagal menghapus transaksi: ' + error.message, 'error'));
                            }).catch(error => showToast('Gagal mengambil data transaksi untuk dihapus: ' + error.message, 'error'));
                        }
                    });
                });
            }
        });
    };

    // Panggil handler halaman yang sesuai saat DOM dimuat
    const currentPath = window.location.pathname.split('/').pop();
    if (currentPath === 'register.html') handleRegisterPage();
    if (currentPath === 'login.html') handleLoginPage();
});