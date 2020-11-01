declare namespace NodeJS {
  export interface ProcessEnv {
    TOKEN_SECRET: string;
    GITHUB_CLIENT_ID: string;
    GITHUB_CLIENT_SECRET: string;
    SERVER_URL: string;
    REFRESH_TOKEN_SECRET: string;
    ACCESS_TOKEN_SECRET: string;
  }
}
