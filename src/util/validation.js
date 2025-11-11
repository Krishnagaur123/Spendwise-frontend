
export const validateEmail = (email) => {
  const value = (email || "").trim();
  if (!value) return false;

  // one @, no spaces, at least one dot after domain
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(value);
};
