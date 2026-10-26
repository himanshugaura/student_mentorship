

const API_BASE = window.location.origin && window.location.origin.startsWith("http")
  ? `${window.location.origin}/api`
  : "http://localhost:8080/api";
let currentUser = null;

window.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("mentorship_user");
  if (saved) {
    try {
      currentUser = JSON.parse(saved);
    } catch (e) {
      console.warn("Corrupt saved user session, clearing:", e);
      localStorage.removeItem("mentorship_user");
      currentUser = null;
    }

    if (currentUser) {
      try {
        renderApp();
      } catch (err) {
        console.error("Error rendering dashboard:", err);
      }
    }
  }
});

function switchAuthTab(tab) {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const tabLoginBtn = document.getElementById("tabLoginBtn");
  const tabRegisterBtn = document.getElementById("tabRegisterBtn");

  if (tab === "login") {
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
    tabLoginBtn.className = "flex-1 py-2 text-xs font-bold rounded-full transition-all bg-mint text-titanium-900 shadow-sm uppercase tracking-wider";
    tabRegisterBtn.className = "flex-1 py-2 text-xs font-bold rounded-full transition-all text-titanium-600 hover:text-titanium-900 uppercase tracking-wider";
  } else {
    loginForm.classList.add("hidden");
    registerForm.classList.remove("hidden");
    tabRegisterBtn.className = "flex-1 py-2 text-xs font-bold rounded-full transition-all bg-mint text-titanium-900 shadow-sm uppercase tracking-wider";
    tabLoginBtn.className = "flex-1 py-2 text-xs font-bold rounded-full transition-all text-titanium-600 hover:text-titanium-900 uppercase tracking-wider";
  }
}

function toggleRollNumberField() {
  const role = document.getElementById("regRole").value;
  const group = document.getElementById("rollNumberGroup");
  if (role === "STUDENT") {
    group.classList.remove("hidden");
  } else {
    group.classList.add("hidden");
  }
}

function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isPassword = input.type === "password";
  input.type = isPassword ? "text" : "password";

  if (isPassword) {
    
    btn.innerHTML = `
      <svg class="w-4 h-4 text-titanium-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"/>
      </svg>
    `;
    btn.title = "Hide Password";
  } else {
    
    btn.innerHTML = `
      <svg class="w-4 h-4 text-titanium-500 hover:text-titanium-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/>
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
      </svg>
    `;
    btn.title = "Show Password";
  }
}

function quickLogin(email, password) {
  document.getElementById("loginEmail").value = email;
  document.getElementById("loginPassword").value = password;
  handleLoginSubmit(new Event("submit"));
}

function setButtonLoading(btn, isLoading, loadingText = "Processing...") {
  if (!btn) return;
  if (isLoading) {
    if (btn.dataset.loading === "true") return false;
    btn.dataset.loading = "true";
    btn.dataset.originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.classList.add("opacity-60", "cursor-not-allowed", "pointer-events-none");
    btn.innerHTML = `
      <span class="inline-flex items-center justify-center gap-2">
        <svg class="animate-spin -ml-1 mr-1 h-3.5 w-3.5 text-current inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>${loadingText}</span>
      </span>
    `;
    return true;
  } else {
    btn.dataset.loading = "false";
    btn.disabled = false;
    btn.classList.remove("opacity-60", "cursor-not-allowed", "pointer-events-none");
    if (btn.dataset.originalHtml) {
      btn.innerHTML = btn.dataset.originalHtml;
    }
    return true;
  }
}

function renderLoadingState(text = "Loading data from server...") {
  return `
    <div class="flex flex-col items-center justify-center py-8 px-4 text-center space-y-3">
      <div class="w-7 h-7 rounded-full border-2 border-titanium-300 border-t-mint animate-spin"></div>
      <p class="text-xs font-bold text-titanium-600 tracking-wide uppercase">${escapeHtml(text)}</p>
    </div>
  `;
}

function renderTableLoadingState(colSpan = 6, text = "Loading records from server...") {
  return `
    <tr>
      <td colspan="${colSpan}" class="py-10 text-center">
        <div class="flex flex-col items-center justify-center space-y-3">
          <div class="w-7 h-7 rounded-full border-2 border-titanium-300 border-t-mint animate-spin"></div>
          <span class="text-xs font-bold text-titanium-600 tracking-wide uppercase">${escapeHtml(text)}</span>
        </div>
      </td>
    </tr>
  `;
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  clearErrors();

  const btn = event.submitter || document.getElementById("loginSubmitBtn") || (event.target && event.target.querySelector("button[type='submit']"));
  if (btn && btn.dataset.loading === "true") return;

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  let hasError = false;
  if (!email) {
    showError("loginEmailErr", "Email is required");
    hasError = true;
  } else if (!validateEmail(email)) {
    showError("loginEmailErr", "Please enter a valid email address");
    hasError = true;
  }

  if (!password) {
    showError("loginPasswordErr", "Password is required");
    hasError = true;
  }

  if (hasError) return;

  setButtonLoading(btn, true, "Signing in...");
  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || "Login failed", true);
      return;
    }

    currentUser = data.user || {
      id: data.userId,
      name: data.name,
      email: data.email,
      role: data.role,
      department: data.department,
      mentorId: data.mentorId,
      mentorName: data.mentorName
    };

    localStorage.setItem("mentorship_user", JSON.stringify(currentUser));

    if (window.PasswordCredential && navigator.credentials) {
      try {
        const cred = new PasswordCredential({
          id: email,
          password: password,
          name: currentUser.name
        });
        navigator.credentials.store(cred).catch(() => {});
      } catch (e) {}
    }

    showToast(`Welcome, ${currentUser.name}!`);
    renderApp();
  } catch (err) {
    showToast("Cannot connect to server at " + API_BASE + ". Ensure backend is running.", true);
  } finally {
    setButtonLoading(btn, false);
  }
}

