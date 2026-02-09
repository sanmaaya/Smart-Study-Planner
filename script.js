//keys for localstorage
const SUBJECTS_KEY="ssp_subjects";
const TASKS_KEY="ssp_tasks";
const SCHEDULES_KEY="ssp_schedules";
const THEME_KEY="ssp_theme";

// from storage
let subjects=JSON.parse(localStorage.getItem(SUBJECTS_KEY)) || [];
let tasks=JSON.parse(localStorage.getItem(TASKS_KEY)) || [];
let schedules = JSON.parse(localStorage.getItem(SCHEDULES_KEY)) || [];

//Which page to show
function showpage(pageId){
    document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
    document.getElementById(pageId).classList.add("active");
}
//DASHBOARD
function renderDashboard(){
    document.getElementById("totalSubjects").innerText=subjects.length;
    document.getElementById("pendingTasks").innerText=tasks.length;

    const today=new Date().toISOString().split("T")[0];
    const upcoming=schedules.filter(s => s.date >=today).length;
    document.getElementById("upcomingschedules").innerText=upcoming;

    const todayList=document.getElementById("todayList");
    todayList.innerHTML="";

    const todaysTask=tasks.filter(t=>t.date===today);
    const todaysSchedule=schedules.filter(s=>s.date===today);

    if(todaysTask.length===0 && todaysSchedule.length===0){
        todayList.innerHTML="<p>No tasks or schedules for today!</p>";
        return;
    }
    todaysTask.forEach(t=>{
        const li=document.createElement("li");
        li.textContent=`Task: ${t.title} - ${t.subject}`;
        todayList.appendChild(li);
    });
    todaysSchedule.forEach(s=>{
        const li=document.createElement("li");
        li.textContent=`Schedule: ${s.subject} at ${s.time}`;
        todayList.appendChild(li);
    });
}

