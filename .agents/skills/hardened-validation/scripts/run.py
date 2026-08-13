"""Run a command with a hard timeout and terminate its process tree on exit."""

from __future__ import annotations

import os
import shutil
import signal
import subprocess
import sys
import time


DEFAULT_TIMEOUT_SECONDS = 900


if os.name == "nt":
    import ctypes
    from ctypes import wintypes

    _JOB_OBJECT_EXTENDED_LIMIT_INFORMATION = 9
    _JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE = 0x00002000
    _kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)

    class _IO_COUNTERS(ctypes.Structure):
        _fields_ = [
            ("ReadOperationCount", ctypes.c_uint64),
            ("WriteOperationCount", ctypes.c_uint64),
            ("OtherOperationCount", ctypes.c_uint64),
            ("ReadTransferCount", ctypes.c_uint64),
            ("WriteTransferCount", ctypes.c_uint64),
            ("OtherTransferCount", ctypes.c_uint64),
        ]

    class _JOBOBJECT_BASIC_LIMIT_INFORMATION(ctypes.Structure):
        _fields_ = [
            ("PerProcessUserTimeLimit", ctypes.c_int64),
            ("PerJobUserTimeLimit", ctypes.c_int64),
            ("LimitFlags", wintypes.DWORD),
            ("MinimumWorkingSetSize", ctypes.c_size_t),
            ("MaximumWorkingSetSize", ctypes.c_size_t),
            ("ActiveProcessLimit", wintypes.DWORD),
            ("Affinity", ctypes.c_size_t),
            ("PriorityClass", wintypes.DWORD),
            ("SchedulingClass", wintypes.DWORD),
        ]

    class _JOBOBJECT_EXTENDED_LIMIT_INFORMATION(ctypes.Structure):
        _fields_ = [
            ("BasicLimitInformation", _JOBOBJECT_BASIC_LIMIT_INFORMATION),
            ("IoInfo", _IO_COUNTERS),
            ("ProcessMemoryLimit", ctypes.c_size_t),
            ("JobMemoryLimit", ctypes.c_size_t),
            ("PeakProcessMemoryUsed", ctypes.c_size_t),
            ("PeakJobMemoryUsed", ctypes.c_size_t),
        ]

    _kernel32.CreateJobObjectW.argtypes = [wintypes.LPVOID, wintypes.LPCWSTR]
    _kernel32.CreateJobObjectW.restype = wintypes.HANDLE
    _kernel32.SetInformationJobObject.argtypes = [
        wintypes.HANDLE,
        ctypes.c_int,
        wintypes.LPVOID,
        wintypes.DWORD,
    ]
    _kernel32.SetInformationJobObject.restype = wintypes.BOOL
    _kernel32.AssignProcessToJobObject.argtypes = [wintypes.HANDLE, wintypes.HANDLE]
    _kernel32.AssignProcessToJobObject.restype = wintypes.BOOL
    _kernel32.CloseHandle.argtypes = [wintypes.HANDLE]
    _kernel32.CloseHandle.restype = wintypes.BOOL

    class _WindowsJob:
        def __init__(self) -> None:
            self.handle = _kernel32.CreateJobObjectW(None, None)
            self.assigned = False
            if not self.handle:
                raise ctypes.WinError(ctypes.get_last_error())

            information = _JOBOBJECT_EXTENDED_LIMIT_INFORMATION()
            information.BasicLimitInformation.LimitFlags = (
                _JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE
            )
            configured = _kernel32.SetInformationJobObject(
                self.handle,
                _JOB_OBJECT_EXTENDED_LIMIT_INFORMATION,
                ctypes.byref(information),
                ctypes.sizeof(information),
            )
            if not configured:
                error = ctypes.get_last_error()
                self.close()
                raise ctypes.WinError(error)

        def assign(self, process: subprocess.Popen[bytes]) -> None:
            if not _kernel32.AssignProcessToJobObject(self.handle, process._handle):
                raise ctypes.WinError(ctypes.get_last_error())
            self.assigned = True

        def close(self) -> None:
            if self.handle:
                _kernel32.CloseHandle(self.handle)
                self.handle = None


def _command_from_args(args: list[str]) -> list[str]:
    command = list(args)
    if os.name == "nt":
        resolved = shutil.which(command[0])
        if resolved:
            command[0] = resolved
    return command


def _taskkill(process: subprocess.Popen[bytes]) -> None:
    subprocess.run(
        ["taskkill", "/PID", str(process.pid), "/T", "/F"],
        check=False,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def _terminate_tree(
    process: subprocess.Popen[bytes],
    windows_job: object | None = None,
) -> None:
    if os.name == "nt":
        assigned = bool(windows_job and windows_job.assigned)
        if windows_job:
            windows_job.close()
        if not assigned:
            _taskkill(process)
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            _taskkill(process)
        return

    try:
        os.killpg(process.pid, signal.SIGTERM)
    except ProcessLookupError:
        return

    deadline = time.monotonic() + 5
    while time.monotonic() < deadline:
        process.poll()
        try:
            os.killpg(process.pid, 0)
        except ProcessLookupError:
            return
        time.sleep(0.05)

    try:
        os.killpg(process.pid, signal.SIGKILL)
    except ProcessLookupError:
        return
    process.poll()


def main() -> int:
    if len(sys.argv) < 2:
        print("usage: python run.py <command>", file=sys.stderr)
        return 2
    command = _command_from_args(sys.argv[1:])
    timeout = int(os.environ.get("HARDENED_TEST_TIMEOUT_SECONDS", DEFAULT_TIMEOUT_SECONDS))
    windows_job = _WindowsJob() if os.name == "nt" else None
    process = None
    try:
        process = subprocess.Popen(
            command,
            shell=False,
            creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if os.name == "nt" else 0,
            start_new_session=os.name != "nt",
        )
        if windows_job:
            windows_job.assign(process)
        return process.wait(timeout=timeout)
    except subprocess.TimeoutExpired:
        print(f"command timed out after {timeout}s: {command}", file=sys.stderr)
        return 124
    finally:
        if process is not None:
            _terminate_tree(process, windows_job)
        elif windows_job:
            windows_job.close()


if __name__ == "__main__":
    raise SystemExit(main())
