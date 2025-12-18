/*
 *  Licensed to the Apache Software Foundation (ASF) under one
 *  or more contributor license agreements.  See the NOTICE file
 *  distributed with this work for additional information
 *  regarding copyright ownership.  The ASF licenses this file
 *  to you under the Apache License, Version 2.0 (the
 *  "License"); you may not use this file except in compliance
 *  with the License.  You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing,
 *  software distributed under the License is distributed on an
 *  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 *  KIND, either express or implied.  See the License for the
 *  specific language governing permissions and limitations
 *  under the License.
 */

window.UploadUI = {
	formatBytes(b) {
		if (b < 1024) return `${b} B`;
		if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
		if (b < 1073741824) return `${(b / 1048576).toFixed(1)} MB`;
		return `${(b / 1073741824).toFixed(2)} GB`;
	},

	createFileProgressUI(file, index, activeUploads) {
		const div = document.createElement("div");
		div.className = "card mb-3";
		div.id = `upload-file-${index}`;
		div.innerHTML = `<div class="card-body">
			<div class="d-flex justify-content-between align-items-start mb-2">
				<div><strong class="file-name"></strong>
					<small class="text-muted ms-2">(${this.formatBytes(file.size)})</small></div>
				<button type="button" class="btn btn-sm btn-outline-secondary cancel-btn">Cancel</button>
			</div>
			<progress class="w-100 mb-1" value="0" max="100"></progress>
			<div class="d-flex justify-content-between">
				<small class="upload-status text-muted">Preparing...</small>
				<small class="upload-percent">0%</small>
			</div></div>`;
		div.querySelector(".file-name").textContent = file.name;
		div.querySelector(".cancel-btn").addEventListener("click", () => {
			const xhr = activeUploads.get(index);
			if (xhr) xhr.abort();
		});
		return div;
	},

	markUploadDone(ui, success, msg) {
		const statusEl = ui.querySelector(".upload-status");
		statusEl.textContent = msg;
		statusEl.className = `upload-status text-${success ? "success" : "danger"}`;
		const border = success ? "border-success" : "border-danger";
		ui.querySelector(".card-body").classList.add(
			"border-start",
			border,
			"border-3",
		);
		if (success) {
			ui.querySelector("progress").value = 100;
			ui.querySelector(".upload-percent").textContent = "100%";
		}
		ui.querySelector(".cancel-btn").classList.add("d-none");
	},

	resetUploadUI(ui) {
		ui.querySelector(".card-body").classList.remove(
			"border-start",
			"border-danger",
			"border-3",
		);
		const statusEl = ui.querySelector(".upload-status");
		statusEl.textContent = "Preparing...";
		statusEl.className = "upload-status text-muted";
		ui.querySelector("progress").value = 0;
		ui.querySelector(".upload-percent").textContent = "0%";
		ui.querySelector(".cancel-btn").classList.remove("d-none");
	},

	showAllFailedSummary(container) {
		const summary = document.createElement("div");
		summary.className = "alert alert-danger mt-3";
		summary.innerHTML = `<strong>All uploads failed.</strong>
			<button type="button" class="btn btn-outline-primary ms-3" id="retry-all-btn">Try again</button>`;
		container.append(summary);
		document
			.getElementById("retry-all-btn")
			.addEventListener("click", () => location.reload());
	},

	showPartialSuccessSummary(container, completedCount, totalFiles, onFinalise) {
		const summary = document.createElement("div");
		summary.className = "alert alert-warning mt-3";
		summary.id = "upload-summary";
		const totalWord = totalFiles === 1 ? "file" : "files";
		const stagedWord = completedCount === 1 ? "file" : "files";
		summary.innerHTML = `<strong>${completedCount} of ${totalFiles} ${totalWord} staged.</strong>
			<span class="ms-2">You can finalise with the staged files or retry failed uploads.</span>
			<button type="button" class="btn btn-primary ms-3" id="finalise-btn">Finalise ${completedCount} ${stagedWord}</button>`;
		container.append(summary);
		document
			.getElementById("finalise-btn")
			.addEventListener("click", onFinalise);
	},

	doFinalise(container, finaliseUrl, csrfToken) {
		const existingSummary = document.getElementById("upload-summary");
		if (existingSummary) existingSummary.remove();
		const summary = document.createElement("div");
		summary.className = "alert alert-info mt-3";
		summary.innerHTML = `<strong>Finalising upload...</strong>`;
		container.append(summary);
		const form = document.createElement("form");
		form.method = "POST";
		form.action = finaliseUrl;
		form.style.display = "none";
		const csrfInput = document.createElement("input");
		csrfInput.type = "hidden";
		csrfInput.name = "csrf_token";
		csrfInput.value = csrfToken;
		form.append(csrfInput);
		document.body.append(form);
		form.submit();
	},

	handleUploadProgress(e, progressBar, statusEl, percentEl, cancelBtn) {
		if (e.lengthComputable) {
			const pct = Math.round((e.loaded / e.total) * 100);
			progressBar.value = pct;
			delete progressBar.dataset.indeterminate;
			percentEl.textContent = `${pct}%`;
			if (pct >= 100) {
				statusEl.textContent = "Processing...";
				cancelBtn.classList.add("d-none");
			} else {
				statusEl.textContent = `${this.formatBytes(e.loaded)} / ${this.formatBytes(e.total)}`;
			}
		} else {
			progressBar.removeAttribute("value");
			progressBar.dataset.indeterminate = "true";
			percentEl.textContent = "";
			statusEl.textContent = `${this.formatBytes(e.loaded)} uploaded`;
		}
	},
};
