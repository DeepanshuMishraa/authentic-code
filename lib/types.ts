export interface GitHubRepo {
  id: number;
  name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  updated_at: string;
  language: string;
  private: boolean;

}

export interface User {
  id: number,
  avatar: string,
  unique_name: string,
  traits: string[],
  username: string,
}
