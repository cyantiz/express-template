export function isString(value) {
  return typeof value === 'string' || value instanceof String;
}

export function isStringEmpty(value) {
  if (value && isString(value)) return false;

  return true;
}

export function containSpace(value) {
  return value.indexOf(' ') > -1;
}

export function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function replaceAll(str, find, replace) {
  return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

export function isNullOrWhitespace(input: string | null | undefined) {
  if (typeof input === 'undefined' || input == null) {
    return true;
  }

  return input.replace(/\s/g, '').length < 1;
}

export function formatString(str: string, ...args: string[]): string {
  if (isNullOrWhitespace(str)) {
    return '';
  }

  return str.replace(/{(\d+)}/g, (match, index) => args[index] || '');
}

export function getImageSourcesFromHtmlString(htmlString: string): string[] {
  let imageSource;
  const imageRegex = /<img[^>]+src=["']?([^"\s]+)["']/g;
  const imageSources = [];

  while ((imageSource = imageRegex.exec(htmlString))) {
    if (imageSource[1] !== "'") imageSources.push(imageSource[1]);
  }

  return imageSources;
}

export function deleteImageFromHTMLString(htmlString: string): string {
  return htmlString.replace(/<img .*?>/g, ' ');
}

export function lowerCaseFirstLetterOfString(string: string): string {
  return string ? string.charAt(0).toLowerCase() + string.slice(1) : '';
}
