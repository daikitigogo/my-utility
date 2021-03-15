import BetterSQLite, { Database } from 'better-sqlite3';
import { Logger, logging } from './Logger';
import { camelToSnake, snakeObjToCamelObj } from './/UtilityFunc';

/**
 * 検索条件キーワード
 */
type ConditionKeyword = '<' | '<=' | '=' | '>=' | '>' | '<>' | 'IS NULL' | 'IS NOT NULL';

/**
 * 検索条件指定タプル
 */
type Condition<T> = [keyof T, ConditionKeyword, string | number | null];

/**
 * ベースカラム型
 */
type Columns = Record<string, string | number | null>;

/**
 * WHERE句とバインドオブジェクトを作成する
 * @param conditions 検索条件
 * @returns WHERE句とバインドオブジェクト
 */
const createConditionValue = <T extends Columns> (conditions: Array<Condition<T>>): [string, Partial<T>] => {
  if (!conditions.length){
    return ['', {}];
  }
  const where = conditions.map(([key, cond]) => `${camelToSnake(key as string)} ${cond} ${cond === 'IS NULL' || cond === 'IS NOT NULL' ? '' : `@${key}`}`).join(' AND ');
  return [
    `WHERE ${where}`,
    conditions.reduce((accum, [key, _, value]) => ({ ...accum, [key]: value }), {}),
  ];
};

/**
 * SELECT-SQLとバインドオブジェクトを作成する
 * @param tableName テーブル名
 * @param conditions 検索条件
 * @returns SELECT-SQLとバインドオブジェクト
 */
const createSelectSQL = <T extends Columns>(tableName: string, conditions: Array<Condition<T>>): [string, Partial<T>] => {
  const sql = `
    SELECT
      *
    FROM
      ${tableName}
  `;
  const [where, obj] = createConditionValue(conditions);
  return [sql + where, obj];
}

/**
 * 基底エンティティクラス
 */
export abstract class EntityBase<T extends Columns> {

  /** テーブル名 */
  readonly tableName: string;

  /**
   * コンストラクタ
   * @param columns カラム値
   */
  constructor(readonly columns: Partial<T>) {
    this.tableName = camelToSnake(this.constructor.name);
  }
};

/**
 * Data access object for SQLite.
 */
export class SQLiteDao {

  /** better-sqlite3 db object */
  readonly db: Database;

  /**
   * コンストラクタ
   * @param dbName データベース名
   */
  constructor(dbName: string) {
    this.db = new BetterSQLite(dbName, { verbose: Logger.debug });
  }

  /**
   * トランザクション
   * @param func トランザクション処理関数
   * @returns T
   */
  transaction<T = void>(func: () => T): T {
    const tx = this.db.transaction(func);
    return tx();
  }

  /**
   * インサート
   * @param entity エンティティ
   * @returns インサートID
   */
  insert = logging('SQLiteDao.insert', <T extends Columns> (entity: EntityBase<T>): number => {
    const keys = Object.keys(entity.columns);
    const stmt = this.db.prepare(`
      INSERT INTO ${entity.tableName} (
        ${keys.map((key) => camelToSnake(key)).join(', ')}
      ) VALUES (
        ${keys.map((key) => `@${key}`).join(', ')}
      );
    `);
    const result = stmt.run(entity.columns);
    return Number(result.lastInsertRowid);
  });

  /**
   * アップデート
   * @param entity エンティティ
   * @param conditions 更新条件
   */
  update = logging('SQLiteDao.update', <T extends Columns> (entity: EntityBase<T>, ...conditions: Array<Condition<T>>): void => {
    const keys = Object.keys(entity.columns);
    const sql = `
      UPDATE
        ${entity.tableName}
      SET
        ${keys.map(key => `${camelToSnake(key as string)} = @${key}`).join(', ')}
    `;
    const [where, obj] = createConditionValue(conditions);
    const stmt = this.db.prepare(sql + where);
    stmt.run({ ...entity.columns, ...obj });
  });

  /**
   * デリート
   * @param entity エンティティ
   * @param conditions 削除条件
   */
  delete = logging('SQLiteDao.delete', <T extends Columns>(entity: EntityBase<T>, ...conditions: Array<Condition<T>>): void => {
    const sql = `
      DELETE FROM
        ${entity.tableName}
    `;
    const [where, obj] = createConditionValue(conditions);
    const stmt = this.db.prepare(sql + where);
    stmt.run({ ...entity.columns, ...obj });
  });

  /**
   * セレクト
   * @param entity エンティティ
   * @param conditions 検索条件
   * @returns 検索結果
   */
  select = logging('SQLiteDao.select', <T extends Columns>(entity: EntityBase<T>, ...conditions: Array<Condition<T>>): T[] => {
    const [sql, obj] = createSelectSQL(entity.tableName, conditions);
    const stmt = this.db.prepare(sql);
    const results = stmt.all(obj);
    return results.map(result => snakeObjToCamelObj(result) as T);
  });

  /**
   * 単一セレクト
   * @param entity エンティティ
   * @param conditions 検索条件
   * @returns 検索結果
   */
  selectOne = logging('SQLiteDao.selectOne', <T extends Columns>(entity: EntityBase<T>, ...conditions: Array<Condition<T>>): T => {
    const [sql, obj] = createSelectSQL(entity.tableName, conditions);
    const stmt = this.db.prepare(sql);
    const result = stmt.get(obj);
    if (!result) {
      return result;
    }
    return snakeObjToCamelObj(result) as T;
  });

  /**
   * クローズ
   */
  close() {
    this.db.close();
  }
};
