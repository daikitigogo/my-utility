import * as log4js from 'log4js';

const LOG_LEVEL = (process.env.NODE_LOG_LEVEL || 'DEBUG') as 'DEBUG' | 'INFO' | 'ERROR' | 'OFF';

log4js.configure({
  appenders: {
    app: {
      type: 'file',
      filename: 'app.log',
    },
    console: {
      type: 'console',
    }
  },
  categories: {
    default: {
      appenders: ['app', 'console'],
      level: LOG_LEVEL,
    }
  }
});

const Log4jsLogger = log4js.getLogger('default');

const debug = (message?: any, ...args: any[]): void => {
  Log4jsLogger.debug(message, ...args);
};

const info = (message?: any, ...args: any[]): void => {
  Log4jsLogger.info(message, ...args);
};

const error = (message?: any, ...args: any[]): void => {
  Log4jsLogger.error(message, ...args);
};

export const Logger = {
  debug,
  info,
  error,
  level: 'DEBUG',
};

/**
 * ログ出力対象の引数を返す
 * @param argArray 引数
 * @param targetArgs ログ出力対象引数
 */
const loggingArgs = (argArray: any, targetArgs?: number[]) => {
  const args = argArray instanceof Array ? Array.from(argArray) : [argArray];
  if (!targetArgs) {
    return args;
  }
  return args.filter((_, i) => targetArgs.includes(i));
};

/**
 * 指定関数の呼び出し・引数・戻り値をロギングする
 * @param key キーワード
 * @param target ロギング対象関数
 * @param targetArgs ログ出力対象引数(インデックス指定)
 */
export const logging = <T extends Function>(
  key: string,
  target: T,
  targetArgs?: number[],
): T => {
  if (Logger.level === 'OFF') {
    return target;
  }
  return new Proxy(target, {
    apply: (target: T, _: any, argArray?: any) => {
      const [sec, nanoSec] = process.hrtime();
      const uniqueKey = (sec * 1000 * 1000 * 1000) + nanoSec;
      try {
        Logger.info(`${uniqueKey} ${key} start...`);
        Logger.info(`${uniqueKey} ${key} args:\n`, loggingArgs(argArray, targetArgs));
        const result = target(...argArray);
        Promise.resolve(result).then((x) => {
          Logger.info(`${uniqueKey} ${key} returns:\n`, x);
          Logger.info(`${uniqueKey} ${key} end...`);
        });
        return result;
      } catch (e) {
        Logger.error(`${uniqueKey} ${key} throws:\n`, e);
        Logger.error(`${uniqueKey} ${key} end...`);
        throw e;
      }
    },
  });
};
