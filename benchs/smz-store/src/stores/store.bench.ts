import { bench, describe } from 'vitest';

function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

describe("fibonacci", () => {
  bench("fibo 10", () => {
    fibonacci(10);
  });

  bench("fibo 15", () => {
    fibonacci(15);
  });
});
