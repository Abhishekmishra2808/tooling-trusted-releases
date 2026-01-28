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

import datetime
import io
import pathlib
import tarfile
import zipfile

import pytest

import atr.archives as archives
import atr.models.sql as sql
import atr.tarzip as tarzip
import atr.tasks.checks as checks
import atr.tasks.checks.license as license_checks
import atr.tasks.checks.targz as targz
import atr.tasks.checks.zipformat as zipformat


class _RecorderStub(checks.Recorder):
    def __init__(self, path: pathlib.Path):
        super().__init__(
            checker="tests.unit.test_archive_member_limit",
            project_name="test",
            version_name="test",
            revision_number="00001",
            primary_rel_path=None,
            member_rel_path=None,
            afresh=False,
        )
        self._path = path
        self.messages: list[tuple[str, str, dict | None]] = []

    async def abs_path(self, rel_path: str | None = None) -> pathlib.Path | None:
        return self._path if (rel_path is None) else self._path / rel_path

    async def primary_path_is_binary(self) -> bool:
        return False

    async def _add(
        self,
        status: sql.CheckResultStatus,
        message: str,
        data: object,
        primary_rel_path: str | None = None,
        member_rel_path: str | None = None,
    ) -> sql.CheckResult:
        self.messages.append((status.value, message, data if isinstance(data, dict) else None))
        return sql.CheckResult(
            id=0,
            release_name=self.release_name,
            revision_number=self.revision_number,
            checker=self.checker,
            primary_rel_path=primary_rel_path,
            member_rel_path=member_rel_path,
            created=datetime.datetime.now(datetime.UTC),
            status=status,
            message=message,
            data=data,
            input_hash=None,
        )


def test_extract_wraps_member_limit(tmp_path, monkeypatch):
    archive_path = tmp_path / "sample.tar"
    _make_tar(archive_path, ["a.txt", "b.txt", "c.txt"])
    extract_dir = tmp_path / "out"
    extract_dir.mkdir()

    original_open = tarzip.open_archive

    def limited_open(path: str, *args, **kwargs):
        return original_open(path, max_members=2)

    monkeypatch.setattr(tarzip, "open_archive", limited_open)

    with pytest.raises(archives.ExtractionError) as excinfo:
        archives.extract(str(archive_path), str(extract_dir), max_size=1024 * 1024, chunk_size=1024)

    assert "too many members" in str(excinfo.value).lower()


def test_license_files_reports_member_limit(tmp_path, monkeypatch):
    archive_path = tmp_path / "sample.tar"
    _make_tar(archive_path, ["LICENSE", "NOTICE", "README.txt"])

    original_open = tarzip.open_archive

    def limited_open(path: str, *args, **kwargs):
        return original_open(path, max_members=2)

    monkeypatch.setattr(tarzip, "open_archive", limited_open)

    results = list(license_checks._files_check_core_logic(str(archive_path), is_podling=False))
    assert any(
        isinstance(result, license_checks.ArtifactResult) and ("too many members" in result.message.lower())
        for result in results
    )


def test_license_headers_reports_member_limit(tmp_path, monkeypatch):
    archive_path = tmp_path / "sample.tar"
    _make_tar(archive_path, ["main.py", "README.txt", "extra.txt"])

    original_open = tarzip.open_archive

    def limited_open(path: str, *args, **kwargs):
        return original_open(path, max_members=2)

    monkeypatch.setattr(tarzip, "open_archive", limited_open)

    results = list(license_checks._headers_check_core_logic(str(archive_path), [], "none"))
    assert any(
        isinstance(result, license_checks.ArtifactResult) and ("too many members" in result.message.lower())
        for result in results
    )


def test_open_archive_disables_member_limit_for_negative(tmp_path):
    archive_path = tmp_path / "sample.zip"
    _make_zip(archive_path, ["a.txt", "b.txt", "c.txt"])

    with tarzip.open_archive(str(archive_path), max_members=-1) as archive:
        members = list(archive)

    assert len(members) == 3


