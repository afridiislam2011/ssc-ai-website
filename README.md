const subjectsByLevel = {
  SSC: [
    "গণিত", "উচ্চতর গণিত", "পদার্থবিজ্ঞান", "রসায়ন",
    "জীববিজ্ঞান", "বাংলা", "English",
    "বাংলাদেশ ও বিশ্বপরিচয়", "ধর্ম ও নৈতিক শিক্ষা",
    "তথ্য ও যোগাযোগ প্রযুক্তি (ICT)", "কৃষিশিক্ষা",
    "গার্হস্থ্য বিজ্ঞান", "অন্যান্য"
  ],
  HSC: [
    "পদার্থবিজ্ঞান", "রসায়ন", "উচ্চতর গণিত", "জীববিজ্ঞান",
    "বাংলা", "English", "তথ্য ও যোগাযোগ প্রযুক্তি (ICT)",
    "অর্থনীতি", "হিসাববিজ্ঞান", "অন্যান্য"
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

  (subjectsByLevel[levelEl.value] || subjectsByLevel.SSC)
    .forEach(subject => {
      const option = document.createElement("option");
      option.value = subject;
      option.textContent = subject;
      subjectEl.appendChild(option);
    });

  if ([...subjectEl.options].some(o => o.value === previous)) {
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
  questionEl.value =
    "একটি বস্তুর ভর ২ kg এবং ত্বরণ ৩ m/s²। নিউটনের দ্বিতীয় সূত্র ব্যবহার করে বল নির্ণয় করো।";
  charCount.textContent = `${questionEl.value.length} / 8000`;
  questionEl.focus();
});

// বাংলা ও আরবি-ইন্ডিক অঙ্ককে ইংরেজি অঙ্কে রূপান্তর
function normalizeDigits(text) {
  const bn = "০১২৩৪৫৬৭৮৯";
  const ar = "٠١٢٣٤٥٦٧٨٩";

  return text
    .replace(/[০-৯]/g, d => bn.indexOf(d))
    .replace(/[٠-٩]/g, d => ar.indexOf(d))
    .replace(/[−–]/g, "-")
    .replace(/[×✕]/g, "*")
    .replace(/[÷]/g, "/")
    .replace(/,/g, "");
}

// নিরাপদ arithmetic parser: eval() ব্যবহার করা হয় না
function calculate(expression) {
  const s = expression.replace(/\s/g, "");

  if (!s || s.length > 150) {
    throw new Error("হিসাবটি পরীক্ষা করে আবার লেখো।");
  }

  const tokens = s.match(
    /(?:\d+(?:\.\d*)?|\.\d+)|[()+\-*/^]/g
  );

  if (!tokens || tokens.join("") !== s) {
    throw new Error("শুধু সংখ্যা, বন্ধনী ও + − × ÷ ^ ব্যবহার করো।");
  }

  const output = [];
  const operators = [];
  const precedence = { "+": 1, "-": 1, "*": 2, "/": 2, "u-": 3, "^": 4 };
  let previous = "start";

  for (const token of tokens) {
    if (/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(token)) {
      if (previous === "number" || previous === ")") {
        throw new Error("অঙ্কটি সঠিকভাবে লেখো।");
      }
      output.push(Number(token));
      previous = "number";
    } else if (token === "(") {
      if (previous === "number" || previous === ")") {
        throw new Error("গুণের চিহ্ন (*) ব্যবহার করো।");
      }
      operators.push(token);
      previous = "(";
    } else if (token === ")") {
      if (previous === "start" || previous === "(" || previous === "operator") {
        throw new Error("বন্ধনী পরীক্ষা করো।");
      }
      while (operators.length && operators.at(-1) !== "(") {
        output.push(operators.pop());
      }
      if (!operators.length) throw new Error("বন্ধনী মেলেনি।");
      operators.pop();
      previous = ")";
    } else {
      let op = token;

      if (op === "-" && ["start", "(", "operator"].includes(previous)) {
        op = "u-";
      } else if (["start", "(", "operator"].includes(previous)) {
        throw new Error("হিসাবটি সম্পূর্ণ করো।");
      }

      while (operators.length && operators.at(-1) !== "(") {
        const top = operators.at(-1);
        const higher = precedence[top] > precedence[op];
        const equalLeft = precedence[top] === precedence[op] && op !== "^";
        if (!higher && !equalLeft) break;
        output.push(operators.pop());
      }

      operators.push(op);
      previous = "operator";
    }
  }

  if (["start", "(", "operator"].includes(previous)) {
    throw new Error("হিসাবটি সম্পূর্ণ করো।");
  }

  while (operators.length) {
    const op = operators.pop();
    if (op === "(") throw new Error("বন্ধনী মেলেনি।");
    output.push(op);
  }

  const stack = [];

  for (const item of output) {
    if (typeof item === "number") {
      stack.push(item);
      continue;
    }

    if (item === "u-") {
      if (stack.length < 1) throw new Error("হিসাবটি পরীক্ষা করো।");
      stack.push(-stack.pop());
      continue;
    }

    if (stack.length < 2) throw new Error("হিসাবটি পরীক্ষা করো।");

    const b = stack.pop();
    const a = stack.pop();
    let result;

    if (item === "+") result = a + b;
    if (item === "-") result = a - b;
    if (item === "*") result = a * b;
    if (item === "/") {
      if (b === 0) throw new Error("শূন্য দিয়ে ভাগ করা যায় না।");
      result = a / b;
    }
    if (item === "^") result = a ** b;

    if (!Number.isFinite(result) || Math.abs(result) > 1e100) {
      throw new Error("ফলাফল নির্ণয় করা যায়নি।");
    }

    stack.push(result);
  }

  if (stack.length !== 1) throw new Error("হিসাবটি পরীক্ষা করো।");
  return stack[0];
}

function formatNumber(n) {
  return Number(n.toPrecision(10)).toString();
}

// নিজস্ব শিক্ষাসামগ্রী ও পরিচিত প্রশ্ন
const lessons = [
  {
    subject: "পদার্থবিজ্ঞান",
    keys: ["নিউটনের দ্বিতীয় সূত্র", "নিউটনের দ্বিতীয় সূত্র", "বল নির্ণয়", "বল নির্ণয়"],
    answer:
      "নিউটনের দ্বিতীয় সূত্র অনুযায়ী, বল = ভর × ত্বরণ।\n" +
      "সূত্র: F = ma\n" +
      "এখানে F = বল, m = ভর এবং a = ত্বরণ।\n" +
      "ভর ও ত্বরণের মান প্রশ্নে দেওয়া থাকলে সূত্রে বসিয়ে বল নির্ণয় করতে হয়।"
  },
  {
    subject: "পদার্থবিজ্ঞান",
    keys: ["বেগের সূত্র", "দ্রুতি", "গড় দ্রুতি", "গড় দ্রুতি"],
    answer:
      "গড় দ্রুতি = মোট অতিক্রান্ত দূরত্ব ÷ মোট সময়।\n" +
      "দূরত্ব মিটারে এবং সময় সেকেন্ডে হলে একক হবে m/s।"
  },
  {
    subject: "পদার্থবিজ্ঞান",
    keys: ["ওহমের সূত্র", "ওহম সূত্র"],
    answer:
      "ওহমের সূত্র: V = IR\n" +
      "এখানে V = বিভব পার্থক্য, I = তড়িৎ প্রবাহ এবং R = রোধ।\n" +
      "দুটি মান জানা থাকলে সূত্র ব্যবহার করে তৃতীয় মান বের করা যায়।"
  },
  {
    subject: "গণিত",
    keys: ["শতকরা", "শতাংশ"],
    answer:
      "শতকরা নির্ণয়ের সূত্র:\n" +
      "শতকরা হার = (অংশ ÷ মোট পরিমাণ) × ১০০%।\n" +
      "প্রশ্নের অংশ ও মোট পরিমাণ সঠিকভাবে শনাক্ত করে হিসাব করো।"
  },
  {
    subject: "গণিত",
    keys: ["পিথাগোরাস", "পিথাগোরাসের উপপাদ্য"],
    answer:
      "সমকোণী ত্রিভুজে অতিভুজ² = ভূমি² + লম্ব²।\n" +
      "অর্থাৎ, c² = a² + b²।\n" +
      "এখানে c হলো অতিভুজ এবং a ও b হলো বাকি দুই বাহু।"
  },
  {
    subject: "রসায়ন",
    keys: ["পানির সংকেত", "পানির রাসায়নিক সংকেত", "পানির রাসায়নিক সংকেত"],
    answer:
      "পানির রাসায়নিক সংকেত H₂O।\n" +
      "একটি পানির অণুতে দুটি হাইড্রোজেন পরমাণু ও একটি অক্সিজেন পরমাণু থাকে।"
  },
  {
    subject: "রসায়ন",
    keys: ["পরমাণু সংখ্যা", "পারমাণবিক সংখ্যা"],
    answer:
      "পারমাণবিক সংখ্যা হলো একটি পরমাণুর নিউক্লিয়াসে থাকা প্রোটনের সংখ্যা।\n" +
      "নিরপেক্ষ পরমাণুতে প্রোটন ও ইলেকট্রনের সংখ্যা সমান।"
  },
  {
    subject: "জীববিজ্ঞান",
    keys: ["সালোকসংশ্লেষণ", "সালোক সংশ্লেষণ"],
    answer:
      "সালোকসংশ্লেষণ হলো এমন প্রক্রিয়া, যার মাধ্যমে সবুজ উদ্ভিদ আলো ও ক্লোরোফিলের উপস্থিতিতে কার্বন ডাই-অক্সাইড ও পানি ব্যবহার করে খাদ্য তৈরি করে এবং অক্সিজেন নির্গত করে।"
  },
  {
    subject: "জীববিজ্ঞান",
    keys: ["কোষের শক্তিঘর", "মাইটোকন্ড্রিয়া", "মাইটোকন্ড্রিয়া"],
    answer:
      "মাইটোকন্ড্রিয়াকে কোষের শক্তিঘর বলা হয়।\n" +
      "এখানে কোষীয় শ্বসনের মাধ্যমে ATP উৎপাদনে গুরুত্বপূর্ণ ভূমিকা পালন করা হয়।"
  }
];

function answerQuestion(rawQuestion, subject, task) {
  const original = rawQuestion.trim();
  const q = normalizeDigits(original);
  const lower = q.toLowerCase();

  // পদার্থবিজ্ঞান: F = ma-এর গাণিতিক হিসাব
  if (
    subject === "পদার্থবিজ্ঞান" &&
    /ভর|mass|kg/i.test(q) &&
    /ত্বরণ|acceleration|m\/s/i.test(q) &&
    /বল|force|নিউটনের/i.test(q)
  ) {
    const massMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:kg|কেজি|কিলোগ্রাম)/i);
    const accelerationMatch = q.match(
      /(\d+(?:\.\d+)?)\s*(?:m\/s(?:\^?2|²)|মি\/সে(?:\^?2|²))/i
    );

    if (massMatch && accelerationMatch) {
      const m = Number(massMatch[1]);
      const a = Number(accelerationMatch[1]);
      const force = m * a;

      return `ধাপ ১: সূত্র লিখি — F = ma\n` +
        `ধাপ ২: ভর, m = ${m} kg\n` +
        `ধাপ ৩: ত্বরণ, a = ${a} m/s²\n` +
        `ধাপ ৪: F = ${m} × ${a} = ${formatNumber(force)} N\n\n` +
        `উত্তর: বল = ${formatNumber(force)} নিউটন।`;
    }
  }

  // সাধারণ গাণিতিক expression: যেমন ২৫*(৮+২)/৫
  const expression = q.replace(/=/g, "").trim();
  if (
    /[0-9]/.test(expression) &&
    /^[\d\s.+\-*/^()]+$/.test(expression) &&
    /[+\-*/^()]/.test(expression)
  ) {
    try {
      const result = calculate(expression);
      return `প্রদত্ত হিসাব: ${expression}\n\n` +
        `ধাপে ধাপে:\n` +
        `১. প্রথমে বন্ধনীর কাজ সম্পন্ন করো।\n` +
        `২. এরপর ঘাত, গুণ ও ভাগের কাজ করো।\n` +
        `৩. শেষে যোগ ও বিয়োগ সম্পন্ন করো।\n\n` +
        `উত্তর: ${formatNumber(result)}`;
    } catch (error) {
      if (expression.length < 100) {
        // ভুল expression হলে নিচের নিয়মে উত্তর খোঁজা হবে
      }
    }
  }

  // নির্বাচিত বিষয়ের সঙ্গে মিলিয়ে সংরক্ষিত উত্তর খোঁজা
  const found = lessons.find(item =>
    item.subject === subject &&
    item.keys.some(key => lower.includes(key.toLowerCase()))
  );

  if (found) {
    return found.answer;
  }

  if (task === "summary" || task === "shortnote") {
    return `এই প্রশ্নের জন্য এখনো StudyMate AI-তে নির্ভরযোগ্য নোট যোগ করা হয়নি।\n\n` +
      `বিষয়: ${subject}\n` +
      `প্রশ্নের বিষয়বস্তু অনুযায়ী নোটের উৎস যোগ করা হলে এখানে সারাংশ দেখানো যাবে।`;
  }

  if (task === "mcq") {
    return `এই বিষয়ের জন্য এখনো এই প্রশ্নের MCQ সংরক্ষণ করা নেই।\n\n` +
      `অধ্যায় ও নির্ভরযোগ্য পাঠ্যবইয়ের তথ্য যোগ করলে MCQ তৈরি ও দেখানোর ফিচার আরও উন্নত করা যাবে।`;
  }

  return `এই প্রশ্নের নির্ভরযোগ্য উত্তর এখনো StudyMate AI-এর শিক্ষাসামগ্রীর ভান্ডারে নেই।\n\n` +
    `বিষয়: ${subject}\n` +
    `প্রশ্ন: ${original}\n\n` +
    `এটি এখনো পূর্ণাঙ্গ AI নয়। সঠিক অধ্যায়ভিত্তিক নোট, সূত্র ও সমাধান যোগ করার মাধ্যমে এর উত্তর দেওয়ার ক্ষমতা বাড়ানো যাবে।`;
}

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
  answerTitle.textContent = "StudyMate AI — উত্তর";

  addText(answerContent, "p",
    `স্তর: ${levelEl.value} | বিষয়: ${subjectEl.value}`);
  addText(answerContent, "h3", "তোমার প্রশ্ন");
  addText(answerContent, "p", question);
  addText(answerContent, "h3", "সমাধান / ব্যাখ্যা");

  const answer = answerQuestion(
    question,
    subjectEl.value,
    taskEl.value
  );

  addText(answerContent, "p", answer);
  answerSection.hidden = false;

  const warning = document.getElementById("demoWarning");
  if (warning) warning.hidden = false;

  answerSection.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
});

updateSubjects();
