import { createProgram } from "./program.js";

const program = createProgram();
// The API key check that runs before each command is async; `parse()` would not wait for it.
await program.parseAsync();
