// Enum for purposeType
export enum PurposeType {
  YOUTUBE_THUMBNAIL = "유튜브 썸네일",
  PERFORMANCE_MARKETING = "퍼포먼스 광고 소재",
  REELS_THUMBNAIL = "릴스 썸네일",
  HOMEPAGE_HERO = "홈페이지 히어로 카피",
}

// Type for basic attributes
export type BasicAttributes = {
  companyName: string;
  customerProblem: string;
  companyAdvantage: string;
  competitorWeakness?: string;
  serviceOffered: string;
  purposeType?: PurposeType;
};

// Type for Ingredient
export type Ingredient = {
  uuid: string;
  position: { x: number; y: number };
  type: "emoji" | "copy" | "keyword";
  parentIngredients?: Ingredient[];
  creationMethod: "craft" | "manual";
  index: number;
  textValue: string;
  tldrawShapeUuid: string;
};

// Type for Emoji
export type Emoji = {
  name: string;
  emoji: string;
};

// Type for whiteboard, keyword panel, emoji panel, and copy panel lists
export type WhiteboardList = Ingredient[];
export type KeywordList = Ingredient[];
export type EmojiList = Emoji[];
export type CopyList = Ingredient[];

export type TLDrawObject = {
  id: string;
  type: string;
  position: { x: number; y: number };
  text: string;
};

// Enum for possible colors
export enum TLDrawColor {
  BLACK = "black",
  BLUE = "blue",
  GREEN = "green",
  GREY = "grey",
  LIGHT_BLUE = "light-blue",
  LIGHT_GREEN = "light-green",
  LIGHT_RED = "light-red",
  LIGHT_VIOLET = "light-violet",
  ORANGE = "orange",
  RED = "red",
  VIOLET = "violet",
  WHITE = "white",
  YELLOW = "yellow",
}

export interface CopyGeneratorData {
  emojiName?: string;
  mainKeyword?: string;
  companyName?: string;
  customerProblem?: string;
  companyAdvantage?: string;
  competitorWeakness?: string;
  serviceOffered?: string;
  purposeType?: string;
  copy?: string;
}
