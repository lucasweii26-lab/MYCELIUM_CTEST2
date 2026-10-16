// Adds a focused, keyboard-accessible detail view to each community pillar.
// The existing modal layout stays intact; the selected item reveals its own copy.
(() => {
  const motionIsReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!motionIsReduced && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    document.querySelectorAll(".features > .feature").forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        const rotateY = (x - 0.5) * 5;
        const rotateX = (0.5 - y) * 5;
        card.style.setProperty("--card-rotate-x", `${rotateX.toFixed(2)}deg`);
        card.style.setProperty("--card-rotate-y", `${rotateY.toFixed(2)}deg`);
        card.classList.add("is-pointer-following");
      });
      card.addEventListener("pointerleave", () => {
        card.classList.remove("is-pointer-following");
        card.style.setProperty("--card-rotate-x", "0deg");
        card.style.setProperty("--card-rotate-y", "0deg");
      });
    });
  }

  const details = {
    smartFacilitiesModal: [
      "Pay community charges and facility fees through a clear, convenient digital flow. Residents can review what they owe and keep a record of completed payments.",
      "Check availability and reserve shared spaces such as the gym, pool or community hall. A booking calendar helps residents plan ahead and avoid double bookings.",
      "Submit requests for shared supplies or maintenance work and follow each request from submission to completion, helping management keep decisions transparent.",
      "Send forms such as maintenance requests and resident applications online, then receive a clear confirmation so there is less paperwork and fewer follow-up calls.",
    ],
    communitySafetyModal: [
      "Keep service agreements, renewal dates and related documents organized in one place, so residents and management can understand what has been agreed.",
      "Register expected guests and let residents know when a visitor arrives. Clear check-in steps help make entry smoother while preserving a human welcome.",
      "Use shared-area camera systems to help the management team review safety incidents. Monitoring should follow local privacy rules and posted community policies.",
      "Coordinate patrol routes and record observations so the team can respond consistently to concerns around entrances, paths and shared facilities.",
    ],
    greenLivingModal: [
      "Adjust watering schedules to weather and planting needs, helping gardens stay healthy while reducing avoidable water use.",
      "Make recycling and composting easier to understand with clear sorting guidance and collection points residents can find around the community.",
      "Provide charging points for electric vehicles and show residents where they are located, supporting lower-emission travel as the community grows.",
      "Track practical steps such as efficient lighting and equipment schedules to reduce energy waste in shared spaces without compromising comfort.",
    ],
    communityConnectModal: [
      "Read current notices from your selected community, including service updates and time-sensitive information.",
      "Browse the community calendar for upcoming activities, dates and practical event information.",
      "Find volunteer opportunities, read what each activity involves and register to take part.",
      "Reach the local management team using the contact information for the region currently selected on the website.",
    ],
  };

  const connectDestinations = {
    "Community updates": "#",
    "Events calendar": "#",
    "Volunteer activities": "#",
    "Contact management": "#",
  };

  document.querySelectorAll(".feature-modal-overlay").forEach((overlay) => {
    const itemGrid = overlay.querySelector(".feature-modal-items");
    if (!itemGrid) return;
    const copy = details[overlay.id] || [];
    const detailPanel = document.createElement("section");
    detailPanel.className = "feature-detail-panel";
    detailPanel.setAttribute("aria-live", "polite");
    detailPanel.hidden = true;
    itemGrid.after(detailPanel);

    itemGrid.querySelectorAll(".feature-modal-item").forEach((item, index) => {
      item.tabIndex = 0;
      item.setAttribute("role", "button");
      item.setAttribute("aria-expanded", "false");
      item.dataset.featureDetailIndex = String(index);

      const showDetail = () => {
        itemGrid.querySelectorAll(".feature-modal-item").forEach((entry) => {
          const selected = entry === item;
          entry.classList.toggle("is-detail-selected", selected);
          entry.setAttribute("aria-expanded", String(selected));
        });
        const label = item.querySelector("[data-i18n]")?.textContent.trim()
          || item.querySelector("span:last-child")?.textContent.trim()
          || "Community feature";
        const icon = item.querySelector("svg")?.cloneNode(true);
        detailPanel.replaceChildren();
        const image = document.createElement("div");
        image.className = "feature-detail-illustration";
        image.setAttribute("aria-hidden", "true");
        if (icon) {
          image.append(icon);
        } else {
          const mark = document.createElement("span");
          mark.className = "feature-detail-mark";
          mark.textContent = String(index + 1).padStart(2, "0");
          image.append(mark);
        }
        detailPanel.append(image);
        const text = document.createElement("div");
        text.className = "feature-detail-copy";
        const heading = document.createElement("h3");
        heading.textContent = label;
        const paragraph = document.createElement("p");
        paragraph.textContent = copy[index] || "Explore how this community feature supports everyday resident needs.";
        text.append(heading, paragraph);

        const destination = connectDestinations[label];
        if (destination) {
          const link = document.createElement("a");
          link.className = "feature-detail-link";
          link.href = destination;
          link.textContent = label === "Events calendar" ? "View the community calendar →"
            : label === "Volunteer activities" ? "Explore volunteer activities →"
              : label === "Contact management" ? "See community contacts →" : "Read community notices →";
          link.addEventListener("click", (event) => {
            event.preventDefault();
            overlay.classList.remove("active");
            overlay.setAttribute("aria-hidden", "true");
            const targets = {
              "Community updates": "#openAnnouncementBtn",
              "Events calendar": "#openCalendarBtn",
              "Volunteer activities": "#openVolunteerBtn",
              "Contact management": ".footer",
            };
            const target = document.querySelector(targets[label]);
            target?.scrollIntoView({ behavior: "smooth", block: "center" });
            if (label === "Community updates") document.querySelector("#openAnnouncementBtn")?.click();
            if (label === "Events calendar") document.querySelector("#openCalendarBtn")?.click();
            if (label === "Volunteer activities") document.querySelector("#openVolunteerBtn")?.click();
          });
          text.append(link);
        }
        detailPanel.append(text);
        detailPanel.hidden = false;
        detailPanel.classList.remove("is-visible");
        requestAnimationFrame(() => detailPanel.classList.add("is-visible"));
      };

      item.addEventListener("click", showDetail);
      item.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          showDetail();
        }
      });
    });

    const trigger = document.querySelector(`[data-modal="${overlay.id}"]`);
    trigger?.addEventListener("click", () => {
      window.setTimeout(() => {
        if (!overlay.classList.contains("active")) return;
        if (itemGrid.querySelector(".is-detail-selected")) return;
        itemGrid.querySelector(".feature-modal-item")?.click();
      }, 0);
    });
  });
})();
