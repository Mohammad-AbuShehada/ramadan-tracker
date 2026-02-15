const days = 30;
const prayerGoal = 150;
const readingGoal = 30;
const tableBody = document.getElementById("tableBody");

for(let i=1; i<=days; i++){
    let week = Math.ceil(i/7);
    let row = document.createElement("tr");
    row.dataset.week = week;
    row.innerHTML = `
        <td>${i}</td>
        <td><input type="checkbox" class="prayer"></td>
        <td><input type="checkbox" class="prayer"></td>
        <td><input type="checkbox" class="prayer"></td>
        <td><input type="checkbox" class="prayer"></td>
        <td><input type="checkbox" class="prayer"></td>
        <td><input type="number" min="0" max="1" class="reading"></td>
    `;
    tableBody.appendChild(row);
}

const prayerChart = new Chart(document.getElementById("prayerChart"),{
    type: "doughnut",
    data: {labels: ["منجز","متبقي"], datasets:[{data:[0,prayerGoal],backgroundColor:["#16a34a","#d1d5db"]}]}
});

const readingChart = new Chart(document.getElementById("readingChart"),{
    type: "doughnut",
    data: {labels: ["منجز","متبقي"], datasets:[{data:[0,readingGoal],backgroundColor:["#16a34a","#d1d5db"]}]}
});

function update(){
    let prayers = document.querySelectorAll(".prayer:checked").length;
    let reading = [...document.querySelectorAll(".reading")].reduce((a,b)=>a+Number(b.value),0);

    document.getElementById("totalPrayers").textContent = prayers;
    document.getElementById("totalReading").textContent = reading;

    let percent = Math.floor(((prayers/prayerGoal)+(reading/readingGoal))/2*100);
    document.getElementById("percentage").textContent = percent+"%";

    let completed = [...document.querySelectorAll("#tableBody tr")].filter(r=>{
        let checks = [...r.querySelectorAll(".prayer")];
        let read = r.querySelector(".reading");
        return checks.every(c=>c.checked) && Number(read.value)===1;
    });

    document.getElementById("completedDays").textContent = completed.length;

    prayerChart.data.datasets[0].data = [prayers,prayerGoal-prayers];
    readingChart.data.datasets[0].data = [reading,readingGoal-reading];
    prayerChart.update();
    readingChart.update();

    document.querySelectorAll("#tableBody tr").forEach(r=>{
        let checks = [...r.querySelectorAll(".prayer")];
        let read = r.querySelector(".reading");
        if(checks.every(c=>c.checked) && Number(read.value)===1){
            r.classList.add("completed");
        } else r.classList.remove("completed");
    });

    localStorage.setItem("ramadanData", JSON.stringify({
        prayers: [...document.querySelectorAll(".prayer")].map(i=>i.checked),
        reading: [...document.querySelectorAll(".reading")].map(i=>i.value)
    }));
}

function load(){
    let data = JSON.parse(localStorage.getItem("ramadanData"));
    if(!data) return;
    document.querySelectorAll(".prayer").forEach((i,x)=> i.checked = data.prayers[x]);
    document.querySelectorAll(".reading").forEach((i,x)=> i.value = data.reading[x]);
}

document.addEventListener("change", update);

document.getElementById("weekFilter").addEventListener("change", e=>{
    let v = e.target.value;
    document.querySelectorAll("#tableBody tr").forEach(r=>{
        r.style.display = v==="all"?"":r.dataset.week===v?"":"none";
    });
});

document.getElementById("modeToggle").addEventListener("click", ()=>{
    document.body.classList.toggle("dark");
});

document.getElementById("clearAll").addEventListener("click", ()=>{
    localStorage.removeItem("ramadanData");
    document.querySelectorAll(".prayer").forEach(i=>i.checked=false);
    document.querySelectorAll(".reading").forEach(i=>i.value="");
    update();
});

document.getElementById("exportJSON").addEventListener("click", ()=>{
    const data = {
        prayers: [...document.querySelectorAll(".prayer")].map(i=>i.checked),
        reading: [...document.querySelectorAll(".reading")].map(i=>i.value)
    };
    const blob = new Blob([JSON.stringify(data)], {type:"application/json"});
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "ramadan-tracker.json";
    link.click();
});

document.getElementById("importJSON").addEventListener("click", ()=>{
    document.getElementById("jsonInput").click();
});

document.getElementById("jsonInput").addEventListener("change", async e=>{
    const file = e.target.files[0];
    if(!file) return;
    const text = await file.text();
    const data = JSON.parse(text);

    document.querySelectorAll(".prayer").forEach((checkbox, index)=>{
        if(data.prayers[index]!==undefined){
            checkbox.checked = data.prayers[index];
        }
    });
    document.querySelectorAll(".reading").forEach((input,index)=>{
        if(data.reading[index]!==undefined){
            input.value = data.reading[index];
        }
    });
    update();
});

document.getElementById("exportPDF").addEventListener("click", ()=>{
    html2canvas(document.querySelector(".container-fluid")).then(canvas=>{
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jspdf.jsPDF({orientation:"portrait",unit:"px",format:"a4"});
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData,"PNG",0,0,pdfWidth,pdfHeight);
        pdf.save("ramadan-tracker.pdf");
    });
});

load();
update();