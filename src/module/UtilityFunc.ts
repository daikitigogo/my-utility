/**
 * camelCase to snake_case.
 * @param camel string
 */
export const camelToSnake = (camel: string): string =>
  camel.replace(/[A-Z0-9]/g, (matched) => '_' + matched.toLowerCase())
    .replace(/^_/, '');

/**
 * sname_case to camelCase.
 * @param snake string
 */
export const snakeToCamel = (snake: string): string =>
  snake.replace(/(_)(.)/g, (_1, _2, p2: string) => p2.toUpperCase());

/**
 * snake_case_object to camelCaseObject
 * @param obj {}
 */
export const snakeObjToCamelObj = (obj: {
  [key: string]: any;
}): { [key: string]: any } => {
  return Object.entries(obj)
    .map(([k, v]) => [snakeToCamel(k), v])
    .reduce((x, [k, v]) => ({ ...x, [k]: v }), {});
};

/**
 * #{key} replace value in target.
 * @param value string
 * @param replacer []
 */
export const multiReplace = (
  target: string,
  replacer: { [key: string]: any },
): string => {
  return Object.entries(replacer).reduce(
    (p, [k, v]) => p.replace(new RegExp(`#{${k}}`, 'g'), v),
    target,
  );
};

/**
 * 文字列を指定分割単位で配列に分割する再帰関数
 * 分割単位に足りない場合はパディング文字で右埋めする
 * @param target string 分割対象文字列
 * @param accum string[] 戻り値
 * @param splitUnit number 分割単位
 * @param padStr string パディング文字
 */
export const split = (
  target: string,
  accum: string[],
  splitUnit: number,
  padStr: string,
): string[] => {
  if (target.length < splitUnit) {
    return accum.concat(target.padEnd(splitUnit, padStr));
  }
  const nextAccum = accum.concat(target.slice(0, splitUnit));
  const nextTarget = target.slice(splitUnit);
  return split(nextTarget, nextAccum, splitUnit, padStr);
};
