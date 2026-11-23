from django.apps import apps
from django.db import connection

for label in ["habits", "checkins"]:
    print("\n==========", label.upper(), "==========")

    for model in apps.get_app_config(label).get_models():
        print("\nMODEL:", model.__name__)
        print("TABLE:", model._meta.db_table)

        print("\nFIELDS:")
        for field in model._meta.fields:
            relation = ""
            if field.is_relation and field.remote_field:
                relation = str(field.remote_field.model)

            print(
                f"Name: {field.name} | "
                f"Type: {field.get_internal_type()} | "
                f"Null: {field.null} | "
                f"Primary Key: {field.primary_key} | "
                f"Relation: {relation}"
            )

        print("\nMODEL CONSTRAINTS:")
        for constraint in model._meta.constraints:
            print(constraint)

        print("\nDATABASE CONSTRAINTS:")
        with connection.cursor() as cursor:
            constraints = connection.introspection.get_constraints(
                cursor, model._meta.db_table
            )

        for name, item in constraints.items():
            if item.get("unique") or item.get("foreign_key") or item.get("primary_key"):
                print(name, item)
