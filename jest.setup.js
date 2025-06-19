// Global Jest setup for Electron preload mocks
beforeAll(() => {
  if (!global.window) global.window = {};
  if (!window.electron) {
    window.electron = {
      invoke: jest.fn().mockResolvedValue({}),
    };
  }
});