async function handleRegisterSubmit(event) {
  event.preventDefault();
  clearErrors();

  const btn = event.submitter || document.getElementById("registerSubmitBtn") || (event.target && event.target.querySelector("button[type='submit']"));
  if (btn && btn.dataset.loading === "true") return;

  const name = document.getElementById("regName").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value.trim();
  const role = document.getElementById("regRole").value;
  const department = document.getElementById("regDept").value.trim();
  const phone = document.getElementById("regPhone").value.trim();
  const rollNumber = document.getElementById("regRoll").value.trim();

  let hasError = false;
  if (!name || name.length < 2) {
    showError("regNameErr", "Name must be at least 2 characters");
    hasError = true;
  }
  if (!email || !validateEmail(email)) {
    showError("regEmailErr", "Please enter a valid email address");
    hasError = true;
  }
  if (!password || password.length < 4) {
    showError("regPasswordErr", "Password must be at least 4 characters");
    hasError = true;
  }

  if (phone && !/^\d{10}$/.test(phone)) {
    showError("regPhoneErr", "Phone number must be exactly 10 digits");
    hasError = true;
  }

  if (role === "STUDENT") {
    if (!rollNumber) {
      showError("regRollErr", "Student ID is required");
      hasError = true;
    } else if (!/^\d{8}$/.test(rollNumber)) {
      showError("regRollErr", "Student ID must be exactly 8 digits (e.g. 24042824)");
      hasError = true;
    }
  }

  if (hasError) return;

  setButtonLoading(btn, true, "Creating Account...");
  try {
    const res = await fetch(`${API_BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role, department, phone, rollNumber })
    });

    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || "Registration failed", true);
      if (data.error && data.error.includes("Student ID")) {
        showError("regRollErr", data.error);
      }
      return;
    }

    showToast("Registration successful! Please sign in.");
    document.getElementById("registerForm").reset();
    switchAuthTab("login");
    document.getElementById("loginEmail").value = email;
  } catch (err) {
    showToast("Cannot connect to backend server.", true);
  } finally {
    setButtonLoading(btn, false);
  }
}

function logout() {
  currentUser = null;
  localStorage.removeItem("mentorship_user");
  renderApp();
  showToast("Logged out successfully");
}

function renderApp() {
  const authSection = document.getElementById("authSection");
  const dashboardSection = document.getElementById("dashboardSection");
  const navUserSection = document.getElementById("navUserSection");

  if (!currentUser) {
    authSection.classList.remove("hidden");
    dashboardSection.classList.add("hidden");
    navUserSection.classList.add("hidden");
    return;
  }

  authSection.classList.add("hidden");
  dashboardSection.classList.remove("hidden");
  navUserSection.classList.remove("hidden");

  
  document.getElementById("navUserName").textContent = currentUser.name || currentUser.email;
  document.getElementById("navUserRole").textContent = currentUser.role;
  document.getElementById("navUserDept").textContent = currentUser.department || "";

  renderRoleTabs();
}

function renderRoleTabs() {
  const tabsContainer = document.getElementById("roleTabs");
  tabsContainer.innerHTML = "";

  const role = (currentUser.role || "").toUpperCase();

  if (role === "STUDENT") {
    tabsContainer.innerHTML = `
      <button onclick="switchTab('studentGrievancesTab', this)" class="nav-tab pill-mint px-5 py-2 text-xs font-bold uppercase tracking-wider">
        My Grievances
      </button>
      <button onclick="switchTab('studentMeetingsTab', this)" class="nav-tab pill-btn px-5 py-2 text-xs font-bold uppercase tracking-wider text-titanium-600">
        Mentorship & Meetings
      </button>
    `;
    switchTab("studentGrievancesTab");
    loadStudentData();

  } else if (role === "MENTOR") {
    tabsContainer.innerHTML = `
      <button onclick="switchTab('mentorStudentsTab', this)" class="nav-tab pill-mint px-5 py-2 text-xs font-bold uppercase tracking-wider">
        Assigned Students
      </button>
      <button onclick="switchTab('mentorGrievancesTab', this)" class="nav-tab pill-btn px-5 py-2 text-xs font-bold uppercase tracking-wider text-titanium-600">
        Student Grievances
      </button>
      <button onclick="switchTab('mentorMeetingsTab', this)" class="nav-tab pill-btn px-5 py-2 text-xs font-bold uppercase tracking-wider text-titanium-600">
        Meeting Requests
      </button>
    `;
    switchTab("mentorStudentsTab");
    loadMentorData();

  } else if (role === "ADMIN") {
    tabsContainer.innerHTML = `
      <button onclick="switchTab('adminStatsTab', this)" class="nav-tab pill-mint px-5 py-2 text-xs font-bold uppercase tracking-wider">
        Overview & Complaints
      </button>
      <button onclick="switchTab('adminUsersTab', this)" class="nav-tab pill-btn px-5 py-2 text-xs font-bold uppercase tracking-wider text-titanium-600">
        User Directory
      </button>
    `;
    switchTab("adminStatsTab");
    loadAdminData();
  }
}

function switchTab(tabId, clickedBtn = null) {
  
  document.querySelectorAll(".dashboard-tab").forEach(tab => tab.classList.add("hidden"));
  const target = document.getElementById(tabId);
  if (target) target.classList.remove("hidden");

  
  document.querySelectorAll(".nav-tab").forEach(btn => {
    btn.className = "nav-tab pill-btn px-5 py-2 text-xs font-bold uppercase tracking-wider text-titanium-600";
  });

  if (clickedBtn && clickedBtn.classList && clickedBtn.classList.contains("nav-tab")) {
    clickedBtn.className = "nav-tab pill-mint px-5 py-2 text-xs font-bold uppercase tracking-wider";
  } else {
    
    const activeBtn = document.querySelector(`.nav-tab[onclick*="'${tabId}'"]`);
    if (activeBtn) {
      activeBtn.className = "nav-tab pill-mint px-5 py-2 text-xs font-bold uppercase tracking-wider";
    }
  }
}

async function loadStudentData() {
  const mentorDisplay = document.getElementById("studentMentorDisplay");
  if (currentUser.mentorName) {
    mentorDisplay.textContent = currentUser.mentorName;
  } else {
    mentorDisplay.textContent = "Not yet allocated. An administrator will assign your mentor shortly.";
  }

  const gList = document.getElementById("studentGrievancesList");
  if (gList) gList.innerHTML = renderLoadingState("Fetching your grievances...");

  const mList = document.getElementById("studentMeetingsList");
  if (mList) mList.innerHTML = renderLoadingState("Fetching guidance sessions...");

  try {
    const res = await fetch(`${API_BASE}/grievances/student/${currentUser.id}`);
    const list = await res.json();
    renderStudentGrievances(list);
  } catch (err) {
    if (gList) gList.innerHTML = `<div class="text-xs text-red-600 py-4 text-center">Failed to load grievances from backend.</div>`;
  }

  try {
    const res = await fetch(`${API_BASE}/meetings/student/${currentUser.id}`);
    const meetings = await res.json();
    renderStudentMeetings(meetings);
  } catch (err) {
    if (mList) mList.innerHTML = `<div class="text-xs text-red-600 py-4 text-center">Failed to load meetings.</div>`;
  }
}

function renderStudentGrievances(grievances) {
  const container = document.getElementById("studentGrievancesList");
  if (!grievances || grievances.length === 0) {
    container.innerHTML = `<div class="text-xs text-titanium-600 text-center py-6">You have not submitted any grievances yet.</div>`;
    return;
  }

  container.innerHTML = grievances.map(g => `
    <div class="glass-panel rounded-2xl p-4 sm:p-5 space-y-3 min-w-0 max-w-full overflow-hidden">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
        <h4 class="text-sm font-extrabold text-titanium-900 break-words min-w-0 flex-1">${escapeHtml(g.title)}</h4>
        <div class="flex items-center gap-1.5 flex-wrap flex-shrink-0">
          ${renderStatusBadge(g.status)}
        </div>
      </div>
      <p class="text-xs text-titanium-700 leading-relaxed break-words whitespace-pre-wrap min-w-0">${escapeHtml(g.description)}</p>
      
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-titanium-600 pt-2 border-t border-black/5 min-w-0">
        <div class="break-words min-w-0">Category: <span class="text-titanium-900 font-bold">${escapeHtml(g.category || "General")}</span> • Submitted: ${g.createdAt || ""}</div>
        <div class="flex-shrink-0"></div>
      </div>

      ${g.remarks ? `
        <div class="mt-2.5 p-3 rounded-2xl bg-white/60 border border-white/80 text-xs shadow-sm min-w-0 overflow-hidden">
          <span class="text-titanium-900 font-extrabold uppercase tracking-wider block text-[10px] flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-mint flex-shrink-0"></span> Faculty Resolution Notes:
          </span>
          <p class="text-titanium-800 mt-1 break-words whitespace-pre-wrap min-w-0">${escapeHtml(g.remarks)}</p>
        </div>
      ` : ""}
    </div>
  `).join("");
}

function renderStudentMeetings(meetings) {
  const container = document.getElementById("studentMeetingsList");
  if (!meetings || meetings.length === 0) {
    container.innerHTML = `<div class="text-xs text-titanium-600 text-center py-6">No meeting requests found.</div>`;
    return;
  }

  container.innerHTML = meetings.map(m => `
    <div class="glass-panel rounded-2xl p-4 sm:p-5 space-y-3 min-w-0 max-w-full overflow-hidden">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
        <h4 class="text-sm font-extrabold text-titanium-900 break-words min-w-0 flex-1">${escapeHtml(m.title)}</h4>
        <span class="pill-btn px-3 py-0.5 text-xs font-bold text-titanium-800 self-start sm:self-auto flex-shrink-0">${escapeHtml(m.status)}</span>
      </div>
      <p class="text-xs text-titanium-700 leading-relaxed break-words whitespace-pre-wrap min-w-0">${escapeHtml(m.purpose || "Guidance session")}</p>
      <div class="text-xs text-titanium-600 break-words min-w-0">
        Mentor: <span class="text-titanium-900 font-bold">${escapeHtml(m.mentorName || "Faculty Mentor")}</span> • Date/Time: <span class="text-titanium-900 font-medium">${m.meetingTime || "TBD"}</span>
      </div>
      ${m.venueOrLink ? `
        <div class="text-xs text-titanium-900 font-semibold break-words min-w-0">Venue / Link: <span class="underline text-emerald-700 break-words">${escapeHtml(m.venueOrLink)}</span></div>
      ` : ""}
      ${m.feedback ? `
        <div class="text-xs text-titanium-700 border-t border-black/5 pt-2 break-words whitespace-pre-wrap min-w-0">Notes/Feedback: ${escapeHtml(m.feedback)}</div>
      ` : ""}
    </div>
  `).join("");
}

async function handleGrievanceSubmit(event) {
  event.preventDefault();
  clearErrors();

  const btn = event.submitter || document.getElementById("grievanceSubmitBtn") || (event.target && event.target.querySelector("button[type='submit']"));
  if (btn && btn.dataset.loading === "true") return;

  const title = document.getElementById("gTitle").value.trim();
  const description = document.getElementById("gDesc").value.trim();
  const category = document.getElementById("gCategory").value;
  if (!title) {
    showError("gTitleErr", "Title is required");
    return;
  }
  if (!description) {
    showError("gDescErr", "Description is required");
    return;
  }

  setButtonLoading(btn, true, "Submitting Complaint...");
  try {
    const res = await fetch(`${API_BASE}/grievances`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        category,
        studentId: currentUser.id,
        studentName: currentUser.name
      })
    });

    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || "Submission failed", true);
      return;
    }

    showToast("Grievance submitted successfully!");
    document.getElementById("grievanceForm").reset();
    loadStudentData();
  } catch (err) {
    showToast("Could not submit grievance to backend.", true);
  } finally {
    setButtonLoading(btn, false);
  }
}

async function handleMeetingRequestSubmit(event) {
  event.preventDefault();

  const btn = event.submitter || document.getElementById("meetingReqSubmitBtn") || (event.target && event.target.querySelector("button[type='submit']"));
  if (btn && btn.dataset.loading === "true") return;

  const title = document.getElementById("mTitle").value.trim();
  const purpose = document.getElementById("mPurpose").value.trim();
  const meetingTime = document.getElementById("mTime").value;

  if (!title) {
    showToast("Session title is required", true);
    return;
  }

  setButtonLoading(btn, true, "Requesting Session...");
  try {
    const res = await fetch(`${API_BASE}/meetings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        purpose,
        meetingTime: meetingTime.replace("T", " "),
        studentId: currentUser.id
      })
    });

    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || "Meeting request failed", true);
      return;
    }

    showToast("Meeting requested successfully!");
    document.getElementById("meetingRequestForm").reset();
    loadStudentData();
  } catch (err) {
    showToast("Could not request meeting.", true);
  } finally {
    setButtonLoading(btn, false);
  }
}

