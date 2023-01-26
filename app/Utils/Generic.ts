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

export function cutVideo(
  inputPath: string,
  outputPath: string,
  start: number,
  end: number
) {
  return new Promise((resolve, _) => {
    ffmpeg()
      .input(inputPath)
      .setStartTime(secondsToFormat(start))
      .setDuration(secondsToFormat(end - start))
      .output(outputPath)
      .on("end", () => {
        resolve(outputPath);
      })
      .run();
  });
}
