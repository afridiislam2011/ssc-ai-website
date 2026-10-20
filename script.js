const subjectsByLevel = {
  SSC: [
    "গণিত","উচ্চতর গণিত","পদার্থবিজ্ঞান","রসায়ন","জীববিজ্ঞান",
    "বাংলা","English","বাংলাদেশ ও বিশ্বপরিচয়","ধর্ম ও নৈতিক শিক্ষা",
    "তথ্য ও যোগাযোগ প্রযুক্তি (ICT)","কৃষিশিক্ষা","গার্হস্থ্য বিজ্ঞান","অন্যান্য"
  ],
  HSC: [
    "পদার্থবিজ্ঞান","রসায়ন","উচ্চতর গণিত","জীববিজ্ঞান","বাংলা","English",
    "তথ্য ও যোগাযোগ প্রযুক্তি (ICT)","অর্থনীতি","হিসাববিজ্ঞান","ব্যবসায় সংগঠন ও ব্যবস্থাপনা",
    "পৌরনীতি ও সুশাসন","ইতিহাস","ভূগোল","যুক্তিবিদ্যা","মনোবিজ্ঞান","অন্যান্য"
  ]
};

const levelEl = document.getElementById("level");
const subjectEl = document.getElementById("subject");
const taskEl = document.getElementById("task");
const languageEl = document.getElementById("language");
const questionEl = document.getElementById("question");
const solveBtn = document.getElementById("solveBtn");
const answerSection = document.getElementById("answerSection");
const answerTitle = document.getElementById("answerTitle");
const answerContent = document.getElementById("answerContent");
const charCount = document.getElementById("charCount");

function updateSubjects() {
  const previous = subjectEl.value;
  subjectEl.replaceChildren();
  subjectsByLevel[levelEl.value].forEach(subject => {
    const option = document.createElement("option");
    option.value = subject;
    option.textContent = subject;
    subjectEl.appendChild(option);
  });
  if ([...subjectEl.options].some(option => option.value === previous)) {
    subjectEl.value = previous;
  }
}
levelEl.addEventListener("change", updateSubjects);
questionEl.addEventListener("input", () => {
  charCount.textContent = `${questionEl.value.length} / 8000`;
});

document.getElementById("clearBtn").addEventListener("click", () => {
  questionEl.value = "";
  charCount.textContent = "0 / 8000";
  questionEl.focus();
});

document.getElementById("demoBtn").addEventListener("click", () => {
  levelEl.value = "SSC";
  updateSubjects();
  subjectEl.value = "পদার্থবিজ্ঞান";
  taskEl.value = "solve";
  languageEl.value = "বাংলা";
  questionEl.value = "একটি বস্তুর ভর ২ kg এবং ত্বরণ ৩ m/s²। নিউটনের দ্বিতীয় সূত্র ব্যবহার করে বল নির্ণয় করো।";
  charCount.textContent = `${questionEl.value.length} / 8000`;
  questionEl.focus();
});

function addText(parent, tag, text) {
  const el = document.createElement(tag);
  el.textContent = text;
  parent.appendChild(el);
}

solveBtn.addEventListener("click", () => {
  const question = questionEl.value.trim();
  if (!question) {
    questionEl.focus();
    questionEl.setCustomValidity("আগে তোমার প্রশ্নটি লিখো।");
    questionEl.reportValidity();
    questionEl.setCustomValidity("");
    return;
  }

  answerContent.replaceChildren();
  answerTitle.textContent = "তোমার প্রশ্ন প্রস্তুত";
  addText(answerContent, "p", `স্তর: ${levelEl.value} | বিষয়: ${subjectEl.value}`);
  addText(answerContent, "p", `কাজ: ${taskEl.options[taskEl.selectedIndex].text}`);
  addText(answerContent, "p", `ভাষা: ${languageEl.value}`);
  addText(answerContent, "h3", "তোমার প্রশ্ন");
  addText(answerContent, "p", question);
  addText(answerContent, "h3", "পরবর্তী ধাপ");
  addText(answerContent, "p", "এই prototype-এ এখনো AI API সংযুক্ত করা হয়নি। পরের ধাপে নিরাপদ backend যোগ করে এখানে AI-এর ব্যাখ্যাসহ উত্তর দেখানো হবে।");
  answerSection.hidden = false;
  document.getElementById("demoWarning").hidden = false;
  answerSection.scrollIntoView({ behavior: "smooth", block: "start" });
});

updateSubjects();
