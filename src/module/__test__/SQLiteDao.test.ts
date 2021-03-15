import { EntityBase, SQLiteDao } from '../SQLiteDao';

type TestTableColumns = {
  id: number | null;
  name: string;
  remarks: string | null;
};
class TestTable extends EntityBase<TestTableColumns> { }

const testData: TestTableColumns[] = Array.from({ length: 10 })
  .map((_, i) => ({
    id: i + 1,
    name: `name-${i + 1}`,
    remarks: (i + 1) % 2 === 0 ? `remarks` : null,
  }));

const dao = new SQLiteDao(`${__dirname}/sqlite.test.db`);
beforeAll(() => {
  dao.db.prepare(`
    CREATE TABLE test_table (
      id INTEGER PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      remarks TEXT
    );
  `).run();
});
beforeEach(() => {
  testData.forEach(x => {
    dao.db.prepare(`
      INSERT INTO test_table (
        id,
        name,
        remarks
      ) VALUES (
        @id,
        @name,
        @remarks
      );
    `).run(x);
  });
});
afterEach(() => {
  dao.db.prepare('DELETE FROM test_table;').run();
});
afterAll(() => {
  dao.db.prepare('DROP TABLE test_table;').run();
  dao.close();
});

describe('insert test.', () => {
  test('Insert not null columns only.', () => {
    const entity = new TestTable({
      id: 91,
      name: 'name-91',
    });
    const insertId = dao.insert(entity);
    expect(insertId).toBe(91);
    const result = dao.db.prepare('SELECT * FROM test_table WHERE id = ?;').get(entity.columns.id);
    expect(result).toEqual({ ...entity.columns, remarks: null });
  });
  test('Insert all columns.', () => {
    const entity = new TestTable({
      id: 92,
      name: 'name-92',
      remarks: 'remarks'
    });
    const insertId = dao.insert(entity);
    expect(insertId).toBe(92);
    const result = dao.db.prepare('SELECT * FROM test_table WHERE id = ?;').get(entity.columns.id);
    expect(result).toEqual({ ...entity.columns });
  });
  test('Insert primary key is null', () => {
    const entity = new TestTable({
      id: null,
      name: 'name-null',
    });
    const insertId = dao.insert(entity);
    expect(insertId).toBe(11);
    const result = dao.db.prepare('SELECT * FROM test_table WHERE id = ?;').get(11);
    expect(result).toEqual({ id: 11, name: 'name-null', remarks: null });
  });
});

describe('update test.', () => {
  test('Update name column.', () => {
    const entity = new TestTable({
      id: 1,
      name: 'update-1',
    });
    dao.update(entity, ['id', '=', entity.columns.id!]);
    const result = dao.db.prepare('SELECT * FROM test_table WHERE id = ?;').get(entity.columns.id);
    expect(result).toEqual({ ...entity.columns, remarks: null });
  });
  test('Update all columns', () => {
    const entity = new TestTable({
      id: 1,
      name: 'update-1',
      remarks: 'remarks',
    });
    dao.update(entity, ['id', '=', entity.columns.id!]);
    const result = dao.db.prepare('SELECT * FROM test_table WHERE id = ?;').get(entity.columns.id);
    expect(result).toEqual({ ...entity.columns });
  });
  test('Update some records.', () => {
    const entity = new TestTable({
      name: 'update!',
    });
    dao.update(entity, ['remarks', '=', 'remarks']);
    const result = dao.db.prepare('SELECT * FROM test_table;').all();
    expect(result).toEqual(expect.arrayContaining(testData.filter(x => x.remarks).map(x => ({ ...x, name: 'update!' }))));
  });
});

describe('select test.', () => {
  test('Select by "<"', () => {
    const result = dao.select(new TestTable({}), ['id', '<', 5]);
    expect(result).toEqual(expect.arrayContaining(testData.filter(x => x.id! < 5)));
  });
  test('Select by "<="', () => {
    const result = dao.select(new TestTable({}), ['id', '<=', 5]);
    expect(result).toEqual(expect.arrayContaining(testData.filter(x => x.id! <= 5)));
  });
  test('Select by "="', () => {
    const result = dao.select(new TestTable({}), ['id', '=', 5]);
    expect(result).toEqual(expect.arrayContaining(testData.filter(x => x.id! === 5)));
  });
  test('Select by ">="', () => {
    const result = dao.select(new TestTable({}), ['id', '>=', 5]);
    expect(result).toEqual(expect.arrayContaining(testData.filter(x => x.id! >= 5)));
  });
  test('Select by ">"', () => {
    const result = dao.select(new TestTable({}), ['id', '>', 5]);
    expect(result).toEqual(expect.arrayContaining(testData.filter(x => x.id! > 5)));
  });
  test('Select by "IS NULL"', () => {
    const result = dao.select(new TestTable({}), ['remarks', 'IS NULL', null]);
    expect(result).toEqual(expect.arrayContaining(testData.filter(x => !x.remarks)));
  });
  test('Select by "IS NOT NULL"', () => {
    const result = dao.select(new TestTable({}), ['remarks', 'IS NOT NULL', null]);
    expect(result).toEqual(expect.arrayContaining(testData.filter(x => x.remarks)));
  });
  test('Select one no records.', () => {
    const result = dao.selectOne(new TestTable({}), ['id', '=', null]);
    expect(result).toBeUndefined();
  });
  test('Select all no records.', () => {
    const result = dao.select(new TestTable({}), ['id', '=', null]);
    expect(result).toEqual([]);
  });
});

describe('delete test.', () => {
  test('Delete one record.', () => {
    dao.delete(new TestTable({}), ['id', '=', 1]);
    const result = dao.db.prepare('SELECT * FROM test_table;').all();
    expect(result).toEqual(expect.arrayContaining(testData.filter(x => x.id !== 1)));
  });
  test('Delete all records.', () => {
    dao.delete(new TestTable({}));
    const result = dao.db.prepare('SELECT * FROM test_table;').all();
    expect(result).toEqual([]);
  });
});

describe('transaction test/', () => {
  test('commit', () => {
    const insertEntity = {
      id: 11,
      name: 'name-11',
      remarks: 'remarks-11',
    };
    const updateEntity = {
      id: 2,
      name: 'update-2',
      remarks: 'remarks',
    };
    dao.transaction(() => {
      const insertId = dao.insert(new TestTable(insertEntity));
      expect(insertId).toBe(11);
      dao.update(new TestTable(updateEntity), ['id', '=', updateEntity.id]);
    });
    const result = dao.select(new TestTable({}));
    const expected = testData
      .concat(insertEntity)
      .map(x => x.id === 2 ? updateEntity : x);
    expect(result).toEqual(expect.arrayContaining(expected));
  });
  test('rollback', () => {
    const insertEntity = {
      id: 11,
      name: 'name-11',
      remarks: 'remarks-11',
    };
    const updateEntity = {
      id: 2,
      name: 'update-2',
      remarks: 'remarks',
    };
    try {
      dao.transaction(() => {
        const insertId = dao.insert(new TestTable(insertEntity));
        expect(insertId).toBe(11);
        dao.insert(new TestTable(updateEntity));
      });
    } catch (e) {
      const result = dao.select(new TestTable({}));
      expect(result).toEqual(expect.arrayContaining(testData));
      return;
    }
    throw new Error('Failed transaction.');
  });
}) ;

