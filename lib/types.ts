export type BasicDownloadableDescription = {
  path: string;
  isDirectory: boolean;
  description: string;
};

export type FullDownloadableDescription = BasicDownloadableDescription & {
  name: string;
  urlKey: string;
  plainTextPassword: string;
  availableUntil: Date | null;
};

export type DownloadableDbRow = {
  id: number;
  name: string;
  file_or_directory_path: string;
  url_key: string;
  encrypted_password: string;
  encryption_type: string;
  encryption_salt: string;
  description: string;
};

export type Result = {
  success: boolean;
  error: boolean;
  message: string | undefined;
};

export type PasswordDetails = {
  hash: string;
  salt: string;
  version: string;
};

export type DbCount = {
  count: number;
};

export type FileDetails = {
  exists: boolean;
  isDirectory: boolean;
};
