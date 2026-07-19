export type BrandingConfig = {
  userId: string;
  primaryColor: string;
  backgroundColor: string;
  fontFamily: string;
  borderRadius: number;
  logoUrl: string | null;
  updatedAt: string;
};

export type BrandingMutationPayload = {
  primaryColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
  borderRadius?: number;
  logoUrl?: string;
};

export type BrandingResponse = {
  success: boolean;
  data: BrandingConfig | null;
  message: string;
};
