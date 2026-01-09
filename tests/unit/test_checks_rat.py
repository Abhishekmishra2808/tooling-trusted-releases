# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.

import pathlib

import pytest

import atr.tasks.checks.rat as rat

TEST_ARCHIVE = pathlib.Path(__file__).parent.parent / "e2e" / "test_files" / "apache-test-0.2.tar.gz"


@pytest.fixture
def rat_available() -> tuple[bool, bool]:
    # TODO: Make this work properly in CI
    java_ok = rat._check_java_installed() is None
    _, jar_error = rat._check_core_logic_jar_exists(rat._CONFIG.APACHE_RAT_JAR_PATH)
    jar_ok = jar_error is None
    return (java_ok, jar_ok)


def _skip_if_unavailable(rat_available: tuple[bool, bool]) -> None:
    java_ok, jar_ok = rat_available
    if not java_ok:
        pytest.skip("Java not available")
    if not jar_ok:
        pytest.skip("RAT JAR not available")


def test_check_includes_excludes_source_none(rat_available: tuple[bool, bool]):
    _skip_if_unavailable(rat_available)
    result = rat._check_core_logic(str(TEST_ARCHIVE), [])
    assert result["excludes_source"] == "none"


def test_check_includes_excludes_source_policy(rat_available: tuple[bool, bool]):
    _skip_if_unavailable(rat_available)
    result = rat._check_core_logic(str(TEST_ARCHIVE), ["*.py"])
    assert result["excludes_source"] == "policy"
