export interface PosterText {
  id: string;
  content: string;
  fontSize: number;
  color: string;
  x: number; // Percent 0-100
  y: number; // Percent 0-100
  width?: number; // Percent 0-100
  height?: number; // Percent 0-100
  fontWeight: string;
  rotation: number;
  shadowColor: string;
  shadowBlur: number;
  strokeColor: string;
  strokeWidth: number;
  textAlign: 'left' | 'center' | 'right';
  lineHeight: number;
}

export interface PosterState {
  templateImage: string | null;
  texts: PosterText[];
  selectedTextId: string | null;
  suggestedColors: string[];
}
