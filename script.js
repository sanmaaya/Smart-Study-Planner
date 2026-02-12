//keys for localstorage
const SUBJECTS_KEY = "subjects";
const TASKS_KEY = "tasks";
const SCHEDULES_KEY = "schedules";
const GOALS_KEY = "goals";
const MARKS_KEY = "marks";
const PLANNER_KEY = "planner";
const THEME_KEY = "theme";
const EXAMS_KEY = "exams";
const FONT_KEY = "planner_font";

// from storage
let subjects = JSON.parse(localStorage.getItem(SUBJECTS_KEY)) || [];
let tasks = JSON.parse(localStorage.getItem(TASKS_KEY)) || [];
let schedules = JSON.parse(localStorage.getItem(SCHEDULES_KEY)) || [];
let goals = JSON.parse(localStorage.getItem(GOALS_KEY)) || [];
let marks = JSON.parse(localStorage.getItem(MARKS_KEY)) || [];
let exams = JSON.parse(localStorage.getItem(EXAMS_KEY)) || [];
let currentTaskView = 'pending'; // 'pending' or 'completed'
let studyStreak = JSON.parse(localStorage.getItem('ssp_streak')) || 0;

const getTodayStr = (offsetDays = 0) => {
    const d = new Date();
    if (offsetDays !== 0) d.setDate(d.getDate() + offsetDays);
    return d.toLocaleDateString('en-CA');
};
const quotes = [
    "Success is not final, failure is not fatal: It is the courage to continue. - Winston Churchill",
    "Believe you can and you're halfway there. - Theodore Roosevelt",
    "The only way to do great work is to love what you do. - Steve Jobs",
    "Don't watch the clock; do what it does. Keep going. - Sam Levenson",
    "The future depends on what you do today. - Mahatma Gandhi",
    "It always seems impossible until it's done. - Nelson Mandela",
    "Your talent determines what you can do. Your motivation determines how much you are willing to do. Your attitude determines how well you do it. - Lou Holtz",
    "The man who has confidence in himself gains the confidence of others. - Hasidic Proverb",
    "Action is the foundational key to all success. - Pablo Picasso",
    "Don't let yesterday take up too much of today. - Will Rogers",
    "Everything you've ever wanted is on the other side of fear. - George Addair",
    "Hardships often prepare ordinary people for an extraordinary destiny. - C.S. Lewis",
    "It's not whether you get knocked down, it's whether you get up. - Vince Lombardi",
    "Quality is not an act, it is a habit. - Aristotle"
];

function displayRandomQuote() {
    const quoteTxt = document.getElementById("quoteText");
    if (quoteTxt) {
        const randomIndex = Math.floor(Math.random() * quotes.length);
        quoteTxt.innerText = `"${quotes[randomIndex]}"`;
    }
}

//Which page to show
function showpage(pageId) {
    // 1. Switch active section
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(pageId).classList.add("active");

    // 2. Update Nav Button Styles
    document.querySelectorAll(".nav-links button").forEach(btn => {
        btn.classList.remove("active-nav");
        const btnText = btn.querySelector('.text') ? btn.querySelector('.text').innerText : btn.innerText;
        if (btnText.toLowerCase().includes(pageId)) btn.classList.add("active-nav");
    });

    // 3. Re-render charts if going to specific pages
    if (pageId === 'dashboard') {
        renderDashboard();
        renderTaskChart("taskChart");
        renderTaskStatusChart("taskStatusChart");
    }
    if (pageId === 'analytics') {
        renderAnalytics();
    }

    // 3. Re-render charts if going to specific pages
    if (pageId === 'dashboard') {
        renderDashboard();
        renderTaskChart("taskChart");
        renderTaskStatusChart("taskStatusChart");
    }
    if (pageId === 'analytics') {
        renderAnalytics();
    }
}
function renderDashboard() {
    const pendingTasks = tasks.filter(t => t.status !== 'completed');
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const pTasksEl = document.getElementById("pendingTasks");
    const cTasksEl = document.getElementById("completedTasks");
    if (pTasksEl) pTasksEl.innerText = pendingTasks.length;
    if (cTasksEl) cTasksEl.innerText = completedTasks.length;

    const todayStr = getTodayStr();
    const nextWeekStr = getTodayStr(7);

    const upcomingCount = schedules.filter(s => s.date >= todayStr && s.date <= nextWeekStr).length;
    const upcomingSchedulesEl = document.getElementById("upcomingschedules");
    if (upcomingSchedulesEl) upcomingSchedulesEl.innerText = upcomingCount;

    const todayList = document.getElementById("todayList");
    if (!todayList) return;
    todayList.innerHTML = "";

    const horizonStr = getTodayStr(3);

    const dashboardTasks = pendingTasks.filter(t => t.date >= todayStr && t.date <= horizonStr);
    const dashboardSchedules = schedules.filter(s => {
        if (s.date < todayStr) return false;
        if (s.date === todayStr) {
            const nowTime = new Date().toTimeString().substring(0, 5);
            if (s.time < nowTime) return false;
        }
        return s.date <= horizonStr;
    });

    if (dashboardTasks.length === 0 && dashboardSchedules.length === 0) {
        todayList.innerHTML = "<li style='background:none; color:#64748b'>No upcoming focus items.</li>";
    } else {
        // Sort by date
        const combined = [
            ...dashboardTasks.map(t => ({ ...t, type: 'Task', sortDate: t.date })),
            ...dashboardSchedules.map(s => ({ ...s, type: 'Schedule', sortDate: s.date, title: s.subject }))
        ].sort((a, b) => a.sortDate.localeCompare(b.sortDate));

        combined.forEach(item => {
            const li = document.createElement("li");
            const dateLabel = item.sortDate === todayStr ? "Today" : item.sortDate;
            li.innerHTML = `<span>[${item.type}] <strong>${dateLabel}</strong>: ${item.title} ${item.time ? 'at ' + item.time : ''}</span>`;
            todayList.appendChild(li);
        });
    }
    updateCountdown();
}
function renderUpcomingTasks() {
    const previewList = document.getElementById("taskListPreview");
    if (!previewList) return;

    previewList.innerHTML = "";
    const today = getTodayStr();

    const upcomingTasks = tasks
        .filter(t => t.date > today && t.status !== 'completed')
        .sort((a, b) => a.date.localeCompare(b.date));

    if (upcomingTasks.length === 0) {
        previewList.innerHTML = "<p>No upcoming tasks!</p>";
        return;
    }
    upcomingTasks.slice(0, 5).forEach(task => {
        const li = document.createElement("li");
        li.innerHTML = `<strong>${task.title}</strong><br>${task.subject} | ${task.date}`;
        previewList.appendChild(li);
    });
}

