import { JSONObject } from "../Container";

export function keywordReplacement(template: string, payload: JSONObject): string {
  let result: string = template;
  const keywords: string[] = extractKeywords(template);
  keywords.forEach((keyword) => {
    result = result.replace('${' + keyword + '}', payload[keyword] as string);
  })

  return result;
}

export function extractKeywords(input: string): string[] {
  const regex = /\${(\w+)}/g;
  const keywords: string[] = [];

  let match;
  while ((match = regex.exec(input)) !== null) {
    keywords.push(match[1]);
  }

  return keywords;
}