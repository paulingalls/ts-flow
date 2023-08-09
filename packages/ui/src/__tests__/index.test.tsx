import * as React from "react";
import { createRoot } from "react-dom/client";
import { CounterButton } from "../CounterButton";

describe("CounterButton", () => {
  it("renders without crashing", () => {
    const div = document.createElement("div");
    const root = createRoot(div);
    root.render(<CounterButton />);
    root.unmount();
  });
});
