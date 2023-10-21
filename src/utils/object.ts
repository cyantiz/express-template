import {ObjectId} from 'mongodb';
import mongoose from 'mongoose';

export function removeNullPropertiesFromObject(object: any) {
  return Object.fromEntries(Object.entries(object).filter(([_, v]) => v != null));
}
export const isObject = (obj: any): boolean =>
  Object.prototype.toString.call(obj) === '[object Object]';

export function standardizeMongoData(data: any): any {
  const result = {...data};
  const mongoObjectIdRegex = /^[0-9a-fA-F]{24}$/;

  for (const key in result) {
    let value = result[key];

    if (isObject(value)) {
      value = standardizeMongoData(value);
    }
    if (value && mongoose.isValidObjectId(value) && mongoObjectIdRegex.test(value)) {
      value = new ObjectId(value.toString());
    }
    if (Array.isArray(value) && value.length > 0) {
      value.map((element) => {
        standardizeMongoData(element);
      });
    }
    result[key] = value;
  }

  return result;
}
