export default {
  // This method is used to mock async processes in demo.
  sleep: (ms: number) => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  },
};
