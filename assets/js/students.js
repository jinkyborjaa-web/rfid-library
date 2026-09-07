document.addEventListener('DOMContentLoaded', () => {
    const studentModal = document.getElementById('studentModal');
    const studentForm = document.getElementById('studentForm');
    const addStudentBtn = document.getElementById('addStudentBtn');
    const closeBtn = document.querySelector('.close-btn');
    const cancelBtn = document.getElementById('cancelBtn');
    const searchInput = document.getElementById('searchInput');
    const collegeFilter = document.getElementById('collegeFilter');
    const courseFilter = document.getElementById('courseFilter');
    const yearFilter = document.getElementById('yearFilter');
    const sectionFilter = document.getElementById('sectionFilter');
    const studentsTableBody = document.getElementById('studentsTableBody');
    const pagination = document.getElementById('pagination');
    const collegeSelect = document.getElementById('college');
    const courseSelect = document.getElementById('course');

    let currentPage = 1;
    const itemsPerPage = 10;
    let students = [];
    let filteredStudents = [];
    let colleges = [];
    let courses = [];

    loadCatalog().then(catalog => {
        colleges = catalog.colleges;
        courses = catalog.courses;
        populateCollegeSelect(collegeSelect, 'Select College');
        populateCollegeSelect(collegeFilter, 'All Colleges');
        updateCourseOptions(collegeFilter, courseFilter, 'All Courses');
        updateCourseOptions(collegeSelect, courseSelect, 'Select College First');
        loadStudents();
    }).catch(handleError);

    // Event Listeners
    addStudentBtn.addEventListener('click', () => {
        openModal();
    });

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    collegeSelect.addEventListener('change', () => updateCourseOptions(collegeSelect, courseSelect, 'Select Course'));

    studentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(studentForm);
        const studentData = Object.fromEntries(formData.entries());

        try {
            const isEditing = studentForm.dataset.editing === 'true';
            const url = isEditing 
                ? API_ENDPOINTS.students.update(studentForm.dataset.studentId)
                : API_ENDPOINTS.students.create;
            
            const response = await apiFetch(url, {
                method: isEditing ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(studentData)
            });

            const data = await response.json();

            if (response.ok) {
                showToast(isEditing ? 'Student updated successfully' : 'Student added successfully');
                closeModal();
                loadStudents();
            } else {
                throw new Error(data.message || 'Failed to save student');
            }
        } catch (error) {
            handleError(error);
        }
    });

    // Search and Filter Event Listeners
    searchInput.addEventListener('input', () => loadStudents({ refreshFilters: false }));
    collegeFilter.addEventListener('change', () => {
        updateCourseOptions(collegeFilter, courseFilter, 'All Courses');
        loadStudents({ refreshFilters: false });
    });
    courseFilter.addEventListener('change', () => loadStudents({ refreshFilters: false }));
    yearFilter.addEventListener('change', () => loadStudents({ refreshFilters: false }));
    sectionFilter.addEventListener('change', () => loadStudents({ refreshFilters: false }));

    // Functions
    async function loadStudents({ refreshFilters = true } = {}) {
        try {
            const params = new URLSearchParams({
                search: searchInput.value.trim(),
                course: collegeFilter.value ? courseFilter.value : courseFilter.value,
                year: yearFilter.value,
                section: sectionFilter.value
            });
            const response = await apiFetch(`${API_ENDPOINTS.students.list}?${params}`);
            const data = await response.json();

            if (response.ok) {
                students = data.data;
                if (refreshFilters) loadFilters();
                filterStudents(); // Apply initial filtering
            } else {
                throw new Error(data.message || 'Failed to load students');
            }
        } catch (error) {
            handleError(error);
        }
    }

    function loadFilters() {
        updateCourseOptions(collegeFilter, courseFilter, 'All Courses');

        // Update year filter
        yearFilter.innerHTML = `
            <option value="">All Years</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
        `;

        // Update section filter
        sectionFilter.innerHTML = `
            <option value="">All Sections</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
        `;
    }

    function filterStudents() {
        const searchTerm = searchInput.value.toLowerCase();
        const collegeValue = collegeFilter.value;
        const courseValue = courseFilter.value;
        const yearValue = yearFilter.value;
        const sectionValue = sectionFilter.value;

        filteredStudents = students.filter(student => {
            const matchesSearch = 
                (student.first_name && student.first_name.toLowerCase().includes(searchTerm)) ||
                (student.last_name && student.last_name.toLowerCase().includes(searchTerm)) ||
                (student.rfid_number && student.rfid_number.toLowerCase().includes(searchTerm));
            
            const matchesCourse = !courseValue || student.course === courseValue;
            const matchesCollege = !collegeValue || courses.some(course => String(course.college_id) === collegeValue && course.name === student.course);
            const matchesYear = !yearValue || student.year_level === yearValue;
            const matchesSection = !sectionValue || student.section === sectionValue;

            return matchesSearch && matchesCollege && matchesCourse && matchesYear && matchesSection;
        });

        currentPage = 1;
        renderTable();
        renderPagination();
    }

    function renderTable() {
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const paginatedStudents = filteredStudents.slice(start, end);

        studentsTableBody.innerHTML = '';

        paginatedStudents.forEach(student => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${student.rfid_number}</td>
                <td>${student.first_name} ${student.last_name}</td>
                <td>${student.course || '-'}</td>
                <td>${student.year_level || '-'}</td>
                <td>${student.section || '-'}</td>
                <td>
                    <div class="action-buttons">
                        <button onclick="editStudent(${student.student_id})" class="icon-button" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteStudent(${student.student_id})" class="icon-button" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            studentsTableBody.appendChild(row);
        });
    }

    function renderPagination() {
        const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
        pagination.innerHTML = '';

        if (totalPages <= 1) return;

        // Previous button
        const prevButton = document.createElement('button');
        prevButton.textContent = 'Previous';
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderTable();
                renderPagination();
            }
        });
        pagination.appendChild(prevButton);

        // Page buttons
        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i;
            pageButton.classList.toggle('active', i === currentPage);
            pageButton.addEventListener('click', () => {
                currentPage = i;
                renderTable();
                renderPagination();
            });
            pagination.appendChild(pageButton);
        }

        // Next button
        const nextButton = document.createElement('button');
        nextButton.textContent = 'Next';
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderTable();
                renderPagination();
            }
        });
        pagination.appendChild(nextButton);
    }

    function openModal(student = null) {
        studentForm.reset();
        collegeSelect.value = '';
        updateCourseOptions(collegeSelect, courseSelect, 'Select College First');
        if (student) {
            studentForm.dataset.editing = 'true';
            studentForm.dataset.studentId = student.student_id;
            Object.keys(student).forEach(key => {
                const input = studentForm.elements[key];
                if (input) input.value = student[key];
            });
            const matchedCollege = colleges.find(college => courses.some(course => course.college_id === college.college_id && course.name === student.course));
            if (matchedCollege) {
                collegeSelect.value = matchedCollege.college_id;
                updateCourseOptions(collegeSelect, courseSelect, 'Select Course');
                courseSelect.value = student.course;
            }
            document.getElementById('modalTitle').textContent = 'Edit Student';
        } else {
            studentForm.dataset.editing = 'false';
            delete studentForm.dataset.studentId;
            document.getElementById('modalTitle').textContent = 'Add Student';
        }
        studentModal.classList.add('active');
    }

    function closeModal() {
        studentModal.classList.remove('active');
    }

    function populateCollegeSelect(select, emptyLabel) {
        select.innerHTML = '';
        select.add(new Option(emptyLabel, ''));
        colleges.forEach(college => select.add(new Option(college.name, college.college_id)));
    }

    function updateCourseOptions(collegeSelectElement, courseSelectElement, emptyLabel, availableCourses = null) {
        const filteredCourses = availableCourses || (collegeSelectElement.value
            ? courses.filter(course => String(course.college_id) === collegeSelectElement.value)
            : courses);
        const previousValue = courseSelectElement.value;
        courseSelectElement.innerHTML = '';
        courseSelectElement.add(new Option(emptyLabel, ''));
        filteredCourses.forEach(course => courseSelectElement.add(new Option(course.name, course.name)));
        courseSelectElement.disabled = !collegeSelectElement.value && collegeSelectElement === collegeSelect;
        if (filteredCourses.some(course => course.name === previousValue)) courseSelectElement.value = previousValue;
    }

    // Global functions for table actions
    window.editStudent = async (studentId) => {
        try {
            const response = await apiFetch(API_ENDPOINTS.students.get(studentId));
            const data = await response.json();

            if (response.ok) {
                openModal(data.data);
            } else {
                throw new Error(data.message || 'Failed to load student data');
            }
        } catch (error) {
            handleError(error);
        }
    };

    window.deleteStudent = async (studentId) => {
        if (!confirm('Are you sure you want to delete this student?')) {
            return;
        }

        try {
            const response = await apiFetch(API_ENDPOINTS.students.delete(studentId), {
                method: 'DELETE'
            });

            const data = await response.json();

            if (response.ok) {
                showToast('Student deleted successfully');
                loadStudents();
            } else {
                throw new Error(data.message || 'Failed to delete student');
            }
        } catch (error) {
            handleError(error);
        }
    };
}); 