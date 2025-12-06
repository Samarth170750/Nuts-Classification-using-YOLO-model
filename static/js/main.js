document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('search-form');
    const productFilter = document.getElementById('productFilter');
    const locationFilter = document.getElementById('locationFilter'); // Now a <select> element
    const priceRange = document.getElementById('priceRange');
    const priceValue = document.getElementById('priceValue');
    const sortSelect = document.getElementById('sortSelect');
    const resultMessage = document.getElementById('result-message');
    const resultGrid = document.getElementById('result-grid');
    const marketStats = document.getElementById('market-stats');
    const loadMoreTrigger = document.getElementById('load-more-trigger');
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.querySelector('.theme-icon');
    const imageUpload = document.getElementById('imageUpload');
    const uploadBtn = document.getElementById('uploadBtn');
    const searchByImageBtn = document.getElementById('searchByImageBtn');
    const imagePreview = document.getElementById('imagePreview');

    let defaultResults = [];
    let currentResults = [];
    let displayedCount = 0;
    const initialLoad = 10;
    const loadIncrement = 5;

    const setTheme = (theme) => {
        if (theme === 'light') {
            document.body.classList.add('light-mode');
            themeIcon.textContent = '☀️';
        } else {
            document.body.classList.remove('light-mode');
            themeIcon.textContent = '🌙';
        }
        localStorage.setItem('theme', theme);
    };

    // Set default theme to dark if no preference is saved
    const savedTheme = localStorage.getItem('theme');
    setTheme(savedTheme || 'dark');

    themeToggle.addEventListener('click', () => {
        const isLightMode = document.body.classList.contains('light-mode');
        setTheme(isLightMode ? 'dark' : 'light');
    });

    // Particle Background
    const canvas = document.getElementById('particle-canvas');
    const ctx = canvas.getContext('2d');

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let particles = [];
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 3 + 1;
            this.speedX = Math.random() * 1 - 0.5;
            this.speedY = Math.random() * 1 - 0.5;
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.size > 0.2) this.size -= 0.01;
        }
        draw() {
            const isLightMode = document.body.classList.contains('light-mode');
            ctx.fillStyle = isLightMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(212, 175, 55, 0.5)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function initParticles() {
        particles = [];
        const particleCount = Math.floor((window.innerWidth * window.innerHeight) / 15000);
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
    }

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();
            if (particles[i].size <= 0.2) {
                particles.splice(i, 1);
                i--;
                particles.push(new Particle());
            }
        }
        requestAnimationFrame(animateParticles);
    }

    initParticles();
    animateParticles();
    window.addEventListener('resize', initParticles);

    // Price Slider
    priceRange.addEventListener('input', () => {
        priceValue.textContent = `₹${parseFloat(priceRange.value).toLocaleString()}`;
    });

    // Market Summary
    function loadMarketSummary(results) {
        marketStats.innerHTML = '';
        const categories = ['Electronics', 'Home-Decor'];
        const summary = categories.map(category => {
            const count = results.filter(r => r['Category']?.toLowerCase() === category.toLowerCase()).length;
            return { category, count };
        }).filter(s => s.count > 0);

        if (summary.length === 0) {
            marketStats.innerHTML = '<p class="result-message"></p>';
        } else {
            marketStats.innerHTML = summary.map(s => 
                `<div class="stat-card">
                    <h3>${s.category}</h3>
                    <p>${s.count}</p>
                </div>`).join('');
        }
    }

    // Render Cards
    function renderCards(results, start, count) {
        const end = Math.min(start + count, results.length);
        for (let i = start; i < end; i++) {
            const result = results[i];
            const card = document.createElement('div');
            card.className = 'result-card';

            const summary = document.createElement('div');
            summary.className = 'summary';
            summary.textContent = formatSummary(result); // Simplified, no typing animation

            const details = document.createElement('div');
            details.className = 'result-details';
            details.innerHTML = formatDetails(result);

            card.appendChild(summary);
            card.appendChild(details);

            resultGrid.appendChild(card);
            setTimeout(() => card.classList.add('show'), (i - start) * 100);
        }
        displayedCount = end;
    }

    // Sort Results
    function sortResults(sortBy) {
        let sorted = [...defaultResults];
        switch (sortBy) {
            case 'price-high':
                sorted.sort((a, b) => (b['Price'] || Infinity) - (a['Price'] || Infinity));
                break;
            case 'price-low':
                sorted.sort((a, b) => (a['Price'] || -Infinity) - (b['Price'] || -Infinity));
                break;
            case 'default':
            default:
                break;
        }
        return sorted;
    }

    // Lazy Loading
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && displayedCount < currentResults.length) {
            renderCards(currentResults, displayedCount, loadIncrement);
        }
    }, { rootMargin: '200px' });

    observer.observe(loadMoreTrigger);

    // Form Submission
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        performSearch();
    });

    sortSelect.addEventListener('change', () => {
        currentResults = sortResults(sortSelect.value);
        resultGrid.innerHTML = '';
        displayedCount = 0;
        renderCards(currentResults, 0, initialLoad);
        loadMarketSummary(currentResults);
    });

    function performSearch() {
        const product = productFilter.value.toLowerCase();
        const location = locationFilter.value.trim().toLowerCase(); // Now works with <select>
        const maxPrice = parseFloat(priceRange.value);

        if (!product && !location) {
            resultMessage.textContent = 'Please select a product or location.';
            resultGrid.innerHTML = '';
            marketStats.innerHTML = '';
            currentResults = [];
            defaultResults = [];
            return;
        }

        resultMessage.textContent = 'Fetching suppliers...';
        resultGrid.innerHTML = '';
        marketStats.innerHTML = '';
        currentResults = [];
        defaultResults = [];
        displayedCount = 0;

        fetch('/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
            body: JSON.stringify({ product, location, max_price: maxPrice })
        })
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            resultMessage.textContent = '';
            defaultResults = data.results || [];
            currentResults = sortResults(sortSelect.value);

            if (currentResults.length === 0) {
                resultMessage.textContent = 'No suppliers found.';
                marketStats.innerHTML = '<p class="result-message">No categories match the current filters.</p>';
                return;
            }

            loadMarketSummary(currentResults);
            renderCards(currentResults, 0, initialLoad);
        })
        .catch(error => {
            console.error('Error:', error);
            resultMessage.textContent = 'Error fetching suppliers.';
            resultGrid.innerHTML = '';
            marketStats.innerHTML = '';
            currentResults = [];
            defaultResults = [];
        });
    }

    // Initial Load on Page Start
    performSearch();

    function formatSummary(result) {
        return `${result['Title'] || 'Unknown'} - ₹${result['Price'] || 'N/A'} by ${result['Company'] || 'Unknown'} (${result['City'] || 'N/A'})`;
    }

    function formatDetails(result) {
        return `
            <strong>Sub-Category:</strong> ${result['Sub-Category'] || 'N/A'}<br>
            <strong>Price:</strong> ₹${result['Price'] || 'N/A'}<br>
            <strong>Address:</strong> ${result['Address'] || 'N/A'}<br>
            <strong>Rating:</strong> ${result['Rating'] || 'N/A'} / 5<br>
            <strong>Reviews:</strong> ${result['No_of_Reviews'] || 'N/A'}<br>
            <strong>Contact:</strong> ${result['Contact'] || 'N/A'}<br>
        `;
    }

    uploadBtn.addEventListener('click', () => imageUpload.click());
    imageUpload.addEventListener('change', handleImageUpload);
    searchByImageBtn.addEventListener('click', searchByImage);

    function handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
    
        const reader = new FileReader();
        reader.onload = function(e) {
            imagePreview.src = e.target.result;
            imagePreview.style.display = 'block';
            searchByImageBtn.disabled = false;
        }
        reader.readAsDataURL(file);
    }

    function searchByImage() {
        if (!imageUpload.files[0]) return;
    
        resultMessage.textContent = 'Analyzing image and searching for suppliers...';
        resultGrid.innerHTML = '';
        marketStats.innerHTML = '';
        const location = locationFilter.value.trim().toLowerCase(); // Now works with <select>
        const maxPrice = parseFloat(priceRange.value);
        currentResults = [];
        defaultResults = [];
        displayedCount = 0;
    
        const formData = new FormData();
        formData.append('image', imageUpload.files[0]);
        formData.append('location', location);
        formData.append('max_price', maxPrice);
        
        fetch('/search-by-image', {
            method: 'POST',
            body: formData  // Send FormData directly, don't stringify it
            // Don't set Content-Type header - the browser will set it automatically with the boundary
        });
        
        fetch('/search-by-image', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            resultMessage.textContent = '';
            defaultResults = data.results || [];
            currentResults = sortResults(sortSelect.value);
    
            if (currentResults.length === 0) {
                resultMessage.textContent = 'No suppliers found for this image.';
                marketStats.innerHTML = '<p class="result-message">No suppliers match the image.</p>';
                return;
            }
    
            loadMarketSummary(currentResults);
            renderCards(currentResults, 0, initialLoad);
        })
        .catch(error => {
            console.error('Error:', error);
            resultMessage.textContent = 'Error processing the image.';
            resultGrid.innerHTML = '';
            marketStats.innerHTML = '';
            currentResults = [];
            defaultResults = [];
        });
    }
});
