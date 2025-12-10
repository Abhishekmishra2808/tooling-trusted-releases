function toggleAllDetails() {
	const details = document.querySelectorAll("details");
	// Check if any are closed
	const anyClosed = Array.from(details).some((detail) => !detail.open);
	// If any are closed, open all
	// Otherwise, close all
	details.forEach((detail) => (detail.open = anyClosed));
}

function toggleStatusVisibility(type, status) {
	const btn = document.getElementById(`btn-toggle-${type}-${status}`);
	const targets = document.querySelectorAll(
		`.atr-result-${type}.atr-result-status-${status}`,
	);
	if (!targets.length) return;
	const elementsCurrentlyHidden = targets[0].classList.contains("atr-hide");
	targets.forEach((el) => {
		if (elementsCurrentlyHidden) {
			el.classList.remove("atr-hide");
		} else {
			el.classList.add("atr-hide");
		}
	});
	const bsSt =
		status === "failure" || status === "exception" ? "danger" : status;
	const cntMatch = btn.textContent.match(/\((\d+)\)/);
	if (!cntMatch) {
		console.error("Button text regex mismatch for:", btn.textContent);
		return;
	}
	const cnt = cntMatch[0];
	const newButtonAction = elementsCurrentlyHidden ? "Hide" : "Show";
	btn.querySelector("span").textContent = newButtonAction;
	if (newButtonAction === "Hide") {
		btn.classList.remove(`btn-outline-${bsSt}`);
		btn.classList.add(`btn-${bsSt}`);
	} else {
		btn.classList.remove(`btn-${bsSt}`);
		btn.classList.add(`btn-outline-${bsSt}`);
	}
	if (type === "member") {
		updateMemberStriping();
	} else if (type === "primary") {
		updatePrimaryStriping();
	}
}

function restripeVisibleRows(rowSelector, stripeClass) {
	let visibleIdx = 0;
	document.querySelectorAll(rowSelector).forEach((row) => {
		row.classList.remove(stripeClass);
		const hidden =
			row.classList.contains("atr-hide") ||
			row.classList.contains("page-member-path-hide");
		if (!hidden) {
			if (visibleIdx % 2 === 0) row.classList.add(stripeClass);
			visibleIdx++;
		}
	});
}

function updatePrimaryStriping() {
	restripeVisibleRows(".atr-result-primary", "page-member-visible-odd");
}

function updateMemberStriping() {
	restripeVisibleRows(".atr-result-member", "page-member-visible-odd");
}

// Toggle status visibility buttons
document.querySelectorAll(".page-toggle-status").forEach((btn) => {
	btn.addEventListener("click", function () {
		const type = this.dataset.type;
		const status = this.dataset.status;
		toggleStatusVisibility(type, status);
	});
});

// Toggle all details button
const toggleAllBtn = document.getElementById("btn-toggle-all-details");
if (toggleAllBtn) {
	toggleAllBtn.addEventListener("click", toggleAllDetails);
}

// Member path filter
const mpfInput = document.getElementById("member-path-filter");
if (mpfInput) {
	mpfInput.addEventListener("input", function () {
		const filterText = this.value.toLowerCase();
		document.querySelectorAll(".atr-result-member").forEach((row) => {
			const pathCell = row.cells[0];
			let hide = false;
			if (filterText) {
				if (!pathCell.textContent.toLowerCase().includes(filterText)) {
					hide = true;
				}
			}
			row.classList.toggle("page-member-path-hide", hide);
		});
		updateMemberStriping();
	});
}

updatePrimaryStriping();
updateMemberStriping();
