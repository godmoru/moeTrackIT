/**
 * Async handler to wrap each route.
 * @param {Function} fn - The async function to wrap
 * @returns {Function} A middleware function that handles async/await errors
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => next(err));
};

export default catchAsync;
