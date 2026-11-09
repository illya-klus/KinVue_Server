const assert = require("node:assert/strict");
const { test } = require("node:test");

test("registration validation normalizes identity fields and preserves password", async () => {
  const { validateRegistrationInput } =
    await import("../dist/modules/auth/registration-input.js");
  assert.deepEqual(
    validateRegistrationInput({
      email: "  Bogdan@Example.com ",
      username: "  BoHDan_1 ",
      displayName: "  Bogdan Tytysh  ",
      password: "  case Sensitive  ",
    }),
    {
      email: "bogdan@example.com",
      username: "bohdan_1",
      displayName: "Bogdan Tytysh",
      password: "  case Sensitive  ",
    },
  );
});

test("registration validation enforces required fields and accepted bounds", async () => {
  const { validateRegistrationInput } =
    await import("../dist/modules/auth/registration-input.js");
  const valid = {
    email: "user@example.com",
    username: "valid_user",
    displayName: "Valid User",
    password: "123456789012",
  };
  const invalid = [
    {},
    { ...valid, password: "12345678901" },
    { ...valid, password: "é".repeat(513) },
    { ...valid, username: "ab" },
    { ...valid, username: "a-bc" },
    { ...valid, username: "x".repeat(31) },
    { ...valid, displayName: "  " },
    { ...valid, displayName: "x".repeat(101) },
    { ...valid, email: "not-an-email" },
  ];

  for (const input of invalid) {
    assert.throws(() => validateRegistrationInput(input), { status: 400 });
  }
  assert.doesNotThrow(() =>
    validateRegistrationInput({ ...valid, password: "é".repeat(512) }),
  );
});
