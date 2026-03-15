/* ============================================
   POZNAIME - Main JavaScript
   Requires: Alpine.js, Chart.js, TailwindCSS
============================================ */

document.addEventListener('alpine:init', () => {
  Alpine.data('appState', () => ({
    // --- Navigation ---
    currentPage: 'home',

    // --- Auth ---
    isLoggedIn: false,
    currentUser: null,
    isSignupMode: false,
    userBalance: 380,

    // --- Modals ---
    showAuthModal: false,
    showConfirmModal: false,
    confirmDetails: {},

    // --- Trade ---
    currentTradeSide: 'yes',
    tradeAmount: 10,
    yesProb: 0.63,
    noProb: 0.37,

    // --- Portfolio ---
    portfolioValueMode: 'realistic',
    portfolioValue: 1380,

    // --- UI state ---
    activeStatsTab: 'overview',
    activePortfolioTab: 'active',
    searchQuery: '',
    searchOpen: false,
    searchResults: [],
    activeCategory: 'all',

    // --- Chart ---
    marketChartObj: null,

    // ---- Init ----
    init() {
      this.initChart();
      this.navigate('home');
      this.simulateLiveUpdates();

      // Hash routing support
      setTimeout(() => {
        const hash = window.location.hash.replace('#', '');
        if (['home', 'market', 'trade', 'portfolio'].includes(hash)) {
          this.navigate(hash);
        }
      }, 100);
    },

    // ============================================
    // NAVIGATION WITH SLIDE TRANSITIONS
    // ============================================
    navigate(pageId) {
      if (pageId === this.currentPage) return;

      // Determine slide direction based on page order
      const pageOrder = ['home', 'market', 'trade', 'portfolio'];
      const currentIdx = pageOrder.indexOf(this.currentPage);
      const targetIdx  = pageOrder.indexOf(pageId);
      const direction  = targetIdx >= currentIdx ? 'forward' : 'back';

      const oldPage = document.getElementById('page-' + this.currentPage);
      const newPage = document.getElementById('page-' + pageId);
      if (!oldPage || !newPage) return;

      // Show new page and apply enter animation
      newPage.classList.add('page-enter-' + direction);
      newPage.style.display = 'block';

      // Apply leave animation to old page
      oldPage.classList.add('page-leave-' + direction);

      // Update header visibility
      const hHome = document.getElementById('header-home');
      const hBack = document.getElementById('header-back');
      if (pageId === 'home' || pageId === 'portfolio') {
        hHome.classList.remove('hidden');
        hBack.classList.add('hidden');
      } else {
        hHome.classList.add('hidden');
        hBack.classList.remove('hidden');
      }

      // Update Alpine nav state immediately
      this.currentPage = pageId;
      window.scrollTo(0, 0);

      // Clean up after animations complete
      const DURATION = 340;
      setTimeout(() => {
        // Remove old page
        oldPage.style.display = 'none';
        oldPage.classList.remove('active', 'page-leave-forward', 'page-leave-back');

        // Finalize new page
        newPage.classList.remove('page-enter-forward', 'page-enter-back');
        newPage.classList.add('active');

        // Resize chart if navigated to market page
        if (pageId === 'market' && this.marketChartObj) {
          this.marketChartObj.resize();
        }
      }, DURATION);
    },

    // ============================================
    // AUTH
    // ============================================
    handleAuth(event) {
      const btn = document.getElementById('auth-submit-btn');
      const originalText = btn.textContent;
      btn.innerHTML = '<div class="spinner inline-block"></div>';
      btn.disabled = true;

      setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
        this.isLoggedIn = true;
        this.currentUser = { name: 'Demo User', email: 'demo@example.com' };
        this.showAuthModal = false;
        this.showToast(this.isSignupMode ? 'Account created successfully!' : 'Welcome back!', 'success');
      }, 1500);
    },

    handleLogout() {
      this.isLoggedIn = false;
      this.currentUser = null;
      this.showToast('Logged out successfully', 'success');
    },

    // ============================================
    // SEARCH
    // ============================================
    searchMarkets: [
      { title: 'Will Bulgaria adopt the Euro before Jan 1, 2026?', category: 'Politics' },
      { title: 'Will Ludogorets win the Bulgarian league in 2026?', category: 'Sports' },
      { title: 'Will Bitcoin exceed €100K before 2027?', category: 'Crypto' },
      { title: "Will Bulgaria's GDP growth exceed 3% in 2026?", category: 'Economy' },
      { title: 'Will there be early parliamentary elections in 2026?', category: 'Politics' }
    ],

    handleSearch() {
      const query = this.searchQuery.toLowerCase();
      if (query.length < 2) { this.searchResults = []; return; }
      this.searchResults = this.searchMarkets.filter(m =>
        m.title.toLowerCase().includes(query) || m.category.toLowerCase().includes(query)
      );
    },

    delayHideSearch() {
      setTimeout(() => { this.searchOpen = false; }, 200);
    },

    // ============================================
    // TRADE
    // ============================================
    confirmTrade(side) {
      if (!this.isLoggedIn) {
        this.showAuthModal = true;
        this.isSignupMode = false;
        return;
      }
      const amount    = parseFloat(this.tradeAmount) || 0;
      const prob      = side === 'yes' ? this.yesProb : this.noProb;
      const winAmount = (amount / prob).toFixed(2);
      const fee       = (amount * 0.005).toFixed(2);

      this.confirmDetails = {
        side,
        amount: amount.toFixed(2),
        price: prob.toFixed(2),
        winAmount,
        fee
      };
      this.currentTradeSide = side;
      this.showConfirmModal = true;
    },

    executeTrade() {
      this.showConfirmModal = false;
      const amount = parseFloat(this.confirmDetails.amount) || 0;
      this.userBalance = Math.max(0, this.userBalance - amount);
      this.showToast('Trade executed successfully!', 'success');
    },

    // ============================================
    // PORTFOLIO VALUE MODE
    // ============================================
    setPortfolioValueMode(mode) {
      this.portfolioValueMode = mode;
      this.portfolioValue = mode === 'realistic' ? 1380 : 1420;
    },

    // ============================================
    // CHART.JS
    // ============================================
    initChart() {
      const ctx = document.getElementById('marketChart');
      if (!ctx) return;

      Chart.defaults.font.family = 'Inter';
      Chart.defaults.font.size = 11;

      const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 200);
      gradient.addColorStop(0, 'rgba(22, 163, 74, 0.2)');
      gradient.addColorStop(1, 'rgba(22, 163, 74, 0)');

      this.marketChartObj = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
          labels: Array.from({ length: 30 }, (_, i) => i + 1),
          datasets: [{
            data: this.generateChartData(30, 45, 70),
            borderColor: '#16A34A',
            backgroundColor: gradient,
            borderWidth: 2,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 6,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 1500, easing: 'easeOutQuart' },
          plugins: {
            legend: { display: false },
            tooltip: {
              enabled: true,
              backgroundColor: '#111',
              titleFont: { size: 12, weight: '600' },
              bodyFont: { size: 11 },
              padding: 12,
              cornerRadius: 8,
              displayColors: false,
              callbacks: {
                label: ctx => ctx.parsed.y + '% probability'
              }
            }
          },
          scales: {
            x: { display: false },
            y: { display: false } // Minimal chart — no axis labels
          },
          interaction: { intersect: false, mode: 'index' }
        }
      });
    },

    generateChartData(points, min, max) {
      const data = [];
      let value = (min + max) / 2;
      for (let i = 0; i < points; i++) {
        value = Math.max(min, Math.min(max, value + (Math.random() - 0.5) * 10));
        data.push(Math.round(value));
      }
      return data;
    },

    updateChartTimeframe(timeframe, btn) {
      // Update active button styling
      document.querySelectorAll('.chart-time-btn').forEach(b => {
        b.classList.remove('bg-white', 'shadow-sm', 'text-textMain');
        b.classList.add('text-textMuted');
      });
      btn.classList.remove('text-textMuted');
      btn.classList.add('bg-white', 'shadow-sm', 'text-textMain');

      let points, min, max;
      switch (timeframe) {
        case '24h': points = 24; min = 55; max = 68; break;
        case '7d':  points = 14; min = 50; max = 70; break;
        default:    points = 30; min = 45; max = 70;
      }

      const newData = this.generateChartData(points, min, max);
      this.marketChartObj.data.labels = Array.from({ length: points }, (_, i) => i + 1);
      this.marketChartObj.data.datasets[0].data = newData;
      this.marketChartObj.update('active');

      // Sync displayed percentages
      const last = newData[newData.length - 1];
      document.getElementById('market-yes-percent').textContent = last + '%';
      document.getElementById('market-no-percent').textContent  = (100 - last) + '%';
    },

    // ============================================
    // SIMULATED LIVE PRICE UPDATES
    // ============================================
    simulateLiveUpdates() {
      setInterval(() => {
        if (this.marketChartObj && document.getElementById('page-market').classList.contains('active')) {
          const data     = this.marketChartObj.data.datasets[0].data;
          const last     = data[data.length - 1];
          const newValue = Math.max(40, Math.min(75, last + (Math.random() - 0.5) * 2));
          const rounded  = Math.round(newValue);
          data.push(rounded);
          data.shift();
          this.marketChartObj.update('none');
          document.getElementById('market-yes-percent').textContent = rounded + '%';
          document.getElementById('market-no-percent').textContent  = (100 - rounded) + '%';
        }
      }, 5000);
    },

    // ============================================
    // TOAST NOTIFICATIONS
    // ============================================
    showToast(message, type = '') {
      const toast = document.getElementById('toast');
      toast.textContent = message;
      toast.className = 'toast show' + (type ? ' ' + type : '');
      setTimeout(() => toast.classList.remove('show'), 3000);
    }
  }));
});