async function loadMentorData() {
  const sContainer = document.getElementById("mentorStudentsList");
  if (sContainer) sContainer.innerHTML = `<div class="col-span-full">${renderLoadingState("Fetching assigned students...")}</div>`;

  const gContainer = document.getElementById("mentorGrievancesList");
  if (gContainer) gContainer.innerHTML = renderLoadingState("Fetching student grievances...");

  const mContainer = document.getElementById("mentorMeetingsList");
  if (mContainer) mContainer.innerHTML = renderLoadingState("Fetching guidance meeting requests...");

  try {
    const res = await fetch(`${API_BASE}/mentors/${currentUser.id}/students`);
    const students = await res.json();
    const container = document.getElementById("mentorStudentsList");
    if (!students || students.length === 0) {
      container.innerHTML = `<div class="text-xs text-titanium-600 py-4 col-span-3 text-center">No students allocated to you yet.</div>`;
    } else {
      container.innerHTML = students.map(s => `
        <div class="glass-panel rounded-2xl p-4 sm:p-5 space-y-2 min-w-0 max-w-full overflow-hidden">
          <div class="flex justify-between items-center min-w-0">
            <h4 class="text-sm font-extrabold text-titanium-900 break-words min-w-0 flex-1">${escapeHtml(s.name)}</h4>
          </div>
          <div class="text-xs text-titanium-700 break-words min-w-0">Student ID: <span class="font-bold text-titanium-900">${escapeHtml(s.rollNumber || "N/A")}</span></div>
          <div class="text-xs text-titanium-700 break-words min-w-0">Email: <span class="font-medium text-titanium-900">${escapeHtml(s.email)}</span></div>
          <div class="text-xs text-titanium-600 break-words min-w-0">Dept: ${escapeHtml(s.department || "BCA")}</div>
        </div>
      `).join("");
    }
  } catch (e) {}

  
  try {
    const res = await fetch(`${API_BASE}/grievances/mentor/${currentUser.id}`);
    const grievances = await res.json();
    const container = document.getElementById("mentorGrievancesList");
    if (!grievances || grievances.length === 0) {
      container.innerHTML = `<div class="text-xs text-titanium-600 py-6 text-center">No student complaints assigned to your mentorship.</div>`;
    } else {
      container.innerHTML = grievances.map(g => `
        <div class="glass-panel rounded-2xl p-4 sm:p-5 space-y-3 min-w-0 max-w-full overflow-hidden">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 min-w-0">
            <div class="min-w-0 flex-1">
              <h4 class="text-sm font-extrabold text-titanium-900 break-words">${escapeHtml(g.title)}</h4>
              <span class="text-xs text-titanium-600 break-words">Student: <span class="text-titanium-900 font-bold">${escapeHtml(g.studentName || "Student")}</span></span>
            </div>
            <div class="flex items-center gap-2 flex-wrap flex-shrink-0">
              ${renderStatusBadge(g.status)}
              <button onclick="openStatusModal(${g.id}, '${g.status}', '${escapeHtml(g.remarks || "")}')" class="pill-mint px-3.5 py-1 text-xs font-bold">
                Update
              </button>
            </div>
          </div>
          <p class="text-xs text-titanium-700 leading-relaxed break-words whitespace-pre-wrap min-w-0">${escapeHtml(g.description)}</p>
          <div class="text-xs text-titanium-600 break-words min-w-0">Category: ${escapeHtml(g.category || "General")} • Submitted: ${g.createdAt || ""}</div>
          ${g.remarks ? `<div class="p-2.5 rounded-xl bg-white/60 border border-white/80 text-xs text-titanium-800 break-words whitespace-pre-wrap min-w-0">Remarks: ${escapeHtml(g.remarks)}</div>` : ""}
        </div>
      `).join("");
    }
  } catch (e) {}

  
  try {
    const res = await fetch(`${API_BASE}/meetings/mentor/${currentUser.id}`);
    const meetings = await res.json();
    const container = document.getElementById("mentorMeetingsList");
    if (!meetings || meetings.length === 0) {
      container.innerHTML = `<div class="text-xs text-titanium-600 py-6 text-center">No guidance meeting requests.</div>`;
    } else {
      container.innerHTML = meetings.map(m => `
        <div class="glass-panel rounded-2xl p-4 sm:p-5 space-y-3 min-w-0 max-w-full overflow-hidden">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 min-w-0">
            <h4 class="text-sm font-extrabold text-titanium-900 break-words min-w-0 flex-1">${escapeHtml(m.title)}</h4>
            <div class="flex items-center gap-2 flex-wrap flex-shrink-0">
              <span class="pill-btn px-3 py-0.5 text-xs font-bold text-titanium-800">${escapeHtml(m.status)}</span>
              <button onclick="openMeetingModal(${m.id}, '${m.status}', '${escapeHtml(m.venueOrLink || "")}', '${escapeHtml(m.feedback || "")}')" class="pill-mint px-3.5 py-1 text-xs font-bold">
                Manage
              </button>
            </div>
          </div>
          <p class="text-xs text-titanium-700 leading-relaxed break-words whitespace-pre-wrap min-w-0">Purpose: ${escapeHtml(m.purpose || "N/A")}</p>
          <div class="text-xs text-titanium-600 break-words min-w-0">Student: <span class="text-titanium-900 font-bold">${escapeHtml(m.studentName || "Student")}</span> • Time: ${m.meetingTime || "Unspecified"}</div>
          ${m.venueOrLink ? `<div class="text-xs text-titanium-900 font-semibold break-words min-w-0">Venue/Link: ${escapeHtml(m.venueOrLink)}</div>` : ""}
          ${m.feedback ? `<div class="p-2.5 rounded-xl bg-white/60 border border-white/80 text-xs text-titanium-800 break-words whitespace-pre-wrap min-w-0">Feedback: ${escapeHtml(m.feedback)}</div>` : ""}
        </div>
      `).join("");
    }
  } catch (e) {}
}

