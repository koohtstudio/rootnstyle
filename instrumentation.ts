// Runs once when the server starts. In live mode a missing key stops the app right here.
export async function register() {
  const { assertConfig } = await import("./lib/config");
  assertConfig();
}
