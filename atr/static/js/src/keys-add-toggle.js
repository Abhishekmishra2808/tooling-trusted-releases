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

document.addEventListener("DOMContentLoaded", () => {
	const checkboxes = document.querySelectorAll(
		"input[name='selected_committees']",
	);
	if (checkboxes.length === 0) return;

	const firstCheckbox = checkboxes[0];
	const container = firstCheckbox.closest(".col-sm-8");
	if (!container) return;

	const button = document.createElement("button");
	button.id = "toggleCommitteesBtn";
	button.type = "button";
	button.className = "btn btn-outline-secondary btn-sm mt-2";
	button.textContent = "Select all committees";

	button.addEventListener("click", () => {
		const allChecked = Array.from(checkboxes).every((cb) => cb.checked);
		checkboxes.forEach((cb) => {
			cb.checked = !allChecked;
		});
		button.textContent = allChecked
			? "Select all committees"
			: "Deselect all committees";
	});

	container.append(button);
});
