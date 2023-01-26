import { TEMP_FOLDER } from './../Config/settings';
import { secondsToFormat } from "./Generic";

const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath);
const concat = require('ffmpeg-concat')

function resizingFFmpeg(
  video: string,
  width: number,
  height: number,
  tempFile: string,
  autoPad?: boolean,
  padColor?: string
): Promise<string> {
  return new Promise((res, rej) => {
    let ff = ffmpeg().input(video).size(`${width}x${height}`);
    autoPad ? (ff = ff.autoPad(autoPad, padColor)) : null;
    ff.output(tempFile)
      .on("start", function (commandLine) {
        console.log("Spawned FFmpeg with command: " + commandLine);
        console.log("Start resizingFFmpeg:", video);
      })
      // .on("progress", function(progress) {
      //   console.log(progress);
      // })
      .on("error", function (err) {
        console.log("Problem performing ffmpeg function");
        rej(err);
      })
      .on("end", function () {
        console.log("End resizingFFmpeg:", tempFile);
        res(tempFile);
      })
      .run();
  });
}

function videoCropCenterFFmpeg(
  video: string,
  w: number,
  h: number,
  tempFile: string
): Promise<string> {
  return new Promise((res, rej) => {
    ffmpeg()
      .input(video)
      .videoFilters([
        {
          filter: "crop",
          options: {
            w,
            h,
          },
        },
      ])
      .output(tempFile)
      .on("start", function (commandLine) {
        console.log("Spawned FFmpeg with command: " + commandLine);
        console.log("Start videoCropCenterFFmpeg:", video);
      })
      // .on("progress", function(progress) {
      //   console.log(progress);
      // })
      .on("error", function (err) {
        console.log("Problem performing ffmpeg function");
        rej(err);
      })
      .on("end", function () {
        console.log("End videoCropCenterFFmpeg:", tempFile);
        res(tempFile);
      })
      .run();
  });
}

function getDimentions(media: string) {
  console.log("Getting Dimentions from:", media);
  return new Promise<{ width: number; height: number }>((res, rej) => {
    ffmpeg.ffprobe(media, async function (err, metadata) {
      if (err) {
        console.log("Error occured while getting dimensions of:", media);
        rej(err);
      }
      res({
        width: metadata.streams[0].width,
        height: metadata.streams[0].height,
      });
    });
  });
}

export async function videoScale(
  video: string,
  output: string,
  newWidth: number,
  newHeight: number
) {
  const { width, height } = await getDimentions(video);
  if ((width / height).toFixed(2) > (newWidth / newHeight).toFixed(2)) {
    // y=0 case
    // landscape to potrait case
    const x = width - (newWidth / newHeight) * height;
    console.log(`New Intrim Res: ${width - x}x${height}`);
    const cropping = TEMP_FOLDER+"/tmp.mp4";
    let cropped = await videoCropCenterFFmpeg(
      video,
      width - x,
      height,
      cropping
    );
    let resized = await resizingFFmpeg(cropped, newWidth, newHeight, output);
    // unlink temp cropping file
    // fs.unlink(cropping, (err) => {
    //   if (err) console.log(err);
    //   console.log(`Temp file ${cropping} deleted Successfuly...`);
    // });
    return resized;
  } else if ((width / height).toFixed(2) < (newWidth / newHeight).toFixed(2)) {
    // x=0 case
    // potrait to landscape case
    // calculate crop or resize with padding or blur sides
    // or just return with black bars on the side
    return await resizingFFmpeg(video, newWidth, newHeight, output, true);
  } else {
    console.log("Same Aspect Ratio forward for resizing");
    return await resizingFFmpeg(video, newWidth, newHeight, output);
  }
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

export async function mergeClips(paths: string[], output: string) {
  await concat({
    output: output,
    videos: paths,
    transition: {
      name: "directionalWipe",
      duration: 500,
    },
  });
  return output;
}
