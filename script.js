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
function addSchedule(){

}
function resetData(){

}
function exportData(){

}
function setTheme(theme){

}