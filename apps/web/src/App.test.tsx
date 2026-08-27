import { render, screen } from "@testing-library/react";

import { App } from "./App";

describe("App", () => {
  it("muestra el punto de entrada principal", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Empieza con una visión clara." })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir al contenido principal" })).toHaveAttribute(
      "href",
      "#main-content",
    );
  });
});