//CHART FOR PROGRESS ANALYSIS
//CHART FOR PROGRESS ANALYSIS
function renderTaskChart(canvasId = "taskChart") {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const subjectCount = {};
    tasks.forEach(task => {
        subjectCount[task.subject] = (subjectCount[task.subject] || 0) + 1;
    });

    const labels = Object.keys(subjectCount);
    const data = Object.values(subjectCount);

    const chartKey = canvasId + "Instance";
    if (window[chartKey]) {
        window[chartKey].destroy();
    }

    window[chartKey] = new Chart(ctx, {
        type: "pie",
        data: {
            labels: labels,
            datasets: [{
                label: "Tasks per Subject",
                data: data,
                backgroundColor: [
                    "#897954",
                    "#b05353",
                    "#c2c435",
                    "#673d3d",
                    "#8eb554",
                    "#f082d1"
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: "bottom"
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

//BAR CHART FOR TASK STATUS PER SUBJECT
//BAR CHART FOR TASK STATUS PER SUBJECT
function renderTaskStatusChart(canvasId = "taskStatusChart") {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const subjectData = {};
    subjects.forEach(sub => {
        subjectData[sub.name] = { pending: 0, completed: 0 };
    });

    tasks.forEach(task => {
        if (subjectData[task.subject]) {
            if (task.status === 'completed') {
                subjectData[task.subject].completed++;
            } else {
                subjectData[task.subject].pending++;
            }
        }
    });

    const labels = Object.keys(subjectData);
    const pendingData = labels.map(label => subjectData[label].pending);
    const completedData = labels.map(label => subjectData[label].completed);

    const chartKey = canvasId + "Instance";
    if (window[chartKey]) {
        window[chartKey].destroy();
    }

    window[chartKey] = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Pending Tasks",
                data: pendingData,
                backgroundColor: "#f39c12"
            }, {
                label: "Completed Tasks",
                data: completedData,
                backgroundColor: "#27ae60"
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: "top"
                }
            },
            scales: {
                x: {
                    stacked: true
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function renderAnalytics() {
    renderTaskChart("analysisTaskChart");
    renderTaskStatusChart("analysisStatusChart");

    const insightEl = document.getElementById("productivityInsights");
    if (!insightEl) return;

    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const perc = total > 0 ? Math.round((completed / total) * 100) : 0;
    const focusToday = localStorage.getItem('ssp_focus_today') || 0;

    insightEl.innerHTML = `
        <div class="stat-info">
            <div class="stat-item">
                <span>Overall Completion</span>
                <h3>${perc}%</h3>
            </div>
            <div class="stat-item">
                <span>Total Tasks</span>
                <h3>${total}</h3>
            </div>
            <div class="stat-item">
                <span>Focus Today</span>
                <h3>${focusToday}m</h3>
            </div>
            <div class="stat-item">
                <span>Study Streak</span>
                <h3>${studyStreak} days</h3>
            </div>
        </div>
    `;
}

//SUBJECT MANAGEMENT
//to add the subject
function addSubject() {
    const name = document.getElementById("subjectInput").value.trim();
    const priority = document.getElementById("subjectpriority").value;
    if (!name) {
        alert("Please enter a subject name");
        return;
    }
    if (subjects.some(s => s.name === name)) {
        alert("Subject already exists");
        return;
    }
    const subject = { name, priority };
    subjects.push(subject);
    saveSubjects(); //function called to save sub
    renderSubjects(); // function called to render sub
    updateSubjectDropdown(); //function called to update the dropdown
    renderDashboard();
    renderTaskChart();
    document.getElementById("subjectInput").value = "";
}
function renderSubjects() {
    const list = document.getElementById("subjectlist");
    list.innerHTML = "";

    if (subjects.length === 0) {
        list.innerHTML = "<p>No subjects added yet.</p>";
        return;
    }

    subjects.forEach((sub, index) => {
        const card = document.createElement("div");
        card.className = "small-card";

        card.innerHTML = `
            <h4>${sub.name}</h4>
            <p>Priority: ${sub.priority}</p>
            <div class="card-actions">
                <button onclick="editSubject(${index})">Edit</button>
                <button onclick="deleteSubject(${index})">Delete</button>
            </div>
        `;

        list.appendChild(card);
    });
}

function editSubject(index) {
    const subject = subjects[index];
    document.getElementById("subjectInput").value = subject.name;
    document.getElementById("subjectpriority").value = subject.priority;

    subjects.splice(index, 1);
    saveSubjects();
    renderSubjects();
    updateSubjectDropdown();
    renderDashboard();
    renderTaskChart();
}

function saveSubjects() {
    localStorage.setItem(SUBJECTS_KEY, JSON.stringify(subjects));
}

function deleteSubject(index) {
    if (!confirm("Delete this subject?")) return;
    subjects.splice(index, 1);
    saveSubjects();
    renderSubjects();
    updateSubjectDropdown();
    renderDashboard();
    renderTaskChart();
}

function updateSubjectDropdown() {
    const taskSelect = document.getElementById("taskSubject");
    const scheduleSelect = document.getElementById("Schedulesubject");

    if (!taskSelect || !scheduleSelect) return;

    taskSelect.innerHTML = '<option value="">Select Subject</option>';
    scheduleSelect.innerHTML = '<option value="">Select Subject</option>';

    subjects.forEach(sub => {
        const opt1 = document.createElement("option");
        opt1.value = sub.name;
        opt1.textContent = sub.name;

        const opt2 = opt1.cloneNode(true);

        taskSelect.appendChild(opt1);
        scheduleSelect.appendChild(opt2);
    });
}
//TASK MANAGEMENT

function addTask() {
    const title = document.getElementById("taskInput").value.trim();
    const date = document.getElementById("taskDate").value;
    const subject = document.getElementById("taskSubject").value;

    if (!title || !date || !subject) {
        alert("Fill everything");
        return;
    }
    const task = { title, date, subject, status: 'pending' };
    tasks.push(task);

    saveTasks();
    renderTasks();
    renderDashboard();
    renderTaskChart();
    renderTaskStatusChart();


    document.getElementById("taskInput").value = "";
    document.getElementById("taskDate").value = "";
    document.getElementById("taskSubject").value = "";
}
function renderTasks() {
    filterTasks();
}

function showTaskView(view) {
    currentTaskView = view;
    filterTasks();
}

function DoneTask(index) {
    tasks[index].status = 'completed';
    tasks[index].completedDate = new Date().toISOString().split("T")[0];
    saveTasks();
    filterTasks();
    renderDashboard();
    renderTaskChart();
    updateStudyStreak();
}

function filterTasks() {
    const searchTerm = document.getElementById("taskSearch").value.toLowerCase();
    const list = document.getElementById("taskList");
    if (!list) return;
    list.innerHTML = "";

    let tasksToShow = currentTaskView === 'completed' ? tasks.filter(t => t.status === 'completed') : tasks.filter(t => t.status !== 'completed');

    if (searchTerm) {
        tasksToShow = tasksToShow.filter(task => task.title.toLowerCase().includes(searchTerm) || task.subject.toLowerCase().includes(searchTerm));
    }

    if (tasksToShow.length === 0) {
        list.innerHTML = currentTaskView === 'completed' ? "<p>No completed tasks found.</p>" : "<p>No pending tasks found.</p>";
        return;
    }

    tasksToShow.forEach((task) => {
        const card = document.createElement("div");
        card.className = "task-card";

        const today = new Date().toISOString().split('T')[0];
        const taskDateStr = task.date;
        const isCompleted = task.status === 'completed';

        let statusText = "Ongoing";
        let statusClass = "ongoing-badge";

        if (isCompleted) {
            statusText = "Completed";
            statusClass = "completed-badge";
        } else if (taskDateStr < today) {
            statusText = "Overdue";
            statusClass = "overdue-badge";
        }

        card.innerHTML = `
            <div class="task-card-content">
                <div class="task-header">
                    <h4 class="${isCompleted ? 'strikethrough' : ''}">${task.title}</h4>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </div>
                <p><strong>Subject:</strong> ${task.subject}</p>
                <p><strong>Date:</strong> ${task.date}</p>
                ${isCompleted ? `<p><strong>Done on:</strong> ${task.completedDate}</p>` : ''}
            </div>
            ${!isCompleted ? `
            <div class="task-card-actions">
                <button class="done-btn" onclick="DoneTask(${tasks.indexOf(task)})">Done</button>
            </div>` : ''}
        `;

        list.appendChild(card);
    });
}

function saveTasks() {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

//SCHEDULE MANAGEMENT
function addSchedule() {
    const date = document.getElementById("scheduledate").value;
    const time = document.getElementById("scheduletime").value;
    const subject = document.getElementById("Schedulesubject").value;
    const reason = document.getElementById("scheduleReason").value.trim();

    if (!date || !time || !subject) {
        alert("Fill date, time, and subject");
        return;
    }

    // CONFLICT HANDLING
    const hasConflict = schedules.some(s => s.date === date && s.time === time);
    if (hasConflict) {
        const proceed = confirm("Conflict Detected: You already have a session at this time. Overwrite?");
        if (!proceed) return;
        // Remove the existing one to "overwrite"
        const existingIndex = schedules.findIndex(s => s.date === date && s.time === time);
        schedules.splice(existingIndex, 1);
    }

    const schedule = { date, time, subject, reason };
    schedules.push(schedule);

    saveSchedules();
    renderKanbanSchedules();
    renderDashboard();

    document.getElementById("scheduledate").value = "";
    document.getElementById("scheduletime").value = "";
    document.getElementById("Schedulesubject").value = "";
    document.getElementById("scheduleReason").value = "";
}

function renderKanbanSchedules() {
    const plannedList = document.getElementById("planned-list");
    if (!plannedList) return;

    plannedList.innerHTML = "";

    const now = new Date();
    const today = getTodayStr();
    const currentTime = now.toTimeString().substring(0, 5); // "HH:MM"

    // Filter out schedules where time is up (passed today's current time or past dates)
    const activeSchedules = schedules.filter(sch => {
        if (sch.date < today) return false;
        if (sch.date === today && sch.time < currentTime) return false;
        return true;
    });

    activeSchedules.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).forEach((sch) => {
        // Need the actual index in the global schedules array for edit/delete
        const realIndex = schedules.indexOf(sch);

        const card = document.createElement("div");
        card.className = "small-card";

        card.innerHTML = `
            <h4>${sch.subject}</h4>
            <p><strong>Time:</strong> ${sch.date} at ${sch.time}</p>
            ${sch.reason ? `<p><strong>Reason:</strong> ${sch.reason}</p>` : ''}
            <div class="card-actions">
                <button onclick="editSchedule(${realIndex})">Edit</button>
                <button onclick="deleteSchedule(${realIndex})">Del</button>
            </div>
        `;

        plannedList.appendChild(card);
    });
    updateScheduleAnalysis();
}

function updateScheduleAnalysis() {
    const today = getTodayStr();
    const todaySchs = schedules.filter(s => s.date === today);

    // Daily progress (Target: 5 sessions)
    const dailyPerc = Math.min((todaySchs.length / 5) * 100, 100);
    const dProg = document.getElementById("dailyProgress");
    if (dProg) dProg.style.width = dailyPerc + "%";
    const dCount = document.getElementById("todaySchedules");
    if (dCount) dCount.innerText = todaySchs.length;

    // Weekly progress (Target: 25 sessions)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday as start
    const monday = new Date(now.setDate(diff));
    const startOfWeek = monday.toLocaleDateString('en-CA');

    const weeklySchs = schedules.filter(s => s.date >= startOfWeek);
    const weeklyPerc = Math.min((weeklySchs.length / 25) * 100, 100);
    const wProg = document.getElementById("weeklyProgress");
    if (wProg) wProg.style.width = weeklyPerc + "%";
    const wCount = document.getElementById("totalWeekSchedules");
    if (wCount) wCount.innerText = weeklySchs.length;

    // Averages and Subjects
    const avg = document.getElementById("avgSchedulesPerDay");
    if (avg) {
        const daysPassed = Math.max(1, new Date().getDay() || 7);
        avg.innerText = (weeklySchs.length / daysPassed).toFixed(1);
    }

    const getTopSubject = (list) => {
        if (list.length === 0) return "-";
        const counts = {};
        list.forEach(s => counts[s.subject] = (counts[s.subject] || 0) + 1);
        return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    };

    const topDay = document.getElementById("topSubjectToday");
    if (topDay) topDay.innerText = getTopSubject(todaySchs);
    const topWeek = document.getElementById("topSubjectWeek");
    if (topWeek) topWeek.innerText = getTopSubject(weeklySchs);
}

function editSchedule(index) {
    const sch = schedules[index];
    document.getElementById("scheduledate").value = sch.date;
    document.getElementById("scheduletime").value = sch.time;
    document.getElementById("Schedulesubject").value = sch.subject;
    document.getElementById("scheduleReason").value = sch.reason || "";
    schedules.splice(index, 1);
    saveSchedules();
    renderKanbanSchedules();
    renderDashboard();
}
function deleteSchedule(index) {
    if (!confirm("Delete this schedule?")) return;
    schedules.splice(index, 1);
    saveSchedules();
    renderKanbanSchedules();
    renderDashboard();
}
function saveSchedules() {
    localStorage.setItem(SCHEDULES_KEY, JSON.stringify(schedules));
}

//SCHEDULE ANALYSIS
function showDailyAnalysis() {
    document.getElementById("dailyAnalysis").style.display = "block";
    document.getElementById("weeklyAnalysis").style.display = "none";

    const today = new Date().toISOString().split("T")[0];
    const todaysSchedules = schedules.filter(s => s.date === today);
    document.getElementById("todaySchedules").innerText = todaysSchedules.length;

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const weekSchedules = schedules.filter(s => {
        const sDate = new Date(s.date);
        return sDate >= weekStart && sDate <= weekEnd;
    });
    document.getElementById("weekSchedules").innerText = weekSchedules.length;

    const subjectCount = {};
    todaysSchedules.forEach(s => {
        subjectCount[s.subject] = (subjectCount[s.subject] || 0) + 1;
    });
    const topSubject = Object.keys(subjectCount).reduce((a, b) => subjectCount[a] > subjectCount[b] ? a : b, "-");
    document.getElementById("topSubjectToday").innerText = topSubject;
}

function showWeeklyAnalysis() {
    document.getElementById("weeklyAnalysis").style.display = "block";
    document.getElementById("dailyAnalysis").style.display = "none";

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const weekSchedules = schedules.filter(s => {
        const sDate = new Date(s.date);
        return sDate >= weekStart && sDate <= weekEnd;
    });
    document.getElementById("totalWeekSchedules").innerText = weekSchedules.length;
    document.getElementById("avgSchedulesPerDay").innerText = (weekSchedules.length / 7).toFixed(1);

    const subjectCount = {};
    weekSchedules.forEach(s => {
        subjectCount[s.subject] = (subjectCount[s.subject] || 0) + 1;
    });
    const topSubject = Object.keys(subjectCount).reduce((a, b) => subjectCount[a] > subjectCount[b] ? a : b, "-");
    document.getElementById("topSubjectWeek").innerText = topSubject;
}

//SETTINGS
function resetData() {
    if (!confirm("Do you want to reset all data (including settings and focus stats)?")) return;

    subjects = [];
    tasks = [];
    schedules = [];
    goals = [];
    marks = [];
    exams = [];
    studyStreak = 0;

    localStorage.removeItem(SUBJECTS_KEY);
    localStorage.removeItem(TASKS_KEY);
    localStorage.removeItem(SCHEDULES_KEY);
    localStorage.removeItem(GOALS_KEY);
    localStorage.removeItem(MARKS_KEY);
    localStorage.removeItem(EXAMS_KEY);
    localStorage.removeItem('ssp_streak');
    localStorage.removeItem('ssp_focus_today');
    localStorage.removeItem(THEME_KEY);
    localStorage.removeItem(FONT_KEY);
    localStorage.removeItem('study_mode');

    alert("System reset successful. Reloading...");
    location.reload();
}

function exportData() {
    const data = {
        subjects,
        tasks,
        schedules,
        goals,
        marks,
        exams,
        settings: {
            theme: localStorage.getItem(THEME_KEY) || 'light',
            font: localStorage.getItem(FONT_KEY) || 'inter',
            studyMode: localStorage.getItem('study_mode') === 'true'
        },
        stats: {
            streak: studyStreak,
            focusToday: localStorage.getItem('ssp_focus_today') || 0
        }
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json"
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `smart-study-planner-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
}

function exportReportPDF() {
    const printWindow = window.open('', '_blank');
    const today = new Date().toLocaleDateString();

    let tasksHtml = tasks.map(t => `
        <tr>
            <td>${t.title}</td>
            <td>${t.subject}</td>
            <td>${t.date}</td>
            <td style="color: ${t.status === 'completed' ? '#27ae60' : '#f39c12'}">
                ${t.status.toUpperCase()}
            </td>
        </tr>
    `).join('');

    let schedulesHtml = schedules.map(s => `
        <tr>
            <td>${s.date}</td>
            <td>${s.time}</td>
            <td>${s.subject}</td>
            <td>${s.reason || '-'}</td>
        </tr>
    `).join('');

    let subjectsHtml = subjects.map(s => `
        <tr>
            <td>${s.name}</td>
            <td>${s.priority}</td>
        </tr>
    `).join('');

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Study Planner Report - ${today}</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
                h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
                h2 { color: #2980b9; margin-top: 30px; border-left: 5px solid #3498db; padding-left: 10px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                th { background-color: #f8f9fa; font-weight: bold; }
                .footer { margin-top: 50px; font-size: 0.8rem; color: #7f8c8d; text-align: center; }
                .summary-box { background: #f0f7ff; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            </style>
        </head>
        <body>
            <h1>Padh Lo - Academic Report</h1>
            <p><strong>Generated on:</strong> ${today}</p>

            <div class="summary-box">
                <p><strong>Total Subjects:</strong> ${subjects.length}</p>
                <p><strong>Ongoing Tasks:</strong> ${tasks.filter(t => t.status !== 'completed').length}</p>
                <p><strong>Completed Tasks:</strong> ${tasks.filter(t => t.status === 'completed').length}</p>
                <p><strong>Current Streak:</strong> ${studyStreak} Days</p>
            </div>

            <h2>Subjects Overview</h2>
            <table>
                <thead><tr><th>Subject Name</th><th>Priority</th></tr></thead>
                <tbody>${subjectsHtml || '<tr><td colspan="2">No subjects found</td></tr>'}</tbody>
            </table>

            <h2>Tasks List</h2>
            <table>
                <thead><tr><th>Task</th><th>Subject</th><th>Deadline</th><th>Status</th></tr></thead>
                <tbody>${tasksHtml || '<tr><td colspan="4">No tasks found</td></tr>'}</tbody>
            </table>

            <h2>Upcoming Schedules</h2>
            <table>
                <thead><tr><th>Date</th><th>Time</th><th>Subject</th><th>Notes</th></tr></thead>
                <tbody>${schedulesHtml || '<tr><td colspan="4">No schedules found</td></tr>'}</tbody>
            </table>

            <div class="footer">
                <p>Generated by Smart Study Planner - Padh Lo</p>
            </div>
            <script>window.print();<\/script>
        </body>
        </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
}
// Theme & Font
function setTheme(theme) {
    document.body.className = theme;
    // Keep font class if present
    const savedFont = localStorage.getItem(FONT_KEY);
    if (savedFont) document.body.classList.add('font-' + savedFont);
    localStorage.setItem(THEME_KEY, theme);
}

function setFont(fontName) {
    document.body.classList.remove('font-inter', 'font-poppins', 'font-serif', 'font-mono');
    document.body.classList.add('font-' + fontName);
    localStorage.setItem(FONT_KEY, fontName);
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = JSON.parse(e.target.result);

            // Core Data
            localStorage.setItem(SUBJECTS_KEY, JSON.stringify(data.subjects || []));
            localStorage.setItem(TASKS_KEY, JSON.stringify(data.tasks || []));
            localStorage.setItem(SCHEDULES_KEY, JSON.stringify(data.schedules || []));
            localStorage.setItem(GOALS_KEY, JSON.stringify(data.goals || []));
            localStorage.setItem(MARKS_KEY, JSON.stringify(data.marks || []));
            localStorage.setItem(EXAMS_KEY, JSON.stringify(data.exams || []));

            // Stats
            if (data.stats) {
                localStorage.setItem('ssp_streak', data.stats.streak || 0);
                localStorage.setItem('ssp_focus_today', data.stats.focusToday || 0);
            }

            // Settings
            if (data.settings) {
                localStorage.setItem(THEME_KEY, data.settings.theme || 'light');
                localStorage.setItem(FONT_KEY, data.settings.font || 'inter');
                localStorage.setItem('study_mode', data.settings.studyMode || false);
            }

            alert("All package data imported successfully! The app will now refresh.");
            location.reload();
        } catch (err) {
            console.error(err);
            alert("Error importing data. Please ensure you are using a valid backup file.");
        }
    };
    reader.readAsText(file);
}

function toggleStudyMode() {
    document.body.classList.toggle('study-mode');
    const isStudy = document.body.classList.contains('study-mode');
    localStorage.setItem('study_mode', isStudy);
}

//GOAL MANAGEMENT
function addGoal() {
    const goal = document.getElementById("goalInput").value.trim();
    const type = document.getElementById("goalType").value;
    const date = document.getElementById("goalDate").value;

    if (!goal || !date) {
        alert("Fill everything");
        return;
    }
    const newGoal = { goal, type, date, progress: 0 };
    goals.push(newGoal);

    saveGoals();
    renderGoals();

    document.getElementById("goalInput").value = "";
    document.getElementById("goalDate").value = "";
}
function renderGoals() {
    const list = document.getElementById("goalList");
    list.innerHTML = "";

    if (goals.length === 0) {
        list.innerHTML = "<p>No goals added yet.</p>";
        return;
    }

    goals.forEach((g, index) => {
        const card = document.createElement("div");
        card.className = "small-card";

        card.innerHTML = `
            <h4>${g.goal}</h4>
            <p>Type: ${g.type}</p>
            <p>Deadline: ${g.date}</p>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${g.progress}%"></div>
            </div>
            <p>Progress: ${g.progress}%</p>
            <div class="card-actions">
                <button onclick="updateProgress(${index})">Update Progress</button>
                <button onclick="deleteGoal(${index})">Delete</button>
            </div>
        `;

        list.appendChild(card);
    });
}
function updateProgress(index) {
    const progress = prompt("Enter progress percentage (0-100):");
    if (progress !== null && !isNaN(progress) && progress >= 0 && progress <= 100) {
        goals[index].progress = parseInt(progress);
        saveGoals();
        renderGoals();
    }
}
function deleteGoal(index) {
    if (!confirm("Delete this goal?")) return;
    goals.splice(index, 1);
    saveGoals();
    renderGoals();
}
function saveGoals() {
    localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
}

//GPA MANAGEMENT
function addMarks() {
    const course = document.getElementById("courseInput").value.trim();
    const markValue = parseFloat(document.getElementById("marksInput").value);
    const weightage = parseFloat(document.getElementById("weightage").value);

    if (!course || isNaN(markValue) || markValue < 0 || markValue > 100) {
        alert("Enter valid course and marks");
        return;
    }
    const markEntry = { course, marks: markValue, weightage };
    marks.push(markEntry);

    saveMarks();
    renderMarks();
    calculateGPA();

    document.getElementById("courseInput").value = "";
    document.getElementById("marksInput").value = "";
}
function renderMarks() {
    const list = document.getElementById("marksList");
    list.innerHTML = "";

    if (marks.length === 0) {
        list.innerHTML = "<p>No marks added yet.</p>";
        return;
    }

    marks.forEach((m, index) => {
        const card = document.createElement("div");
        card.className = "small-card";

        card.innerHTML = `
            <h4>${m.course}</h4>
            <p>Marks: ${m.marks}%</p>
            <p>Weightage: ${m.weightage * 100}%</p>
            <div class="card-actions">
                <button onclick="deleteMark(${index})">Delete</button>
            </div>
        `;

        list.appendChild(card);
    });
}
function deleteMark(index) {
    if (!confirm("Delete this mark?")) return;
    marks.splice(index, 1);
    saveMarks();
    renderMarks();
    calculateGPA();
}
function getGradePoints(marks) {
    if (marks >= 90) return 4.0;
    if (marks >= 80) return 3.0;
    if (marks >= 70) return 2.0;
    if (marks >= 60) return 1.0;
    return 0.0;
}

function calculateGPA() {
    if (marks.length === 0) {
        document.getElementById("currentGPA").innerText = "0.00";
        document.getElementById("estimatedGrade").innerText = "-";
        return;
    }

    let totalWeightedPoints = 0;
    let totalWeightage = 0;

    marks.forEach(m => {
        const gradePoints = getGradePoints(m.marks);
        totalWeightedPoints += gradePoints * m.weightage;
        totalWeightage += m.weightage;
    });

    const gpa = totalWeightage > 0 ? (totalWeightedPoints / totalWeightage).toFixed(2) : 0.00;
    document.getElementById("currentGPA").innerText = gpa;

    let grade = "-";
    if (gpa >= 3.7) grade = "A";
    else if (gpa >= 3.0) grade = "B";
    else if (gpa >= 2.0) grade = "C";
    else if (gpa >= 1.0) grade = "D";
    else grade = "F";
    document.getElementById("estimatedGrade").innerText = grade;
}
function saveMarks() {
    localStorage.setItem(MARKS_KEY, JSON.stringify(marks));
}

//DEADLINE REMINDER
function checkDeadlines() {
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const urgentTasks = tasks.filter(t => t.date === tomorrowStr && t.status !== 'completed');
    const overdueTasks = tasks.filter(t => t.date < today && t.status !== 'completed');

    if (urgentTasks.length > 0) {
        alert(`Reminder: You have ${urgentTasks.length} task(s) due tomorrow!`);
    }
    if (overdueTasks.length > 0) {
        alert(`Alert: You have ${overdueTasks.length} overdue task(s)!`);
    }
}

// FOCUS TIMER LOGIC
let timerInterval;
let startTime;
let elapsedTime = 0;

function startTimer() {
    startTime = Date.now() - elapsedTime;
    timerInterval = setInterval(() => {
        elapsedTime = Date.now() - startTime;
        updateTimerDisplay();
    }, 1000);
    document.getElementById("startBtn").style.display = "none";
    document.getElementById("stopBtn").style.display = "inline-block";
}

function stopTimer() {
    clearInterval(timerInterval);
    document.getElementById("startBtn").style.display = "inline-block";
    document.getElementById("stopBtn").style.display = "none";
    saveFocusTime();
}

function resetTimer() {
    stopTimer();
    elapsedTime = 0;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const totalSeconds = Math.floor(elapsedTime / 1000);
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    document.getElementById("timerDisplay").innerText =
        `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function saveFocusTime() {
    const totalMins = Math.floor(elapsedTime / 60000);
    localStorage.setItem('ssp_focus_today', totalMins);
    document.getElementById("todayTotalFocus").innerText = totalMins + "m";
}

function updateStudyStreak() {
    const today = new Date().toISOString().split("T")[0];
    const completedToday = tasks.filter(t => t.completedDate === today).length;
    if (completedToday > 0) {
        studyStreak = (parseInt(localStorage.getItem('ssp_streak')) || 0) + 1;
        localStorage.setItem('ssp_streak', studyStreak);
    }
    const streakEl = document.getElementById("studyStreak");
    if (streakEl) streakEl.innerText = studyStreak + " days";

    // Also load focus time
    const focusToday = localStorage.getItem('ssp_focus_today') || 0;
    document.getElementById("todayTotalFocus").innerText = focusToday + "m";
}

function calculateProductivityScore() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const score = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const scoreEl = document.getElementById("productivityScore");
    if (scoreEl) scoreEl.innerText = score + "%";
}

//EXAM MANAGEMENT
function setDashboardExams() {
    const nameEl = document.getElementById("examNameInput") || document.getElementById("examName");
    const dateEl = document.getElementById("examDateInput") || document.getElementById("examDate");

    const name = nameEl ? nameEl.value.trim() : "";
    const date = dateEl ? dateEl.value : "";

    if (!name || !date) {
        alert("Please enter both exam name and date.");
        return;
    }

    const exam = { name, date };
    exams.push(exam);
    if (exams.length > 20) exams.shift();

    saveExams();
    updateCountdown();

    if (nameEl) nameEl.value = "";
    if (dateEl) dateEl.value = "";

    const examListEl = document.getElementById("examList");
    if (examListEl) renderExams();
}
function renderExams() {
    const list = document.getElementById("examList");
    list.innerHTML = "";

    if (exams.length === 0) {
        list.innerHTML = "<p>No exams added yet.</p>";
        return;
    }

    exams.forEach((exam, index) => {
        const card = document.createElement("div");
        card.className = "small-card";

        card.innerHTML = `
            <h4>${exam.name}</h4>
            <p>Date: ${exam.date}</p>
            <div class="card-actions">
                <button onclick="deleteExam(${index})">Delete</button>
            </div>
        `;

        list.appendChild(card);
    });
}
function deleteExam(index) {
    if (!confirm("Delete this exam?")) return;
    exams.splice(index, 1);
    saveExams();
    renderExams();
    updateCountdown();
}
function saveExams() {
    localStorage.setItem(EXAMS_KEY, JSON.stringify(exams));
}

//EXAM COUNTDOWN
function setExamCountdown() {
    setDashboardExams();
}
function updateCountdown() {
    const display = document.getElementById("countdownDisplay");
    if (!display) return;

    if (exams.length === 0) {
        display.innerHTML = "<p>No exam set</p>";
        return;
    }

    const now = new Date();
    // Get up to 2 upcoming exams
    const upcomingExams = exams
        .filter(exam => new Date(exam.date) >= now.setHours(0, 0, 0, 0))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 2);

    if (upcomingExams.length === 0) {
        display.innerHTML = "<p>No upcoming exams</p>";
        return;
    }

    display.innerHTML = "";
    upcomingExams.forEach(exam => {
        const examDate = new Date(exam.date);
        const timeDiff = examDate - new Date();
        const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

        const examDiv = document.createElement("div");
        examDiv.className = "exam-item";

        let label = daysLeft > 0 ? `${daysLeft} days left` : (daysLeft === 0 ? "Today!" : "Passed");
        examDiv.innerHTML = `<strong>${exam.name}</strong>: ${label}`;
        display.appendChild(examDiv);
    });
}



function checkDeadlines() {
    const today = getTodayStr();
    const tomorrowStr = getTodayStr(1);

    const todayTasks = tasks.filter(t => t.date === today && t.status !== 'completed');
    const tomorrowTasks = tasks.filter(t => t.date === tomorrowStr && t.status !== 'completed');

    if (todayTasks.length > 0 || tomorrowTasks.length > 0) {
        let msg = "Deadline Alert:\n";
        if (todayTasks.length > 0) msg += `- ${todayTasks.length} tasks due TODAY\n`;
        if (tomorrowTasks.length > 0) msg += `- ${tomorrowTasks.length} tasks due TOMORROW\n`;
        // Use a non-blocking way if possible, but alert is requirement-friendly
        console.log(msg);
        // alert(msg); // Optional: Uncomment if the user specifically wants annoying popups
    }
}

function init() {
    renderKanbanSchedules();
    renderTasks();
    renderSubjects();
    renderGoals();
    renderMarks();
    renderExams();
    calculateGPA();
    updateSubjectDropdown();
    renderDashboard();
    renderTaskChart();
    renderTaskStatusChart();
    calculateProductivityScore();
    updateStudyStreak();
    updateCountdown();
    displayRandomQuote();

    const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
    const savedFont = localStorage.getItem(FONT_KEY) || 'inter';
    document.body.className = savedTheme;
    document.body.classList.add('font-' + savedFont);

    checkDeadlines();
    showpage('dashboard');
}
document.addEventListener("DOMContentLoaded", init);
