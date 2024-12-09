import { Database } from "jsr:@db/sqlite";
import { sqliteFileLocation } from "../lib/config.ts";
import {
  BasicDownloadableDescription,
  DbCount,
  DownloadableDbRow,
  FullDownloadableDescription,
  Result,
} from "../lib/types.ts";
import {
  createSalt,
  currentEncrypter,
  getEncrypterByType,
} from "../lib/crypto.ts";

export class Storage {
  private db: Database;

  constructor() {
    this.db = new Database(sqliteFileLocation);
    this.ensureStructureExists();
  }

  private ensureStructureExists(): void {
    this.db.prepare(`create table if not exists downloadables
                     (
                         id                     integer not null
                         constraint downloadables_pk
                         primary key autoincrement,
                         name                   text,
                         file_or_directory_path text,
                         url_key                text,
                         encrypted_password     text,
                         encryption_type        text,
                         encryption_salt        text,
                         description            text,
                         created_at             datetime default current_timestamp,
                         available_until        datetime
                     );

    `).run();
  }

  public async lookupDownloadable(
    urlKey: string,
    plainTextPassword: string,
  ): Promise<BasicDownloadableDescription | null> {
    const dbResult: DownloadableDbRow | undefined = this.db.prepare(
      `select * from downloadables where url_key = ? and (available_until > datetime('now') or available_until is null)`,
    ).get(urlKey);
    if (!dbResult) {
      await currentEncrypter(plainTextPassword, "abcdef"); // to standardise the response time
      return null;
    }
    const {
      encrypted_password,
      encryption_salt,
      encryption_type,
      file_or_directory_path,
      description,
    } = dbResult;
    const encryptPassword = getEncrypterByType(encryption_type);
    const { hash } = await encryptPassword(plainTextPassword, encryption_salt);
    const hashesMatch = hash === encrypted_password;
    if (!hashesMatch) {
      return null;
    }
    return {
      path: file_or_directory_path,
      isDirectory: false,
      description,
    };
  }

  public async createDownloadable(
    fullDescription: FullDownloadableDescription,
  ): Promise<Result> {
    const {
      name,
      path,
      urlKey,
      plainTextPassword,
      description,
      availableUntil,
    } = fullDescription;
    const { hash, salt, version } = await currentEncrypter(
      plainTextPassword,
      createSalt(),
    );

    const nameCheckResult = this.db.prepare(`select count(id) as count
                                             from downloadables
                                             where url_key = ?`).get<DbCount>(
      urlKey,
    );
    if (nameCheckResult && nameCheckResult.count > 0) {
      return {
        success: false,
        error: true,
        message: "URL Key already exists in database",
      };
    }

    const result = this.db.prepare(
      `insert into downloadables (name, file_or_directory_path, url_key,
                                                               encrypted_password, encryption_type, encryption_salt,
                                                               description, available_until)
                                    values (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .run(
        name,
        path,
        urlKey,
        hash,
        version,
        salt,
        description,
        availableUntil,
      );
    return {
      success: result > 0,
      error: result === 0,
      message: `inserted ${result} rows`,
    };
  }

  public close() {
    this.db.close();
  }
}

// db.prepare("create table if not exists downloadables (id int, name text)").run();
