import help from '../../src/modules/help';

it('provides test help strings', () => {
  expect(help.jest).toBe('jest1234');
});