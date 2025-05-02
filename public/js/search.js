document.addEventListener('DOMContentLoaded', function() {
    const searchForm = document.getElementById('searchForm');
    const priceRangeSelect = document.querySelector('select[name="priceRange"]');

    if (priceRangeSelect) {
        priceRangeSelect.addEventListener('change', function() {
            const minPriceInput = document.getElementById('minPrice');
            const maxPriceInput = document.getElementById('maxPrice');

            const range = this.value.split('-');
            if (range.length === 2) {
                minPriceInput.value = range[0];
                maxPriceInput.value = range[1];
            } else if (this.value === '100+') {
                minPriceInput.value = '100';
                maxPriceInput.value = '1000';
            } else {
                minPriceInput.value = '';
                maxPriceInput.value = '';
            }
        });
    }

    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const searchParams = new URLSearchParams();
            
            for(let [key, value] of formData.entries()) {
                if(value) {
                    searchParams.append(key, value);
                }
            }
            window.location.href = '/search-tutors?' + searchParams.toString();
        });
    }
    const filterForm = document.getElementById('filterForm');
    if (filterForm) {
        filterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const searchParams = new URLSearchParams();
            
            for(let [key, value] of formData.entries()) {
                if(value) {
                    searchParams.append(key, value);
                }
            }
            window.location.href = '/search-tutors?' + searchParams.toString();
        });
    }
}); 