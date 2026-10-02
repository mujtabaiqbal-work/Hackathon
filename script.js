// ==========================================
// CareRoute - FRONTEND + MUJTABA API
// ==========================================

const API_BASE_URL = "https://hackathon-9gzp.vercel.app/api";


// ==========================================
// PAGE NAVIGATION
// ==========================================

function openPage(pageId) {

    const frontPage = document.getElementById("frontPage");
    const app = document.getElementById("app");

    // Hide front page
    if (frontPage) {
        frontPage.classList.remove("active");
        frontPage.style.display = "none";
    }

    // Show application
    if (app) {
        app.classList.remove("hidden");
        app.style.display = "flex";
    }

    // Hide all pages
    document.querySelectorAll(".page").forEach(function(page) {
        page.classList.remove("active");
    });

    // Show selected page
    const selectedPage = document.getElementById(pageId);

    if (selectedPage) {
        selectedPage.classList.add("active");
    }

    updateTopbar(pageId);

    // Load API data when page opens
    if (pageId === "dashboard") {
        loadDashboard();
    }

    if (pageId === "status") {
        loadRequests();
    }

    if (pageId === "capacity") {
        loadCapacityHospitals();
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// ==========================================
// BACK TO HOME
// ==========================================

function goHome() {

    const app = document.getElementById("app");
    const frontPage = document.getElementById("frontPage");

    if (app) {
        app.style.display = "none";
        app.classList.add("hidden");
    }

    if (frontPage) {
        frontPage.style.display = "flex";
        frontPage.classList.add("active");
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// ==========================================
// TOPBAR
// ==========================================

function updateTopbar(pageId) {

    const titles = {

        dashboard: "Dashboard",
        search: "Find Hospital",
        admission: "Patient Admission",
        status: "My Requests",
        capacity: "Hospital Capacity"

    };

    const titleElement =
        document.getElementById("topbarTitle");

    if (titleElement) {
        titleElement.textContent =
            titles[pageId] || "CareRoute";
    }
}


// ==========================================
// 1. FIND HOSPITAL
// GET /api/hospitals
// ==========================================

async function searchHospitals() {

    const resourceType =
        document.getElementById("resourceType").value;
        const resourceMap = {
    "ICU": "icuBeds",
    "General Bed": "generalBeds",
    "Ventilator": "ventilators"
};

const apiResourceType =
    resourceMap[resourceType] || "icuBeds";

    const searchResults =
        document.getElementById("searchResults");

    searchResults.innerHTML = `
        <div class="loading-message">
            Finding suitable hospitals...
        </div>
    `;

    try {

        const response = await fetch(
            `${API_BASE_URL}/hospitals?resourceType=${apiResourceType}`
        );

        const hospitals = await response.json();

        if (!hospitals || hospitals.length === 0) {

            searchResults.innerHTML = `
                <div class="empty-state">
                    <h2>No hospitals found</h2>
                    <p>No hospital currently matches this requirement.</p>
                </div>
            `;

            return;
        }


        searchResults.innerHTML = hospitals.map(hospital => {

            const resource =
                hospital.capacity?.[resourceType];

            const available =
                resource?.available ?? 0;

            const matchScore =
                hospital.matchScore ?? 0;

           const image = "";

            const status =
                available > 0
                    ? "Available for your requirement"
                    : "Currently unavailable";

            const statusClass =
                available > 0
                    ? "hospital-status"
                    : "hospital-status unavailable";


            return `

                <div class="hospital-result-card">

                    <!-- Hospital Main Gate Image -->
                   


                    <div class="hospital-details">

                        <!-- Name + Match -->
                        <div class="hospital-title-row">

                            <div class="hospital-title">
                                ${hospital.name}
                            </div>

                            <div class="match-badge">
                                ${matchScore}% Match
                            </div>

                        </div>


                        <!-- Location -->
                        <div class="hospital-location">
                            📍 ${hospital.location}
                        </div>


                        <!-- Hospital Resources -->
                        <div class="hospital-info-grid">

                            <div class="hospital-info-box">

                                <strong>
                                    ${hospital.capacity?.icuBeds?.available ?? 0}
                                </strong>

                                <span>
                                    ICU Beds
                                </span>

                            </div>


                            <div class="hospital-info-box">

                                <strong>
                                    ${hospital.capacity?.generalBeds?.available ?? 0}
                                </strong>

                                <span>
                                    General Beds
                                </span>

                            </div>


                            <div class="hospital-info-box">

                                <strong>
                                    ${hospital.capacity?.emergencyBeds?.available ?? 0}
                                </strong>

                                <span>
                                    Emergency Beds
                                </span>

                            </div>


                            <div class="hospital-info-box">

                                <strong>
                                    ${hospital.capacity?.ventilators?.available ?? 0}
                                </strong>

                                <span>
                                    Ventilators
                                </span>

                            </div>

                        </div>


                        <!-- Distance + Travel -->
                        <div class="hospital-meta">

                            <span>
                                📏
                                ${hospital.distanceKm ?? "—"} km away
                            </span>

                            <span>
                                🚗
                                ${hospital.travelTimeMins ?? "—"} min travel
                            </span>

                            <span>
                                🕒
                                Updated
                                ${hospital.lastUpdatedMinutesAgo ?? "—"}
                                min ago
                            </span>

                        </div>


                        <!-- Availability -->
                        <div class="${statusClass}">
                            ${available > 0 ? "🟢" : "🔴"}
                            ${status}
                        </div>


                        <!-- Select Button -->
                        ${
                            available > 0
                                ? `
                                    <button
                                        class="hospital-action"
                                        onclick="selectHospital('${hospital._id}', '${hospital.name}')">

                                        Select This Hospital →

                                    </button>
                                  `
                                : ""
                        }

                    </div>

                </div>

            `;

        }).join("");


    } catch (error) {

        console.error(
            "Hospital search error:",
            error
        );

        searchResults.innerHTML = `
            <div class="empty-state">

                <h2>Unable to load hospitals</h2>

                <p>
                    Please make sure the MediMatch backend
                    is running.
                </p>

            </div>
        `;
    }
}
  
// ==========================================
// RENDER HOSPITAL RESULTS
// ==========================================

function renderHospitals(
    hospitals,
    apiResource,
    displayResource
) {

    const container =
        document.getElementById("searchResults");

    if (!container) {
        return;
    }


    if (!hospitals || hospitals.length === 0) {

        container.innerHTML = `
            <div class="empty-state">

                <div>🏥</div>

                <h3>
                    No hospitals found
                </h3>

                <p>
                    No hospital data is currently available.
                </p>

            </div>
        `;

        return;
    }


    // Show all hospitals returned by API
    container.innerHTML = hospitals.map(function(hospital) {

        const capacity =
            hospital.capacity &&
            hospital.capacity[apiResource];

        const available =
            capacity
                ? capacity.available
                : 0;


        const matchScore =
            hospital.matchScore !== undefined
                ? hospital.matchScore
                : 0;


        const staleClass =
            hospital.isStale
                ? "stale"
                : "fresh";


        const freshnessText =
            hospital.isStale
                ? "⚠ May be outdated"
                : "✓ Fresh";


        const suitableText =
            hospital.isSuitable
                ? "Suitable"
                : "Currently unavailable";


        return `

            <div class="hospital-card">

                <div class="hospital-card-top">

                    <div>

                        <h3>
                            ${hospital.name}
                        </h3>

                        <p>
                            ${hospital.location}
                        </p>

                    </div>


                    <div class="match-score">

                        ${matchScore}%

                        <span>
                            Match
                        </span>

                    </div>

                </div>


                <div class="hospital-details">

                    <div>

                        <strong>
                            ${available}
                        </strong>

                        <span>
                            Available
                        </span>

                    </div>


                    <div>

                        <strong>
                            ${hospital.distanceKm}
                            km
                        </strong>

                        <span>
                            Distance
                        </span>

                    </div>


                    <div>

                        <strong>
                            ${hospital.travelTimeMins}
                            min
                        </strong>

                        <span>
                            Travel Time
                        </span>

                    </div>

                </div>


                <div class="hospital-footer">

                    <span class="${staleClass}">

                        ${freshnessText}

                    </span>


                    <span>

                        Updated
                        ${hospital.lastUpdatedMinutesAgo}
                        min ago

                    </span>


                    <span>

                        ${suitableText}

                    </span>


                    ${
                        hospital.isSuitable
                        ?

                        `<button
                            onclick="selectHospital(
                                '${hospital._id}',
                                '${escapeHtml(hospital.name)}',
                                '${apiResource}'
                            )">
                            Select Hospital
                        </button>`

                        :

                        `<button
                            disabled
                            style="opacity:0.5;cursor:not-allowed;">
                            Not Available
                        </button>`
                    }

                </div>

            </div>

        `;

    }).join("");
}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHtml(text) {

    return String(text)

        .replace(/&/g, "&amp;")

        .replace(/'/g, "\\'")

        .replace(/"/g, "&quot;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;");
}


// ==========================================
// 2. SELECT HOSPITAL
// POST /api/requests
// ==========================================

async function selectHospital(
    hospitalId,
    hospitalName,
    resourceType
) {

    // Patient information from admission form
    const patientNameElement =
        document.getElementById("patientName");

    const requirementElement =
        document.getElementById("patientRequirement");


    const patientName =
        patientNameElement &&
        patientNameElement.value.trim()
            ? patientNameElement.value.trim()
            : "Emergency Patient";


    const condition =
        requirementElement &&
        requirementElement.value.trim()
            ? requirementElement.value.trim()
            : "Emergency medical care";


    // Emergency requests are treated as CRITICAL
    const urgency = "CRITICAL";


    try {

        const response = await fetch(
            `${API_BASE_URL}/requests`,
            {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    patientName: patientName,

                    condition: condition,

                    urgency: urgency,

                    requiredResource: resourceType,

                    hospitalId: hospitalId

                })

            }
        );


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Request creation failed"
            );
        }


        alert(

            "Request sent successfully!\n\n" +

            "Hospital: " +
            hospitalName +

            "\nRequest ID: " +
            data._id

        );


        // Open My Requests
        openPage("status");

        loadRequests();

    }


    catch (error) {

        console.error(
            "Request API Error:",
            error
        );


        alert(

            "Unable to send request.\n\n" +

            error.message

        );
    }
}


// ==========================================
// 3. PATIENT ADMISSION
// ==========================================

const admissionForm =
    document.getElementById("admissionForm");


if (admissionForm) {

    admissionForm.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            const patientName =
                document
                    .getElementById("patientName")
                    ?.value.trim();


            const age =
                document
                    .getElementById("patientAge")
                    ?.value;


            const gender =
                document
                    .getElementById("patientGender")
                    ?.value;


            const phone =
                document
                    .getElementById("patientPhone")
                    ?.value;


            const requirement =
                document
                    .getElementById("patientRequirement")
                    ?.value.trim();


            const result =
                document.getElementById(
                    "admissionResult"
                );


            if (result) {

                result.innerHTML = `

                    <div class="success-card">

                        <h3>
                            ✓ Patient Information Saved
                        </h3>


                        <p>
                            Patient:
                            <strong>
                                ${patientName}
                            </strong>
                        </p>


                        <p>
                            Age:
                            <strong>
                                ${age}
                            </strong>
                        </p>


                        <p>
                            Gender:
                            <strong>
                                ${gender}
                            </strong>
                        </p>


                        <p>
                            Requirement:
                            <strong>
                                ${requirement}
                            </strong>
                        </p>


                        <p>
                            Your information is ready.
                            Now use
                            <strong>
                                Find Hospital
                            </strong>
                            to find a suitable hospital.
                        </p>

                    </div>

                `;
            }


            // Save patient data temporarily
            localStorage.setItem(
                "CareRoutePatient",
                JSON.stringify({

                    patientName: patientName,

                    age: age,

                    gender: gender,

                    phone: phone,

                    requirement: requirement

                })
            );

        }
    );
}