async function loadAdminData() {
  const countBadge = document.getElementById("adminStudentsAllocationCount");
  if (countBadge) countBadge.textContent = "Loading...";

  const tableBody = document.getElementById("adminStudentMentorsTableBody");
  if (tableBody) tableBody.innerHTML = renderTableLoadingState(6, "Loading student allocation directory...");

  const gContainer = document.getElementById("adminGrievancesList");
  if (gContainer) gContainer.innerHTML = renderLoadingState("Fetching all campus grievances...");

  try {
    const res = await fetch(`${API_BASE}/admin/stats`);
    const stats = await res.json();
    document.getElementById("statTotalStudents").textContent = stats.totalStudents || 0;
    document.getElementById("statTotalMentors").textContent = stats.totalMentors || 0;
    document.getElementById("statTotalGrievances").textContent = stats.totalGrievances || 0;
    document.getElementById("statPendingGrievances").textContent = stats.pendingGrievances || 0;
    document.getElementById("statResolvedGrievances").textContent = stats.resolvedGrievances || 0;
  } catch (e) {}

  
  try {
    const [studentsRes, mentorsRes] = await Promise.all([
      fetch(`${API_BASE}/users?role=STUDENT`),
      fetch(`${API_BASE}/users?role=MENTOR`)
    ]);
    const students = await studentsRes.json();
    const mentors = await mentorsRes.json();

    const unassignedStudents = (students || []).filter(s => !s.mentorId && (!s.mentorName || s.mentorName.trim() === ""));
    const assignedStudents = (students || []).filter(s => s.mentorId || (s.mentorName && s.mentorName.trim() !== ""));

    const studentSelect = document.getElementById("allocStudentSelect");
    const mentorSelect = document.getElementById("allocMentorSelect");
    const assignBtn = document.querySelector("#allocateMentorForm button[type='submit']");

    
    if (unassignedStudents.length === 0) {
      studentSelect.innerHTML = `<option value="" disabled selected>All students currently have mentors assigned</option>`;
      studentSelect.disabled = true;
      if (assignBtn) assignBtn.disabled = true;
    } else {
      studentSelect.disabled = false;
      if (assignBtn) assignBtn.disabled = false;
      studentSelect.innerHTML = `<option value="">Choose an Unassigned Student (${unassignedStudents.length} available)...</option>` +
        unassignedStudents.map(s => `<option value="${s.id}">${escapeHtml(s.name)} (${escapeHtml(s.email)})${s.rollNumber ? ' - ID: ' + escapeHtml(s.rollNumber) : ''}</option>`).join("");
    }

    mentorSelect.innerHTML = `<option value="">Choose a Mentor...</option>` +
      mentors.map(m => `<option value="${m.id}">${escapeHtml(m.name)} (${escapeHtml(m.department || 'Faculty')})</option>`).join("");

    
    if (countBadge) {
      countBadge.textContent = `${assignedStudents.length} Assigned • ${unassignedStudents.length} Unassigned`;
    }

    if (tableBody) {
      if (!students || students.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="py-6 text-center text-xs text-titanium-600">No students registered in the system yet.</td></tr>`;
      } else {
        tableBody.innerHTML = students.map(s => {
          const isAssigned = Boolean(s.mentorId || (s.mentorName && s.mentorName.trim() !== ""));
          return `
            <tr class="border-b border-black/5 hover:bg-white/40 transition">
              <td class="py-3 px-3.5 text-titanium-900 font-extrabold text-xs whitespace-nowrap">
                ${escapeHtml(s.name)}
              </td>
              <td class="py-3 px-3.5 text-titanium-700 font-mono text-xs whitespace-nowrap">
                ${escapeHtml(s.rollNumber || "-")}
              </td>
              <td class="py-3 px-3.5 text-titanium-600 text-xs whitespace-nowrap">
                ${escapeHtml(s.email)}
              </td>
              <td class="py-3 px-3.5 text-titanium-600 text-xs whitespace-nowrap">
                ${escapeHtml(s.department || "-")}
              </td>
              <td class="py-3 px-3.5 whitespace-nowrap">
                ${isAssigned ? `
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-mint/20 text-titanium-900 border border-mint/40 whitespace-nowrap">
                    <span class="w-1.5 h-1.5 rounded-full bg-mint flex-shrink-0"></span>
                    ${escapeHtml(s.mentorName || "Assigned")}
                  </span>
                ` : `
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20 whitespace-nowrap">
                    <span class="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0"></span>
                    Unassigned
                  </span>
                `}
              </td>
              <td class="py-3 px-3.5 text-right whitespace-nowrap">
                ${isAssigned ? `
                  <button onclick="unassignMentor(${s.id}, this)" class="pill-btn px-2.5 py-1 text-[11px] text-amber-700 border border-amber-200 hover:bg-amber-50 whitespace-nowrap">
                    Unassign
                  </button>
                ` : `
                  <button onclick="focusAllocation(${s.id})" class="pill-mint px-2.5 py-1 text-[11px] font-bold whitespace-nowrap">
                    Assign
                  </button>
                `}
              </td>
            </tr>
          `;
        }).join("");
      }
    }
  } catch (e) {}

  
  try {
    const res = await fetch(`${API_BASE}/grievances`);
    const grievances = await res.json();
    const container = document.getElementById("adminGrievancesList");
    if (!grievances || grievances.length === 0) {
      container.innerHTML = `<div class="text-xs text-titanium-600 py-6 text-center">No grievances in system.</div>`;
    } else {
      container.innerHTML = grievances.map(g => `
        <div class="glass-panel rounded-2xl p-4 sm:p-5 space-y-3 min-w-0 max-w-full overflow-hidden">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 min-w-0">
            <div class="min-w-0 flex-1">
              <h4 class="text-sm font-extrabold text-titanium-900 break-words">${escapeHtml(g.title)}</h4>
              <span class="text-xs text-titanium-600 break-words">Student: <span class="text-titanium-900 font-bold">${escapeHtml(g.studentName || "")}</span></span>
            </div>
            <div class="flex items-center gap-2 flex-wrap flex-shrink-0">
              ${renderStatusBadge(g.status)}
              <button onclick="openStatusModal(${g.id}, '${g.status}', '${escapeHtml(g.remarks || "")}')" class="pill-mint px-3.5 py-1 text-xs font-bold">
                Update
              </button>
            </div>
          </div>
          <p class="text-xs text-titanium-700 leading-relaxed break-words whitespace-pre-wrap min-w-0">${escapeHtml(g.description)}</p>
          <div class="text-xs text-titanium-600 break-words min-w-0">
            Student: <span class="text-titanium-900 font-bold">${escapeHtml(g.studentName || "")}</span> • Category: ${escapeHtml(g.category || "General")} • Date: ${g.createdAt || ""}
          </div>
          ${g.remarks ? `<div class="p-2.5 rounded-xl bg-white/60 border border-white/80 text-xs text-titanium-800 break-words whitespace-pre-wrap min-w-0">Remarks: ${escapeHtml(g.remarks)}</div>` : ""}
        </div>
      `).join("");
    }
  } catch (e) {}

  
  loadAdminUsers();
}

async function handleAllocateMentorSubmit(event) {
  event.preventDefault();

  const btn = event.submitter || document.getElementById("allocSubmitBtn") || (event.target && event.target.querySelector("button[type='submit']"));
  if (btn && btn.dataset.loading === "true") return;

  const studentId = document.getElementById("allocStudentSelect").value;
  const mentorId = document.getElementById("allocMentorSelect").value;

  if (!studentId || !mentorId) {
    showToast("Please select both a student and a mentor", true);
    return;
  }

  setButtonLoading(btn, true, "Assigning...");
  try {
    const res = await fetch(`${API_BASE}/allocate-mentor`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: Number(studentId), mentorId: Number(mentorId) })
    });

    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || "Allocation failed", true);
      return;
    }

    showToast("Mentor allocated successfully!");
    const form = document.getElementById("allocateMentorForm");
    if (form) form.reset();
    loadAdminData();
  } catch (err) {
    showToast("Failed to allocate mentor.", true);
  } finally {
    setButtonLoading(btn, false);
  }
}

async function unassignMentor(studentId, btnTrigger = null) {
  const btn = btnTrigger || (typeof event !== 'undefined' && event?.target ? event.target : null);
  if (btn && btn.dataset.loading === "true") return;
  if (!confirm("Are you sure you want to unassign the mentor from this student?")) return;

  setButtonLoading(btn, true, "...");
  try {
    const res = await fetch(`${API_BASE}/allocate-mentor`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: Number(studentId), mentorId: 0 })
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || "Failed to unassign mentor", true);
      return;
    }
    showToast("Mentor unassigned successfully");
    loadAdminData();
  } catch (err) {
    showToast("Failed to unassign mentor.", true);
  } finally {
    setButtonLoading(btn, false);
  }
}

function focusAllocation(studentId) {
  const studentSelect = document.getElementById("allocStudentSelect");
  if (studentSelect) {
    studentSelect.disabled = false;
    studentSelect.value = studentId;
    const form = document.getElementById("allocateMentorForm");
    if (form) {
      form.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    const mentorSelect = document.getElementById("allocMentorSelect");
    if (mentorSelect) mentorSelect.focus();
  }
}

async function loadAdminUsers(roleFilter) {
  const tbody = document.getElementById("adminUsersTableBody");
  if (tbody) tbody.innerHTML = renderTableLoadingState(6, "Loading user accounts...");

  try {
    const url = roleFilter ? `${API_BASE}/users?role=${roleFilter}` : `${API_BASE}/users`;
    const res = await fetch(url);
    const users = await res.json();

    if (!users || users.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="py-4 text-center text-titanium-600">No users found</td></tr>`;
      return;
    }

    tbody.innerHTML = users.map(u => `
      <tr class="border-b border-black/5 hover:bg-white/40">
        <td class="py-3 px-3.5 text-titanium-900 font-extrabold whitespace-nowrap">${escapeHtml(u.name)}</td>
        <td class="py-3 px-3.5 text-titanium-700 font-medium whitespace-nowrap">${escapeHtml(u.email)}</td>
        <td class="py-3 px-3.5 whitespace-nowrap">
          <span class="pill-btn px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-titanium-900 whitespace-nowrap">${u.role}</span>
        </td>
        <td class="py-3 px-3.5 text-titanium-600 whitespace-nowrap">${escapeHtml(u.department || "-")}</td>
        <td class="py-3 px-3.5 whitespace-nowrap">
          ${u.role === 'STUDENT' ? (u.mentorName ? `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-mint/20 text-titanium-900 border border-mint/40 whitespace-nowrap"><span class="w-1.5 h-1.5 rounded-full bg-mint flex-shrink-0"></span>${escapeHtml(u.mentorName)}</span>` : `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20 whitespace-nowrap"><span class="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0"></span>Unassigned</span>`) : '-'}
        </td>
        <td class="py-3 px-3.5 text-right whitespace-nowrap">
          ${u.id !== currentUser.id ? `
            <button onclick="deleteUser(${u.id}, this)" class="pill-btn px-2.5 py-1 text-[11px] text-red-600 border border-red-200 hover:bg-red-50 whitespace-nowrap">
              Delete
            </button>
          ` : `<span class="text-titanium-400 text-[10px] font-bold uppercase whitespace-nowrap">Active</span>`}
        </td>
      </tr>
    `).join("");
  } catch (e) {}
}

async function deleteUser(id, btnTrigger = null) {
  const btn = btnTrigger || (typeof event !== 'undefined' && event?.target ? event.target : null);
  if (btn && btn.dataset.loading === "true") return;
  if (!confirm("Are you sure you want to delete this user?")) return;

  setButtonLoading(btn, true, "...");
  try {
    const res = await fetch(`${API_BASE}/users/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || "Could not delete user", true);
      return;
    }
    showToast("User deleted successfully");
    loadAdminData();
  } catch (err) {
    showToast("Error deleting user.", true);
  } finally {
    setButtonLoading(btn, false);
  }
}

function openStatusModal(id, currentStatus, currentRemarks) {
  document.getElementById("modalGrievanceId").value = id;
  if (currentStatus) document.getElementById("modalStatusSelect").value = currentStatus;
  document.getElementById("modalRemarks").value = currentRemarks || "";
  document.getElementById("statusModal").classList.remove("hidden");
}

async function submitStatusUpdate(btnTrigger = null) {
  const btn = btnTrigger || document.getElementById("modalStatusSubmitBtn");
  if (btn && btn.dataset.loading === "true") return;

  const id = document.getElementById("modalGrievanceId").value;
  const status = document.getElementById("modalStatusSelect").value;
  const remarks = document.getElementById("modalRemarks").value.trim();

  setButtonLoading(btn, true, "Saving...");
  try {
    const res = await fetch(`${API_BASE}/grievances/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, remarks })
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || "Failed to update", true);
      return;
    }

    showToast("Status updated successfully!");
    closeModal("statusModal");
    if (currentUser.role === "MENTOR") loadMentorData();
    else if (currentUser.role === "ADMIN") loadAdminData();
  } catch (err) {
    showToast("Failed to update status", true);
  } finally {
    setButtonLoading(btn, false);
  }
}

  setButtonLoading(btn, true, "Escalating...");
  try {
    const res = await fetch(`${API_BASE}/grievances/${id}/escalate`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason })
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || "Failed to escalate", true);
      return;
    }

    showToast("Complaint escalated to Urgent!");
    closeModal("escalateModal");
    loadStudentData();
  } catch (err) {
    showToast("Failed to escalate", true);
  } finally {
    setButtonLoading(btn, false);
  }
}

