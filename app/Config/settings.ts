import Application from "@ioc:Adonis/Core/Application";
const path = require('path');
export const projectDirectory = path.resolve(__dirname, '..');
export const CLIP_FOLDER = Application.tmpPath() + "/Clip";
export const DOWNLOAD_FOLDER = Application.tmpPath() + "/Download";
export const MERGEDVIDEO_FOLDER = Application.tmpPath() + "/Merged";
export const CROPPEDVIDEO_FOLDER = Application.tmpPath() + "/Cropped";
export const TEMP_FOLDER = Application.tmpPath() + "/Temp";
export const TITLE_FOLDER = Application.tmpPath() + "/Title";
export const VIDEO_FORMAT = "mp4";

export const REGION_CODE = "US";

export const FONT = "arialbd";

export const INTRO_VIDEO = projectDirectory + "/intro.mp4";

export const TRENDS_DOWNLOAD_QUANTITY = 15;

export const VIDEO_QUANTITY = 5;
export const DURATION_PER_VIDEO = 2;