// ==========================================
// 4. MY REQUESTS
// GET /api/requests
// ==========================================

async function loadRequests() {

    const container =
        document.getElementById(
            "status"
        );


    if (!container) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/requests`
            );


        if (!response.ok) {
            throw new Error(
                "Request API failed"
            );
        }


        const requests =
            await response.json();


        renderRequests(requests);

    }


    catch (error) {

        console.error(
            "Requests API Error:",
            error
        );

        showRequestError();
    }
}


// ==========================================
// RENDER REQUESTS
// ==========================================

function renderRequests(requests) {

    const statusPage =
        document.getElementById("status");


    if (!statusPage) {
        return;
    }


    // Find existing status-card
    const existingCard =
        statusPage.querySelector(".status-card");


    if (!existingCard) {
        return;
    }


    if (!requests || requests.length === 0) {

        existingCard.innerHTML = `

            <div class="empty-state">

                <div>📋</div>

                <h3>
                    No requests yet
                </h3>

                <p>
                    Your hospital requests
                    will appear here.
                </p>

            </div>

        `;

        return;
    }


    // Latest request
    const request =
        requests[requests.length - 1];


    existingCard.innerHTML = `

        <div class="status-top">

            <div>

                <span class="small-label">
                    REQUEST ID
                </span>

                <h2>
                    ${request._id}
                </h2>

            </div>


            <span class="status-badge pending">

                ${request.status}

            </span>

        </div>


        <div class="request-details">

            <div>

                <span>
                    Patient
                </span>

                <strong>
                    ${request.patientName}
                </strong>

            </div>


            <div>

                <span>
                    Resource
                </span>

                <strong>
                    ${request.requiredResource}
                </strong>

            </div>


            <div>

                <span>
                    Urgency
                </span>

                <strong>
                    ${request.urgency}
                </strong>

            </div>

        </div>


        <div class="tracker">

            <div class="tracker-step done">

                <div class="tracker-circle">
                    ✓
                </div>

                <span>
                    Request Created
                </span>

            </div>


            <div class="tracker-line"></div>


            <div class="tracker-step current">

                <div class="tracker-circle">
                    2
                </div>

                <span>
                    Hospital Reviewing
                </span>

            </div>


            <div class="tracker-line"></div>


            <div class="tracker-step">

                <div class="tracker-circle">
                    3
                </div>

                <span>
                    Accepted
                </span>

            </div>


            <div class="tracker-line"></div>


            <div class="tracker-step">

                <div class="tracker-circle">
                    4
                </div>

                <span>
                    Completed
                </span>

            </div>

        </div>

    `;
}


// ==========================================
// REQUEST ERROR
// ==========================================

function showRequestError() {

    const statusPage =
        document.getElementById("status");


    if (!statusPage) {
        return;
    }


    const existingCard =
        statusPage.querySelector(".status-card");


    if (existingCard) {

        existingCard.innerHTML = `

            <div class="empty-state">

                <div>⚠️</div>

                <h3>
                    Unable to load requests
                </h3>

                <p>
                    Please make sure Mujtaba's
                    backend is running on port 5001.
                </p>

            </div>

        `;
    }
}


// ==========================================
// 5. HOSPITAL CAPACITY
// LOAD HOSPITALS
// ==========================================

async function loadCapacityHospitals() {

    const select =
        document.getElementById(
            "hospitalName"
        );


    if (!select) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/hospitals?resourceType=icuBeds`
            );


        if (!response.ok) {
            throw new Error(
                "Hospital API failed"
            );
        }


        const hospitals =
            await response.json();


        select.innerHTML = `

            <option value="">
                Select Hospital
            </option>

        `;


        hospitals.forEach(
            function(hospital) {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    hospital._id;


                option.textContent =
                    hospital.name;


                select.appendChild(option);

            }
        );

    }


    catch (error) {

        console.error(
            "Capacity hospital loading error:",
            error
        );

    }
}


