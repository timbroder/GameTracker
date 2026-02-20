module.exports = {
  setString: jest.fn(),
  getString: jest.fn().mockResolvedValue(''),
  hasString: jest.fn().mockResolvedValue(false),
  default: {
    setString: jest.fn(),
    getString: jest.fn().mockResolvedValue(''),
    hasString: jest.fn().mockResolvedValue(false),
  },
};
