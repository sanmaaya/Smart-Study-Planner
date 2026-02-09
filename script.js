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
    document.getElementById("subjectInput").value="";
}
function renderSubjects(){
    const list=document.getElementById("subjectlist");
    list.innerHTML="";
    subjects.forEach(sub=>{
        const li=document.createElement("li");
        li.innerHTML='<strong>${sub.name}</strong> (${sub.priority})';
        list.appendChild(li);
    });
}
function saveSubjects(){
    localStorage.setItem(SUBJECTS_KEY,JSON.stringify(subjects));
}
function updateSubjectDropdown(){
    const taskSelect=document.getElementById("taslSubject");
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

    document.getElementById("taskInput").value="";
    document.getElementById("taskDate").value="";
    document.getElementById("taskSubject").value="";
}
function renderTasks(){
    const list=document.getElementById("tasklist");
    list.innerHTML="";
    task.forEach((task,index)=>{
        const li=document.createElement("li");
        li.innerHTML='<strong>${task.title}</strong><br>${task.subject} | ${task.date}';
        li.onclick=()=>deleteTask(index);
        list.appendChild(li);
    });
}
function deleteTask(index){
    tasks.splice(index,1);
    saveTasks();
    renderTasks();
}
function saveTasks(){
    localStorage.setItem(TASKS_KEY,JSON.stringify(tasks));
}

//SCHEDULE MANAGEMENT
function addSchedule(){
    const data=document.getElementById("scheduledate").value;
    const time=document.getElementById("scheduletime").value;
    const subject=document.getElementById("Schedulesubject").value;

    if(!date || !time || !subject){
        alert("Fill everything");
        return;
    }

    const schedule={date,time,subject};
    schedule.push(schedule);

    saveSchedules();
    renderSchedules();

    document.getElementById("scheduledate").value="";
    document.getElementById("scheduletime").value="";
    document.getElementById("Schedulesubject").value="";
}
function renderSchedule(){
    const list=document.getElementById("schedulelist");
    list.innerHTML="";
    schedules.forEach((sch,index)=>{
        const li=document.createElement("li");
        li.innerHTML=`${sch.subject} - ${sch.date} at ${sch.time}`;
        li.onclick=()=>deleteSchedule(index);
        list.appendChild(li);
    });
}
function deleteSchedule(index){
    schedules.splice(index,1);
    saveSchedules();
    renderSchedules();
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
    localStorage.setItem(THEME_KEY.theme);
}
function init(){
    renderSchedule();
    renderTasks();
    renderSubjects();
    updateSubjectDropdown();
    const savedTheme=localStorage.getItem(THEME_KEY);
    if(savedTheme) document.body.className=savedTheme;
}
init();