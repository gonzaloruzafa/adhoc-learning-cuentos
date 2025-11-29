export interface StoryRequest {
  concept: string;
  interest: string;
}

export interface StoryResponse {
  title: string;
  content: string;
  moralOrFact: string; // A key takeaway or fun fact
  images: string[];
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}