function openMeetingModal(id, status, venue, feedback) {
  document.getElementById("modalMeetingId").value = id;
  if (status) document.getElementById("modalMeetingStatus").value = status;
  document.getElementById("modalMeetingVenue").value = venue || "";
  document.getElementById("modalMeetingFeedback").value = feedback || "";
  document.getElementById("meetingModal").classList.remove("hidden");
}

async function submitMeetingUpdate(btnTrigger = null) {
  const btn = btnTrigger || document.getElementById("modalMeetingSubmitBtn");
  if (btn && btn.dataset.loading === "true") return;

  const id = document.getElementById("modalMeetingId").value;
  const status = document.getElementById("modalMeetingStatus").value;
  const venueOrLink = document.getElementById("modalMeetingVenue").value.trim();
  const feedback = document.getElementById("modalMeetingFeedback").value.trim();

  setButtonLoading(btn, true, "Updating...");
  try {
    const res = await fetch(`${API_BASE}/meetings/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, venueOrLink, feedback })
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || "Failed to update meeting", true);
      return;
    }

    showToast("Meeting updated successfully!");
    closeModal("meetingModal");
    loadMentorData();
  } catch (err) {
    showToast("Failed to update meeting", true);
  } finally {
    setButtonLoading(btn, false);
  }
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.add("hidden");
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showError(elemId, message) {
  const elem = document.getElementById(elemId);
  if (elem) {
    elem.textContent = message;
    elem.classList.remove("hidden");
  }
}

function clearErrors() {
  document.querySelectorAll("p[id$='Err']").forEach(p => {
    p.textContent = "";
    p.classList.add("hidden");
  });
}

const toast = {
  container: null,

  getContainer() {
    if (!this.container) {
      this.container = document.getElementById("hot-toast-container");
      if (!this.container) {
        this.container = document.createElement("div");
        this.container.id = "hot-toast-container";
        this.container.className = "fixed top-5 inset-x-0 z-50 flex flex-col items-center gap-2 pointer-events-none px-4";
        document.body.appendChild(this.container);
      }
    }
    return this.container;
  },

  show(message, type = "default", duration = 3500) {
    const container = this.getContainer();
    const id = "toast-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4);

    const toastEl = document.createElement("div");
    toastEl.id = id;
    toastEl.className = "hot-toast pointer-events-auto flex items-center gap-3 px-4 py-2.5 rounded-full bg-white/95 backdrop-blur-md border border-black/10 shadow-[0_10px_30px_rgba(0,0,0,0.12),0_4px_10px_rgba(0,0,0,0.06)] text-xs font-semibold text-titanium-900 max-w-md cursor-pointer transition-transform hover:scale-[1.02]";

    let iconHtml = "";
    if (type === "success") {
      iconHtml = `
        <div class="w-5 h-5 rounded-full bg-[#00F5B8] flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(0,245,184,0.4)]">
          <svg class="w-3 h-3 text-black stroke-[3.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
          </svg>
        </div>
      `;
    } else if (type === "error") {
      iconHtml = `
        <div class="w-5 h-5 rounded-full bg-[#EF4444] flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(239,68,68,0.4)]">
          <svg class="w-3 h-3 text-white stroke-[3.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </div>
      `;
    } else if (type === "loading") {
      iconHtml = `
        <div class="w-5 h-5 flex items-center justify-center shrink-0">
          <svg class="w-4 h-4 text-titanium-800 toast-spinner" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      `;
    } else {
      iconHtml = `
        <div class="w-5 h-5 rounded-full bg-titanium-900 flex items-center justify-center shrink-0 text-white font-bold text-[10px]">
          i
        </div>
      `;
    }

    toastEl.innerHTML = `
      ${iconHtml}
      <span class="tracking-wide">${escapeHtml(message)}</span>
    `;

    
    toastEl.onclick = () => this.dismiss(id);

    container.appendChild(toastEl);

    
    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }

    return id;
  },

  success(message, duration = 3500) {
    return this.show(message, "success", duration);
  },

  error(message, duration = 4000) {
    return this.show(message, "error", duration);
  },

  loading(message) {
    return this.show(message, "loading", 0);
  },

  dismiss(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add("toast-closing");
    setTimeout(() => {
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
      }
    }, 250);
  }
};

window.toast = toast;

function showToast(message, isError = false) {
  if (isError) {
    toast.error(message);
  } else {
    toast.success(message);
  }
}

function renderStatusBadge(status, isAdmin) {
  const s = (status || "").toLowerCase();
  if (s === "resolved") {
    return `<span class="pill-mint px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider shadow-sm">Resolved</span>`;
  }
  if (s === "in progress") {
    return `<span class="pill-btn px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 border-amber-200">In Progress</span>`;
  }
  if (s === "under review") {
    return `<span class="pill-btn px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-sky-100 text-sky-800 border-sky-200">Under Review</span>`;
  }
  if (s === "rejected") {
    return `<span class="pill-btn px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-red-100 text-red-700 border-red-200">Rejected</span>`;
  }
  // "Submitted" / default — hide on admin side, show orange on student side
  if (isAdmin) return "";
  return `<span class="pill-btn px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-orange-100 text-orange-700 border-orange-200">Pending</span>`;
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
