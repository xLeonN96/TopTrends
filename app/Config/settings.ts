import Application from "@ioc:Adonis/Core/Application";

export const CLIP_FOLDER = Application.tmpPath() + "/Clip";
export const DOWNLOAD_FOLDER = Application.tmpPath() + "/Download";
export const MERGEDVIDEO_FOLDER = Application.tmpPath() + "/Merged";
export const CROPPEDVIDEO_FOLDER = Application.tmpPath() + "/Cropped";
export const TEMP_FOLDER = Application.tmpPath() + "/Temp";
export const VIDEO_FORMAT = "mp4";

export const REGION_CODE = "US";

export const TRENDS_QUANTITY = 20;
