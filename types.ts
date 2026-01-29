
export interface NewsArticle {
  title: string;
  source: string;
  timestamp: string;
  summary?: string;
  url: string;
}

export interface ScriptOutput {
  intro: string;
  newsSegments: {
    title: string;
    script: string;
    transition: string;
    imageUrl?: string;
  }[];
  outro: string;
  thumbnailUrl?: string;
}

export enum WorkflowStage {
  IDLE = 'IDLE',
  FETCHING = 'DATA_SCAN',
  SUMMARIZING = 'NEURAL_SYNTHESIS',
  GENERATING = 'SCRIPT_COMPILING',
  GENERATING_IMAGES = 'VISUAL_VECTORING',
  COMPLETED = 'LINK_ESTABLISHED'
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}