// ==========================================
// UPDATE HOSPITAL CAPACITY
// POST /api/hospitals/:id/capacity
// ==========================================

async function updateCapacity(
    hospitalId,
    resourceType,
    delta
) {

    if (!hospitalId) {

        alert(
            "Please select a hospital first."
        );

        return;
    }


    try {

        const response =
            await fetch(

                `${API_BASE_URL}/hospitals/${hospitalId}/capacity`,

                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body: JSON.stringify({

                        resourceType:
                            resourceType,

                        delta:
                            Number(delta)

                    })

                }

            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(

                data.error ||
                "Capacity update failed"

            );
        }


        alert(

            "Capacity updated successfully!\n\n" +

            resourceType +

            ": " +

            data.updatedAvailable +

            " available"

        );


        loadCapacityHospitals();

    }


    catch (error) {

        console.error(
            "Capacity API Error:",
            error
        );


        alert(

            "Unable to update capacity.\n\n" +

            error.message

        );
    }
}


// ==========================================
// CAPACITY FORM
// ==========================================

const capacityForm =
    document.getElementById(
        "capacityForm"
    );


if (capacityForm) {

    capacityForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const hospitalSelect =
                document.getElementById(
                    "hospitalName"
                );


            const hospitalId =
                hospitalSelect?.value;


            if (!hospitalId) {

                alert(
                    "Please select a hospital."
                );

                return;
            }


            const icu =
                Number(
                    document.getElementById(
                        "icuBeds"
                    )?.value || 0
                );


            const general =
                Number(
                    document.getElementById(
                        "generalBeds"
                    )?.value || 0
                );


            const emergency =
                Number(
                    document.getElementById(
                        "emergencyBeds"
                    )?.value || 0
                );


            const ventilators =
                Number(
                    document.getElementById(
                        "ventilators"
                    )?.value || 0
                );


            try {

                // Update ICU
                if (icu !== 0) {

                    await updateCapacity(
                        hospitalId,
                        "icuBeds",
                        icu
                    );

                }


                // Update General Beds
                if (general !== 0) {

                    await updateCapacity(
                        hospitalId,
                        "generalBeds",
                        general
                    );

                }


                // Update Emergency Beds
                if (emergency !== 0) {

                    await updateCapacity(
                        hospitalId,
                        "emergencyBeds",
                        emergency
                    );

                }


                // Update Ventilators
                if (ventilators !== 0) {

                    await updateCapacity(
                        hospitalId,
                        "ventilators",
                        ventilators
                    );

                }


                const result =
                    document.getElementById(
                        "capacityResult"
                    );


                if (result) {

                    result.innerHTML = `

                        <div class="success-card">

                            <h3>
                                ✓ Capacity Updated
                            </h3>

                            <p>
                                Hospital resource
                                information has been
                                sent to the CareRoute API.
                            </p>

                        </div>

                    `;

                }

            }


            catch (error) {

                console.error(
                    "Capacity form error:",
                    error
                );

            }

        }
    );
}


