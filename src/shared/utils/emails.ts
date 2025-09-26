const regexp = new RegExp(
  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
);
export const isEmail = (email: string) => {
  return regexp.test(email);
};

export const isWildcardEmail = (email: string): boolean => {
  // must start with single *, then @, then sybmols, then 2-4 letters of top-level domains
  return /^\*{1,1}@([\w-]+\.)+[\w-]{2,4}$/.test(email);
};

export const hasWildcardAccess = (
  whitelistedEmailsDb: string[],
  email: string,
): boolean => {
  return whitelistedEmailsDb.some((emailDb: string) => {
    if (isWildcardEmail(emailDb)) {
      const domainFromEmailDb = emailDb.split('*')[1];
      if (email.length > domainFromEmailDb.length) {
        return (
          email.substring(email.length - domainFromEmailDb.length) ===
          domainFromEmailDb
        );
      }
    }
  });
};
