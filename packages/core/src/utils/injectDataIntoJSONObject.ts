import { JSONObject, JSONValue } from "../Container";
import { keywordReplacement } from "./keywordReplacement";

export function injectDataIntoJSONObject(
  data: JSONObject,
  template: JSONObject,
): JSONObject {
  const filledObject: JSONObject = structuredClone(template);
  return injectData(data, filledObject) as JSONObject;
}

function injectData(
  data: JSONObject,
  item: JSONObject | JSONValue,
): JSONObject | JSONValue {
  if (item instanceof Array) {
    item.forEach((value, index) => {
      item[index] = injectData(data, value as JSONObject);
    });
  } else if (typeof item === "string") {
    return keywordReplacement(item, data) as JSONValue;
  } else if (typeof item === "object") {
    Object.keys(item).forEach((key) => {
      item[key] = injectData(data, item[key]);
    });
  }
  return item;
}
