import pytest
from pydantic import ValidationError

from financiera_api.imports_schemas import CategorizationRuleCreate, ImportRowPreview


def test_import_row_requires_positive_row_number():
    with pytest.raises(ValidationError):
        ImportRowPreview.model_validate({"row_number": 0, "status": "invalid"})


def test_categorization_priority_is_bounded():
    with pytest.raises(ValidationError):
        CategorizationRuleCreate.model_validate(
            {
                "name": "Supermercado",
                "match_text": "mercado",
                "category_id": "category-id",
                "priority": 0,
            }
        )
