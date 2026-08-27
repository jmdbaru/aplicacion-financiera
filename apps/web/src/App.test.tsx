import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { App } from "./App";

describe("App", () => {
  it("muestra el punto de entrada principal", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Tu dinero, con calma y claridad." })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument();
  });
});
