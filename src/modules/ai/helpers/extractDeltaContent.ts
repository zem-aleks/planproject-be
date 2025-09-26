export const extractDeltaContent = (dataString: string) => {
  // Regular expression to find the "delta" object
  const deltaRegex =
    /"delta":\s*\{\s*"role":\s*"[^"]*",\s*"content":\s*"([^"]*)"\s*\}/;

  // Execute the regular expression on the data string
  const match = deltaRegex.exec(dataString);

  // If a match is found, return the content; otherwise, return null or an appropriate message
  return match ? match[1] : null;
};

export const extractDeltaContent2 = (dataString: string) => {
  // Regular expression to find the "delta" object
  const deltaRegex = /"delta":\s*\{[^{}]*?"content":\s*"((?:[^"\\]|\\.)*)"/;

  // Execute the regular expression on the data string
  const match = deltaRegex.exec(dataString);

  // If a match is found, return the content; otherwise, return null or an appropriate message
  return match ? match[1] : null;
};
