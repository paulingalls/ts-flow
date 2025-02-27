import { JSONObject } from "../Container";

export function keywordReplacement(template: string, payload: JSONObject): string {
  let result: string = template;
  const keywords: string[] = extractKeywords(template);
  keywords.forEach((keyword) => {
    const value = getValueForKeyword(keyword, payload);
    result = result.replace('${' + keyword + '}', (value ?? process.env[keyword]));
  })

  return result;
}

function extractKeywords(input: string): string[] {
  const regex = /\${([\w.]+)}/g;
  const keywords: string[] = [];

  let match;
  while ((match = regex.exec(input)) !== null) {
    keywords.push(match[1]);
  }

  return keywords;
}

function getValueForKeyword(keyword: string, payload: JSONObject): string {
  const parts = keyword.split('.');
  let value;
  switch(parts.length) {
    case 1: {
      value = payload[parts[0]];
      break;
    }
    case 2: {
      const firstPart: JSONObject = payload[parts[0]] as JSONObject;
      value = firstPart[parts[1]];
      break;
    }
    case 3: {
      const firstPart: JSONObject = payload[parts[0]] as JSONObject;
      const secondPart: JSONObject = firstPart[parts[1]] as JSONObject;
      value = secondPart[parts[2]];
      break;
    }
    case 4: {
      const firstPart: JSONObject = payload[parts[0]] as JSONObject;
      const secondPart: JSONObject = firstPart[parts[1]] as JSONObject;
      const thirdPart: JSONObject = secondPart[parts[2]] as JSONObject;
      value = thirdPart[parts[3]];
      break;
    }
    default: {
      value = '';
    }
  }
  if (typeof value === 'string') {
    return value;
  }
  return JSON.stringify(value);
}

export function getJSONObjectFromPath(keyword: string, payload: JSONObject): JSONObject {
  const parts = keyword.split('.');
  let jsonObject: JSONObject = {};
  switch(parts.length) {
    case 1: {
      jsonObject = payload[parts[0]] as JSONObject;
      break;
    }
    case 2: {
      const firstPart: JSONObject = payload[parts[0]] as JSONObject;
      jsonObject = firstPart[parts[1]] as JSONObject;
      break;
    }
    case 3: {
      const firstPart: JSONObject = payload[parts[0]] as JSONObject;
      const secondPart: JSONObject = firstPart[parts[1]] as JSONObject;
      jsonObject = secondPart[parts[2]] as JSONObject;
      break;
    }
    case 4: {
      const firstPart: JSONObject = payload[parts[0]] as JSONObject;
      const secondPart: JSONObject = firstPart[parts[1]] as JSONObject;
      const thirdPart: JSONObject = secondPart[parts[2]] as JSONObject;
      jsonObject = thirdPart[parts[3]] as JSONObject;
      break;
    }
  }
  return jsonObject;
}