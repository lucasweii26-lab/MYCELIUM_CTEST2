// Footer: one field, two clear outcomes.
//  - An email address  -> the button keeps its normal "Subscribe" label and subscribes (unchanged logic in app.js).
//  - A written message -> the button label changes to "Write a report →" and opens the existing report form
//                         with the typed text already in the message box, so residents know where to complain.
// Classic script, runs after app.js has built the page.
(() => {
  const form = document.getElementById("newsletterForm");
  const input = document.getElementById("newsletterEmail");
  const button = form?.querySelector(".footer-newsletter-btn");
  if (!form || !input || !button) return;

  const TEXT = {
    en: { placeholder: "Email to subscribe, or write your message", report: "Write a report →", hint: "Enter an email to join the newsletter. Write anything else and we will open the report form so you can send it to the management team." },
    "zh-CN": { placeholder: "输入邮箱订阅，或直接写下您的留言", report: "撰写投诉 / 反馈 →", hint: "输入邮箱即可订阅通讯；输入其他内容，我们会为您打开反馈表单，直接提交给管理团队。" },
    ms: { placeholder: "E-mel untuk melanggan, atau tulis mesej anda", report: "Tulis laporan →", hint: "Masukkan e-mel untuk melanggan buletin. Tulis apa-apa lagi dan kami akan membuka borang laporan untuk dihantar kepada pasukan pengurusan." },
    es: { placeholder: "Correo para suscribirte, o escribe tu mensaje", report: "Escribir un reporte →", hint: "Escribe un correo para unirte al boletín. Si escribes otra cosa, abriremos el formulario de reporte para enviarlo a la administración." },
    ta: { placeholder: "குழுசேர மின்னஞ்சல், அல்லது உங்கள் செய்தியை எழுதுங்கள்", report: "அறிக்கை எழுதுங்கள் →", hint: "செய்திமடலில் சேர மின்னஞ்சலை உள்ளிடவும். வேறு எதையாவது எழுதினால், நிர்வாகக் குழுவுக்கு அனுப்ப அறிக்கைப் படிவம் திறக்கும்." },
  };
  const lang = () => (typeof currentLang === "string" && currentLang) || document.documentElement.lang || "en";
  const T = () => TEXT[lang()] || TEXT.en;

  const hint = document.createElement("p");
  hint.className = "footer-newsletter-hint";
  hint.id = "newsletterHint";
  form.after(hint);
  input.setAttribute("aria-describedby", "newsletterHint");

  let mode = "email";
  let subscribeLabel = button.textContent.trim();

  // A sentence (has a space) or a long text without "@" is a message, not an email address.
  const looksLikeMessage = (value) => {
    const v = value.trim();
    return v.length > 0 && (/\s/.test(v) || (!v.includes("@") && v.length >= 14));
  };

  function apply() {
    const t = T();
    input.placeholder = t.placeholder;
    hint.textContent = t.hint;
    button.textContent = mode === "report" ? t.report : subscribeLabel;
    button.dataset.mode = mode;
  }

  function setMode(next) {
    if (next === mode) return;
    mode = next;
    apply();
  }

  input.addEventListener("input", () => setMode(looksLikeMessage(input.value) ? "report" : "email"));

  // Capture phase: runs before the form's own submit/validation, so an email-type field
  // never blocks a message from being written.
  button.addEventListener("click", (event) => {
    if (mode !== "report") return;
    event.preventDefault();
    event.stopPropagation();
    const text = input.value.trim();
    document.querySelector(".report-btn")?.click(); // opens the existing report modal (script.js)
    requestAnimationFrame(() => {
      const message = document.querySelector("#reportForm textarea[name='message']");
      if (message) { message.value = text; message.dispatchEvent(new Event("input", { bubbles: true })); message.focus({ preventScroll: true }); }
      input.value = "";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      setMode("email");
    });
  }, true);

  // After a language switch app.js rewrites the label; re-read it, then re-apply ours if needed.
  window.addEventListener("mycelium:languagechange", () => {
    setTimeout(() => {
      const current = button.textContent.trim();
      const isOurReportLabel = Object.values(TEXT).some((entry) => entry.report === current);
      if (!isOurReportLabel) subscribeLabel = current; // app.js has just translated the Subscribe label
      apply();
    }, 0);
  });

  apply();
})();