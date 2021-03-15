/**
 * 日付汎用クラス
 */
export default class UtilityDate {
  /**
   * constructor
   * @param date Date
   */
  constructor(private date: Date = new Date(), private connector = '-') {}

  /**
   * 日付をフォーマットする
   */
  format(connector: string = this.connector): string {
    const year = this.year().toString();
    const month = this.month().toString();
    const day = this.day().toString();

    return [year, ('0' + month).slice(-2), ('0' + day).slice(-2)].join(
      connector,
    );
  }

  /**
   * 日付をフォーマットする(時分秒)
   * @param connector YMD接続文字列
   */
  formatWithHMS(connector = this.connector): string {
    const ymd = this.format(connector);
    const hms = [
      this.hours().toString().padStart(2, '0'),
      this.minutes().toString().padStart(2, '0'),
      this.seconds().toString().padStart(2, '0'),
    ].join(connector ? ':' : '');
    return `${ymd}${connector ? ' ' : ''}${hms}`;
  }

  /**
   * 日付をフォーマットする(時分秒ミリ)
   * @param connector YMD接続文字列
   */
  formatWithHMSF(connector = this.connector): string {
    const ymd = this.format(connector);
    const hmsf = [
      this.hours().toString().padStart(2, '0'),
      this.minutes().toString().padStart(2, '0'),
      this.seconds().toString().padStart(2, '0'),
      this.milliseconds().toString().padStart(3, '0'),
    ].join(connector ? ':' : '');
    return `${ymd}${connector ? ' ' : ''}${hmsf}`;
  }

  /**
   * 年を返す
   */
  year(): number {
    return this.date.getFullYear();
  }

  /**
   * 月を返す
   */
  month(): number {
    return this.date.getMonth() + 1;
  }

  /**
   * 日を返す
   */
  day(): number {
    return this.date.getDate();
  }

  /**
   * 時を返す
   */
  hours(): number {
    return this.date.getHours();
  }

  /**
   * 分を返す
   */
  minutes(): number {
    return this.date.getMinutes();
  }

  /**
   * 秒を返す
   */
  seconds(): number {
    return this.date.getSeconds();
  }

  /**
   * ミリ秒を返す
   */
  milliseconds(): number {
    return this.date.getMilliseconds();
  }

  /**
   * 日を変更した新しいインスタンスを返す
   * @param day number
   */
  withDayOfMonth(day: number): UtilityDate {
    const date = new Date(this.year(), this.month() - 1, day);

    return new UtilityDate(date);
  }

  /**
   * Date型に変換する
   */
  toDate(): Date {
    return new Date(this.year(), this.month() - 1, this.day());
  }
}
