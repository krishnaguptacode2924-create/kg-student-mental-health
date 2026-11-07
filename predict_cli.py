"""Bridge between Node and the model. Reads one JSON object on stdin, prints one JSON object on stdout."""
import json
import os
import sys
import warnings

warnings.filterwarnings("ignore")

# Work from this file's folder so the relative "KG_Student_Artifact/..." paths always resolve.
HERE = os.path.dirname(os.path.abspath(__file__))
os.chdir(HERE)
sys.path.insert(0, HERE)

from KG_Student_Prediction import kg_student_prediction  # noqa: E402


def main():
    try:
        data = json.load(sys.stdin)
        print(json.dumps(kg_student_prediction(data), default=lambda o: o.item() if hasattr(o, "item") else str(o)))
    except Exception as exc:  # report any failure to Node as JSON
        print(json.dumps({"error": str(exc)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
