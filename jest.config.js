module.exports = {
  verbose: true,
  "rootDir": "./",
  testMatch: [
    "**/src/__tests__/unit/**/*.+(ts|tsx|js)",
    // "**/src/__tests__/acceptance/**/*.+(ts|tsx|js)"
  ],
  "transform": {
    "^.+\\.(ts|tsx)?$": "ts-jest"
  },
  "coverageThreshold": {
    "global": {
      "branches": 80,
      "functions": 80,
      "lines": 80,
      "statements": 0
    }
  }
}