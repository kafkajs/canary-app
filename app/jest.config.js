module.exports = {
  transform: { '^.+\\.ts?$': 'ts-jest' },
  testEnvironment: 'node',
  testRegex: '/.*\\.(test|spec)?\\.ts$',
  moduleFileExtensions: ['ts', 'js', 'json', 'node']
};