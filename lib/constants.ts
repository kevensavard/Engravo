// Application Constants

// File Upload Constraints
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_UPLOAD_DIMENSION = 4096; // 4096px
export const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];

// Image Processing Defaults
export const DEFAULT_SHARPEN_AMOUNT = 2;
export const DEFAULT_PUZZLE_PIECES = 12;
export const DEFAULT_PUZZLE_CORNER_RADIUS = 5;
export const DEFAULT_UPSCALE_FACTOR = 2;
export const DEFAULT_DEPTH_MAP_DETAIL = 50;

// Color Correction Ranges
export const BRIGHTNESS_MIN = 0.5;
export const BRIGHTNESS_MAX = 2;
export const CONTRAST_MIN = 0.5;
export const CONTRAST_MAX = 2;
export const SATURATION_MIN = 0;
export const SATURATION_MAX = 2;

// Vectorization Settings
export const VECTORIZE_THRESHOLD = 128;
export const VECTORIZE_COLOR = "#000000";
export const VECTORIZE_BACKGROUND = "#FFFFFF";

// Background Removal
export const BG_REMOVAL_THRESHOLD = 240;

// Depth Map
export const DEPTH_MAP_MIN_BLUR = 1;
export const DEPTH_MAP_MAX_BLUR = 10;

// Storage
export const UPLOAD_DIR = "public/uploads";
export const UPLOAD_URL_PREFIX = "/uploads";

// Processing Timeouts
export const DEFAULT_TIMEOUT_MS = 30000; // 30 seconds
export const LONG_OPERATION_TIMEOUT_MS = 60000; // 60 seconds

// Feature Flags
export const FEATURES = {
  ML_BACKGROUND_REMOVAL: false,
  ML_DEPTH_ESTIMATION: false,
  ML_SUPER_RESOLUTION: false,
  JOB_QUEUE: false,
  CLOUD_STORAGE: false,
};

