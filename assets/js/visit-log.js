document.addEventListener('DOMContentLoaded', () => {
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    const studentFilter = document.getElementById('studentFilter');
    const collegeFilter = document.getElementById('collegeFilter');
    const courseFilter = document.getElementById('courseFilter');
    const filterBtn = document.getElementById('filterBtn');
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    const visitLogTableBody = document.getElementById('visitLogTableBody');
    const pagination = document.getElementById('pagination');

    let currentPage = 1;
    const itemsPerPage = 10;
    let visits = [];
    let colleges = [];
    let courses = [];

    loadCatalog().then(catalog => {
        colleges = catalog.colleges;
        courses = catalog.courses;
        populateCollegeSelect();
        updateCourseFilter();
        loadVisitLog();
        loadStudents();
    }).catch(handleError);

    // Set default date range (last 7 days)
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    function setDefaultDates() {
        startDate.value = lastWeek.toISOString().split('T')[0];
        endDate.value = today.toISOString().split('T')[0];
    }

    function resetFilters() {
        setDefaultDates();
        studentFilter.value = '';
        collegeFilter.value = '';
        updateCourseFilter();
        currentPage = 1;
        loadVisitLog();
    }

    // Set initial dates
    setDefaultDates();

    // Event Listeners
    filterBtn.addEventListener('click', loadVisitLog);
    resetFiltersBtn.addEventListener('click', resetFilters);
    collegeFilter.addEventListener('change', updateCourseFilter);

    // Functions
    async function loadVisitLog() {
        try {
            const params = new URLSearchParams({
                startDate: startDate.value,
                endDate: endDate.value,
                studentId: studentFilter.value,
                course: courseFilter.value,
                limit: itemsPerPage,
                offset: (currentPage - 1) * itemsPerPage
            });

            const response = await apiFetch(`${API_ENDPOINTS.visits.list}?${params}`);
            const data = await response.json();

            if (response.ok) {
                visits = data.data;
                renderTable();
                renderPagination(data.total);
            } else {
                throw new Error(data.message || 'Failed to load visit log');
            }
        } catch (error) {
            console.error('Error loading visit log:', error);
            showToast(error.message, 'error');
        }
    }

    async function loadStudents() {
        try {
            const response = await apiFetch(API_ENDPOINTS.students.list);
            const data = await response.json();

            if (response.ok) {
                // Clear existing options
                studentFilter.innerHTML = '<option value="">All Students</option>';

                // Add student options
                data.data.forEach(student => {
                    const option = new Option(
                        `${student.first_name} ${student.last_name}`,
                        student.student_id
                    );
                    studentFilter.add(option);
                });
            } else {
                throw new Error(data.message || 'Failed to load students');
            }
        } catch (error) {
            handleError(error);
        }
    }

    function renderTable() {
        visitLogTableBody.innerHTML = '';

        visits.forEach(visit => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatDate(visit.check_in_date)}</td>
                <td>${formatTime(visit.check_in_time)}</td>
                <td>${visit.first_name} ${visit.last_name}</td>
                <td>${visit.course || '-'}</td>
                <td>${visit.year_level || '-'} - ${visit.section || '-'}</td>
            `;
            visitLogTableBody.appendChild(row);
        });
    }

    function populateCollegeSelect() {
        colleges.forEach(college => collegeFilter.add(new Option(college.name, college.college_id)));
    }

    function updateCourseFilter() {
        const filteredCourses = collegeFilter.value
            ? courses.filter(course => String(course.college_id) === collegeFilter.value)
            : courses;
        courseFilter.innerHTML = '<option value="">All Courses</option>';
        filteredCourses.forEach(course => courseFilter.add(new Option(course.name, course.name)));
    }

    function renderPagination(totalItems) {
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        pagination.innerHTML = '';

        if (totalPages <= 1) return;

        // Previous button
        const prevButton = document.createElement('button');
        prevButton.textContent = 'Previous';
        prevButton.className = 'pagination-btn';
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                loadVisitLog();
            }
        });
        pagination.appendChild(prevButton);

        // Page numbers
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);
        
        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }

        if (startPage > 1) {
            pagination.appendChild(createPageButton(1));
            if (startPage > 2) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.className = 'pagination-ellipsis';
                pagination.appendChild(ellipsis);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            pagination.appendChild(createPageButton(i));
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.className = 'pagination-ellipsis';
                pagination.appendChild(ellipsis);
            }
            pagination.appendChild(createPageButton(totalPages));
        }

        // Next button
        const nextButton = document.createElement('button');
        nextButton.textContent = 'Next';
        nextButton.className = 'pagination-btn';
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                loadVisitLog();
            }
        });
        pagination.appendChild(nextButton);
    }

    function createPageButton(pageNum) {
        const pageButton = document.createElement('button');
        pageButton.textContent = pageNum;
        pageButton.className = 'pagination-btn' + (pageNum === currentPage ? ' active' : '');
        pageButton.addEventListener('click', () => {
            if (currentPage !== pageNum) {
                currentPage = pageNum;
                loadVisitLog();
            }
        });
        return pageButton;
    }

    // Helper functions
    function formatDate(dateStr) {
        return new Date(dateStr).toLocaleDateString();
    }

    function formatTime(timeStr) {
        return new Date(`1970-01-01T${timeStr}`).toLocaleTimeString();
    }
}); 