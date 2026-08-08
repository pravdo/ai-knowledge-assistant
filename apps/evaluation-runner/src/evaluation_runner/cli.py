"""Evaluation runner CLI entrypoint (docs/architecture.md §11.10).

Only `validate` is implemented so far: loading and validating a dataset is the runner's first
responsibility. Running cases against a RAG configuration, scoring, and reporting land once the
retrieval and generation pipeline exists (roadmap Week 13).
"""

from pathlib import Path
from typing import Annotated

import typer

from evaluation_runner.dataset import DatasetValidationError, load_dataset, summarize_dataset

app = typer.Typer(add_completion=False)

DatasetArgument = Annotated[Path, typer.Argument(help="Path to a dataset JSON file.")]


@app.callback()
def main() -> None:
    """Evaluate RAG configurations against versioned datasets."""


@app.command()
def validate(dataset: DatasetArgument) -> None:
    """Load a dataset file and report whether it is well-formed."""
    try:
        cases = load_dataset(dataset)
    except (DatasetValidationError, OSError) as error:
        typer.secho(f"Invalid dataset: {error}", fg=typer.colors.RED)
        raise typer.Exit(code=1) from error

    summary = summarize_dataset(cases)
    typer.echo(f"{summary.case_count} cases loaded from {dataset}")
    typer.echo(f"{summary.unanswerable_count} unanswerable ({summary.unanswerable_ratio:.0%})")


if __name__ == "__main__":
    app()
