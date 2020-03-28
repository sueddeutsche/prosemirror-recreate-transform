import { AnyObject } from "./types";
/**
 * get target value from json-pointer (e.g. /content/0/content)
 * @param  {AnyObject} obj  object to resolve path into
 * @param  {string}    path json-pointer
 * @return {any} target value
 */
export declare function getFromPath(obj: AnyObject, path: string): any;
