import Application from "@ioc:Adonis/Core/Application";

export const CLIP_FOLDER = Application.tmpPath() + "/Clip";
export const DOWNLOAD_FOLDER = Application.tmpPath() + "/Download";
export const MERGEDVIDEO_FOLDER = Application.tmpPath() + "/Merged";
export const CROPPEDVIDEO_FOLDER = Application.tmpPath() + "/Cropped";
export const TEMP_FOLDER = Application.tmpPath() + "/Temp";
export const TITLE_FOLDER = Application.tmpPath() + "/Title";
export const VIDEO_FORMAT = "mp4";

export const REGION_CODE = "US";

export const FONT = "Beirut";

export const TRENDS_DOWNLOAD_QUANTITY = 15;

export const VIDEO_QUANTITY = 5;
export const DURATION_PER_VIDEO = 2;
