document.addEventListener('DOMContentLoaded', async () => {
    const message = document.getElementById('settingsMessage');
    const collegeList = document.getElementById('collegeList');
    const showMessage = (text, isError = false) => {
        message.className = `settings-message ${isError ? 'error' : 'success'}`;
        message.innerHTML = `<span class="settings-message-content"><i class="fas ${isError ? 'fa-circle-exclamation' : 'fa-circle-check'}"></i><span></span></span><button type="button" class="settings-message-close" aria-label="Dismiss message"><i class="fas fa-xmark"></i></button>`;
        message.querySelector('span span').textContent = text;
        message.querySelector('.settings-message-close').addEventListener('click', () => { message.className = 'settings-message'; message.innerHTML = ''; });
    };

    const setLoading = (button, loading) => {
        button.disabled = loading;
        button.setAttribute('aria-busy', String(loading));
    };

    async function loadProfile() {
        const response = await apiRequest(API_ENDPOINTS.auth.me);
        document.getElementById('profileUsername').value = response.data.username || '';
        document.getElementById('profileEmail').value = response.data.email || '';
    }

    async function loadColleges() {
        const response = await apiRequest(API_ENDPOINTS.colleges.list);
        collegeList.innerHTML = '';
        if (!response.data.length) {
            collegeList.innerHTML = '<div class="catalog-empty"><i class="fas fa-building-columns"></i><strong>No colleges added yet</strong><span>Add a college to start building your course catalog.</span></div>';
            return;
        }
        response.data.forEach(college => {
            const item = document.createElement('article');
            item.className = 'college-item';
            item.innerHTML = `<div class="college-heading"><button class="college-toggle" type="button" aria-expanded="false"><i class="fas fa-chevron-right"></i><strong></strong><span class="course-count"></span></button><button class="icon-button delete-college" type="button" title="Delete college"><i class="fas fa-trash"></i></button></div><div class="course-panel" hidden><form class="inline-form course-form"><input name="name" type="text" placeholder="New course name" required /><button class="scan-button" type="submit"><i class="fas fa-plus"></i> Add Course</button></form><div class="course-list"></div></div>`;
            item.querySelector('strong').textContent = college.name;
            item.querySelector('.course-count').textContent = `${college.courses?.length || 0} ${(college.courses?.length || 0) === 1 ? 'course' : 'courses'}`;
            const panel = item.querySelector('.course-panel');
            const toggle = item.querySelector('.college-toggle');
            toggle.addEventListener('click', () => {
                panel.hidden = !panel.hidden;
                toggle.setAttribute('aria-expanded', String(!panel.hidden));
                toggle.querySelector('i').classList.toggle('fa-rotate-90', !panel.hidden);
                if (!panel.hidden) loadCourses(college.college_id, panel.querySelector('.course-list'));
            });
            item.querySelector('.delete-college').addEventListener('click', async () => {
                if (!confirm(`Delete ${college.name}?`)) return;
                const button = item.querySelector('.delete-college'); setLoading(button, true);
                try { await apiRequest(API_ENDPOINTS.colleges.delete(college.college_id), 'DELETE'); showMessage('College deleted.'); loadColleges(); }
                catch (error) { showMessage(error.message, true); }
                finally { setLoading(button, false); }
            });
            item.querySelector('.course-form').addEventListener('submit', async event => {
                event.preventDefault();
                const button = event.currentTarget.querySelector('button'); setLoading(button, true);
                try { await apiRequest(API_ENDPOINTS.courses.create, 'POST', { college_id: college.college_id, name: new FormData(event.currentTarget).get('name') }); showMessage('Course added.'); event.currentTarget.reset(); loadCourses(college.college_id, item.querySelector('.course-list')); }
                catch (error) { showMessage(error.message, true); }
                finally { setLoading(button, false); }
            });
            collegeList.appendChild(item);
        });
    }

    async function loadCourses(collegeId, target) {
        const response = await apiRequest(`${API_ENDPOINTS.courses.list}?college_id=${collegeId}`);
        target.innerHTML = '';
        response.data.forEach(course => {
            const row = document.createElement('div');
            row.className = 'course-row';
            row.innerHTML = `<span></span><button class="icon-button" type="button" title="Delete course"><i class="fas fa-trash"></i></button>`;
            row.querySelector('span').textContent = course.name;
            row.querySelector('button').addEventListener('click', async () => {
                const button = row.querySelector('button'); setLoading(button, true);
                try { await apiRequest(API_ENDPOINTS.courses.delete(course.course_id), 'DELETE'); showMessage('Course deleted.'); loadCourses(collegeId, target); }
                catch (error) { showMessage(error.message, true); }
                finally { setLoading(button, false); }
            });
            target.appendChild(row);
        });
    }

    document.getElementById('profileForm').addEventListener('submit', async event => {
        event.preventDefault();
        document.querySelectorAll('.field-error').forEach(field => field.textContent = '');
        const button = event.currentTarget.querySelector('button'); setLoading(button, true);
        try { await apiRequest(API_ENDPOINTS.auth.updateProfile, 'PUT', Object.fromEntries(new FormData(event.currentTarget))); showMessage('Profile updated successfully'); }
        catch (error) { showMessage(error.message, true); if (error.fields) Object.entries(error.fields).forEach(([field, text]) => { const target = document.getElementById(`${field}Error`); if (target) target.textContent = text; }); }
        finally { setLoading(button, false); }
    });

    document.getElementById('passwordForm').addEventListener('submit', async event => {
        event.preventDefault();
        const form = event.currentTarget;
        const error = document.getElementById('passwordError');
        error.textContent = '';
        const data = Object.fromEntries(new FormData(form));
        if (data.newPassword !== data.confirmNewPassword) { error.textContent = 'New passwords do not match.'; return; }
        const button = form.querySelector('button'); setLoading(button, true);
        try { await apiRequest(API_ENDPOINTS.auth.changePassword, 'PUT', data); showMessage('Password changed successfully'); form.reset(); }
        catch (requestError) { showMessage(requestError.message, true); }
        finally { setLoading(button, false); }
    });

    document.getElementById('collegeForm').addEventListener('submit', async event => {
        event.preventDefault();
        const button = event.currentTarget.querySelector('button'); setLoading(button, true);
        try { await apiRequest(API_ENDPOINTS.colleges.create, 'POST', Object.fromEntries(new FormData(event.currentTarget))); showMessage('College added.'); event.currentTarget.reset(); loadColleges(); }
        catch (error) { showMessage(error.message, true); }
        finally { setLoading(button, false); }
    });

    document.querySelectorAll('.settings-password-toggle').forEach(toggle => toggle.addEventListener('click', () => {
        const input = toggle.parentElement.querySelector('input');
        const visible = input.type === 'password';
        input.type = visible ? 'text' : 'password';
        toggle.querySelector('i').className = `fas fa-eye${visible ? '-slash' : ''}`;
    }));
    const confirmPassword = document.getElementById('confirmNewPassword');
    const newPassword = document.getElementById('newPassword');
    const passwordError = document.getElementById('passwordError');
    const validateMatch = () => {
        const mismatch = confirmPassword.value && newPassword.value !== confirmPassword.value;
        confirmPassword.classList.toggle('input-error', mismatch);
        passwordError.textContent = mismatch ? 'Passwords do not match.' : '';
    };
    newPassword.addEventListener('input', validateMatch);
    confirmPassword.addEventListener('input', validateMatch);

    try { await loadProfile(); await loadColleges(); }
    catch (error) { showMessage(error.message, true); }
});
