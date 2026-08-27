import { render, screen } from "@testing-library/react";
import type { Session } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { BudgetWorkspace } from "./BudgetWorkspace";
import type { Category } from "./budgets";

const categories: Category[] = [
  {
    id: "home",
    name: "Hogar",
    type: "expense",
    icon: "home",
    color: "#10B981",
    parent_id: null,
    is_default: true,
    is_active: true,
    user_id: null,
  },
  {
    id: "utilities",
    name: "Suministros",
    type: "expense",
    icon: "zap",
    color: "#3B82F6",
    parent_id: "home",
    is_default: false,
    is_active: true,
    user_id: "user-1",
  },
];

describe("BudgetWorkspace", () => {
  it("presenta la jerarquía y distingue el catálogo de las categorías personales", () => {
    render(
      <BudgetWorkspace
        session={{ user: { id: "user-1" } } as Session}
        currency="EUR"
        categories={categories}
        mode="categories"
        onCategoriesChanged={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "Hogar" })).toBeInTheDocument();
    expect(screen.getByText("Suministros")).toBeInTheDocument();
    expect(screen.getByText(/Catálogo/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Editar Suministros" })).toBeInTheDocument();
  });
});
