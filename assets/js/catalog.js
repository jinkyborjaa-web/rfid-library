async function loadCatalog() {
    const [collegeResponse, courseResponse] = await Promise.all([
        apiRequest(API_ENDPOINTS.colleges.list),
        apiRequest(API_ENDPOINTS.courses.list)
    ]);
    return { colleges: collegeResponse.data, courses: courseResponse.data };
}