// ==========================================
// 6. DASHBOARD
// GET /api/dashboard/analytics
// ==========================================

async function loadDashboard() {

    try {

        const response =
            await fetch(
                `${API_BASE_URL}/dashboard/analytics`
            );


        if (!response.ok) {

            throw new Error(
                "Dashboard API failed"
            );

        }


        const data =
            await response.json();


        console.log(
            "Dashboard API:",
            data
        );


        // These IDs don't currently exist
        // in your HTML, so create/use them
        // only if available.

        const totalPatients =
            document.getElementById(
                "totalPatients"
            );


        const activeRequests =
            document.getElementById(
                "activeRequests"
            );


        const availableHospitals =
            document.getElementById(
                "availableHospitals"
            );


        const emergencyRequests =
            document.getElementById(
                "emergencyRequests"
            );


        // Available hospitals
        if (availableHospitals) {

            availableHospitals.textContent =
                data.verifiedFacilities ??
                data.totalFacilities ??
                0;

        }


        // Active requests
        if (activeRequests) {

            activeRequests.textContent =
                data.recentAuditLogs
                    ? data.recentAuditLogs.length
                    : 0;

        }


        // Patients and emergency requests
        // are NOT provided by Mujtaba's
        // dashboard analytics API.

        if (totalPatients) {

            totalPatients.textContent =
                "—";

        }


        if (emergencyRequests) {

            emergencyRequests.textContent =
                "—";

        }


        // Update dashboard availability text
        updateDashboardAvailability(
            data
        );

    }


    catch (error) {

        console.error(
            "Dashboard API Error:",
            error
        );

    }
}


// ==========================================
// UPDATE DASHBOARD AVAILABILITY
// ==========================================

function updateDashboardAvailability(data) {

    const availabilityItems =
        document.querySelectorAll(
            ".availability-item"
        );


    if (!availabilityItems.length) {
        return;
    }


    // ICU
    if (availabilityItems[0]) {

        const strong =
            availabilityItems[0]
                .querySelector("strong");


        if (strong) {

            strong.textContent =
                `${data.cityAvailableICUBeds ?? 0} available`;

        }

    }


    // General beds
    if (availabilityItems[1]) {

        const strong =
            availabilityItems[1]
                .querySelector("strong");


        if (strong) {

            strong.textContent =
                "Live data unavailable";

        }

    }


    // Emergency beds
    if (availabilityItems[2]) {

        const strong =
            availabilityItems[2]
                .querySelector("strong");


        if (strong) {

            strong.textContent =
                "Live data unavailable";

        }

    }

}


// ==========================================
// STARTUP
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        console.log(
            "✓ CareRoute frontend loaded"
        );

        console.log(
            "✓ API:",
            API_BASE_URL
        );

    }
);
