import Application from "@ioc:Adonis/Core/Application";
const moment = require("moment");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath);
export function ISO8601ToSeconds(data: string) {
  let seconds = moment.duration(data).asSeconds();
  return seconds;
}

export function secondsToFormat(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}
export function cutVideo(path: string, start: number, end: number) {
  return new Promise((resolve, _) => {
    const crop =
      Application.tmpPath() +
      "/Crop/" +
      (Math.random()*10000).toString().slice(0, 7) +
      ".mp4";
    ffmpeg()
      .input(path)
      .setStartTime(secondsToFormat(start))
      .setDuration(secondsToFormat(end - start))
      .output(crop)
      .on("end", () => {
        resolve(crop);
      })
      .run();
  });
}
