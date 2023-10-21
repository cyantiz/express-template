export const isEmail = (email: string): boolean => {
  const emailRegex = /\S+@\S+\.\S+/;

  return emailRegex.test(email);
};