//CHART FOR PROGRESS ANALYSIS
function renderTaskChart(){
    const ctx=document.getElementById("taskChart");
    if(!ctx) return;

    const subjectCount={};
    tasks.forEach(task=>{
        subjectCount[task.subject]=(subjectCount[task.subject] || 0)+1;
    });

    const labels=Object.keys(subjectCount);
    const data=Object.values(subjectCount);
     if (window.taskChartInstance) {
        window.taskChartInstance.destroy();
    }

    window.taskChartInstance = new Chart(ctx, {
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
                     position: "right"
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

//SUBJECT MANAGEMENT
//to add the subject
function addSubject(){
    const name=document.getElementById("subjectInput").value.trim();
    const priority=document.getElementById("subjectpriority").value;
    if(!name){
        alert("Please enter a subject name");
        return;
    }
    if(subjects.some(s=>s.name === name)){
        alert("Subject already exists");
        return;
    }
    const subject={name,priority};
    subjects.push(subject);
    saveSubjects(); //function called to save sub
    renderSubjects(); // function called to render sub
    updateSubjectDropdown(); //function called to update the dropdown
    renderDashboard();
    renderTaskChart();
    document.getElementById("subjectInput").value="";
}
function renderSubjects(){
    const list=document.getElementById("subjectlist");
    list.innerHTML="";
    subjects.forEach((sub,index)=>{
        const li=document.createElement("li");
        li.innerHTML=`<strong>${sub.name}</strong> (${sub.priority})
        <button onclick="editSubject(${index})">Edit</button>
        <button onclick="deleteSubject(${index})">Delete</button>`;
        list.appendChild(li);
    });
}
function editSubject(index){
    const subject=subjects[index];
    document.getElementById("subjectInput").value=subject.name;
    document.getElementById("subjectpriority").value=subject.priority;

    subjects.splice(index,1);
    saveSubjects();
    renderSubjects();
    updateSubjectDropdown();
    renderDashboard();
    renderTaskChart();
}
function deleteSubject(index){
    if(!confirm("Delete this subject?")) return;

    subjects.splice(index,1);
    saveSubjects();
    renderSubjects();
    updateSubjectDropdown();
    renderDashboard();
    renderTaskChart();
}
function saveSubjects(){
    localStorage.setItem(SUBJECTS_KEY,JSON.stringify(subjects));
}
function updateSubjectDropdown(){
    const taskSelect=document.getElementById("taskSubject");
    const scheduleSelect=document.getElementById("Schedulesubject");

    taskSelect.innerHTML='<option value="">Select Subject</option>';
    scheduleSelect.innerHTML='<option value="">Select Subject</option>';

    subjects.forEach(sub=>{
        const opt1=document.createElement("option");
        opt1.value=sub.name;
        opt1.textContent=sub.name;

        const opt2=opt1.cloneNode(true);

        taskSelect.appendChild(opt1);
        scheduleSelect.appendChild(opt2);
    });
}
//TASK MANAGEMENT

function addTask(){
    const title=document.getElementById("taskInput").value.trim();
    const date=document.getElementById("taskDate").value;
    const subject=document.getElementById("taskSubject").value;

    if(!title || !date || !subject){
        alert("Fill everything");
        return;
    }
    const task={title,date,subject};
    tasks.push(task);

    saveTasks();
    renderTasks();
    renderDashboard();
    renderTaskChart();


    document.getElementById("taskInput").value="";
    document.getElementById("taskDate").value="";
    document.getElementById("taskSubject").value="";
}
function renderTasks(){
    const list=document.getElementById("taskList");
    list.innerHTML="";
    tasks.forEach((task,index)=>{
        const li=document.createElement("li");
        li.innerHTML=`<strong>${task.title}</strong><br>${task.subject} | ${task.date}
        <button onclick="DoneTask(${index})">Done</button>`;
        list.appendChild(li);
    });
}
function DoneTask(index){
    tasks.splice(index,1);
    saveTasks();
    renderTasks();
    renderDashboard();
    renderTaskChart();

}
function saveTasks(){
    localStorage.setItem(TASKS_KEY,JSON.stringify(tasks));
}

//SCHEDULE MANAGEMENT
function addSchedule(){
    const date=document.getElementById("scheduledate").value;
    const time=document.getElementById("scheduletime").value;
    const subject=document.getElementById("Schedulesubject").value;

    if(!date || !time || !subject){
        alert("Fill everything");
        return;
    }

    const schedule={date,time,subject};
    schedules.push(schedule);

    saveSchedules();
    renderSchedules();
    renderDashboard();
    renderTaskChart();



    document.getElementById("scheduledate").value="";
    document.getElementById("scheduletime").value="";
    document.getElementById("Schedulesubject").value="";
}
function renderSchedules(){
    const list=document.getElementById("schedulelist");
    list.innerHTML="";
    schedules.forEach((sch,index)=>{
        const li=document.createElement("li");
        li.innerHTML=`${sch.subject} - ${sch.date} at ${sch.time}
        <button onclick="editSchedule(${index})">Edit</button>
        <button onclick="deleteSchedule(${index})">Delete</button>`;
        list.appendChild(li);
    });
}
function editSchedule(index){
    const sch=schedules[index];
    document.getElementById("scheduledate").value=sch.date;
    document.getElementById("scheduletime").value=sch.time;
    document.getElementById("Schedulesubject").value=sch.subject;
    schedules.splice(index,1);
    saveSchedules();
    renderSchedules();
    renderDashboard();
    renderTaskChart();
}
function deleteSchedule(index){
    if(!confirm("Delete this schedule?")) return;
    schedules.splice(index,1);
    saveSchedules();
    renderSchedules();
    renderDashboard();
    renderTaskChart();
}
function saveSchedules(){
    localStorage.setItem(SCHEDULES_KEY,JSON.stringify(schedules));
}

//SETTINGS
function resetData(){
    if(!confirm("Do you want to reset all data?")) return;

    subjects=[];
    tasks=[];
    schedules=[];

    localStorage.removeItem(SUBJECTS_KEY);
    localStorage.removeItem(TASKS_KEY);
    localStorage.removeItem(SCHEDULES_KEY);

    renderSubjects();
    renderTasks();
    renderSchedules();
    updateSubjectDropdown();
    renderDashboard();
    renderTaskChart();

}
function exportData(){
    const data={subjects,tasks,schedules};
    const blob=new Blob([JSON.stringify(data,null,2)],{
        type:"application/json"
    });
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download="smart-study-planner-data.json";
    a.click();
}
function setTheme(theme){
    document.body.className=theme;
    localStorage.setItem(THEME_KEY,theme);
}
function init(){
    renderSchedules();
    renderTasks();
    renderSubjects();
    updateSubjectDropdown();
    renderDashboard();
    renderTaskChart();
    const savedTheme=localStorage.getItem(THEME_KEY);
    if(savedTheme) document.body.className=savedTheme;
}
document.addEventListener("DOMContentLoaded", init);