def test_open_archive_disables_member_limit_for_zero(tmp_path):
    archive_path = tmp_path / "sample.tar"
    _make_tar(archive_path, ["a.txt", "b.txt", "c.txt"])

    with tarzip.open_archive(str(archive_path), max_members=0) as archive:
        members = list(archive)

    assert len(members) == 3


def test_open_archive_enforces_member_limit_tar(tmp_path):
    archive_path = tmp_path / "sample.tar"
    _make_tar(archive_path, ["a.txt", "b.txt", "c.txt"])

    with tarzip.open_archive(str(archive_path), max_members=2) as archive:
        with pytest.raises(tarzip.ArchiveMemberLimitExceededError):
            list(archive)


def test_open_archive_enforces_member_limit_zip(tmp_path):
    archive_path = tmp_path / "sample.zip"
    _make_zip(archive_path, ["a.txt", "b.txt", "c.txt"])

    with tarzip.open_archive(str(archive_path), max_members=2) as archive:
        with pytest.raises(tarzip.ArchiveMemberLimitExceededError):
            list(archive)


@pytest.mark.asyncio
async def test_targz_integrity_reports_member_limit(tmp_path, monkeypatch):
    archive_path = tmp_path / "sample.tar"
    _make_tar(archive_path, ["a.txt", "b.txt", "c.txt"])
    recorder = _RecorderStub(archive_path)

    original_open = tarzip.open_archive

    def limited_open(path: str, *args, **kwargs):
        return original_open(path, max_members=2)

    monkeypatch.setattr(tarzip, "open_archive", limited_open)

    args = await _args_for(recorder)
    await targz.integrity(args)

    assert any("too many members" in message.lower() for _, message, _ in recorder.messages)


@pytest.mark.asyncio
async def test_targz_structure_reports_member_limit(tmp_path, monkeypatch):
    archive_path = tmp_path / "sample.tar"
    # Must include the root directory here
    _make_tar(archive_path, ["sample/a.txt", "sample/b.txt", "sample/c.txt"])
    recorder = _RecorderStub(archive_path)

    original_open = tarzip.open_archive

    def limited_open(path: str, *args, **kwargs):
        return original_open(path, max_members=2)

    monkeypatch.setattr(tarzip, "open_archive", limited_open)

    args = await _args_for(recorder)
    await targz.structure(args)

    assert any("too many members" in message.lower() for _, message, _ in recorder.messages)


def test_zipformat_integrity_reports_member_limit(tmp_path, monkeypatch):
    archive_path = tmp_path / "sample.zip"
    _make_zip(archive_path, ["a.txt", "b.txt", "c.txt"])

    original_open = tarzip.open_archive

    def limited_open(path: str, *args, **kwargs):
        return original_open(path, max_members=2)

    monkeypatch.setattr(tarzip, "open_archive", limited_open)

    result = zipformat._integrity_check_core_logic(str(archive_path))
    assert "too many members" in result.get("error", "").lower()


def test_zipformat_structure_reports_member_limit(tmp_path, monkeypatch):
    archive_path = tmp_path / "sample.zip"
    _make_zip(archive_path, ["a.txt", "b.txt", "c.txt"])

    original_open = tarzip.open_archive

    def limited_open(path: str, *args, **kwargs):
        return original_open(path, max_members=2)

    monkeypatch.setattr(tarzip, "open_archive", limited_open)

    result = zipformat._structure_check_core_logic(str(archive_path))
    assert "too many members" in result.get("error", "").lower()


async def _args_for(recorder: _RecorderStub) -> checks.FunctionArguments:
    async def _recorder() -> checks.Recorder:
        return recorder

    return checks.FunctionArguments(
        recorder=_recorder,
        asf_uid="",
        project_name="test",
        version_name="test",
        revision_number="00001",
        primary_rel_path=None,
        extra_args={},
    )


def _make_tar(path, members: list[str]) -> None:
    with tarfile.open(path, "w") as tf:
        for name in members:
            data = f"data-{name}".encode()
            info = tarfile.TarInfo(name=name)
            info.size = len(data)
            tf.addfile(info, io.BytesIO(data))


def _make_zip(path, members: list[str]) -> None:
    with zipfile.ZipFile(path, "w") as zf:
        for name in members:
            zf.writestr(name, f"data-{name}")
