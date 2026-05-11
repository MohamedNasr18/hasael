export const isAdmin = (req, res, next) => {
  if (req.user.role !== "ADMIN") {
    return next(new appError('Access denied', 403));
  }
  next();
}; 