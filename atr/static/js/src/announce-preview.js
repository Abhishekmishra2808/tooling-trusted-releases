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

function fetchAnnouncePreview(
	previewUrl,
	csrfToken,
	bodyTextarea,
	textPreviewContent,
) {
	const bodyContent = bodyTextarea.value;

	fetch(previewUrl, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			"X-CSRFToken": csrfToken,
		},
		body: new URLSearchParams({
			body: bodyContent,
			csrf_token: csrfToken,
		}),
	})
		.then((response) => {
			if (!response.ok) {
				return response.text().then((text) => {
					throw new Error(`HTTP error ${response.status}: ${text}`);
				});
			}
			return response.text();
		})
		.then((previewText) => {
			textPreviewContent.textContent = previewText;
		})
		.catch((error) => {
			console.error("Error fetching email preview:", error);
			textPreviewContent.textContent = `Error loading preview:\n${error.message}`;
		});
}

function initAnnouncePreview() {
	let debounceTimeout;
	const debounceDelay = 500;

	const bodyTextarea = document.getElementById("body");
	const textPreviewContent = document.getElementById(
		"announce-body-preview-content",
	);
	const announceForm = document.querySelector("form.atr-canary");
	const configElement = document.getElementById("announce-config");

	if (!bodyTextarea || !textPreviewContent || !announceForm) {
		console.error("Required elements for announce preview not found. Exiting.");
		return;
	}

	const previewUrl = configElement ? configElement.dataset.previewUrl : null;
	const csrfTokenInput = announceForm.querySelector('input[name="csrf_token"]');

	if (!previewUrl || !csrfTokenInput) {
		console.error(
			"Required data attributes or CSRF token not found for announce preview.",
		);
		return;
	}
	const csrfToken = csrfTokenInput.value;

	const doFetch = () =>
		fetchAnnouncePreview(
			previewUrl,
			csrfToken,
			bodyTextarea,
			textPreviewContent,
		);

	bodyTextarea.addEventListener("input", () => {
		clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(doFetch, debounceDelay);
	});

	doFetch();
}

function initDownloadPathValidation() {
	const pathInput = document.getElementById("download_path_suffix");
	const pathHelpText = pathInput
		? pathInput.parentElement.querySelector(".form-text")
		: null;

	if (!pathInput || !pathHelpText) {
		return;
	}

	const baseText = pathHelpText.dataset.baseText || "";
	let pathDebounce;

	const updatePathHelpText = () => {
		let suffix = pathInput.value;
		if (suffix.includes("..") || suffix.includes("//")) {
			pathHelpText.textContent =
				"Download path suffix must not contain .. or //";
			return;
		}
		if (suffix.startsWith("./")) {
			suffix = suffix.slice(1);
		} else if (suffix === ".") {
			suffix = "/";
		}
		if (!suffix.startsWith("/")) {
			suffix = `/${suffix}`;
		}
		if (!suffix.endsWith("/")) {
			suffix = `${suffix}/`;
		}
		if (suffix.includes("/.")) {
			pathHelpText.textContent = "Download path suffix must not contain /.";
			return;
		}
		pathHelpText.textContent = baseText + suffix;
	};

	pathInput.addEventListener("input", () => {
		clearTimeout(pathDebounce);
		pathDebounce = setTimeout(updatePathHelpText, 10);
	});
	updatePathHelpText();
}

document.addEventListener("DOMContentLoaded", () => {
	initAnnouncePreview();
	initDownloadPathValidation();
});
