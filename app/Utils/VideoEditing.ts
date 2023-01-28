import {
  TEMP_FOLDER,
  VIDEO_FORMAT,
  TITLE_FOLDER,
  FONT,
} from "./../Config/settings";
import { makeid, secondsToFormat } from "./Generic";
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath);
const canvas = require("canvas");
const fs = require("fs");
const concat = require("ffmpeg-concat");

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
        console.log(err);
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
    const cropping = `${TEMP_FOLDER}/${makeid(5)}.${VIDEO_FORMAT}`;
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
  for (let i = 0; i < paths.length; i++) {
    const vid = paths[i];

    let videosArray = [output, vid];
    if (i === 0) videosArray = [vid];

    await concat({
      output: output,
      videos: videosArray,
      transition: {
        name: "fade",
        duration: 1,
      },
    });
  }

  return output;
}

export async function addTextOnVideo(
  inputPath: string,
  outputPath: string,
  videoName: string,
  channelName: string,
  index: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const words = videoName.toUpperCase().split(" ");
    const rows: string[] = [""];
    let rowIndex = 0;

    words.forEach((word) => {
      if (rows[rowIndex].length + word.length > 25) {
        rowIndex++;
        rows[rowIndex] = "";
      }
      rows[rowIndex] += `${word} `;
    });

    // Create a new canvas
    const image = canvas.createCanvas(1640, 1480);
    const ctx = image.getContext("2d");
    ctx.clearRect(0, 0, image.width, image.height);

    // Add the background
    // Create a gradient for the bottom fading effect
    const gradient = ctx.createLinearGradient(0, 125, 0, 900);
    gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(0.5, "rgba(0, 0, 0, 0.7)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, image.width, image.height);

    // Add index
    ctx.font = `300px '${FONT}'`;
    ctx.fillStyle = "yellow";
    ctx.fillText("#" + index, 20, 565);

    // Add the text to the canvas (channel name)
    ctx.font = `75px '${FONT}'`;
    ctx.fillStyle = "yellow";
    ctx.fillText(channelName, 290, 480);

    // Add the text to the canvas (video name)
    ctx.font = `50px '${FONT}'`;
    ctx.fillStyle = "white";
    rows.forEach((row, key) => {
      ctx.fillText(row, 290, 540 + 50 * key);
    });

    // Save the canvas image to a file
    const buffer = image.toBuffer("image/png");

    const overlaypath = TITLE_FOLDER + "/" + makeid(6) + ".png";
    fs.writeFileSync(overlaypath, buffer);

    ffmpeg()
      .input(inputPath)
      .input(overlaypath)
      .complexFilter(["overlay=0:0:enable='between(t,0,30)'"])
      .output(outputPath)
      .on("end", function () {
        console.log("Video overlay complete!");
        fs.unlinkSync(overlaypath);
        resolve(outputPath);
      })
      .on("error", function (err) {
        fs.unlinkSync(overlaypath);
        reject(err);
      })
      .run();
  });
}
