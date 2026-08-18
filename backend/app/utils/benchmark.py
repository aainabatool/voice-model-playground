import time
from contextlib import contextmanager


@contextmanager
def timer():
    """Context manager that measures elapsed wall-clock time.

    Usage:
        with timer() as t:
            do_something()
        print(t.elapsed)
    """
    class _Timer:
        elapsed = None

    t = _Timer()
    start = time.perf_counter()
    yield t
    t.elapsed = time.perf_counter() - start


def compute_rtf(generation_time: float, audio_duration: float) -> float:
    """Real-Time Factor: how many seconds of compute per second of audio.

    RTF < 1.0 means faster than real-time (good).
    """
    if audio_duration <= 0:
        return 0.0
    return generation_time / audio_duration

def compute_wer_cer(reference: str, hypothesis: str) -> dict:
    """Word Error Rate and Character Error Rate against a reference transcript."""
    import jiwer

    wer = jiwer.wer(reference, hypothesis)
    cer = jiwer.cer(reference, hypothesis)
    return {"wer": wer, "cer": cer}