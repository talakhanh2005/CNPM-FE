export const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
export const utf8Length = (value) => new TextEncoder().encode(value).length;
